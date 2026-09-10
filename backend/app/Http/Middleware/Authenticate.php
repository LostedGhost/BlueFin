<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        // ✅ Pour les requêtes API (JSON), retourner null pour éviter la redirection
        if ($request->expectsJson()) {
            return null;
        }
        
        // Pour les requêtes web classiques
        return route('login');
    }
}