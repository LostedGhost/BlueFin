<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Débit général de l'API : protège l'ensemble des routes /api contre les abus.
        RateLimiter::for('api', function ($request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Débit strict pour login/register/OTP : ces routes sont les plus exposées au
        // brute force (mot de passe, code OTP à 4-6 chiffres) et au bombardement de
        // SMS/WhatsApp coûteux via NotificationService. Voir audit sécurité.
        RateLimiter::for('auth', function ($request) {
            $identifier = $request->input('email') ?? $request->input('phone') ?? 'anonymous';
            return Limit::perMinute(5)->by($request->ip().'|'.$identifier);
        });
    }
}
