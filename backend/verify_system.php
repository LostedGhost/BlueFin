#!/usr/bin/env php
<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Storage;
use App\Models\PropertyPhoto;
use App\Models\User;

echo "\n";
echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║   ✅ VÉRIFICATION FINALE - SYSTÈME PRÊT?                   ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n";
echo "\n";

$ready = true;
$warnings = [];
$notes = [];

// 1. Template email
echo "📧 Template Email\n";
if (file_exists(resource_path('views/emails/admin/property_submitted.blade.php'))) {
    echo "   ✓ Template créé\n";
} else {
    echo "   ✗ Template MANQUANT\n";
    $ready = false;
}
echo "\n";

// 2. Lien symbolique
echo "🔗 Lien Symbolique\n";
$link_path = public_path('storage');
if (is_dir($link_path)) {
    echo "   ✓ Lien existe\n";
} else {
    echo "   ⚠ Lien manquant - Exécutez: php artisan storage:link\n";
    $warnings[] = "Lien symbolique";
}
echo "\n";

// 3. Configuration mail
echo "📬 Configuration Email\n";
if (config('mail.from.address')) {
    echo "   ✓ Email FROM configuré: " . config('mail.from.address') . "\n";
} else {
    echo "   ✗ Email FROM non configuré\n";
    $ready = false;
}

$mailer = config('mail.mailer');
if ($mailer === 'log') {
    echo "   ⓘ Mailer: 'log' (développement)\n";
    $notes[] = "En production, configurer un vrai serveur SMTP";
} else if ($mailer) {
    echo "   ✓ Mailer: $mailer\n";
} else {
    echo "   ⚠ Mailer non configuré\n";
    $warnings[] = "Configuration Mail";
}
echo "\n";

// 4. Admins
echo "👤 Admins Configurés\n";
$admin_count = User::where('user_type', 'admin')->count();
$admin_email_count = User::where('user_type', 'admin')
    ->where('receive_email_notifications', true)
    ->count();

if ($admin_count > 0) {
    echo "   ✓ Total admins: $admin_count\n";
    echo "   ✓ Avec notifications email: $admin_email_count\n";
} else {
    echo "   ✗ Aucun admin en base de données\n";
    $ready = false;
}
echo "\n";

// 5. Photos
echo "🖼️  Photos de Propriétés\n";
$photo_count = PropertyPhoto::count();
if ($photo_count > 0) {
    echo "   ✓ Total photos: $photo_count\n";
    
    $first_photo = PropertyPhoto::first();
    if ($first_photo->photo_url) {
        echo "   ✓ Photos ont des URLs\n";
    } else {
        echo "   ✗ URLs photos manquantes\n";
        $ready = false;
    }
} else {
    echo "   ⚠ Aucune photo en BD (normal pour un nouveau projet)\n";
    $notes[] = "Tester après upload de propriété";
}
echo "\n";

// 6. Listeners
echo "👂 Event Listeners\n";
try {
    $listeners = \Illuminate\Support\Facades\Event::getListeners(
        \App\Events\PropertySubmittedForApproval::class
    );
    if (!empty($listeners)) {
        echo "   ✓ Listeners enregistrés: " . count($listeners) . "\n";
    } else {
        echo "   ✗ Aucun listener enregistré\n";
        $ready = false;
    }
} catch (\Exception $e) {
    echo "   ⚠ Impossible vérifier: " . $e->getMessage() . "\n";
}
echo "\n";

// 7. Stockage
echo "💾 Stockage\n";
$storage_dir = storage_path('app/public');
if (is_dir($storage_dir)) {
    echo "   ✓ Répertoire storage/app/public existe\n";
    if (is_writable($storage_dir)) {
        echo "   ✓ Répertoire est accessible en écriture\n";
    } else {
        echo "   ✗ Répertoire NOT writable\n";
        $ready = false;
    }
} else {
    echo "   ✗ Répertoire storage/app/public MANQUANT\n";
    $ready = false;
}
echo "\n";

// Résumé
echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║   RÉSUMÉ                                                   ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n";
echo "\n";

if ($ready) {
    echo "✅ SYSTÈME PRÊT POUR TESTER!\n\n";
} else {
    echo "⚠️  DES CORRECTIONS SONT NÉCESSAIRES\n\n";
}

if (!empty($warnings)) {
    echo "⚠️  AVERTISSEMENTS:\n";
    foreach ($warnings as $w) {
        echo "   - $w\n";
    }
    echo "\n";
}

if (!empty($notes)) {
    echo "ℹ️  NOTES:\n";
    foreach ($notes as $n) {
        echo "   - $n\n";
    }
    echo "\n";
}

// Prochaines étapes
echo "📋 PROCHAINES ÉTAPES:\n";
echo "   1. Vérifier que les admins existent\n";
echo "   2. Configurer MAIL_MAILER en production (smtp)\n";
echo "   3. Tester soumission propriété:\n";
echo "      POST /api/v1/host/properties/{id}/submit\n";
echo "   4. Vérifier logs:\n";
echo "      tail -f storage/logs/laravel.log\n";
echo "   5. Utiliser GUIDE_TEST_COMPLET.md pour tests détaillés\n";
echo "\n";

// Status exit
exit($ready ? 0 : 1);
?>
