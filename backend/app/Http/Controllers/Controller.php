<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

abstract class Controller
{
    /**
     * Ouvre la session web de l'utilisateur qui vient de s'inscrire ou de se
     * connecter.
     *
     * Le frontend s'authentifie par cookie de session Sanctum (requêtes
     * « stateful » depuis bluefin-immo.com) et n'envoie jamais le jeton
     * Bearer renvoyé par l'API. Sans cette ouverture de session, toute route
     * protégée répondait 401 juste après une connexion réussie.
     *
     * Le jeton reste émis pour les clients qui l'utilisent (app mobile…).
     * Sans session disponible (appel API pur), rien n'est fait.
     */
    protected function startWebSession(Request $request, User $user, bool $remember = false): void
    {
        if (! $request->hasSession()) {
            return;
        }

        Auth::guard('web')->login($user, $remember);
        // Nouvel identifiant de session : empêche la fixation de session.
        $request->session()->regenerate();
    }

    /**
     * Messages de validation en français (inscription, connexion,
     * administration) : ce sont eux que l'utilisateur lit quand un envoi est
     * refusé — sans eux, il voit « validation.unique » ou de l'anglais.
     */
    protected function frenchValidationMessages(): array
    {
        return [
            'required' => 'Ce champ est obligatoire.',
            'required_if' => 'Ce champ est obligatoire pour ce moyen de versement.',
            'required_without' => 'Indiquez votre e-mail ou votre numéro de téléphone.',
            'email' => 'L’adresse e-mail n’est pas valide.',
            'email.unique' => 'Un compte existe déjà avec cette adresse e-mail. Connectez-vous plutôt.',
            'phone.unique' => 'Ce numéro de téléphone est déjà utilisé par un autre compte.',
            'password.min' => 'Le mot de passe doit contenir au moins :min caractères.',
            'password.confirmed' => 'Les deux mots de passe ne correspondent pas.',
            // Laravel n'applique pas de message par type (texte / nombre) :
            // formulations valables pour les deux.
            'max' => 'Maximum autorisé : :max.',
            'min' => 'Minimum requis : :min.',
            'numeric' => 'Indiquez un nombre.',
            'integer' => 'Indiquez un nombre entier.',
            'in' => 'La valeur choisie n’est pas valide.',
            'regex' => 'Le format n’est pas valide.',
            'mimes' => 'Format de fichier non accepté (:values).',
            'file' => 'Le fichier envoyé n’est pas valide.',
        ];
    }
}
