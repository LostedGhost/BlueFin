<?php

namespace App\Support;

use App\Models\Property;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Mise en forme des données renvoyées par les endpoints PUBLICS (sans
 * connexion) : liste et fiche des logements, recherche, avis.
 *
 * Auparavant ces endpoints sérialisaient la ligne `users` complète de l'hôte
 * (e-mail, téléphone, adresse, date de naissance, IP de connexion,
 * permissions, référence de la pièce d'identité…) et des champs internes du
 * logement (justificatifs, chiffre d'affaires, lien iCal privé, notes de
 * modération). N'importe qui pouvait les récupérer.
 *
 * Principe : LISTE BLANCHE pour les personnes — un champ ajouté plus tard à
 * la table `users` ne sortira jamais publiquement par accident.
 */
class PublicPayload
{
    /** Seuls champs d'une personne visibles publiquement. */
    public const USER_ATTRIBUTES = [
        'id', 'first_name', 'last_name', 'full_name', 'profile_photo', 'profile_photo_url',
        'bio', 'languages', 'country', 'city', 'user_type', 'host_type',
        'verification_status', 'average_rating_as_host', 'total_reviews', 'total_properties',
        'created_at',
    ];

    /** Champs internes d'un logement, jamais publics. */
    public const PROPERTY_PRIVATE_ATTRIBUTES = [
        'property_document', 'insurance_certificate', 'total_revenue', 'ical_url',
        'moderation_notes', 'moderation_attempts', 'moderated_by', 'moderated_at',
        'rejection_reason', 'requires_review', 'checkin_instructions',
    ];

    public static function user(?User $user): ?User
    {
        return $user?->setVisible(self::USER_ATTRIBUTES)->append(['full_name', 'profile_photo_url']);
    }

    public static function property(?Property $property): ?Property
    {
        if (! $property) {
            return null;
        }

        $property->makeHidden(self::PROPERTY_PRIVATE_ATTRIBUTES);

        if ($property->relationLoaded('user')) {
            self::user($property->user);
        }

        return $property;
    }

    /** @param iterable<Property> $properties */
    public static function properties(iterable $properties): void
    {
        foreach ($properties as $property) {
            self::property($property);
        }
    }

    /** Champs internes d'une expérience ou d'un service, jamais publics. */
    public const OFFER_PRIVATE_ATTRIBUTES = ['moderation_notes', 'moderated_at'];

    /**
     * Expériences / services publics : accepte un modèle, une collection ou
     * un paginateur, et le renvoie tel quel.
     */
    public static function offers(mixed $offers): mixed
    {
        $items = $offers instanceof \Illuminate\Pagination\AbstractPaginator ? $offers->getCollection() : $offers;
        $items = $items instanceof \Illuminate\Database\Eloquent\Model ? [$items] : $items;
        foreach ($items ?? [] as $offer) {
            $offer->makeHidden(self::OFFER_PRIVATE_ATTRIBUTES);
        }

        return $offers;
    }

    /** Avis publics : l'auteur n'apparaît que par son profil public. */
    public static function reviews(iterable $reviews): void
    {
        foreach ($reviews as $review) {
            if ($review->relationLoaded('user')) {
                self::user($review->user);
            }
        }
    }
}
