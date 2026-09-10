<?php

namespace App\Http\Controllers\Api\Host;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class HostBookingController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get all bookings for the host.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $status = $request->get('status', 'all');

        $query = Booking::with(['property.coverPhoto', 'user', 'payment'])
            ->whereHas('property', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });

        if ($status !== 'all') {
            $query->where('booking_status', $status);
        }

        $bookings = $query->orderBy('created_at', 'desc')->paginate(10);

        $bookings->getCollection()->transform(function ($booking) {
            return [
                'id' => $booking->id,
                'reference' => $booking->booking_reference,
                'status' => $booking->booking_status,
                'status_label' => $this->getStatusLabel($booking->booking_status),
                'guest' => [
                    'id' => $booking->user->id,
                    'name' => $booking->user->full_name,
                    'phone' => $booking->user->phone,
                    'photo' => $booking->user->profile_photo_url,
                ],
                'property' => [
                    'id' => $booking->property->id,
                    'title' => $booking->property->title,
                    'city' => $booking->property->city,
                    'district' => $booking->property->district,
                    'cover_photo' => $booking->property->coverPhoto?->photo_url,
                ],
                'dates' => [
                    'check_in' => $booking->check_in->format('d/m/Y'),
                    'check_out' => $booking->check_out->format('d/m/Y'),
                    'nights' => $booking->nights_count,
                ],
                'amount' => [
                    'subtotal' => number_format($booking->subtotal, 0, ',', ' '),
                    'service_fee' => number_format($booking->service_fee, 0, ',', ' '),
                    'cleaning_fee' => number_format($booking->cleaning_fee, 0, ',', ' '),
                    'total' => number_format($booking->total_amount, 0, ',', ' '),
                ],
                'payment_status' => $booking->payment_status,
                'checked_in_at' => optional($booking->checked_in_at)->format('d/m/Y H:i'),
                'checked_out_at' => optional($booking->checked_out_at)->format('d/m/Y H:i'),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $bookings,
        ]);
    }

    /**
     * Get single booking details.
     */
    public function show(Request $request, $id)
    {
        $booking = $this->findHostBooking($request->user()->id, $id);

        return response()->json([
            'success' => true,
            'data' => [
                'booking' => [
                    'id' => $booking->id,
                    'reference' => $booking->booking_reference,
                    'status' => $booking->booking_status,
                    'status_label' => $this->getStatusLabel($booking->booking_status),
                    'guest' => [
                        'id' => $booking->user->id,
                        'name' => $booking->user->full_name,
                        'phone' => $booking->user->phone,
                        'email' => $booking->user->email,
                    ],
                    'property' => [
                        'id' => $booking->property->id,
                        'title' => $booking->property->title,
                        'city' => $booking->property->city,
                        'district' => $booking->property->district,
                        'address' => $booking->property->address,
                        'cover_photo' => $booking->property->coverPhoto?->photo_url,
                    ],
                    'dates' => [
                        'check_in' => $booking->check_in->format('d/m/Y'),
                        'check_out' => $booking->check_out->format('d/m/Y'),
                        'nights' => $booking->nights_count,
                    ],
                    'amount' => [
                        'subtotal' => number_format($booking->subtotal, 0, ',', ' '),
                        'service_fee' => number_format($booking->service_fee, 0, ',', ' '),
                        'cleaning_fee' => number_format($booking->cleaning_fee, 0, ',', ' '),
                        'total' => number_format($booking->total_amount, 0, ',', ' '),
                    ],
                    'payment_status' => $booking->payment_status,
                    'checked_in_at' => optional($booking->checked_in_at)->format('d/m/Y H:i'),
                    'checked_out_at' => optional($booking->checked_out_at)->format('d/m/Y H:i'),
                ],
            ],
        ]);
    }

    /**
     * Confirm a pending booking.
     */
    public function confirm(Request $request, $id)
    {
        $booking = $this->findHostBooking($request->user()->id, $id);

        if ($booking->booking_status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Cette réservation ne peut pas être confirmée.',
            ], 422);
        }

        $booking->update(['booking_status' => 'confirmed']);

        return response()->json([
            'success' => true,
            'message' => 'Réservation confirmée avec succès.',
            'data' => [
                'status' => $booking->booking_status,
            ],
        ]);
    }

    /**
     * Decline a pending booking.
     */
    public function decline(Request $request, $id)
    {
        $booking = $this->findHostBooking($request->user()->id, $id);

        if ($booking->booking_status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Cette réservation ne peut pas être refusée.',
            ], 422);
        }

        $booking->update([
            'booking_status' => 'cancelled',
            'cancelled_at' => now(),
            'cancellation_reason' => 'Refusée par l\'hôte',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Réservation refusée.',
            'data' => [
                'status' => $booking->booking_status,
            ],
        ]);
    }

    /**
     * Mark the booking as checked in.
     */
    public function checkIn(Request $request, $id)
    {
        $booking = $this->findHostBooking($request->user()->id, $id);

        if ($booking->booking_status !== 'confirmed') {
            return response()->json([
                'success' => false,
                'message' => 'La réservation doit être confirmée avant l\'enregistrement.',
            ], 422);
        }

        if ($booking->checked_in_at) {
            return response()->json([
                'success' => false,
                'message' => 'L\'enregistrement a déjà été effectué.',
            ], 422);
        }

        $booking->update(['checked_in_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Check-in enregistré.',
            'data' => [
                'checked_in_at' => $booking->checked_in_at->format('d/m/Y H:i'),
            ],
        ]);
    }

    /**
     * Mark the booking as checked out.
     */
    public function checkOut(Request $request, $id)
    {
        $booking = $this->findHostBooking($request->user()->id, $id);

        if ($booking->booking_status !== 'confirmed') {
            return response()->json([
                'success' => false,
                'message' => 'La réservation doit être confirmée avant le départ.',
            ], 422);
        }

        if ($booking->checked_out_at) {
            return response()->json([
                'success' => false,
                'message' => 'Le check-out a déjà été effectué.',
            ], 422);
        }

        $booking->update([
            'checked_out_at' => now(),
            'booking_status' => 'completed',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Check-out enregistré.',
            'data' => [
                'checked_out_at' => $booking->checked_out_at->format('d/m/Y H:i'),
                'status' => $booking->booking_status,
            ],
        ]);
    }

    /**
     * Find a booking owned by this host.
     */
    private function findHostBooking($hostId, $bookingId)
    {
        return Booking::with(['property', 'user', 'payment'])
            ->where('id', $bookingId)
            ->whereHas('property', function ($q) use ($hostId) {
                $q->where('user_id', $hostId);
            })
            ->firstOrFail();
    }

    private function getStatusLabel($status)
    {
        return match ($status) {
            'pending' => 'En attente',
            'confirmed' => 'Confirmée',
            'cancelled' => 'Annulée',
            'completed' => 'Terminée',
            'refunded' => 'Remboursée',
            default => ucfirst($status),
        };
    }
}
