<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdminNotification extends Model
{
    use HasFactory;

    protected $table = 'admin_notifications';

    protected $fillable = [
        'admin_id', 'type', 'title', 'message', 'data', 
        'priority', 'is_read', 'read_at', 'is_archived'
    ];

    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean',
        'is_archived' => 'boolean',
        'read_at' => 'datetime',
    ];

    // Scopes
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeHighPriority($query)
    {
        return $query->whereIn('priority', ['high', 'urgent']);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    // Mark as read
    public function markAsRead()
    {
        $this->is_read = true;
        $this->read_at = now();
        $this->save();
    }

    // Get priority color
    public function getPriorityColorAttribute()
    {
        return match($this->priority) {
            'urgent' => 'red',
            'high' => 'orange',
            'normal' => 'blue',
            'low' => 'gray',
            default => 'gray',
        };
    }

    // Get icon based on type
    public function getIconAttribute()
    {
        return match($this->type) {
            'property_submitted' => '🏠',
            'property_approved' => '✅',
            'property_rejected' => '❌',
            'payment_received' => '💰',
            'message_sent' => '💬',
            'user_registered' => '👤',
            'booking_made' => '📅',
            'review_submitted' => '⭐',
            default => '🔔',
        };
    }
}