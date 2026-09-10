<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckUserStatus
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        
        if ($user && !$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Votre compte a été désactivé. Veuillez contacter le support.',
            ], 403);
        }
        
        if ($user && $user->suspended_until && now()->lessThan($user->suspended_until)) {
            return response()->json([
                'success' => false,
                'message' => 'Votre compte est suspendu jusqu\'au ' . $user->suspended_until->format('d/m/Y'),
            ], 403);
        }
        
        return $next($request);
    }
}<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckUserStatus
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        
        if ($user && !$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Votre compte a été désactivé.'
            ], 403);
        }
        
        return $next($request);
    }
}