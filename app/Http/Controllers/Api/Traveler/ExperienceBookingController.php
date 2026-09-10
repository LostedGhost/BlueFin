<?php

namespace App\Http\Controllers\Api\Traveler;

use App\Http\Controllers\Controller;
use App\Models\Experience;
use App\Models\ExperienceBooking;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class ExperienceBookingController extends Controller
{
    public function book(Request $request, $experienceId)
    {
        $experience = Experience::where('status', 'active')->where('is_published', true)->findOrFail($experienceId);

        $validator = Validator::make($request->all(), [
            'reservation_date' => 'required|date|after_or_equal:today',
            'guests_count' => 'nullable|integer|min:1|max:50',
            'payment_method' => 'nullable|in:mobile_money,card,bank_transfer',
            'guest_details' => 'nullable|array',
            'special_requests' => 'nullable|string|max:1000',
            'transaction_id' => 'nullable|string|max:255',
            'mobile_money_provider' => 'nullable|in:MTN,Moov,Orange',
            'mobile_money_number' => 'nullable|string|regex:/^\+?[0-9]{8,15}$/',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $guestsCount = $request->input('guests_count', 1);

        if ($guestsCount > $experience->total_places) {
            return response()->json([
                'success' => false,
                'message' => "Cette expérience n'accepte que {$experience->total_places} place(s) maximum.",
            ], 422);
        }

        $booking = ExperienceBooking::create([
            'experience_id' => $experience->id,
            'user_id' => $request->user()->id,
            'reservation_date' => $request->input('reservation_date'),
            'guests_count' => $guestsCount,
            'total_amount' => $experience->price * $guestsCount,
            'payment_method' => $request->input('payment_method', 'mobile_money'),
            'mobile_money_provider' => $request->input('mobile_money_provider'),
            'mobile_money_number' => $request->input('mobile_money_number'),
            'guest_details' => $request->input('guest_details', []),
            'special_requests' => $request->input('special_requests'),
        ]);

        $experience->increment('bookings_count');

        $transactionId = $request->input('transaction_id');
        if ($transactionId) {
            $this->attachAndVerifyPayment($booking, $transactionId);
        }

        return response()->json([
            'success' => true,
            'message' => 'Réservation créée avec succès',
            'data' => $booking->refresh(),
        ], 201);
    }

    /**
     * Crée le paiement lié et vérifie immédiatement son statut réel auprès de
     * CinetPay (jamais de confiance dans un statut transmis par le client — voir
     * PaymentController::webhook pour la même logique côté propriétés).
     */
    private function attachAndVerifyPayment(ExperienceBooking $booking, string $transactionId): void
    {
        $payment = Payment::create([
            'experience_booking_id' => $booking->id,
            'transaction_id' => $transactionId,
            'payment_method' => $booking->payment_method,
            'mobile_money_provider' => $booking->mobile_money_provider,
            'mobile_money_number' => $booking->mobile_money_number,
            'amount' => $booking->total_amount,
            'status' => 'pending',
        ]);

        try {
            $verification = Http::post('https://api-checkout.cinetpay.com/v2/payment/check', [
                'apikey' => env('CINETPAY_API_KEY'),
                'site_id' => env('CINETPAY_SITE_ID'),
                'transaction_id' => $transactionId,
            ])->json();
        } catch (\Throwable $e) {
            \Log::error('Vérification paiement expérience échouée', ['error' => $e->getMessage()]);
            return;
        }

        $verifiedStatus = $verification['data']['status'] ?? null;
        $verifiedAmount = isset($verification['data']['amount']) ? (float) $verification['data']['amount'] : null;

        $isConfirmed = ($verification['code'] ?? null) === '00'
            && $verifiedStatus === 'ACCEPTED'
            && $verifiedAmount !== null
            && abs($verifiedAmount - (float) $payment->amount) < 0.01;

        if ($isConfirmed) {
            $payment->update(['status' => 'success', 'paid_at' => now(), 'payment_gateway_response' => $verification]);
            $booking->update(['payment_status' => 'paid', 'booking_status' => 'confirmed']);
        }
    }
}
