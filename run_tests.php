<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use App\Models\Property;
use App\Models\User;
use App\Models\PropertyPhoto;
use App\Events\PropertySubmittedForApproval;

echo "\n";
echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║   TEST D'IMPLÉMENTATION - EMAILS & IMAGES                  ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n";
echo "\n";

$tests_passed = 0;
$tests_failed = 0;

// TEST 1: Template Email Existe
echo "TEST 1: Template email existe\n";
$template_path = resource_path('views/emails/admin/property_submitted.blade.php');
if (file_exists($template_path)) {
    echo "✓ PASS: Template trouvé\n";
    $tests_passed++;
} else {
    echo "✗ FAIL: Template non trouvé\n";
    $tests_failed++;
}
echo "\n";

// TEST 2: Lien Symbolique
echo "TEST 2: Lien symbolique public/storage\n";
$link_path = public_path('storage');
if (is_dir($link_path)) {
    echo "✓ PASS: Lien existe\n";
    $tests_passed++;
} else {
    echo "✗ FAIL: Lien n'existe pas\n";
    echo "  Exécutez: php artisan storage:link\n";
    $tests_failed++;
}
echo "\n";

// TEST 3: Vérifier les photos en DB
echo "TEST 3: Photos en base de données\n";
$photo_count = PropertyPhoto::count();
if ($photo_count > 0) {
    echo "✓ PASS: $photo_count photo(s) trouvée(s)\n";
    
    // Vérifier les URLs
    $photo = PropertyPhoto::first();
    echo "  - Photo URL: " . $photo->photo_url . "\n";
    echo "  - Fichier existe: " . (Storage::disk('public')->exists($photo->photo_path) ? "OUI" : "NON") . "\n";
    $tests_passed++;
} else {
    echo "⚠ WARNING: Aucune photo en DB (normal si c'est la première fois)\n";
}
echo "\n";

// TEST 4: Configuration Mail
echo "TEST 4: Configuration Mail\n";
$mail_config = config('mail.mailer');
echo "  - Mailer: " . $mail_config . " (développement: log, production: smtp)\n";
echo "  - From: " . config('mail.from.address') . "\n";

if (config('mail.from.address')) {
    echo "✓ PASS: Configuration mail détectée\n";
    if ($mail_config === 'log') {
        echo "  ⓘ Note: Mailer en mode 'log' (développement)\n";
        echo "    Pour la production, utilisez 'smtp'\n";
    }
    $tests_passed++;
} else {
    echo "✗ FAIL: MAIL_FROM_ADDRESS manquant\n";
    $tests_failed++;
}
echo "\n";

// TEST 5: Admins existants
echo "TEST 5: Admins avec notifications email\n";
$admins = User::where('user_type', 'admin')
    ->where('receive_email_notifications', true)
    ->count();

if ($admins > 0) {
    echo "✓ PASS: $admins admin(s) avec notifications email activées\n";
    $tests_passed++;
} else {
    echo "✗ FAIL: Aucun admin avec notifications email\n";
    $tests_failed++;
}
echo "\n";

// TEST 6: Listener enregistré
echo "TEST 6: Listener PropertySubmittedForApproval enregistré\n";
try {
    $listeners = \Illuminate\Support\Facades\Event::getListeners(\App\Events\PropertySubmittedForApproval::class);
    if (!empty($listeners)) {
        echo "✓ PASS: " . count($listeners) . " listener(s) enregistré(s)\n";
        foreach ($listeners as $listener) {
            echo "  - " . get_class($listener) . "\n";
        }
        $tests_passed++;
    } else {
        echo "✗ FAIL: Aucun listener enregistré\n";
        $tests_failed++;
    }
} catch (\Exception $e) {
    echo "⚠ WARNING: " . $e->getMessage() . "\n";
}
echo "\n";

// TEST 7: Propriété avec photos
echo "TEST 7: Propriété avec photos\n";
$property = Property::whereHas('photos', function ($q) {
    $q->where('order', 1);
})->first();

if ($property) {
    echo "✓ PASS: Propriété trouvée: " . $property->title . "\n";
    echo "  - Photos: " . $property->photos()->count() . "\n";
    echo "  - Première photo URL: " . $property->photos()->first()->photo_url . "\n";
    $tests_passed++;
} else {
    echo "⚠ WARNING: Aucune propriété avec photos\n";
}
echo "\n";

// RÉSUMÉ
echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║   RÉSUMÉ DES TESTS                                         ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n";
echo "✓ PASSÉ: $tests_passed\n";
echo "✗ ÉCHOUÉ: $tests_failed\n";
echo "\n";

if ($tests_failed === 0) {
    echo "✓ TOUS LES TESTS SONT PASSÉS!\n";
    echo "\nProchaines étapes:\n";
    echo "1. Envoyer une requête POST à /api/v1/host/properties/{id}/submit\n";
    echo "2. Vérifier les logs: tail -f storage/logs/laravel.log\n";
    echo "3. Vérifier la réception de l'email\n";
    echo "4. Vérifier l'affichage des images dans le frontend\n";
} else {
    echo "⚠ Veuillez corriger les problèmes indiqués ci-dessus\n";
}

echo "\n";
?>
