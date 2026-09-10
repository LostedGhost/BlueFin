<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Cache\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class ThrottleBookings
{
    protected $limiter;

    public function __construct(RateLimiter $limiter)
    {
        $this->limiter = $limiter;
    }

    public function handle(Request $request, Closure $next, $maxAttempts = 5, $decayMinutes = 60)
    {
        $key = 'booking:' . $request->user()->id;
        
        if ($this->limiter->tooManyAttempts($key, $maxAttempts)) {
            return response()->json([
                'success' => false,
                'message' => 'Trop de tentatives de réservation. Veuillez réessayer dans ' . $decayMinutes . ' minutes.',
                'retry_after' => $this->limiter->availableIn($key),
            ], 429);
        }
        
        $this->limiter->hit($key, $decayMinutes * 60);
        
        return $next($request);
    }
}