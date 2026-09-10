<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class TravelerMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user || $user->user_type !== 'voyageur') {
            return response()->json([
                'success' => false,
                'message' => 'Cette fonctionnalité est réservée aux voyageurs.',
            ], 403);
        }

        return $next($request);
    }
}
