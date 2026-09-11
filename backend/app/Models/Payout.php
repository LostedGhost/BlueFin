<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Un versement dû ou effectué à un hôte.
 *
 * Il naît soit d'une demande de retrait de l'hôte, soit de la génération
 * hebdomadaire côté administration. `payout_details` porte la période
 * couverte, le nombre de réservations, la référence de la transaction réelle
 * (Mobile Money / virement) saisie par l'admin, et la trace des annulations.
 *
 * Le modèle était vide auparavant : sans $fillable, Payout::create()
 * levait une MassAssignmentException, ce qui cassait aussi la demande de
 * retrait côté hôte.
 */
class Payout extends Model
{
    protected $fillable = [
        'user_id', 'payout_reference', 'amount', 'payout_method',
        'mobile_money_provider', 'mobile_money_number', 'bank_name', 'bank_account',
        'status', 'payout_details', 'processed_at', 'failure_reason',
    ];

    protected $casts = [
        'amount' => 'integer',
        'payout_details' => 'array',
        'processed_at' => 'datetime',
    ];

    /** Statuts qui réservent de l'argent sur le solde de l'hôte. */
    public const OPEN_STATUSES = ['pending', 'processing'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
