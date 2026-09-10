<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use App\Models\PropertyPhoto;

echo "\n=== DIAGNOSTIC DE STOCKAGE DES IMAGES ===\n\n";

// 1. Configuration des disques
echo "1. Configuration des disques:\n";
echo "   - Default disk: " . config('filesystems.default') . "\n";
echo "   - Public disk root: " . config('filesystems.disks.public.root') . "\n";
echo "   - Public disk URL: " . config('filesystems.disks.public.url') . "\n";
echo "   - APP_URL: " . env('APP_URL', 'Pas défini') . "\n\n";

// 2. Vérifier le lien symbolique
echo "2. Statut du lien symbolique:\n";
$storageLink = public_path('storage');
$storageDir = storage_path('app/public');

if (is_link($storageLink)) {
    echo "   ✓ Lien symbolique EXISTE\n";
    echo "     - Cible: " . readlink($storageLink) . "\n";
    echo "     - Pointe vers: " . $storageDir . "\n";
} else {
    echo "   ✗ Lien symbolique ABSENT!\n";
    echo "     - Chemin attendu: " . $storageLink . "\n";
    echo "     - À créer: php artisan storage:link\n";
}
echo "\n";

// 3. Vérifier le répertoire de stockage
echo "3. Répertoire de stockage:\n";
echo "   - Exists: " . (is_dir($storageDir) ? "✓" : "✗") . "\n";
echo "   - Writable: " . (is_writable($storageDir) ? "✓" : "✗") . "\n";
echo "\n";

// 4. Exemples d'URLs générées
echo "4. Exemples d'URLs générées:\n";
$testPath = 'properties/1/test.jpg';
$storedUrl = Storage::disk('public')->url($testPath);
echo "   - Storage::disk('public')->url('$testPath'): $storedUrl\n";
echo "   - Full URL: " . env('APP_URL') . $storedUrl . "\n\n";

// 5. Vérifier les photos en base de données
echo "5. Photos en base de données:\n";
$photos = PropertyPhoto::with('property')->take(5)->get();
if ($photos->count() === 0) {
    echo "   Aucune photo en base de données\n";
} else {
    foreach ($photos as $photo) {
        echo "   - ID: {$photo->id}, Property: {$photo->property?->title}\n";
        echo "     Photo URL: {$photo->photo_url}\n";
        echo "     Photo Path: {$photo->photo_path}\n";
        echo "     File exists: " . (Storage::disk('public')->exists($photo->photo_path) ? "✓" : "✗") . "\n";
    }
}
echo "\n";

// 6. Permissions
echo "6. Permissions des fichiers:\n";
$propertiesDir = storage_path('app/public/properties');
echo "   - Directory permissions: " . (is_dir($propertiesDir) ? decoct(fileperms($propertiesDir)) : "N/A") . "\n";
echo "\n";

echo "=== FIN DU DIAGNOSTIC ===\n\n";
?>
