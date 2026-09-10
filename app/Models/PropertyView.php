<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PropertyView extends Model
{
    use HasFactory;

    protected $table = 'property_views';

    protected $fillable = [
        'property_id', 'ip_address', 'user_agent', 'referrer', 
        'user_id', 'session_id', 'view_date'
    ];

    protected $casts = [
        'view_date' => 'date',
    ];

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}