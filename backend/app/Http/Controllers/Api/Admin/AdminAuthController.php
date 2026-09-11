<?php
// app/Http/Controllers/Api/Admin/AdminAuthController.php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AdminAuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)
            ->where('user_type', 'admin')
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants sont incorrects.'],
            ]);
        }

        // ⚠️ Contrairement aux 3 autres login() (traveler/host/auth), celui-ci
        // ne vérifiait jamais si le compte était désactivé/suspendu — un
        // administrateur désactivé pouvait donc continuer à se connecter.
        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Ce compte administrateur est désactivé.'],
            ]);
        }
        if ($user->is_suspended) {
            throw ValidationException::withMessages([
                'email' => ['Ce compte administrateur est suspendu jusqu\'au ' . $user->suspended_until->format('d/m/Y') . '.'],
            ]);
        }

        // Supprimer les anciens tokens
        $user->tokens()->delete();

        // Créer un nouveau token
        $token = $user->createToken('admin-token', ['admin'])->plainTextToken;
        $this->startWebSession($request, $user, $request->boolean('remember'));

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'user_type' => $user->user_type,
                'is_active' => $user->is_active,
            ],
            'token_type' => 'Bearer',
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Déconnecté avec succès',
        ]);
    }
}