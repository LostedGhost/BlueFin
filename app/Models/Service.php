<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Service extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'host_id', 'title', 'description', 'slug', 'location', 'service_type', 'category',
        'price', 'duration_minutes', 'images', 'availability',
        'status', 'is_published', 'published_at', 'requires_review',
        'moderated_by', 'moderated_at', 'moderation_notes', 'rejection_reason',
    ];

    protected $casts = [
        'images' => 'array',
        'availability' => 'array',
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

    public function bookings()
    {
        return $this->hasMany(ServiceBooking::class);
    }

    public static function generateSlug(string $title): string
    {
        return Str::slug($title) . '-' . uniqid();
    }
}
