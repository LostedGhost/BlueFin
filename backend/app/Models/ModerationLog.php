<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ModerationLog extends Model
{
    use HasFactory;

    protected $table = 'moderation_logs';

    protected $fillable = [
        'moderator_id', 'moderatable_type', 'moderatable_id', 
        'action', 'reason', 'old_data', 'new_data'
    ];

    protected $casts = [
        'old_data' => 'array',
        'new_data' => 'array',
    ];

    // Relations
    public function moderator()
    {
        return $this->belongsTo(User::class, 'moderator_id');
    }

    public function moderatable()
    {
        return $this->morphTo();
    }
}