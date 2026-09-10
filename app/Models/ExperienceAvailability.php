<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExperienceAvailability extends Model
{
    protected $fillable = ['experience_id', 'date', 'slots', 'is_available'];

    protected $casts = [
        'date' => 'date',
        'slots' => 'array',
        'is_available' => 'boolean',
    ];

    public function experience()
    {
        return $this->belongsTo(Experience::class);
    }
}
