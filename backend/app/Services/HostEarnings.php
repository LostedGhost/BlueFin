<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\ExperienceBooking;
use App\Models\Payout;
use App\Models\PlatformSetting;
use App\Models\ServiceBooking;
use App\Models\User;
use Carbon\CarbonInterface;

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
        $bookings = $this->propertyBookings($host)->whereBetween('check_out', [$from->toDateString(), $to->toDateString()]);
        $experiences = $this->experienceBookings($host)->whereBetween('reservation_date', [$from->toDateString(), $to->toDateString()]);
        $services = $this->serviceBookings($host)->whereBetween('reservation_date', [$from->toDateString(), $to->toDateString()]);

        return [
            'gross' => (int) ((clone $bookings)->sum('total_amount') + (clone $experiences)->sum('total_amount') + (clone $services)->sum('total_amount')),
            'reservations' => $bookings->count() + $experiences->count() + $services->count(),
        ];
    }

    private function gross(User $host): int
    {
        return (int) ($this->propertyBookings($host)->sum('total_amount')
            + $this->experienceBookings($host)->sum('total_amount')
            + $this->serviceBookings($host)->sum('total_amount'));
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
