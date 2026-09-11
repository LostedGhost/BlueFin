<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * Besoin publié par un voyageur, auquel les hôtes de la ville répondent.
 */
class Need extends Model
{
    protected $fillable = [
        'user_id', 'type', 'city', 'district', 'start_date', 'end_date',
        'guests', 'budget_max', 'details', 'status', 'closed_reason',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'guests' => 'integer',
        'budget_max' => 'integer',
        'responses_count' => 'integer',
    ];

    public const MAX_OPEN_PER_USER = 5;

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function responses()
    {
        return $this->hasMany(NeedResponse::class)->latest();
    }

    /** Un besoin dont la date de fin est passée n'attend plus de réponse. */
    public function isExpired(): bool
    {
        return $this->end_date !== null && $this->end_date->isPast() && ! $this->end_date->isToday();
    }

    public function isOpen(): bool
    {
        return $this->status === 'open' && ! $this->isExpired();
    }

    /** Clé de comparaison des villes saisies librement (« Porto Novo » = « porto-novo »). */
    public static function cityKey(?string $city): string
    {
        return (string) Str::of(Str::ascii((string) $city))->lower()->replaceMatches('/[^a-z]+/', '');
    }
}
