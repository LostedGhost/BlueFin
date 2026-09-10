<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Property;
use App\Models\Payment;
use App\Models\Availability;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class BookingController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function store(Request $request)
    {
        // ✅ CORRECTION: Accepter 'guests' et 'guests_count'
        $validator = Validator::make($request->all(), [
            'property_id' => 'required|exists:properties,id',
            'check_in' => 'required|date|after_or_equal:today',
            'check_out' => 'required|date|after:check_in',
            'guests' => 'nullable|integer|min:1|max:50',           // ✅ Nouveau champ
            'guests_count' => 'nullable|integer|min:1|max:50',     // ✅ Ancien champ
            // 'cash' n'existe pas dans l'enum DB (mobile_money|card|bank_transfer) —
            // le laisser passer la validation aurait provoqué une erreur SQL à l'insertion.
            'payment_method' => 'nullable|in:card,mobile_money,bank_transfer',
            'mobile_money_provider' => 'nullable|in:MTN,Moov,Orange',
            'mobile_money_number' => 'nullable|string|regex:/^\+?[0-9]{8,15}$/',
            'guest_details' => 'nullable|array',
            'transaction_id' => 'nullable|string',
        ], [
            'property_id.required' => 'La propriété est requise.',
            'property_id.exists' => 'La propriété sélectionnée n\'existe pas.',
            'check_in.required' => 'La date d\'arrivée est requise.',
            'check_in.date' => 'La date d\'arrivée doit être une date valide.',
            'check_in.after_or_equal' => 'La date d\'arrivée doit être aujourd\'hui ou plus tard.',
            'check_out.required' => 'La date de départ est requise.',
            'check_out.date' => 'La date de départ doit être une date valide.',
            'check_out.after' => 'La date de départ doit être après la date d\'arrivée.',
            'guests.integer' => 'Le nombre de voyageurs doit être un nombre entier.',
            'guests.min' => 'Le nombre de voyageurs doit être au moins 1.',
            'guests_count.integer' => 'Le nombre de voyageurs doit être un nombre entier.',
            'guests_count.min' => 'Le nombre de voyageurs doit être au moins 1.',
            'payment_method.in' => 'La méthode de paiement sélectionnée n\'est pas valide.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // ✅ Prendre 'guests' ou 'guests_count'
        $guestsCount = $request->guests ?? $request->guests_count;

        if (!$guestsCount) {
            return response()->json([
                'errors' => ['guests' => ['Le nombre de voyageurs est requis.']]
            ], 422);
        }

        $property = Property::findOrFail($request->property_id);

        // Vérifier si la propriété est active
        if ($property->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'La propriété n\'est pas disponible pour la réservation.',
            ], 422);
        }

        // Vérifier la disponibilité
        if (!$property->isAvailable($request->check_in, $request->check_out)) {
            return response()->json([
                'success' => false,
                'message' => 'La propriété n\'est pas disponible pour les dates demandées.',
            ], 422);
        }

        // Vérifier le nombre de voyageurs
        if ($guestsCount > $property->max_guests) {
            return response()->json([
                'success' => false,
                'message' => "Le nombre de voyageurs ne peut pas dépasser {$property->max_guests}.",
            ], 422);
        }

        // Calculer le prix total
        $priceDetails = $property->calculateTotalPrice(
            $request->check_in, 
            $request->check_out, 
            $guestsCount
        );

        // Préparer les détails du voyageur
        $guestDetails = $request->guest_details ?? [];
        $guestDetails['full_name'] = $guestDetails['full_name'] ?? $request->user()->full_name;
        $guestDetails['email'] = $guestDetails['email'] ?? $request->user()->email;
        $guestDetails['phone'] = $guestDetails['phone'] ?? $request->user()->phone;

        DB::beginTransaction();

        try {
            // Générer un numéro de réservation unique
            $bookingReference = 'BLF-' . strtoupper(uniqid());

            // Créer la réservation
            $booking = Booking::create([
                'user_id' => $request->user()->id,
                'property_id' => $property->id,
                'booking_reference' => $bookingReference,
                'check_in' => $request->check_in,
                'check_out' => $request->check_out,
                'guests_count' => $guestsCount,
                'nights_count' => $priceDetails['nights'],
                'subtotal' => $priceDetails['subtotal'] + ($priceDetails['extra_guest_fee'] ?? 0),
                'service_fee' => $priceDetails['service_fee'],
                'cleaning_fee' => $priceDetails['cleaning_fee'] ?? 0,
                'total_amount' => $priceDetails['total'],
                'payment_method' => $request->payment_method,
                'payment_status' => 'pending',
                'booking_status' => 'pending',
                'guest_details' => $guestDetails,
            ]);

            // Créer le paiement si méthode de paiement sélectionnée
            if ($request->payment_method && in_array($request->payment_method, ['card', 'mobile_money'])) {
                Payment::create([
                    'booking_id' => $booking->id,
                    'transaction_id' => $request->transaction_id ?? 'pending_' . uniqid(),
                    'payment_method' => $request->payment_method,
                    'amount' => $booking->total_amount,
                    'currency' => 'XOF',
                    'status' => 'pending',
                    'mobile_money_provider' => $request->mobile_money_provider,
                    'mobile_money_number' => $request->mobile_money_number,
                ]);
            }

            // Bloquer les dates dans le calendrier
            $this->blockAvailabilityDates($booking);

            DB::commit();

            // Notifier l'hôte
            $this->notificationService->sendWhatsApp(
                $property->user->phone,
                "🏠 *Nouvelle demande de réservation*\n\n"
                . "📌 Référence: {$bookingReference}\n"
                . "🏠 Propriété: {$property->title}\n"
                . "👤 Voyageur: {$request->user()->full_name}\n"
                . "📞 Téléphone: {$request->user()->phone}\n"
                . "📅 Arrivée: " . date('d/m/Y', strtotime($request->check_in)) . "\n"
                . "📅 Départ: " . date('d/m/Y', strtotime($request->check_out)) . "\n"
                . "👥 Voyageurs: {$guestsCount}\n"
                . "💰 Montant total: " . number_format($priceDetails['total'], 0, ',', ' ') . " FCFA\n\n"
                . "⏳ En attente de confirmation de paiement."
            );

            // Notifier le voyageur
            $this->notificationService->sendWhatsApp(
                $request->user()->phone,
                "✅ *Réservation créée avec succès*\n\n"
                . "📌 Référence: {$bookingReference}\n"
                . "🏠 Propriété: {$property->title}\n"
                . "📅 Arrivée: " . date('d/m/Y', strtotime($request->check_in)) . "\n"
                . "📅 Départ: " . date('d/m/Y', strtotime($request->check_out)) . "\n"
                . "👥 Voyageurs: {$guestsCount}\n"
                . "💰 Total: " . number_format($priceDetails['total'], 0, ',', ' ') . " FCFA\n\n"
                . "💳 Vous recevrez une demande de paiement sur votre numéro Mobile Money.\n"
                . "Une fois le paiement confirmé, votre réservation sera validée."
            );

            return response()->json([
                'success' => true,
                'message' => 'Réservation créée avec succès. En attente de paiement.',
                'data' => [
                    'booking' => $booking,
                    'payment_details' => [
                        'amount' => $priceDetails['total'],
                        'currency' => 'XOF',
                        'method' => $request->payment_method,
                    ]
                ],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erreur création réservation: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la réservation: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Bloquer les dates dans le calendrier
     */
    private function blockAvailabilityDates($booking)
    {
        $dates = [];
        $current = clone $booking->check_in;

        while ($current->lt($booking->check_out)) {
            $dates[] = $current->format('Y-m-d');
            $current->addDay();
        }

        foreach ($dates as $date) {
            Availability::updateOrCreate(
                [
                    'property_id' => $booking->property_id,
                    'date' => $date,
                ],
                [
                    'is_available' => false,
                    'status' => 'booked',
                    'notes' => "Réservation #{$booking->booking_reference}",
                ]
            );
        }
    }

    /**
     * Libérer les dates (en cas d'annulation)
     */
    private function freeAvailabilityDates($booking)
    {
        $dates = [];
        $current = clone $booking->check_in;

        while ($current->lt($booking->check_out)) {
            $dates[] = $current->format('Y-m-d');
            $current->addDay();
        }

        Availability::where('property_id', $booking->property_id)
            ->whereIn('date', $dates)
            ->where('status', 'booked')
            ->update(['status' => 'available', 'is_available' => true]);
    }


    public function getUserBookings(Request $request)
    {
        $bookings = Booking::with(['property.coverPhoto', 'payment'])
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json(['success' => true, 'data' => $bookings]);
    }

    public function getHostBookings(Request $request)
    {
        $bookings = Booking::with(['property.coverPhoto', 'user', 'payment'])
            ->whereHas('property', function ($query) use ($request) {
                $query->where('user_id', $request->user()->id);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json(['success' => true, 'data' => $bookings]);
    }

    public function show(Request $request, $id)
    {
        $booking = Booking::with(['property.user', 'user', 'payment'])
            ->findOrFail($id);

        if ($booking->user_id !== $request->user()->id && $booking->property->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé à cette réservation.',
            ], 403);
        }

        return response()->json(['success' => true, 'data' => $booking]);
    }

    public function confirmPayment(Request $request, $id)
    {
        $booking = Booking::with(['property.user', 'payment'])
            ->findOrFail($id);

        if ($booking->user_id !== $request->user()->id && $booking->property->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé à cette réservation.',
            ], 403);
        }

        if ($booking->booking_status === 'confirmed') {
            return response()->json([
                'success' => true,
                'message' => 'Le paiement est déjà confirmé.',
            ]);
        }

        // ⚠️ Cette route confirmait le paiement sur la seule foi de l'appelant
        // (y compris le voyageur lui-même), sans jamais vérifier auprès de la
        // passerelle — n'importe qui pouvait donc valider gratuitement sa
        // propre réservation. On applique désormais la même vérification
        // serveur-à-serveur que PaymentController::webhook.
        $validator = Validator::make($request->all(), [
            'transaction_id' => 'required|string',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $transactionId = $request->input('transaction_id');

        try {
            $verification = Http::post('https://api-checkout.cinetpay.com/v2/payment/check', [
                'apikey' => env('CINETPAY_API_KEY'),
                'site_id' => env('CINETPAY_SITE_ID'),
                'transaction_id' => $transactionId,
            ])->json();
        } catch (\Throwable $e) {
            \Log::error('Vérification paiement réservation échouée', ['booking_id' => $booking->id, 'error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Vérification du paiement indisponible, réessayez.'], 502);
        }

        $verifiedStatus = $verification['data']['status'] ?? null;
        $verifiedAmount = isset($verification['data']['amount']) ? (float) $verification['data']['amount'] : null;
        $isConfirmed = ($verification['code'] ?? null) === '00'
            && $verifiedStatus === 'ACCEPTED'
            && $verifiedAmount !== null
            && abs($verifiedAmount - (float) $booking->total_amount) < 0.01;

        if (!$isConfirmed) {
            return response()->json([
                'success' => false,
                'message' => 'Le paiement n\'a pas pu être confirmé auprès de la passerelle.',
            ], 422);
        }

        $booking->update([
            'payment_status' => 'paid',
            'booking_status' => 'confirmed',
        ]);

        if ($booking->payment) {
            $booking->payment->update([
                'status' => 'success',
                'paid_at' => now(),
                'transaction_id' => $transactionId,
                'payment_gateway_response' => $verification,
            ]);
        }

        $this->notificationService->sendWhatsApp(
            $booking->property->user->phone,
            "✅ Paiement confirmé pour la réservation #{$booking->booking_reference}\n\n"
            . "Propriété: {$booking->property->title}\n"
            . "Voyageur: {$booking->user->full_name}\n"
            . "Montant: " . number_format($booking->total_amount, 0, ',', ' ') . " FCFA"
        );

        return response()->json([
            'success' => true,
            'message' => 'Paiement confirmé et réservation validée.',
            'data' => ['status' => $booking->booking_status],
        ]);
    }

    public function cancel(Request $request, $id)
    {
        $booking = Booking::with(['property', 'payment'])
            ->findOrFail($id);

        $user = $request->user();
        $isHost = $booking->property->user_id === $user->id;
        $isGuest = $booking->user_id === $user->id;

        if (!$isHost && !$isGuest) {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé à cette réservation.',
            ], 403);
        }

        if ($booking->booking_status === 'cancelled' || $booking->booking_status === 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Cette réservation ne peut pas être annulée.',
            ], 422);
        }

        if ($isGuest && !$booking->canBeCancelled()) {
            return response()->json([
                'success' => false,
                'message' => 'Cette réservation ne peut plus être annulée selon la politique.',
            ], 422);
        }

        $booking->update([
            'booking_status' => 'cancelled',
            'cancelled_at' => now(),
            'cancellation_reason' => $request->get('reason', $isHost ? 'Annulée par l\'hôte' : 'Annulée par le voyageur'),
        ]);

        if ($booking->payment && $booking->payment->status === 'success') {
            $booking->payment->update(['status' => 'refunded', 'refunded_at' => now()]);
        }

        $this->freeAvailabilityDates($booking);

        $recipient = $isHost ? $booking->user : $booking->property->user;
        $message = $isHost
            ? "❌ Votre réservation #{$booking->booking_reference} a été annulée par l'hôte."
            : "❌ Votre réservation #{$booking->booking_reference} a été annulée."
        ;

        $this->notificationService->sendWhatsApp($recipient->phone, $message);

        return response()->json([
            'success' => true,
            'message' => 'Réservation annulée avec succès.',
            'data' => ['status' => $booking->booking_status],
        ]);
    }

    public function checkIn(Request $request, $id)
    {
        $booking = Booking::with(['property'])->findOrFail($id);

        if ($booking->property->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé à cette réservation.',
            ], 403);
        }

        if ($booking->booking_status !== 'confirmed') {
            return response()->json([
                'success' => false,
                'message' => 'La réservation doit être confirmée avant le check-in.',
            ], 422);
        }

        if ($booking->checked_in_at) {
            return response()->json([
                'success' => false,
                'message' => 'Le check-in a déjà été enregistré.',
            ], 422);
        }

        $booking->update(['checked_in_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Check-in enregistré.',
            'data' => ['checked_in_at' => $booking->checked_in_at->format('d/m/Y H:i')],
        ]);
    }

    public function checkOut(Request $request, $id)
    {
        $booking = Booking::with(['property'])->findOrFail($id);

        if ($booking->property->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé à cette réservation.',
            ], 403);
        }

        if ($booking->booking_status !== 'confirmed') {
            return response()->json([
                'success' => false,
                'message' => 'La réservation doit être confirmée avant le check-out.',
            ], 422);
        }

        if ($booking->checked_out_at) {
            return response()->json([
                'success' => false,
                'message' => 'Le check-out a déjà été enregistré.',
            ], 422);
        }

        $booking->update(['checked_out_at' => now(), 'booking_status' => 'completed']);

        return response()->json([
            'success' => true,
            'message' => 'Check-out enregistré.',
            'data' => ['checked_out_at' => $booking->checked_out_at->format('d/m/Y H:i'), 'status' => $booking->booking_status],
        ]);
    }

    
}
