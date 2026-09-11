<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Réglages de la plateforme. Seuls les réglages déclarés dans
 * PlatformSetting::DEFINITIONS sont lus ou écrits ; tous sont effectivement
 * utilisés par le calcul des soldes et des versements.
 */
class SettingsController extends Controller
{
    public function index()
    {
        return response()->json(['success' => true, 'data' => $this->present()]);
    }

    public function update(Request $request)
    {
        // Changer la commission modifie immédiatement le solde de tous les
        // hôtes : réservé au super administrateur.
        abort_unless($request->user()?->isSuperAdmin, 403, 'Seul un super administrateur peut modifier les réglages.');

        $rules = [];
        foreach (PlatformSetting::DEFINITIONS as $key => $definition) {
            $rules[$key] = 'sometimes|' . $definition['rules'];
        }
        $values = $request->validate($rules, $this->frenchValidationMessages());

        $before = PlatformSetting::allValues();
        PlatformSetting::store($values, $request->user()->id);

        Log::info('Réglages plateforme modifiés', [
            'admin_id' => $request->user()->id,
            'avant' => array_intersect_key($before, $values),
            'après' => $values,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Réglages enregistrés.',
            'data' => $this->present(),
        ]);
    }

    private function present(): array
    {
        $values = PlatformSetting::allValues();

        return collect(PlatformSetting::DEFINITIONS)->map(fn ($definition, $key) => [
            'key' => $key,
            'label' => $definition['label'],
            'value' => $values[$key],
            'default' => $definition['default'],
        ])->values()->all();
    }
}
