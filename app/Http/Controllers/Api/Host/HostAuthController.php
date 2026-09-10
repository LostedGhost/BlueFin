<?php

namespace App\Http\Controllers\Api\Host;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class HostAuthController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Register as host
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'required|string|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'property_address' => 'nullable|string',
            'property_type' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'user_type' => 'hote',
            'verification_status' => 'pending',
            'is_active' => true,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        // Send welcome message to host
        $this->notificationService->sendWhatsApp(
            $user->phone,
            "🎉 *Bienvenue sur Bluefin Immo, {$user->first_name}!* 🎉\n\n"
            . "Vous êtes maintenant inscrit en tant qu'hôte.\n\n"
            . "📝 *Prochaines étapes pour commencer:*\n"
            . "1. ✅ Vérifiez votre identité (CNI/Passeport)\n"
            . "2. 🏠 Publiez votre première annonce\n"
            . "3. ⏳ Notre équipe valide votre annonce (24-48h)\n"
            . "4. 🚀 Recevez vos premières réservations\n\n"
            . "📱 Connectez-vous à votre espace hôte pour commencer!\n\n"
            . "Besoin d'aide? Répondez à ce message."
        );

        // Notify admin about new host registration
        $this->notifyAdminNewHost($user);

        return response()->json([
            'success' => true,
            'message' => 'Inscription réussie! Veuillez vérifier votre identité pour commencer.',
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'user_type' => $user->user_type,
                'verification_status' => $user->verification_status,
            ],
            'token' => $token,
            'token_type' => 'Bearer',
            'next_steps' => [
                'verify_identity' => true,
                'complete_profile' => true,
                'add_property' => false,
            ],
        ], 201);
    }

    /**
     * Login with OTP (SMS/WhatsApp)
     */
    public function loginWithOTP(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $otp = rand(100000, 999999);
        
        Cache::put("otp_{$request->phone}", $otp, 300);
        
        $message = "🔐 *Votre code de vérification Bluefin*\n\n"
            . "Code: *{$otp}*\n\n"
            . "Valable 5 minutes.\n\n"
            . "Utilisez ce code pour vous connecter à votre espace hôte.";
        
        $this->notificationService->sendWhatsApp($request->phone, $message);
        $this->notificationService->sendSMS($request->phone, "Votre code Bluefin: {$otp}");
        
        return response()->json([
            'success' => true,
            'message' => 'Code OTP envoyé par WhatsApp',
            'expires_in' => 300,
        ]);
    }

    /**
     * Verify OTP and login
     */
    public function verifyOTP(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string',
            'otp' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $cachedOtp = Cache::get("otp_{$request->phone}");
        
        if (!$cachedOtp || $cachedOtp != $request->otp) {
            return response()->json([
                'success' => false,
                'message' => 'Code OTP invalide ou expiré'
            ], 401);
        }

        $user = User::where('phone', $request->phone)->first();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun compte trouvé avec ce numéro. Veuillez vous inscrire.'
            ], 404);
        }

        if ($user->user_type !== 'hote' && $user->user_type !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Ce compte n\'est pas un compte hôte.'
            ], 403);
        }

        Cache::forget("otp_{$request->phone}");
        
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
                'user_type' => $user->user_type,
                'verification_status' => $user->verification_status,
                'profile_photo' => $user->profile_photo_url,
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

        if ($user->user_type !== 'hote' && $user->user_type !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Ce compte n\'est pas un compte hôte.'
            ], 403);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Votre compte a été désactivé. Veuillez contacter le support.'
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
                'user_type' => $user->user_type,
                'verification_status' => $user->verification_status,
                'profile_photo' => $user->profile_photo_url,
            ],
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Upload identity document for verification
     */
    public function uploadIdentity(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'identity_document' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'document_type' => 'required|in:cni,passeport',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        
        $path = $request->file('identity_document')->store('identity-documents', 'private');
        
        $user->update([
            'identity_document' => $path,
            'identity_document_type' => $request->document_type,
            'verification_status' => 'pending',
        ]);
        
        // Notify admin for verification
        $this->notifyAdminIdentitySubmission($user);
        
        return response()->json([
            'success' => true,
            'message' => 'Document soumis. Notre équipe vérifiera dans les 24-48h.',
            'verification_status' => $user->verification_status,
        ]);
    }

    /**
     * Get verification status
     */
    public function verificationStatus(Request $request)
    {
        $user = $request->user();
        
        $messages = [
            'pending' => 'Votre identité est en cours de vérification. Cela peut prendre 24-48h.',
            'verified' => 'Félicitations! Votre identité est vérifiée. Vous pouvez maintenant publier des annonces.',
            'rejected' => 'Votre document a été rejeté. Veuillez soumettre un document valide et lisible.',
        ];
        
        return response()->json([
            'success' => true,
            'verification_status' => $user->verification_status,
            'is_verified' => $user->verification_status === 'verified',
            'can_publish' => $user->verification_status === 'verified',
            'message' => $messages[$user->verification_status] ?? 'Veuillez soumettre vos documents d\'identité.',
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

    /**
     * Become a host (for existing users)
     */
    public function becomeHost(Request $request)
    {
        $user = $request->user();
        
        if ($user->user_type === 'hote') {
            return response()->json([
                'success' => false,
                'message' => 'Vous êtes déjà un hôte.',
            ], 400);
        }
        
        $user->update([
            'user_type' => 'hote',
            'verification_status' => 'pending',
        ]);
        
        // Send notification to admin
        $this->notifyAdminNewHost($user);
        
        // Send welcome message
        $this->notificationService->sendWhatsApp(
            $user->phone,
            "🎉 *Félicitations! Vous êtes maintenant hôte sur Bluefin!* 🎉\n\n"
            . "📝 *Prochaines étapes:*\n"
            . "1. ✅ Vérifiez votre identité\n"
            . "2. 🏠 Publiez votre première annonce\n\n"
            . "Commencez dès maintenant à gagner de l'argent en partageant votre espace!"
        );
        
        return response()->json([
            'success' => true,
            'message' => 'Félicitations! Vous êtes maintenant hôte. Veuillez vérifier votre identité.',
            'user' => $user,
            'next_steps' => [
                'verify_identity' => true,
                'add_property' => false,
            ],
        ]);
    }

    private function notifyAdminNewHost($user)
    {
        $admins = User::where('user_type', 'admin')->get();
        
        foreach ($admins as $admin) {
            $this->notificationService->sendWhatsApp(
                $admin->phone,
                "👤 *NOUVEL HÔTE INSCRIT* 👤\n\n"
                . "Nom: {$user->full_name}\n"
                . "📞 Téléphone: {$user->phone}\n"
                . "📧 Email: {$user->email}\n\n"
                . "⏳ En attente de vérification d'identité.\n\n"
                . "Connectez-vous au panel admin pour vérifier."
            );
        }
    }

    private function notifyAdminIdentitySubmission($user)
    {
        $admins = User::where('user_type', 'admin')->get();
        
        foreach ($admins as $admin) {
            $this->notificationService->sendWhatsApp(
                $admin->phone,
                "📄 *DOCUMENT À VÉRIFIER* 📄\n\n"
                . "Hôte: {$user->full_name}\n"
                . "📞 Téléphone: {$user->phone}\n"
                . "Type de document: " . strtoupper($user->identity_document_type) . "\n\n"
                . "🔗 Connectez-vous au panel admin pour vérifier le document."
            );
        }
    }
}