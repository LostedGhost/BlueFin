<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Réponse d'un hôte à un besoin, avec éventuellement l'une de ses annonces.
 */
class NeedResponse extends Model
{
    protected $fillable = ['need_id', 'host_id', 'property_id', 'message'];

    public function need()
    {
        return $this->belongsTo(Need::class);
    }

    public function host()
    {
        return $this->belongsTo(User::class, 'host_id');
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }
}
