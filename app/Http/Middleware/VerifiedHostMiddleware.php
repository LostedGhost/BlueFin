<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class VerifiedHostMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        
        if ($user->user_type !== 'hote') {
            return response()->json([
                'success' => false,
                'message' => 'Cette fonctionnalité est réservée aux hôtes.',
            ], 403);
        }
        
        if ($user->verification_status !== 'verified') {
            return response()->json([
                'success' => false,
                'message' => 'Votre identité doit être vérifiée avant de pouvoir publier des annonces.',
                'verification_status' => $user->verification_status,
                'next_steps' => 'Veuillez soumettre vos documents d\'identité dans votre profil.',
            ], 403);
        }
        
        return $next($request);
    }
}