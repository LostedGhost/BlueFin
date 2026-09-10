<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class BookingMonitoringController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'nullable|in:pending,confirmed,cancelled,completed,refunded',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'search' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $query = Booking::with(['user', 'property.user', 'payment']);

        if ($request->has('status')) {
            $query->where('booking_status', $request->status);
        }
        if ($request->has('start_date')) {
            $query->where('check_in', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('check_out', '<=', $request->end_date);
        }
        if ($request->has('search')) {
            // Échapper les jokers LIKE (%, _) présents dans la saisie utilisateur
            // pour éviter qu'une recherche contenant ces caractères ne se
            // comporte de façon inattendue.
            $search = str_replace(['%', '_'], ['\\%', '\\_'], $request->search);
            $query->where(function($q) use ($search) {
                $q->where('booking_reference', 'like', "%{$search}%")
                  ->orWhereHas('user', function($q2) use ($search) {
                      $q2->where('first_name', 'like', "%{$search}%")
                         ->orWhere('last_name', 'like', "%{$search}%")
                         ->orWhere('phone', 'like', "%{$search}%");
                  });
            });
        }

        $bookings = $query->orderBy('created_at', 'desc')->paginate(20);

        $stats = [
            'total' => Booking::count(),
            'confirmed' => Booking::where('booking_status', 'confirmed')->count(),
            'pending' => Booking::where('booking_status', 'pending')->count(),
            'completed' => Booking::where('booking_status', 'completed')->count(),
            'cancelled' => Booking::where('booking_status', 'cancelled')->count(),
            'today_checkins' => Booking::whereDate('check_in', today())->count(),
            'today_checkouts' => Booking::whereDate('check_out', today())->count(),
        ];

        return response()->json(['success' => true, 'data' => $bookings, 'stats' => $stats]);
    }

    public function show($id)
    {
        $booking = Booking::with(['user', 'property.user', 'property.photos', 'payment', 'review'])
            ->findOrFail($id);
        $booking->timeline = $this->getBookingTimeline($booking);
        return response()->json(['success' => true, 'data' => $booking]);
    }

    public function cancel(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);
        $reason = $request->reason ?? 'Annulation par l\'administrateur';

        $booking->update([
            'booking_status' => 'cancelled',
            'cancelled_at' => now(),
            'cancellation_reason' => $reason,
        ]);

        $this->notificationService->sendWhatsApp(
            $booking->user->phone,
            "❌ Réservation #{$booking->booking_reference} annulée par l'admin.\nRaison: {$reason}"
        );
        $this->notificationService->sendWhatsApp(
            $booking->property->user->phone,
            "❌ Réservation #{$booking->booking_reference} annulée.\nVoyageur: {$booking->user->full_name}"
        );

        return response()->json(['success' => true, 'message' => 'Réservation annulée']);
    }

    private function getBookingTimeline($booking)
    {
        $timeline = [
            ['event' => 'Réservation créée', 'date' => $booking->created_at, 'status' => 'completed'],
        ];
        if ($booking->payment && $booking->payment->paid_at) {
            $timeline[] = ['event' => 'Paiement confirmé', 'date' => $booking->payment->paid_at, 'amount' => $booking->payment->amount, 'status' => 'completed'];
        }
        if ($booking->checked_in_at) {
            $timeline[] = ['event' => 'Check-in effectué', 'date' => $booking->checked_in_at, 'status' => 'completed'];
        }
        if ($booking->checked_out_at) {
            $timeline[] = ['event' => 'Check-out effectué', 'date' => $booking->checked_out_at, 'status' => 'completed'];
        }
        if ($booking->review) {
            $timeline[] = ['event' => 'Avis laissé', 'date' => $booking->review->created_at, 'rating' => $booking->review->rating, 'status' => 'completed'];
        }
        if ($booking->cancelled_at) {
            $timeline[] = ['event' => 'Réservation annulée', 'date' => $booking->cancelled_at, 'reason' => $booking->cancellation_reason, 'status' => 'warning'];
        }
        return $timeline;
    }
}