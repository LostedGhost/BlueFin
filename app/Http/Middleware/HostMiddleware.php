<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class HostMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        
        if (!$user || $user->user_type !== 'hote') {
            return response()->json([
                'success' => false,
                'message' => 'Cette fonctionnalité est réservée aux hôtes.',
            ], 403);
        }
        
        return $next($request);
    }
}