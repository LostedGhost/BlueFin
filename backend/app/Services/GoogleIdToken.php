<?php

namespace App\Services;

use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Vérification d'un jeton d'identité Google (bouton « Se connecter avec
 * Google », Google Identity Services).
 *
 * Le jeton est un JWT signé par Google. On vérifie localement : signature
 * (clés publiques de Google, mises en cache selon leur durée de validité),
 * émetteur, audience (notre Client ID), expiration, et e-mail vérifié.
 * Aucun secret client n'est nécessaire.
 */
class GoogleIdToken
{
    private const CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
    private const ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

    /**
     * @return array{sub: string, email: string, first_name: string, last_name: string, picture: ?string}
     * @throws RuntimeException jeton invalide, expiré, ou destiné à une autre application
     */
    public function verify(string $credential): array
    {
        $clientId = config('services.google.client_id');
        if (blank($clientId)) {
            throw new RuntimeException('La connexion Google n’est pas configurée (GOOGLE_CLIENT_ID manquant).');
        }

        JWT::$leeway = 60; // tolérance d'horloge entre nos serveurs et ceux de Google

        try {
            $claims = (array) JWT::decode($credential, JWK::parseKeySet($this->keys()));
        } catch (\Throwable $e) {
            throw new RuntimeException('Jeton Google invalide ou expiré.', 0, $e);
        }

        if (! in_array($claims['iss'] ?? null, self::ISSUERS, true)) {
            throw new RuntimeException('Jeton Google : émetteur inattendu.');
        }
        if (($claims['aud'] ?? null) !== $clientId) {
            throw new RuntimeException('Jeton Google destiné à une autre application.');
        }
        if (empty($claims['email']) || ! filter_var($claims['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            throw new RuntimeException('L’adresse e-mail de ce compte Google n’est pas vérifiée.');
        }

        return [
            'sub' => (string) $claims['sub'],
            'email' => mb_strtolower((string) $claims['email']),
            'first_name' => (string) ($claims['given_name'] ?? ''),
            'last_name' => (string) ($claims['family_name'] ?? ''),
            'picture' => $claims['picture'] ?? null,
        ];
    }

    private function keys(): array
    {
        $cached = Cache::get('google_oauth_certs');
        if ($cached) {
            return $cached;
        }

        $response = Http::timeout(10)->get(self::CERTS_URL)->throw();
        $keys = $response->json();

        // Google indique la durée de validité de ses clés dans Cache-Control.
        preg_match('/max-age=(\d+)/', (string) $response->header('Cache-Control'), $m);
        Cache::put('google_oauth_certs', $keys, (int) ($m[1] ?? 3600));

        return $keys;
    }
}
