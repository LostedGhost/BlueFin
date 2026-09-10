<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LogUserActivity
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);
        
        if ($request->user() && $request->method() !== 'GET') {
            Log::channel('activity')->info('User activity', [
                'user_id' => $request->user()->id,
                'user_email' => $request->user()->email,
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'response_status' => $response->status(),
            ]);
        }
        
        return $response;
    }
}