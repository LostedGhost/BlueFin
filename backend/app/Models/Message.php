<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory;

    protected $table = 'messages';

    protected $fillable = [
        'sender_id', 'receiver_id', 'booking_id', 'experience_id', 'service_id', 'message',
        'is_read', 'read_at', 'message_type', 'attachment_url',
        'attachment_name', 'attachment_size', 'is_deleted_by_sender',
        'is_deleted_by_receiver'
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'is_deleted_by_sender' => 'boolean',
        'is_deleted_by_receiver' => 'boolean',
    ];

    // ==================== RELATIONS ====================
    
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function experience()
    {
        return $this->belongsTo(Experience::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    // ==================== SCOPES ====================
    
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where(function($q) use ($userId) {
            $q->where('sender_id', $userId)
              ->orWhere('receiver_id', $userId);
        });
    }

    // ==================== METHODS ====================
    
    public function markAsRead()
    {
        if (!$this->is_read) {
            $this->is_read = true;
            $this->read_at = now();
            $this->save();
        }
    }

    public function getPreviewAttribute()
    {
        return strlen($this->message) > 50 
            ? substr($this->message, 0, 50) . '...' 
            : $this->message;
    }

    public function isFromUser($userId)
    {
        return $this->sender_id === $userId;
    }

    public function isToUser($userId)
    {
        return $this->receiver_id === $userId;
    }
}