<?php

namespace App\Events;

use App\Models\Property;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PropertySubmittedForApproval implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $property;

    public function __construct(Property $property)
    {
        $this->property = $property;
    }

    public function broadcastOn()
    {
        return new Channel('admin-notifications');
    }

    public function broadcastAs()
    {
        return 'property.submitted';
    }

    public function broadcastWith()
    {
        return [
            'id' => $this->property->id,
            'title' => $this->property->title,
            'host_name' => $this->property->user->full_name,
            'host_phone' => $this->property->user->phone,
            'city' => $this->property->city,
            'district' => $this->property->district,
            'created_at' => $this->property->created_at->toIso8601String(),
        ];
    }
}