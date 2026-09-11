<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\Validator;

/**
 * Crée (ou promeut) un compte administrateur, mot de passe saisi à la main.
 *
 * Pourquoi cette commande plutôt que AdminSeeder : ce dernier contient un mot
 * de passe en dur (« Admin@123 ») visible par quiconque lit le dépôt. L'exécuter
 * en production reviendrait à publier les identifiants d'administration. Ici le
 * mot de passe est demandé en saisie masquée : il ne transite ni par un
 * fichier, ni par Git, ni par l'historique du shell.
 *
 * Usage :
 *   php artisan bluefin:make-admin
 *   php artisan bluefin:make-admin --email=… --first=… --last=… --phone=…
 */
class MakeAdmin extends Command
{
    protected $signature = 'bluefin:make-admin
        {--email= : Adresse e-mail du compte}
        {--first= : Prénom}
        {--last= : Nom}
        {--phone= : Téléphone (format +229…)}';

    protected $description = 'Créer un compte administrateur, ou promouvoir un compte existant';

    public function handle(): int
    {
        $email = $this->option('email') ?: $this->ask('Adresse e-mail');

        $existing = User::where('email', $email)->first();

        if ($existing) {
            $this->warn("Un compte existe déjà pour {$email} (type actuel : {$existing->user_type}).");
            if (! $this->confirm('Le promouvoir administrateur et réinitialiser son mot de passe ?', false)) {
                $this->info('Abandon, rien n\'a été modifié.');

                return self::SUCCESS;
            }
        }

        $first = $this->option('first') ?: ($existing->first_name ?? $this->ask('Prénom', 'Admin'));
        $last = $this->option('last') ?: ($existing->last_name ?? $this->ask('Nom', 'Bluefin'));
        $phone = $this->option('phone') ?: ($existing->phone ?? $this->ask('Téléphone (+229…)'));

        $password = $this->secret('Mot de passe');
        if ($password !== $this->secret('Confirmer le mot de passe')) {
            $this->error('Les deux saisies diffèrent.');

            return self::FAILURE;
        }

        $validator = Validator::make(
            ['email' => $email, 'phone' => $phone, 'password' => $password],
            [
                'email' => 'required|email',
                'phone' => 'required|string|regex:/^\+?[0-9]{8,15}$/',
                // Un compte d'administration donne accès aux données de tous
                // les utilisateurs : la règle est plus stricte que pour un
                // compte voyageur.
                'password' => ['required', Password::min(12)->letters()->numbers()->symbols()],
            ]
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $attributes = [
            'first_name' => $first,
            'last_name' => $last,
            'phone' => $phone,
            'password' => Hash::make($password),
            'user_type' => 'admin',
            'admin_role' => 'super_admin',
            'admin_permissions' => ['all'],
            // Vérifiés à la connexion admin : sans eux, le compte serait créé
            // mais refusé au login. `is_suspended` n'est pas une colonne mais
            // un accesseur calculé sur `suspended_until` — c'est donc cette
            // date qu'il faut effacer pour lever une suspension.
            'is_active' => true,
            'suspended_until' => null,
            'verification_status' => 'verified',
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
        ];

        $user = $existing
            ? tap($existing)->update($attributes)
            : User::create($attributes + ['email' => $email]);

        $this->newLine();
        $this->info($existing ? "Compte promu administrateur : {$user->email}" : "Compte administrateur créé : {$user->email}");
        $this->line("  identifiant : {$user->id}");
        $this->line('  connexion   : POST /api/v1/admin/login  (ou la page /admin-login du site)');
        $this->newLine();
        $this->warn('Compte temporaire de test : pensez à le supprimer ou à changer son mot de passe avant la mise en service.');

        return self::SUCCESS;
    }
}
