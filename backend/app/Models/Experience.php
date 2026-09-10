<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Experience extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'host_id', 'name', 'description', 'slug', 'location', 'latitude', 'longitude',
        'price', 'total_places', 'duration', 'steps', 'images',
        'status', 'is_published', 'published_at', 'requires_review',
        'moderated_by', 'moderated_at', 'moderation_notes', 'rejection_reason', 'moderation_attempts',
    ];

    protected $casts = [
        'steps' => 'array',
        'images' => 'array',
        'is_published' => 'boolean',
        'published_at' => 'datetime',
        'moderated_at' => 'datetime',
        'price' => 'decimal:0',
        'average_rating' => 'decimal:2',
    ];

    public function host()
    {
        return $this->belongsTo(User::class, 'host_id');
    }

    public function moderator()
    {
        return $this->belongsTo(User::class, 'moderated_by');
    }

    public function availabilities()
    {
        return $this->hasMany(ExperienceAvailability::class);
    }

    public function bookings()
    {
        return $this->hasMany(ExperienceBooking::class);
    }

    // Remarque : il n'existe pas encore de colonne experience_id sur la table
    // `reviews` (celle-ci ne couvre aujourd'hui que les logements) — average_rating
    // et reviews_count sont donc de simples compteurs, pas encore alimentés par un
    // vrai système d'avis. À raccorder si des avis d'expériences sont introduits.

    public static function generateSlug(string $name): string
    {
        return Str::slug($name) . '-' . uniqid();
    }
}
