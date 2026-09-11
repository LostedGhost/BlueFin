<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Coordonnées sur lesquelles un hôte est payé (Mobile Money ou virement).
 */
class HostPayoutAccount extends Model
{
    protected $fillable = [
        'user_id', 'payment_method', 'full_name', 'phone_number', 'mobile_provider',
        'bank_name', 'account_holder', 'iban', 'bic', 'updated_by',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /** Ligne lisible du compte, ex. « MTN · 97 00 00 00 » ou « BOA · BJ06… ». */
    public function destination(): string
    {
        return $this->payment_method === 'mobile_money'
            ? trim(($this->mobile_provider ?? '') . ' · ' . ($this->phone_number ?? ''), ' ·')
            : trim(($this->bank_name ?? '') . ' · ' . ($this->iban ?? ''), ' ·');
    }
}
