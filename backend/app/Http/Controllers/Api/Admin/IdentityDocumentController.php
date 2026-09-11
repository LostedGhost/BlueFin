<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Consultation, par un administrateur, de la pièce d'identité d'un hôte.
 *
 * Le document n'est JAMAIS exposé par une URL que le navigateur pourrait
 * conserver, partager ou voir fuiter dans un historique : l'endpoint le
 * diffuse lui-même. Côté Cloudinary, l'asset est en `type=authenticated` et
 * son URL signée ne quitte pas le serveur ; côté disque local, le fichier est
 * hors de toute racine servie publiquement.
 *
 * Ce choix évite aussi de dépendre de l'authentification par jeton de
 * Cloudinary (qui seule permet une vraie expiration), dont la disponibilité
 * varie selon le forfait.
 *
 * Chaque consultation est journalisée : regarder la pièce d'identité de
 * quelqu'un est un accès à une donnée personnelle, il doit rester traçable.
 */
class IdentityDocumentController extends Controller
{
    public function show(Request $request, $id)
    {
        $user = User::findOrFail($id);

        if (blank($user->identity_document)) {
            return response()->json([
                'success' => false,
                'message' => "Cet utilisateur n'a pas transmis de pièce d'identité.",
            ], 404);
        }

        Log::info('Consultation d\'une pièce d\'identité', [
            'admin_id' => $request->user()->id,
            'admin_email' => $request->user()->email,
            'cible_id' => $user->id,
            'ip' => $request->ip(),
        ]);

        $reference = $user->identity_document;

        return str_starts_with($reference, 'http://') || str_starts_with($reference, 'https://')
            ? $this->streamFromCloudinary($reference, $user)
            : $this->streamFromDisk($reference, $user);
    }

    private function streamFromCloudinary(string $url, User $user)
    {
        $response = Http::timeout(30)->get($url);

        if ($response->failed()) {
            Log::error('Pièce d\'identité illisible sur Cloudinary', [
                'cible_id' => $user->id,
                'status' => $response->status(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Document introuvable ou inaccessible.',
            ], 502);
        }

        return response($response->body(), 200, $this->headers(
            $response->header('Content-Type') ?: 'application/octet-stream'
        ));
    }

    private function streamFromDisk(string $path, User $user)
    {
        $disk = Storage::disk('private');

        if (! $disk->exists($path)) {
            Log::error('Pièce d\'identité absente du disque privé', [
                'cible_id' => $user->id,
                'path' => $path,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Document introuvable sur le serveur.',
            ], 404);
        }

        return new StreamedResponse(
            fn () => fpassthru($disk->readStream($path)),
            200,
            $this->headers($disk->mimeType($path) ?: 'application/octet-stream')
        );
    }

    /**
     * `inline` pour permettre l'affichage direct, et surtout un cache
     * désactivé : ce document n'a rien à faire dans le cache d'un navigateur
     * ni d'un intermédiaire.
     */
    private function headers(string $contentType): array
    {
        return [
            'Content-Type' => $contentType,
            'Content-Disposition' => 'inline',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, private',
            'Pragma' => 'no-cache',
            'X-Content-Type-Options' => 'nosniff',
        ];
    }
}
