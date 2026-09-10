<?php

namespace App\Http\Controllers\Api\Traveler;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Property;
use App\Models\Payment;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class TravelerBookingController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }
    
    /**
     * Get all bookings for the traveler
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $status = $request->get('status', 'all');
        
        $query = Booking::with(['property', 'property.photos', 'payment', 'review'])
            ->where('user_id', $user->id);
        
        if ($status !== 'all') {
            $query->where('booking_status', $status);
        }
        
        $bookings = $query->orderBy('created_at', 'desc')
            ->paginate(10);
        
        // Add formatted data
        $bookings->getCollection()->transform(function($booking) {
            return [
                'id' => $booking->id,
                'reference' => $booking->booking_reference,
                'property' => [
                    'id' => $booking->property->id,
                    'title' => $booking->property->title,
                    'city' => $booking->property->city,
                    'district' => $booking->property->district,
                    'address' => $booking->property->address,
                    'photo' => $booking->property->coverPhoto?->photo_url,
                    'phone' => $booking->property->user->phone,
                ],
                'host' => [
                    'id' => $booking->property->user->id,
                    'name' => $booking->property->user->full_name,
                    'photo' => $booking->property->user->profile_photo_url,
                ],
                'dates' => [
                    'check_in' => $booking->check_in->format('d/m/Y'),
                    'check_out' => $booking->check_out->format('d/m/Y'),
                    'check_in_raw' => $booking->check_in->toDateString(),
                    'check_out_raw' => $booking->check_out->toDateString(),
                    'nights' => $booking->nights_count,
                ],
                'guests_count' => $booking->guests_count,
                'price_details' => [
                    'subtotal' => number_format($booking->subtotal, 0, ',', ' '),
                    'service_fee' => number_format($booking->service_fee, 0, ',', ' '),
                    'cleaning_fee' => number_format($booking->cleaning_fee, 0, ',', ' '),
                    'total' => number_format($booking->total_amount, 0, ',', ' '),
                ],
                'payment' => [
                    'method' => $booking->payment_method,
                    'status' => $booking->payment_status,
                    'paid_at' => $booking->payment?->paid_at?->format('d/m/Y H:i'),
                ],
                'status' => $booking->booking_status,
                'status_label' => $this->getStatusLabel($booking->booking_status),
                'can_cancel' => $booking->canBeCancelled(),
                'cancellation_deadline' => $this->getCancellationDeadline($booking),
                'has_review' => $booking->review !== null,
                'qr_code' => $booking->qr_code,
                'created_at' => $booking->created_at->format('d/m/Y'),
            ];
        });
        
        // Statistics
        $stats = [
            'total' => Booking::where('user_id', $user->id)->count(),
            'confirmed' => Booking::where('user_id', $user->id)->where('booking_status', 'confirmed')->count(),
            'pending' => Booking::where('user_id', $user->id)->where('booking_status', 'pending')->count(),
            'completed' => Booking::where('user_id', $user->id)->where('booking_status', 'completed')->count(),
            'cancelled' => Booking::where('user_id', $user->id)->where('booking_status', 'cancelled')->count(),
        ];
        
        return response()->json([
            'success' => true,
            'data' => $bookings,
            'stats' => $stats,
        ]);
    }

    /**
     * Get single booking details
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        
        $booking = Booking::with(['property', 'property.photos', 'property.user', 'payment', 'review'])
            ->where('user_id', $user->id)
            ->findOrFail($id);
        
        // Get timeline
        $timeline = $this->getBookingTimeline($booking);
        
        // Get similar properties
        $similarProperties = Property::where('city', $booking->property->city)
            ->where('status', 'active')
            ->where('id', '!=', $booking->property->id)
            ->with('coverPhoto')
            ->limit(4)
            ->get()
            ->map(function($property) {
                return [
                    'id' => $property->id,
                    'title' => $property->title,
                    'price_per_night' => number_format($property->price_per_night, 0, ',', ' '),
                    'photo' => $property->coverPhoto?->photo_url,
                ];
            });
        
        return response()->json([
            'success' => true,
            'data' => [
                'booking' => [
                    'id' => $booking->id,
                    'reference' => $booking->booking_reference,
                    'property' => [
                        'id' => $booking->property->id,
                        'title' => $booking->property->title,
                        'description' => $booking->property->description,
                        'city' => $booking->property->city,
                        'district' => $booking->property->district,
                        'address' => $booking->property->address,
                        'latitude' => $booking->property->latitude,
                        'longitude' => $booking->property->longitude,
                        'photos' => $booking->property->photos->map(function($photo) {
                            return $photo->photo_url;
                        }),
                        'amenities' => $booking->property->amenities_list,
                        'has_generator' => $booking->property->has_generator,
                        'has_water_tank' => $booking->property->has_water_tank,
                        'has_wifi' => $booking->property->has_wifi,
                        'has_air_conditioning' => $booking->property->has_air_conditioning,
                    ],
                    'host' => [
                        'id' => $booking->property->user->id,
                        'name' => $booking->property->user->full_name,
                        'photo' => $booking->property->user->profile_photo_url,
                        'phone' => $booking->property->user->phone,
                        'member_since' => $booking->property->user->created_at->format('F Y'),
                    ],
                    'dates' => [
                        'check_in' => $booking->check_in->format('d/m/Y'),
                        'check_out' => $booking->check_out->format('d/m/Y'),
                        'check_in_weekday' => $booking->check_in->format('l'),
                        'check_out_weekday' => $booking->check_out->format('l'),
                        'nights' => $booking->nights_count,
                    ],
                    'guests' => [
                        'count' => $booking->guests_count,
                        'details' => $booking->guest_details,
                    ],
                    'price_details' => [
                        'price_per_night' => number_format($booking->subtotal / $booking->nights_count, 0, ',', ' '),
                        'nights' => $booking->nights_count,
                        'subtotal' => number_format($booking->subtotal, 0, ',', ' '),
                        'service_fee' => number_format($booking->service_fee, 0, ',', ' '),
                        'cleaning_fee' => number_format($booking->cleaning_fee, 0, ',', ' '),
                        'total' => number_format($booking->total_amount, 0, ',', ' '),
                    ],
                    'payment' => [
                        'method' => $booking->payment_method,
                        'status' => $booking->payment_status,
                        'transaction_id' => $booking->payment?->transaction_id,
                        'paid_at' => $booking->payment?->paid_at?->format('d/m/Y H:i'),
                    ],
                    'status' => $booking->booking_status,
                    'status_label' => $this->getStatusLabel($booking->booking_status),
                    'cancellation_policy' => $booking->property->cancellation_policy,
                    'can_cancel' => $booking->canBeCancelled(),
                    'cancellation_deadline' => $this->getCancellationDeadline($booking),
                    'refund_amount' => $booking->canBeCancelled() ? number_format($booking->calculateRefundAmount(), 0, ',', ' ') : 0,
                    'qr_code' => $booking->qr_code,
                    'timeline' => $timeline,
                ],
                'similar_properties' => $similarProperties,
            ],
        ]);
    }

    /**
     * Cancel a booking
     */
    public function cancel(Request $request, $id)
    {
        $user = $request->user();
        
        $booking = Booking::with(['property', 'payment'])
            ->where('user_id', $user->id)
            ->findOrFail($id);
        
        if (!$booking->canBeCancelled()) {
            return response()->json([
                'success' => false,
                'message' => 'Cette réservation ne peut plus être annulée.',
                'cancellation_policy' => $booking->property->cancellation_policy,
            ], 422);
        }
        
        $refundAmount = $booking->calculateRefundAmount();
        
        DB::beginTransaction();
        
        try {
            $booking->update([
                'booking_status' => 'cancelled',
                'cancelled_at' => now(),
                'cancellation_reason' => $request->reason,
            ]);
            
            if ($refundAmount > 0) {
                $this->processRefund($booking, $refundAmount);
            }
            
            // Free availability dates
            $this->freeAvailabilityDates($booking);
            
            DB::commit();
            
            // Send cancellation notifications
            $this->sendCancellationNotifications($booking, $refundAmount);
            
            return response()->json([
                'success' => true,
                'message' => 'Réservation annulée avec succès',
                'refund_amount' => number_format($refundAmount, 0, ',', ' '),
                'refund_message' => $refundAmount > 0 
                    ? "Un remboursement de {$refundAmount} FCFA sera effectué sous 5-10 jours ouvrables."
                    : "Aucun remboursement n'est prévu selon la politique d'annulation.",
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'annulation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get booking timeline
     */
    private function getBookingTimeline($booking)
    {
        $timeline = [];
        
        // Booking created
        $timeline[] = [
            'event' => 'Réservation créée',
            'date' => $booking->created_at->format('d/m/Y H:i'),
            'status' => 'completed',
            'icon' => '📅',
        ];
        
        // Payment confirmed
        if ($booking->payment && $booking->payment->paid_at) {
            $timeline[] = [
                'event' => 'Paiement confirmé',
                'date' => $booking->payment->paid_at->format('d/m/Y H:i'),
                'amount' => number_format($booking->payment->amount, 0, ',', ' '),
                'status' => 'completed',
                'icon' => '💰',
            ];
        }
        
        // Booking confirmed
        if ($booking->booking_status === 'confirmed') {
            $timeline[] = [
                'event' => 'Réservation confirmée',
                'date' => $booking->updated_at->format('d/m/Y H:i'),
                'status' => 'completed',
                'icon' => '✅',
            ];
        }
        
        // Check-in
        if ($booking->checked_in_at) {
            $timeline[] = [
                'event' => 'Check-in effectué',
                'date' => $booking->checked_in_at->format('d/m/Y H:i'),
                'status' => 'completed',
                'icon' => '🏠',
            ];
        }
        
        // Check-out
        if ($booking->checked_out_at) {
            $timeline[] = [
                'event' => 'Check-out effectué',
                'date' => $booking->checked_out_at->format('d/m/Y H:i'),
                'status' => 'completed',
                'icon' => '🚪',
            ];
        }
        
        // Review
        if ($booking->review) {
            $timeline[] = [
                'event' => 'Avis laissé',
                'date' => $booking->review->created_at->format('d/m/Y H:i'),
                'rating' => $booking->review->rating,
                'status' => 'completed',
                'icon' => '⭐',
            ];
        }
        
        // Cancellation
        if ($booking->cancelled_at) {
            $timeline[] = [
                'event' => 'Réservation annulée',
                'date' => $booking->cancelled_at->format('d/m/Y H:i'),
                'reason' => $booking->cancellation_reason,
                'status' => 'warning',
                'icon' => '❌',
            ];
        }
        
        return $timeline;
    }

    private function getCancellationDeadline($booking)
    {
        $policy = $booking->property->cancellation_policy;
        $checkIn = $booking->check_in;
        
        switch ($policy) {
            case 'flexible':
                return $checkIn->copy()->subDay()->format('d/m/Y');
            case 'moderate':
                return $checkIn->copy()->subDays(5)->format('d/m/Y');
            case 'strict':
                return $checkIn->copy()->subDays(14)->format('d/m/Y');
            default:
                return null;
        }
    }

    private function processRefund($booking, $amount)
    {
        $payment = $booking->payment;
        
        if ($payment && $payment->status === 'success') {
            // Process refund via payment gateway
            if ($payment->payment_method === 'mobile_money') {
                // Process Mobile Money refund
                // Integration with CinetPay
            } elseif ($payment->payment_method === 'card') {
                // Process Stripe refund
                \Stripe\Stripe::setApiKey(env('STRIPE_SECRET'));
                \Stripe\Refund::create([
                    'payment_intent' => $payment->transaction_id,
                    'amount' => $amount,
                ]);
            }
            
            $payment->update([
                'status' => 'refunded',
                'refunded_at' => now(),
            ]);
        }
    }

    private function freeAvailabilityDates($booking)
    {
        $dates = [];
        $currentDate = clone $booking->check_in;
        
        while ($currentDate < $booking->check_out) {
            $dates[] = $currentDate->format('Y-m-d');
            $currentDate->addDay();
        }
        
        \App\Models\Availability::where('property_id', $booking->property_id)
            ->whereIn('date', $dates)
            ->where('status', 'booked')
            ->update(['status' => 'available', 'is_available' => true]);
    }

    private function sendCancellationNotifications($booking, $refundAmount)
    {
        $message = "❌ *Votre réservation a été annulée* ❌\n\n"
            . "🏠 Propriété: {$booking->property->title}\n"
            . "📅 Dates: {$booking->check_in->format('d/m/Y')} → {$booking->check_out->format('d/m/Y')}\n"
            . "📝 Réservation: #{$booking->booking_reference}\n\n";
        
        if ($refundAmount > 0) {
            $message .= "💰 *Remboursement:* " . number_format($refundAmount, 0, ',', ' ') . " FCFA\n"
                . "🕐 Délai: 5-10 jours ouvrables\n\n";
        }
        
        $message .= "Une confirmation vous a été envoyée par email.\n\n"
            . "Nous espérons vous accueillir prochainement!";
        
        $this->notificationService->sendWhatsApp($booking->user->phone, $message);
        $this->notificationService->sendWhatsApp($booking->property->user->phone, $message);
    }

    private function getStatusLabel($status)
    {
        $labels = [
            'pending' => 'En attente de paiement',
            'confirmed' => 'Confirmée',
            'completed' => 'Terminée',
            'cancelled' => 'Annulée',
        ];
        return $labels[$status] ?? $status;
    }
}