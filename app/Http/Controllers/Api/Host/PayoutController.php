<?php

namespace App\Http\Controllers\Api\Host;

use App\Http\Controllers\Controller;
use App\Models\Payout;
use App\Models\Booking;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PayoutController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get payout history
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $payouts = Payout::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);
        
        $payouts->getCollection()->transform(function($payout) {
            return [
                'id' => $payout->id,
                'reference' => $payout->payout_reference,
                'amount' => number_format($payout->amount, 0, ',', ' '),
                'method' => $payout->payout_method,
                'status' => $payout->status,
                'status_label' => $this->getStatusLabel($payout->status),
                'created_at' => $payout->created_at->format('d/m/Y'),
                'processed_at' => $payout->processed_at?->format('d/m/Y'),
            ];
        });
        
        return response()->json([
            'success' => true,
            'data' => $payouts,
        ]);
    }

    /**
     * Get available balance
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
        
        // Get recent earnings (last 30 days)
        $recentEarnings = Booking::whereHas('property', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->where('booking_status', 'completed')
            ->where('check_out', '>=', now()->subDays(30))
            ->selectRaw('DATE(check_out) as date, SUM(total_amount) as amount')
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => [
                'total_earned' => number_format($earned, 0, ',', ' '),
                'service_fee' => number_format($serviceFee, 0, ',', ' '),
                'net_earned' => number_format($earned - $serviceFee, 0, ',', ' '),
                'paid_out' => number_format($paidOut, 0, ',', ' '),
                'pending_payouts' => number_format($pendingPayouts, 0, ',', ' '),
                'available_balance' => number_format(max(0, $available), 0, ',', ' '),
                'recent_earnings' => $recentEarnings,
            ],
        ]);
    }

    /**
     * Request a payout
     */
    public function requestPayout(Request $request)
    {
        $user = $request->user();
        
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
        
        // Calculate available balance
        $earned = Booking::whereHas('property', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->where('booking_status', 'completed')
            ->sum('total_amount');
        
        $serviceFee = $earned * 0.15;
        $paidOut = Payout::where('user_id', $user->id)->where('status', 'completed')->sum('amount');
        $pendingPayouts = Payout::where('user_id', $user->id)->where('status', 'pending')->sum('amount');
        
        $available = $earned - $serviceFee - $paidOut - $pendingPayouts;
        
        if ($request->amount > $available) {
            return response()->json([
                'success' => false,
                'message' => 'Montant demandé supérieur au solde disponible',
                'available_balance' => number_format($available, 0, ',', ' '),
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
        
        // Send notification
        $this->notificationService->sendWhatsApp(
            $user->phone,
            "💰 *Demande de retrait* 💰\n\n"
            . "Montant: " . number_format($request->amount, 0, ',', ' ') . " FCFA\n"
            . "Méthode: " . ($request->payout_method === 'mobile_money' ? 'Mobile Money' : 'Virement bancaire') . "\n"
            . "Référence: {$payout->payout_reference}\n\n"
            . "⏳ En traitement - Vous recevrez une confirmation sous 48h."
        );
        
        // Notify admin
        $this->notifyAdminPayoutRequest($user, $payout);
        
        return response()->json([
            'success' => true,
            'message' => 'Demande de retrait envoyée avec succès. Traitement sous 48h.',
            'data' => [
                'reference' => $payout->payout_reference,
                'amount' => number_format($payout->amount, 0, ',', ' '),
                'status' => $payout->status,
            ],
        ]);
    }

    private function getStatusLabel($status)
    {
        $labels = [
            'pending' => 'En attente',
            'processing' => 'En cours',
            'completed' => 'Effectué',
            'failed' => 'Échoué',
        ];
        return $labels[$status] ?? $status;
    }

    private function notifyAdminPayoutRequest($user, $payout)
    {
        $admins = User::where('user_type', 'admin')->get();
        
        foreach ($admins as $admin) {
            $this->notificationService->sendWhatsApp(
                $admin->phone,
                "💰 *NOUVELLE DEMANDE DE RETRAIT* 💰\n\n"
                . "Hôte: {$user->full_name}\n"
                . "📞 Téléphone: {$user->phone}\n"
                . "Montant: " . number_format($payout->amount, 0, ',', ' ') . " FCFA\n"
                . "Méthode: {$payout->payout_method}\n"
                . "Référence: {$payout->payout_reference}\n\n"
                . "🔗 Connectez-vous au panel admin pour traiter."
            );
        }
    }
}