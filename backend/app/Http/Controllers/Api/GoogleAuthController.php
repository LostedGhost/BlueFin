<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\GoogleIdToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Connexion / inscription avec Google.
 *
 * Parcours (défini avec le client) :
 *   1. Le visiteur clique « Se connecter avec Google » → POST /auth/google.
 *      - Un compte existe (même identifiant Google ou même e-mail) : il est
 *        connecté directement, qu'il soit sur l'écran de connexion ou
 *        d'inscription.
 *      - Sinon : rien n'est créé ; on renvoie nom, prénom et e-mail pour
 *        pré-remplir les étapes suivantes.
 *   2. Il complète « Infos personnelles » (nom et prénom modifiables,
 *      téléphone obligatoire), puis valide → POST /auth/google/register.
 *      Le jeton Google est renvoyé et revérifié : on ne fait jamais
 *      confiance à un e-mail transmis par le navigateur.
 */
class GoogleAuthController extends Controller
{
    public function __construct(private GoogleIdToken $google) {}

    public function authenticate(Request $request)
    {
        $request->validate(['credential' => 'required|string'], $this->frenchValidationMessages());

        try {
            $profile = $this->google->verify($request->credential);
        } catch (RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 401);
        }

        $user = User::where('google_id', $profile['sub'])->first()
            ?? User::where('email', $profile['email'])->first();

        if (! $user) {
            return response()->json([
                'success' => true,
                'status' => 'new',
                'profile' => [
                    'email' => $profile['email'],
                    'first_name' => $profile['first_name'],
                    'last_name' => $profile['last_name'],
                ],
            ]);
        }

        if (! $user->is_active) {
            return response()->json(['success' => false, 'message' => 'Votre compte a été désactivé'], 403);
        }

        // Compte créé avec mot de passe : on y rattache Google. Google a
        // vérifié l'adresse, c'est donc bien la même personne.
        $user->forceFill([
            'google_id' => $user->google_id ?: $profile['sub'],
            'email_verified_at' => $user->email_verified_at ?: now(),
            'last_login_at' => now(),
        ])->save();

        return $this->signedIn($request, $user, 'Connexion réussie');
    }

    public function register(Request $request)
    {
        // « traveler » : vocabulaire du frontend, « voyageur » en base.
        if ($request->input('user_type') === 'traveler') {
            $request->merge(['user_type' => 'voyageur']);
        }

        $data = $request->validate([
            'credential' => 'required|string',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'phone' => 'required|string|regex:/^\+?[0-9 ]{8,20}$/|unique:users,phone',
            'user_type' => 'sometimes|in:voyageur,hote',
            'host_type' => 'sometimes|nullable|in:logement,experience,service',
        ], $this->frenchValidationMessages());

        try {
            $profile = $this->google->verify($data['credential']);
        } catch (RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage() . ' Recommencez avec le bouton Google.'], 401);
        }

        // Le compte a pu être créé entre-temps (autre onglet) : on connecte.
        $existing = User::where('google_id', $profile['sub'])->orWhere('email', $profile['email'])->first();
        if ($existing) {
            return $this->signedIn($request, $existing, 'Un compte existait déjà : vous êtes connecté.');
        }

        $userType = $data['user_type'] ?? 'voyageur';
        $attributes = [
            'first_name' => trim($data['first_name']),
            'last_name' => trim($data['last_name']),
            'email' => $profile['email'],
            'phone' => preg_replace('/\s+/', '', $data['phone']),
            // Aucun mot de passe connu : le compte se connecte par Google.
            'password' => Hash::make(Str::random(64)),
            'user_type' => $userType,
            'verification_status' => $userType === 'hote' ? 'pending' : 'verified',
            'is_active' => true,
        ];
        if (! empty($data['host_type']) && Schema::hasColumn('users', 'host_type')) {
            $attributes['host_type'] = $data['host_type'];
        }

        $user = User::create($attributes);
        $user->forceFill(['google_id' => $profile['sub'], 'email_verified_at' => now()])->save();

        try {
            event(new \App\Events\NewUserRegistered($user));
        } catch (\Throwable $e) {
            Log::warning('Notification nouvel inscrit non envoyée', ['user_id' => $user->id, 'error' => $e->getMessage()]);
        }

        return $this->signedIn($request, $user, 'Inscription réussie ! Bienvenue sur Bluefin-Immo.', 201);
    }

    /**
     * Vérifie, étape par étape, qu'un e-mail ou un téléphone n'est pas déjà
     * utilisé — pour prévenir le visiteur tout de suite plutôt qu'à la fin.
     */
    public function availability(Request $request)
    {
        $data = $request->validate([
            'email' => 'sometimes|nullable|email',
            'phone' => 'sometimes|nullable|string|max:30',
        ], $this->frenchValidationMessages());

        return response()->json([
            'success' => true,
            'email_taken' => ! empty($data['email']) && User::where('email', mb_strtolower($data['email']))->exists(),
            'phone_taken' => ! empty($data['phone']) && User::where('phone', preg_replace('/\s+/', '', $data['phone']))->exists(),
        ]);
    }

    private function signedIn(Request $request, User $user, string $message, int $status = 200)
    {
        $token = $user->createToken('auth_token')->plainTextToken;
        $this->startWebSession($request, $user, true);

        return response()->json([
            'success' => true,
            'status' => 'logged_in',
            'message' => $message,
            'user' => $user->fresh(),
            'token' => $token,
            'token_type' => 'Bearer',
        ], $status);
    }
}
