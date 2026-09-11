<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/**
 * Stockage des médias publics (photos de logements, d'expériences, de services,
 * avatars).
 *
 * Pourquoi ce service existe : jusqu'ici ces fichiers étaient écrits sur le
 * disque local, à l'intérieur du répertoire de l'application. Un redéploiement
 * a suffi à les faire disparaître — le code étant jetable et reclonable, alors
 * que les envois des hôtes sont irremplaçables. Les deux ne doivent pas
 * partager le même cycle de vie.
 *
 * Les pièces d'identité ne passent PAS par ici : elles restent sur le disque
 * `private`. Les publier derrière une URL de CDN devinable exposerait des
 * documents personnels, ce qu'interdit le traitement de données à caractère
 * personnel encadré par la loi n° 2017-20.
 *
 * Pas de SDK : l'envoi signé tient en quelques lignes d'appel HTTP, et une
 * dépendance de moins est une dépendance de moins à maintenir.
 */
class PhotoStorage
{
    /** Cloudinary est-il configuré ? Sinon on retombe sur le disque local. */
    public function enabled(): bool
    {
        return filled(config('services.cloudinary.cloud_name'))
            && filled(config('services.cloudinary.api_key'))
            && filled(config('services.cloudinary.api_secret'));
    }

    /**
     * Stocke un fichier et renvoie ['path' => ..., 'url' => ...].
     *
     * Sur Cloudinary, `path` est volontairement une chaîne vide : les modèles
     * (PropertyPhoto notamment) ne renvoient `photo_url` telle quelle que si
     * `photo_path` est vide — sinon ils reconstruisent une URL locale. La
     * colonne étant NOT NULL, c'est bien '' et non null.
     */
    public function upload(UploadedFile $file, string $folder): array
    {
        if (! $this->enabled()) {
            $path = $file->store($folder, 'public');

            return ['path' => $path, 'url' => Storage::url($path)];
        }

        return ['path' => '', 'url' => $this->uploadToCloudinary($file, $folder)];
    }

    /**
     * Stocke un document sensible (pièce d'identité).
     *
     * Envoyé en `type=authenticated` : contrairement aux médias publics, le
     * fichier n'est PAS servi par une URL permanente devinable — sa livraison
     * exige une URL signée à durée limitée. Une carte d'identité derrière une
     * adresse publique et définitive serait consultable par n'importe qui
     * tombant dessus, ce qu'aucune obligation de vérification ne justifie.
     *
     * On conserve l'identifiant Cloudinary (public_id) et non une URL : c'est
     * lui qui permettra de signer une consultation ponctuelle. Tant qu'aucun
     * écran n'affiche ces documents, la revue se fait depuis la console
     * Cloudinary.
     */
    public function uploadPrivate(UploadedFile $file, string $folder): string
    {
        if (! $this->enabled()) {
            // Le disque `private` pointe, en production, hors du répertoire de
            // l'application (PRIVATE_STORAGE_ROOT) : sans quoi ces documents
            // disparaîtraient à chaque redéploiement.
            return $file->store($folder, 'private');
        }

        return $this->uploadToCloudinary($file, $folder, authenticated: true);
    }

    private function uploadToCloudinary(UploadedFile $file, string $folder, bool $authenticated = false): string
    {
        $cloud = config('services.cloudinary.cloud_name');
        $timestamp = time();
        $target = trim(config('services.cloudinary.folder', 'bluefin'), '/').'/'.trim($folder, '/');

        // La signature porte sur les paramètres envoyés, triés par nom, puis
        // concaténés avec le secret. `file` et `api_key` en sont exclus.
        $signed = ['folder' => $target, 'timestamp' => $timestamp];
        if ($authenticated) {
            $signed['type'] = 'authenticated';
        }
        ksort($signed);
        $toSign = collect($signed)->map(fn ($v, $k) => "$k=$v")->implode('&');
        $signature = sha1($toSign.config('services.cloudinary.api_secret'));

        $response = Http::timeout(30)
            ->attach('file', $file->get(), $file->getClientOriginalName())
            ->post("https://api.cloudinary.com/v1_1/{$cloud}/image/upload", array_merge($signed, [
                'api_key' => config('services.cloudinary.api_key'),
                'signature' => $signature,
            ]));

        // Un document authentifié n'a pas d'URL publique exploitable : on
        // conserve son public_id, seul élément permettant de signer plus tard
        // une consultation à durée limitée.
        $expected = $authenticated ? 'public_id' : 'secure_url';

        if ($response->failed() || blank($response->json($expected))) {
            Log::error('Envoi Cloudinary en échec', [
                'folder' => $target,
                'status' => $response->status(),
                'body' => $response->json('error.message') ?? $response->body(),
            ]);

            // On ne se rabat PAS silencieusement sur le disque local : le
            // fichier y survivrait jusqu'au prochain déploiement, puis
            // disparaîtrait sans que personne ne l'ait su. Mieux vaut que
            // l'envoi échoue franchement et que l'hôte recommence.
            throw new RuntimeException("L'envoi de l'image a échoué. Merci de réessayer.");
        }

        return $response->json($expected);
    }
}
