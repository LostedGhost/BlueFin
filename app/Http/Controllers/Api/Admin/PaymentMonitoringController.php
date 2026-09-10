<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PaymentMonitoringController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $payments = Payment::with('booking.user')
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->user_id, fn($q) => $q->whereHas('booking', fn($b) => $b->where('user_id', $request->user_id)))
            ->when($request->booking_id, fn($q) => $q->where('booking_id', $request->booking_id))
            ->orderBy($request->sort ?? 'created_at', $request->direction ?? 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($payments);
    }

    public function show(int $id): JsonResponse
    {
        $payment = Payment::with('booking.user')->findOrFail($id);
        return response()->json($payment);
    }

    public function refund(int $id, Request $request): JsonResponse
    {
        $payment = Payment::findOrFail($id);

        if ($payment->status === 'refunded') {
            return response()->json(['error' => 'Ce paiement a déjà été remboursé.'], 422);
        }

        // Logique de remboursement (simulée ici)
        $payment->status = 'refunded';
        $payment->refunded_at = now();
        $payment->save();

        // Mettre à jour la réservation associée
        if ($payment->booking) {
            $payment->booking->update([
                'payment_status' => 'refunded',
                'booking_status' => 'refunded'
            ]);
        }

        return response()->json([
            'message' => 'Remboursement effectué avec succès.',
            'payment' => $payment->fresh()
        ]);
    }
}