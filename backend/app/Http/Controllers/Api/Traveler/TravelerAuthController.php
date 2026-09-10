<?php

namespace App\Http\Controllers\Api\Traveler;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class TravelerAuthController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Register as traveler or host
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'required|string|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'user_type' => 'sometimes|in:voyageur,hote', // ✅ accepte le rôle du frontend
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Valeur par défaut : voyageur
        $userType = $request->user_type ?? 'voyageur';

        // ⚠️ Cette route forçait 'verification_status' => 'verified' quel que
        // soit le rôle choisi, y compris pour user_type=hote — un compte
        // pouvait ainsi obtenir le statut "hôte vérifié" sans jamais soumettre
        // de pièce d'identité, contournant tout HostAuthController::register/
        // uploadIdentity. Un hôte créé ici doit repartir 'pending' comme
        // n'importe quel hôte, et ne pourra publier qu'après vérification.
        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'user_type' => $userType,
            'verification_status' => $userType === 'hote' ? 'pending' : 'verified',
            'is_active' => true,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        // Message de bienvenue adapté au rôle
        $roleText = $userType === 'hote' 
            ? 'Hôte' 
            : 'voyageur';
        
        $welcomeMessage = "🎉 *Bienvenue sur Bluefin Immo, {$user->first_name}!* 🎉\n\n"
            . "Vous êtes maintenant inscrit en tant que {$roleText}.\n\n"
            . "🏠 Découvrez les meilleurs hébergements au Bénin:\n"
            . "• Appartements meublés\n"
            . "• Villas de luxe\n"
            . "• Hôtels et résidences\n"
            . "• Maisons d'hôtes\n\n"
            . "📱 Explorez l'application et trouvez votre prochain séjour!\n\n"
            . "Besoin d'aide? Répondez à ce message.";

        $this->notificationService->sendWhatsApp($user->phone, $welcomeMessage);

        return response()->json([
            'success' => true,
            'message' => 'Inscription réussie! Bienvenue sur Bluefin Immo.',
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'profile_photo' => $user->profile_photo_url,
                'user_type' => $user->user_type,
            ],
            'token' => $token,
            'token_type' => 'Bearer',
        ], 201);
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
        Cache::put("otp_{$request->phone}", $otp, 300);
        
        $message = "🔐 *Votre code de vérification Bluefin Immo*\n\n"
            . "Code: *{$otp}*\n\n"
            . "Valable 5 minutes.\n\n"
            . "Si vous n'avez pas demandé ce code, ignorez ce message.";

        $this->notificationService->sendWhatsApp($request->phone, $message);
        $this->notificationService->sendSMS($request->phone, "Votre code Bluefin Immo: {$otp}");
        
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
            // Auto-register new user (par défaut voyageur)
            $user = User::create([
                'phone' => $request->phone,
                'first_name' => 'Voyageur',
                'last_name' => 'Bluefin',
                'email' => $request->phone . '@temp.bluefin-immo.com',
                'password' => Hash::make(Str::random(16)),
                'user_type' => 'voyageur',
                'phone_verified_at' => now(),
                'verification_status' => 'verified',
                'is_active' => true,
            ]);
        } else {
            $user->update(['phone_verified_at' => now()]);
        }

        Cache::forget("otp_{$request->phone}");
        
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Authentification réussie',
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'profile_photo' => $user->profile_photo_url,
                'user_type' => $user->user_type,
            ],
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Standard login with email/password
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required_without:phone|email',
            'phone' => 'required_without:email|string',
            'password' => 'required|string',
        ]);

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

        $user->update(['last_login_at' => now()]);
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Connexion réussie',
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'profile_photo' => $user->profile_photo_url,
                'user_type' => $user->user_type,
            ],
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Déconnexion réussie'
        ]);
    }
}