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

        // Connexion Google : pas de mot de passe à deviner (un faux jeton est
        // rejeté par sa signature), mais beaucoup d'utilisateurs mobiles
        // partagent la même IP opérateur. Limite par IP plus large que
        // « auth », qui regroupait tous les appels Google sous « anonymous ».
        RateLimiter::for('google-auth', fn ($request) => Limit::perMinute(30)->by($request->ip()));

        // Vérification « e-mail / téléphone déjà utilisé » pendant
        // l'inscription par étapes : bornée pour limiter l'énumération.
        RateLimiter::for('availability', fn ($request) => Limit::perMinute(20)->by($request->ip()));
    }
}
