<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Favorite extends Model
{
    use HasFactory;

    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'property_id',
        'list_name',
        'notes',
    ];

    /**
     * Les attributs qui doivent être castés.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Les valeurs par défaut des attributs.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'list_name' => 'default',
    ];

    /**
     * Relation avec l'utilisateur
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation avec la propriété
     */
    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    /**
     * Scope pour filtrer par liste
     */
    public function scopeInList($query, $listName)
    {
        return $query->where('list_name', $listName);
    }

    /**
     * Scope pour l'utilisateur courant
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Vérifier si une propriété est déjà en favoris
     */
    public static function isFavorited($userId, $propertyId, $listName = 'default')
    {
        return self::where('user_id', $userId)
            ->where('property_id', $propertyId)
            ->where('list_name', $listName)
            ->exists();
    }
}