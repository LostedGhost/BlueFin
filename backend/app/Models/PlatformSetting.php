<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

/**
 * Réglages modifiables depuis l'administration.
 *
 * Seuls les réglages déclarés dans DEFINITIONS existent : chacun est
 * réellement lu par le code (aucun réglage « décoratif »). La valeur par
 * défaut s'applique tant que l'administrateur n'a rien enregistré — ce qui
 * reproduit exactement le comportement antérieur (15 %, 5 000 FCFA).
 */
class PlatformSetting extends Model
{
    protected $fillable = ['key', 'value', 'updated_by'];

    public const DEFINITIONS = [
        'commission_rate' => [
            'type' => 'float',
            'default' => 15,
            'rules' => 'numeric|min:0|max:50',
            'label' => 'Commission de la plateforme (%)',
        ],
        'min_payout_amount' => [
            'type' => 'int',
            'default' => 5000,
            'rules' => 'integer|min:0|max:10000000',
            'label' => 'Montant minimum de versement (FCFA)',
        ],
        'payout_overdue_days' => [
            'type' => 'int',
            'default' => 7,
            'rules' => 'integer|min:1|max:90',
            'label' => 'Délai avant qu\'un versement soit considéré en retard (jours)',
        ],
    ];

    private const CACHE_KEY = 'platform_settings.all';

    /** @return array<string, int|float> */
    public static function allValues(): array
    {
        return Cache::remember(self::CACHE_KEY, 3600, function () {
            // Avant que la migration soit jouée, on retombe sur les valeurs
            // par défaut plutôt que de faire planter tout calcul de solde.
            $stored = Schema::hasTable('platform_settings')
                ? static::query()->pluck('value', 'key')->all()
                : [];

            $values = [];
            foreach (self::DEFINITIONS as $key => $definition) {
                $raw = $stored[$key] ?? $definition['default'];
                $values[$key] = $definition['type'] === 'int' ? (int) $raw : (float) $raw;
            }

            return $values;
        });
    }

    public static function current(string $key): int|float
    {
        return self::allValues()[$key];
    }

    public static function store(array $values, ?int $adminId): void
    {
        foreach ($values as $key => $value) {
            if (! array_key_exists($key, self::DEFINITIONS)) {
                continue;
            }
            static::updateOrCreate(['key' => $key], ['value' => (string) $value, 'updated_by' => $adminId]);
        }

        Cache::forget(self::CACHE_KEY);
    }
}
