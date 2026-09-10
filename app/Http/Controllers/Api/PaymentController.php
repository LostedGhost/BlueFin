<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Payout;
use App\Models\Booking;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get payment history for user
     */
    public function getPaymentHistory(Request $request)
    {
        $payments = Payment::with('booking.property')
            ->whereHas('booking', function($q) use ($request) {
                $q->where('user_id', $request->user()->id);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(20);
        
        return response()->json([
            'success' => true,
            'data' => $payments
        ]);
    }

    /**
     * Request withdrawal for host
     */
    public function requestWithdrawal(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:5000',
            'payout_method' => 'required|in:mobile_money,bank_transfer',
            'mobile_money_provider' => 'required_if:payout_method,mobile_money|in:MTN,Moov,Orange',
            'mobile_money_number' => 'required_if:payout_method,mobile_money|string',
            'bank_name' => 'required_if:payout_method,bank_transfer|string',
            'bank_account' => 'required_if:payout_method,bank_transfer|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        
        // Check if user is host
        if (!$user->isHost()) {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les hôtes peuvent demander un retrait'
            ], 403);
        }
        
        // Calculate available balance (from completed bookings)
        $availableBalance = Booking::whereHas('property', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->where('booking_status', 'completed')
            ->whereDoesntHave('payout')
            ->sum('total_amount');
        
        $serviceFee = $availableBalance * 0.15; // 15% service fee
        $netBalance = $availableBalance - $serviceFee;
        
        if ($request->amount > $netBalance) {
            return response()->json([
                'success' => false,
                'message' => 'Montant demandé supérieur au solde disponible',
                'available_balance' => $netBalance
            ], 422);
        }
        
        $payout = Payout::create([
            'user_id' => $user->id,
            'payout_reference' => 'PYT-' . strtoupper(Str::random(12)),
            'amount' => $request->amount,
            'payout_method' => $request->payout_method,
            'mobile_money_provider' => $request->mobile_money_provider,
            'mobile_money_number' => $request->mobile_money_number,
            'bank_name' => $request->bank_name,
            'bank_account' => $request->bank_account,
            'status' => 'pending',
        ]);
        
        // Process payout via API
        $this->processPayout($payout);
        
        return response()->json([
            'success' => true,
            'message' => 'Demande de retrait envoyée',
            'data' => $payout
        ]);
    }

    /**
     * Get host payouts history
     */
    public function getPayoutsHistory(Request $request)
    {
        $payouts = Payout::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);
        
        return response()->json([
            'success' => true,
            'data' => $payouts
        ]);
    }

    /**
     * Get host balance
     */
    public function getBalance(Request $request)
    {
        $user = $request->user();
        
        // Calculate earned amount from completed bookings
        $earned = Booking::whereHas('property', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->where('booking_status', 'completed')
            ->sum('total_amount');
        
        // Calculate service fee (15%)
        $serviceFee = $earned * 0.15;
        
        // Calculate paid out amount
        $paidOut = Payout::where('user_id', $user->id)
            ->where('status', 'completed')
            ->sum('amount');
        
        // Calculate pending payouts
        $pendingPayouts = Payout::where('user_id', $user->id)
            ->where('status', 'pending')
            ->sum('amount');
        
        $available = $earned - $serviceFee - $paidOut - $pendingPayouts;
        
        return response()->json([
            'success' => true,
            'data' => [
                'total_earned' => $earned,
                'service_fee' => $serviceFee,
                'net_earned' => $earned - $serviceFee,
                'paid_out' => $paidOut,
                'pending_payouts' => $pendingPayouts,
                'available_balance' => max(0, $available),
            ]
        ]);
    }

    /**
     * Webhook for payment gateway
     */
    public function webhook(Request $request)
    {
        // CinetPay n'envoie qu'un identifiant de transaction (cpm_trans_id) et impose
        // de rappeler son API de vérification pour obtenir le statut réel — on ne fait
        // JAMAIS confiance à un champ "status" transmis directement par l'appelant,
        // celui-ci pourrait être forgé par n'importe qui (voir audit sécurité).
        $transactionId = $request->input('cpm_trans_id') ?? $request->input('transaction_id');

        \Log::info('Webhook paiement reçu', ['transaction_id' => $transactionId]);

        if (!$transactionId) {
            return response()->json(['status' => 'ignored', 'reason' => 'missing transaction_id'], 400);
        }

        $payment = Payment::where('transaction_id', $transactionId)->first();

        if (!$payment) {
            \Log::warning('Webhook paiement: transaction inconnue', ['transaction_id' => $transactionId]);
            return response()->json(['status' => 'ignored', 'reason' => 'unknown transaction'], 404);
        }

        // Déjà traité (le webhook peut être appelé plusieurs fois) : on répond OK sans rejouer.
        if ($payment->status === 'success') {
            return response()->json(['status' => 'ok']);
        }

        try {
            $verification = Http::post('https://api-checkout.cinetpay.com/v2/payment/check', [
                'apikey' => env('CINETPAY_API_KEY'),
                'site_id' => env('CINETPAY_SITE_ID'),
                'transaction_id' => $transactionId,
            ])->json();
        } catch (\Throwable $e) {
            \Log::error('Webhook paiement: échec de la vérification CinetPay', [
                'transaction_id' => $transactionId,
                'error' => $e->getMessage(),
            ]);
            return response()->json(['status' => 'error'], 502);
        }

        $verifiedStatus = $verification['data']['status'] ?? null;
        $verifiedAmount = isset($verification['data']['amount']) ? (float) $verification['data']['amount'] : null;
        $isConfirmed = ($verification['code'] ?? null) === '00'
            && $verifiedStatus === 'ACCEPTED'
            && $verifiedAmount !== null
            && abs($verifiedAmount - (float) $payment->amount) < 0.01;

        \Log::info('Webhook paiement: résultat de la vérification CinetPay', [
            'transaction_id' => $transactionId,
            'verified_status' => $verifiedStatus,
            'confirmed' => $isConfirmed,
        ]);

        if ($isConfirmed) {
            $payment->update([
                'status' => 'success',
                'paid_at' => now(),
                'payment_gateway_response' => $verification,
            ]);

            $booking = $payment->booking;
            if ($booking) {
                $booking->update([
                    'payment_status' => 'paid',
                    'booking_status' => 'confirmed',
                ]);
            }
        } elseif ($verifiedStatus === 'REFUSED') {
            $payment->update([
                'status' => 'failed',
                'payment_gateway_response' => $verification,
            ]);
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Mobile Money webhook
     */
    public function mobileMoneyWebhook(Request $request)
    {
        // Handle Mobile Money callback
        $data = $request->all();
        
        // Log webhook for debugging
        \Log::info('Mobile Money Webhook', $data);
        
        return response()->json(['status' => 'received']);
    }

    /**
     * Process payout
     */
    private function processPayout($payout)
    {
        if ($payout->payout_method === 'mobile_money') {
            // Process Mobile Money payout via CinetPay
            $response = Http::post('https://api.cinetpay.com/v1/payout', [
                'apikey' => env('CINETPAY_API_KEY'),
                'site_id' => env('CINETPAY_SITE_ID'),
                'transaction_id' => $payout->payout_reference,
                'amount' => $payout->amount,
                'currency' => 'XOF',
                'payment_method' => $payout->mobile_money_provider,
                'phone_number' => $payout->mobile_money_number,
            ]);
            
            if ($response->successful()) {
                $payout->update([
                    'status' => 'processing',
                    'payout_details' => $response->json()
                ]);
            } else {
                $payout->update([
                    'status' => 'failed',
                    'failure_reason' => $response->body()
                ]);
            }
        }
        
        // Notify user
        $this->notificationService->sendWhatsApp(
            $payout->user->phone,
            "💰 Demande de retrait #{$payout->payout_reference}\n"
            . "Montant: " . number_format($payout->amount, 0, ',', ' ') . " FCFA\n"
            . "Statut: En traitement\n\n"
            . "Vous recevrez une confirmation dès que le transfert sera effectué."
        );
    }
}