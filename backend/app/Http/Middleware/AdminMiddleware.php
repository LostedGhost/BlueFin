<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user || $user->user_type !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé. Zone réservée aux administrateurs.'
            ], 403);
        }

        return $next($request);
    }
}