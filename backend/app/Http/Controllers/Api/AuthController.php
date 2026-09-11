<?php

namespace App\Http\Controllers\Api;

use App\Services\PhotoStorage;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserDevice;
use App\Events\NewUserRegistered;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        // Le site envoie « traveler » (vocabulaire du frontend) ; la base
        // stocke « voyageur ». Sans cette traduction, toute inscription
        // voyageur échouait en 422 « The selected user type is invalid ».
        if ($request->input('user_type') === 'traveler') {
            $request->merge(['user_type' => 'voyageur']);
        }

        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'required|string|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'user_type' => 'in:voyageur,hote',
        ], $this->frenchValidationMessages());

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'user_type' => $request->user_type ?? 'voyageur',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;
        $this->startWebSession($request, $user, $request->boolean('remember'));

        // Send welcome notification
        $this->notificationService->sendWhatsApp(
            $user->phone,
            "Bienvenue sur Bluefin-Immo, {$user->first_name}! 🎉\n\nCommencez à explorer les meilleurs hébergements au Bénin."
        );


// Après avoir créé l'utilisateur
// Notification des admins : ne doit jamais faire échouer l'inscription
        // (le compte est déjà créé à ce stade — un 500 ici laissait croire au
        // visiteur que l'inscription avait échoué).
        try {
            event(new NewUserRegistered($user));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Notification nouvel inscrit non envoyée', ['user_id' => $user->id, 'error' => $e->getMessage()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Inscription réussie',
            'user' => $user,
            'token' => $token,
            'token_type' => 'Bearer',
        ], 201);
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required_without:phone|email',
            'phone' => 'required_without:email|string',
            'password' => 'required|string',
        ], $this->frenchValidationMessages());

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $field = $request->has('email') ? 'email' : 'phone';
        $user = User::where($field, $request->$field)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Identifiants invalides'
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Votre compte a été désactivé'
            ], 403);
        }

        // Update last login
        $user->update(['last_login_at' => now()]);

        // Delete old tokens
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;
        $this->startWebSession($request, $user, $request->boolean('remember'));

        return response()->json([
            'success' => true,
            'message' => 'Connexion réussie',
            'user' => $user,
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Login with OTP (SMS/WhatsApp)
     */
    public function loginWithOTP(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string|regex:/^\+?[0-9]{8,15}$/',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $otp = rand(100000, 999999);
        
        // Store OTP in cache for 5 minutes
        Cache::put("otp_{$request->phone}", $otp, 300);
        
        // Send OTP via WhatsApp (primary) and SMS (backup)
        $message = "Votre code de vérification Bluefin Immo est: {$otp}\nValable 5 minutes.";
        
        $this->notificationService->sendWhatsApp($request->phone, $message);
        $this->notificationService->sendSMS($request->phone, $message);
        
        return response()->json([
            'success' => true,
            'message' => 'Code OTP envoyé par WhatsApp',
            'expires_in' => 300,
        ]);
    }

    /**
     * Verify OTP and login/register
     */
    public function verifyOTP(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string|regex:/^\+?[0-9]{8,15}$/',
            'otp' => 'required|string|size:6',
            'device_token' => 'nullable|string',
            'device_type' => 'nullable|in:ios,android,web',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $cachedOtp = Cache::get("otp_{$request->phone}");
        
        if (!$cachedOtp || (string) $cachedOtp !== (string) $request->otp) {
            return response()->json([
                'success' => false,
                'message' => 'Code OTP invalide ou expiré'
            ], 401);
        }

        $user = User::where('phone', $request->phone)->first();
        
        if (!$user) {
            // Auto-register new user
            $user = User::create([
                'phone' => $request->phone,
                'first_name' => 'Utilisateur',
                'last_name' => 'Bluefin',
                'email' => $request->phone . '@temp.bluefin-immo.com',
                'password' => Hash::make(Str::random(16)),
                'user_type' => 'voyageur',
                'phone_verified_at' => now(),
            ]);
        } else {
            $user->update(['phone_verified_at' => now()]);
        }

        // Register device for push notifications
        if ($request->device_token && $request->device_type) {
            UserDevice::updateOrCreate(
                ['user_id' => $user->id, 'device_token' => $request->device_token],
                ['device_type' => $request->device_type, 'last_used_at' => now(), 'is_active' => true]
            );
        }

        Cache::forget("otp_{$request->phone}");
        
        // Delete old tokens
        $user->tokens()->delete();
        
        $token = $user->createToken('auth_token')->plainTextToken;
        $this->startWebSession($request, $user, $request->boolean('remember'));

        // Après avoir créé l'utilisateur
// Notification des admins : ne doit jamais faire échouer l'inscription
        // (le compte est déjà créé à ce stade — un 500 ici laissait croire au
        // visiteur que l'inscription avait échoué).
        try {
            event(new NewUserRegistered($user));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Notification nouvel inscrit non envoyée', ['user_id' => $user->id, 'error' => $e->getMessage()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Authentification réussie',
            'user' => $user,
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        // Authentifié par jeton : on révoque ce jeton. Authentifié par session
        // (cas du site), currentAccessToken() est un TransientToken sans
        // delete() — l'appeler provoquait une erreur 500 à la déconnexion.
        $token = $request->user()->currentAccessToken();
        if ($token instanceof \Laravel\Sanctum\PersonalAccessToken) {
            $token->delete();
        }

        if ($request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'success' => true,
            'message' => 'Déconnexion réussie'
        ]);
    }

    /**
     * Utilisateur connecté, version légère : appelée par le site à chaque
     * chargement de page pour vérifier que la session est toujours valide.
     */
    public function currentUser(Request $request)
    {
        return response()->json([
            'success' => true,
            'user' => $request->user(),
        ]);
    }

    /**
     * Get authenticated user
     */
    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'user' => $request->user()->load(['properties', 'bookings' => function($q) {
                $q->latest()->limit(5);
            }])
        ]);
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'first_name' => 'string|max:255',
            'last_name' => 'string|max:255',
            'email' => 'email|unique:users,email,' . $user->id,
            'phone' => 'string|unique:users,phone,' . $user->id,
            'bio' => 'string|max:1000',
            'languages' => 'array',
            'city' => 'string|max:255',
            'profile_photo' => 'image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($request->hasFile('profile_photo')) {
            $stored = app(PhotoStorage::class)->upload($request->file('profile_photo'), 'profile-photos');
            $request->merge(['profile_photo' => $stored['path'] ?: $stored['url']]);
        }

        $user->update($request->only([
            'first_name', 'last_name', 'email', 'phone', 'bio', 'languages', 'city', 'profile_photo'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Profil mis à jour',
            'user' => $user
        ]);
    }

    /**
     * Verify user identity (CNI or Passport)
     */
    public function verifyIdentity(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'identity_document' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'document_type' => 'required|in:cni,passeport',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        
        $path = app(PhotoStorage::class)->uploadPrivate($request->file('identity_document'), 'identity-documents');
        
        $user->update([
            'identity_document' => $path,
            'verification_status' => 'pending'
        ]);

        // Notify admin for verification
        // TODO: Send notification to admin panel

        return response()->json([
            'success' => true,
            'message' => 'Document soumis pour vérification',
            'verification_status' => $user->verification_status
        ]);
    }
}