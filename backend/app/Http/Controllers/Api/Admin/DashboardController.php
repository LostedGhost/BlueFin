<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Property;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\AdminNotification;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    /**
     * Get admin dashboard overview
     */
    public function index(Request $request)
    {
        try {
            // Real-time statistics
            $stats = [
                'users' => [
                    'total' => User::count(),
                    'new_today' => User::whereDate('created_at', today())->count(),
                    'new_this_week' => User::where('created_at', '>=', now()->startOfWeek())->count(),
                    'hosts' => User::where('user_type', 'hote')->count(),
                    'travelers' => User::where('user_type', 'voyageur')->count(),
                ],
                'properties' => [
                    'total' => Property::count(),
                    'pending' => Property::where('status', 'pending')->count(),
                    'active' => Property::where('status', 'active')->count(),
                    'rejected' => Property::where('status', 'rejected')->count(),
                    'new_today' => Property::whereDate('created_at', today())->count(),
                ],
                'bookings' => [
                    'total' => Booking::count(),
                    'today' => Booking::whereDate('check_in', today())->count(),
                    'pending_payment' => Booking::where('payment_status', 'pending')->count(),
                    'confirmed' => Booking::where('booking_status', 'confirmed')->count(),
                    'completed' => Booking::where('booking_status', 'completed')->count(),
                ],
                'payments' => [
                    'total_amount' => Payment::where('status', 'success')->sum('amount') ?? 0,
                    'today_amount' => Payment::where('status', 'success')
                        ->whereDate('created_at', today())  // ✅ Changé: paid_at -> created_at
                        ->sum('amount') ?? 0,
                    'pending_payouts' => DB::table('payouts')->where('status', 'pending')->sum('amount') ?? 0,
                ],
            ];
            
            // Recent activity
            $recentActivities = $this->getRecentActivities();
            
            // Unread notifications count
            $unreadNotifications = AdminNotification::where('admin_id', $request->user()->id)
                ->where('is_read', false)
                ->count();
            
            // Chart data for last 30 days
            $chartData = $this->getChartData();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => $stats,
                    'recent_activities' => $recentActivities,
                    'unread_notifications' => $unreadNotifications,
                    'chart_data' => $chartData,
                    'last_updated' => now()->toIso8601String(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Dashboard error: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get recent activities for dashboard
     */
    private function getRecentActivities()
    {
        try {
            $activities = collect();
            
            // Recent property submissions
            $recentProperties = Property::with('user')
                ->where('status', 'pending')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function($property) {
                    // ✅ Sécuriser l'accès au nom complet
                    $userName = $property->user->first_name . ' ' . $property->user->last_name;
                    $userName = trim($userName) ?: ($property->user->email ?? 'Utilisateur');
                    
                    return [
                        'type' => 'property_submitted',
                        'title' => $property->title,
                        'user' => $userName,
                        'time' => $property->created_at ? $property->created_at->diffForHumans() : 'N/A',
                        'timestamp' => $property->created_at,
                        'action_url' => "/admin/properties/{$property->id}/moderate",
                    ];
                });
            $activities = $activities->merge($recentProperties);
            
            // Recent payments
            $recentPayments = Payment::with(['booking.user', 'booking.property'])
                ->where('status', 'success')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function($payment) {
                    $userName = $payment->booking->user->first_name . ' ' . $payment->booking->user->last_name;
                    $userName = trim($userName) ?: ($payment->booking->user->email ?? 'Client');
                    
                    return [
                        'type' => 'payment_received',
                        'amount' => $payment->amount,
                        'guest' => $userName,
                        'property' => $payment->booking->property->title ?? 'N/A',
                        'time' => $payment->created_at ? $payment->created_at->diffForHumans() : 'N/A',
                        'timestamp' => $payment->created_at,
                        'action_url' => "/admin/payments/{$payment->id}",
                    ];
                });
            $activities = $activities->merge($recentPayments);
            
            // Recent user registrations
            $recentUsers = User::orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function($user) {
                    $userName = $user->first_name . ' ' . $user->last_name;
                    $userName = trim($userName) ?: $user->email;
                    
                    return [
                        'type' => 'user_registered',
                        'name' => $userName,
                        'user_type' => $user->user_type,
                        'time' => $user->created_at ? $user->created_at->diffForHumans() : 'N/A',
                        'timestamp' => $user->created_at,
                        'action_url' => "/admin/users/{$user->id}",
                    ];
                });
            $activities = $activities->merge($recentUsers);
            
            // Recent messages
            $recentMessages = Message::with(['sender', 'receiver', 'booking.property'])
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function($message) {
                    $senderName = $message->sender->first_name . ' ' . $message->sender->last_name;
                    $senderName = trim($senderName) ?: ($message->sender->email ?? 'N/A');
                    
                    $receiverName = $message->receiver->first_name . ' ' . $message->receiver->last_name;
                    $receiverName = trim($receiverName) ?: ($message->receiver->email ?? 'N/A');
                    
                    return [
                        'type' => 'message_sent',
                        'from' => $senderName,
                        'to' => $receiverName,
                        'property' => $message->booking?->property?->title ?? 'N/A',
                        'time' => $message->created_at ? $message->created_at->diffForHumans() : 'N/A',
                        'timestamp' => $message->created_at,
                    ];
                });
            $activities = $activities->merge($recentMessages);
            
            // Sort by timestamp
            return $activities->sortByDesc('timestamp')->take(50)->values()->toArray();
            
        } catch (\Exception $e) {
            Log::error('getRecentActivities error: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get chart data for graphs
     */
    private function getChartData()
    {
        try {
            $last30Days = collect(range(0, 29))->map(function($days) {
                $date = now()->subDays($days);
                return [
                    'date' => $date->format('Y-m-d'),
                    'day' => $date->format('d M'),
                ];
            })->reverse()->values();
            
            // Revenue data
            $revenueData = [];
            foreach ($last30Days as $day) {
                $revenue = Payment::where('status', 'success')
                    ->whereDate('created_at', $day['date'])
                    ->sum('amount') ?? 0;
                $revenueData[] = $revenue;
            }
            
            // Bookings data
            $bookingsData = [];
            foreach ($last30Days as $day) {
                $bookings = Booking::whereDate('created_at', $day['date'])->count();
                $bookingsData[] = $bookings;
            }
            
            // New users data
            $usersData = [];
            foreach ($last30Days as $day) {
                $users = User::whereDate('created_at', $day['date'])->count();
                $usersData[] = $users;
            }
            
            return [
                'labels' => $last30Days->pluck('day')->toArray(),
                'revenue' => $revenueData,
                'bookings' => $bookingsData,
                'users' => $usersData,
            ];
        } catch (\Exception $e) {
            Log::error('getChartData error: ' . $e->getMessage());
            return [
                'labels' => [],
                'revenue' => [],
                'bookings' => [],
                'users' => [],
            ];
        }
    }

    /**
     * Get real-time notifications
     */
    public function notifications(Request $request)
    {
        try {
            $notifications = AdminNotification::where('admin_id', $request->user()->id)
                ->orderBy('created_at', 'desc')
                ->paginate(20);
            
            return response()->json([
                'success' => true,
                'data' => $notifications,
            ]);
        } catch (\Exception $e) {
            Log::error('notifications error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark notification as read
     */
    public function markNotificationRead(Request $request, $id)
    {
        try {
            $notification = AdminNotification::where('admin_id', $request->user()->id)
                ->findOrFail($id);
            
            $notification->update(['is_read' => true, 'read_at' => now()]);
            
            return response()->json([
                'success' => true,
                'message' => 'Notification marquée comme lue',
            ]);
        } catch (\Exception $e) {
            Log::error('markNotificationRead error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark all notifications as read
     */
    public function markAllRead(Request $request)
    {
        try {
            AdminNotification::where('admin_id', $request->user()->id)
                ->where('is_read', false)
                ->update(['is_read' => true, 'read_at' => now()]);
            
            return response()->json([
                'success' => true,
                'message' => 'Toutes les notifications ont été marquées comme lues',
            ]);
        } catch (\Exception $e) {
            Log::error('markAllRead error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}