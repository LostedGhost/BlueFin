<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\ExperienceBooking;
use App\Models\Payout;
use App\Models\PlatformSetting;
use App\Models\ServiceBooking;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Schema;

/**
 * Calcul unique de ce que la plateforme doit à un hôte.
 *
 *   brut       = réservations terminées (logements + expériences + services)
 *   commission = brut × taux (réglage « commission_rate »)
 *   net        = brut − commission
 *   dû         = net − versements effectués − versements en cours
 *
 * Les versements « en cours » (pending/processing) sont déduits : l'argent
 * est déjà réservé, ni l'hôte ni l'admin ne peuvent le verser deux fois.
 *
 * La règle métier reprend exactement celle qui existait (commission prélevée
 * sur le montant total de la réservation) ; seul le taux est désormais
 * réglable et les expériences/services, jusque-là oubliés, sont comptés.
 */
class HostEarnings
{
    public function summary(User $host): array
    {
        $gross = $this->gross($host);
        $rate = (float) PlatformSetting::current('commission_rate');
        $commission = (int) round($gross * $rate / 100);
        $net = $gross - $commission;

        $paid = (int) Payout::where('user_id', $host->id)->where('status', 'completed')->sum('amount');
        $open = (int) Payout::where('user_id', $host->id)->whereIn('status', Payout::OPEN_STATUSES)->sum('amount');

        return [
            'gross' => $gross,
            'commission_rate' => $rate,
            'commission' => $commission,
            'net' => $net,
            'paid' => $paid,
            'open' => $open,
            'owed' => max(0, $net - $paid - $open),
        ];
    }

    public function owed(User $host): int
    {
        return $this->summary($host)['owed'];
    }

    /** Montant brut et nombre de réservations terminées sur une période. */
    public function period(User $host, CarbonInterface $from, CarbonInterface $to): array
    {
        $range = [$from->toDateString(), $to->toDateString()];
        $queries = [$this->propertyBookings($host)->whereBetween('check_out', $range)];
        foreach ($this->offerBookings($host) as $query) {
            $queries[] = $query->whereBetween('reservation_date', $range);
        }

        return [
            'gross' => (int) array_sum(array_map(fn ($q) => (clone $q)->sum('total_amount'), $queries)),
            'reservations' => array_sum(array_map(fn ($q) => $q->count(), $queries)),
        ];
    }

    private function gross(User $host): int
    {
        $total = $this->propertyBookings($host)->sum('total_amount');
        foreach ($this->offerBookings($host) as $query) {
            $total += $query->sum('total_amount');
        }

        return (int) $total;
    }

    /**
     * Réservations d'expériences et de services, seulement si leurs tables
     * existent : la base de production a été montée hors migrations et ne
     * les contient pas (encore). Sans ce garde-fou, tout calcul de solde —
     * Paiements Hôtes, solde et demande de retrait côté hôte — plantait.
     */
    private function offerBookings(User $host): array
    {
        static $tables = null;
        $tables ??= [
            'experience_bookings' => Schema::hasTable('experience_bookings'),
            'service_bookings' => Schema::hasTable('service_bookings'),
        ];

        $queries = [];
        if ($tables['experience_bookings']) {
            $queries[] = $this->experienceBookings($host);
        }
        if ($tables['service_bookings']) {
            $queries[] = $this->serviceBookings($host);
        }

        return $queries;
    }

    private function propertyBookings(User $host)
    {
        return Booking::where('booking_status', 'completed')
            ->whereHas('property', fn ($q) => $q->where('user_id', $host->id));
    }

    private function experienceBookings(User $host)
    {
        return ExperienceBooking::where('booking_status', 'completed')
            ->whereHas('experience', fn ($q) => $q->where('host_id', $host->id));
    }

    private function serviceBookings(User $host)
    {
        return ServiceBooking::where('booking_status', 'completed')
            ->whereHas('service', fn ($q) => $q->where('host_id', $host->id));
    }
}
