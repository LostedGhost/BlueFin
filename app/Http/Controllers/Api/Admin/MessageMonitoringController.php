<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MessageMonitoringController extends Controller
{
    /**
     * Get message activity
     */
    public function index(Request $request)
    {
        $query = Message::with(['sender', 'receiver', 'booking.property']);
        
        // Filter by date
        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }
        
        // Filter by user
        if ($request->has('user_id')) {
            $query->where(function($q) use ($request) {
                $q->where('sender_id', $request->user_id)
                  ->orWhere('receiver_id', $request->user_id);
            });
        }
        
        $messages = $query->orderBy('created_at', 'desc')
            ->paginate(50);
        
        // Statistics
        $stats = [
            'total_messages' => Message::count(),
            'today_messages' => Message::whereDate('created_at', today())->count(),
            'unread_messages' => Message::where('is_read', false)->count(),
            'top_conversations' => $this->getTopConversations(),
            'most_active_users' => $this->getMostActiveUsers(),
        ];
        
        return response()->json([
            'success' => true,
            'data' => $messages,
            'stats' => $stats,
        ]);
    }

    /**
     * Get conversation between two users
     */
    public function getConversation(Request $request, $user1Id, $user2Id)
    {
        $messages = Message::where(function($q) use ($user1Id, $user2Id) {
                $q->where('sender_id', $user1Id)
                  ->where('receiver_id', $user2Id);
            })
            ->orWhere(function($q) use ($user1Id, $user2Id) {
                $q->where('sender_id', $user2Id)
                  ->where('receiver_id', $user1Id);
            })
            ->with(['sender', 'receiver'])
            ->orderBy('created_at', 'asc')
            ->get();
        
        $user1 = User::find($user1Id);
        $user2 = User::find($user2Id);
        
        return response()->json([
            'success' => true,
            'data' => [
                'users' => [
                    'user1' => $user1,
                    'user2' => $user2,
                ],
                'messages' => $messages,
                'total' => $messages->count(),
            ],
        ]);
    }

    /**
     * Get suspicious conversations (potential fraud)
     */
    public function suspiciousConversations(Request $request)
    {
        // Find conversations with many messages in short time
        $suspicious = Message::select('sender_id', 'receiver_id', DB::raw('COUNT(*) as count'))
            ->where('created_at', '>=', now()->subHours(24))
            ->groupBy('sender_id', 'receiver_id')
            ->having('count', '>', 50)
            ->get();
        
        $conversations = [];
        foreach ($suspicious as $conv) {
            $conversations[] = [
                'sender' => User::find($conv->sender_id),
                'receiver' => User::find($conv->receiver_id),
                'message_count' => $conv->count,
            ];
        }
        
        return response()->json([
            'success' => true,
            'data' => $conversations,
        ]);
    }

    /**
     * Get top conversations by message count
     */
    private function getTopConversations()
    {
        return Message::select('sender_id', 'receiver_id', DB::raw('COUNT(*) as total'))
            ->groupBy('sender_id', 'receiver_id')
            ->orderBy('total', 'desc')
            ->limit(10)
            ->get();
    }

    /**
     * Get most active users (by message count)
     */
    private function getMostActiveUsers()
    {
        $senderCounts = Message::select('sender_id', DB::raw('COUNT(*) as sent'))
            ->groupBy('sender_id')
            ->get();
        
        $receiverCounts = Message::select('receiver_id', DB::raw('COUNT(*) as received'))
            ->groupBy('receiver_id')
            ->get();
        
        $users = [];
        foreach ($senderCounts as $sender) {
            $user = User::find($sender->sender_id);
            if ($user) {
                $received = $receiverCounts->where('receiver_id', $sender->sender_id)->first();
                $users[] = [
                    'user' => $user,
                    'sent' => $sender->sent,
                    'received' => $received ? $received->received : 0,
                    'total' => $sender->sent + ($received ? $received->received : 0),
                ];
            }
        }
        
        return collect($users)->sortByDesc('total')->take(10)->values();
    }
}