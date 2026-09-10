<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
            'host' => \App\Http\Middleware\HostMiddleware::class,
            'traveler' => \App\Http\Middleware\TravelerMiddleware::class,
            'verified.host' => \App\Http\Middleware\VerifiedHostMiddleware::class,
            'force.json' => \App\Http\Middleware\ForceJsonResponse::class,
            'security.headers' => \App\Http\Middleware\SecurityHeaders::class,
            'log.activity' => \App\Http\Middleware\LogUserActivity::class,
            'throttle.bookings' => \App\Http\Middleware\ThrottleBookings::class,
            'check.user.status' => \App\Http\Middleware\CheckUserStatus::class,
            'localization' => \App\Http\Middleware\Localization::class,
        ]);

        $middleware->statefulApi();

        // Le CORS est géré par le HandleCors natif de Laravel (config/cors.php, liste
        // blanche d'origines). Un middleware maison a existé ici et forçait
        // Access-Control-Allow-Origin: * avec credentials: true sur TOUTES les
        // réponses API, en conflit avec la config correcte — supprimé (voir audit
        // sécurité). Ne pas le réintroduire.
        $middleware->api([
            \App\Http\Middleware\Localization::class,
            \App\Http\Middleware\ForceJsonResponse::class,
            \Illuminate\Routing\Middleware\ThrottleRequests::class.':api',
        ]);

        $middleware->append([
            \App\Http\Middleware\SecurityHeaders::class,
            \App\Http\Middleware\LogUserActivity::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
