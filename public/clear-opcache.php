<?php
// clear-opcache.php
echo "=== VIDAGE OPCACHE ===\n";

if (function_exists('opcache_reset')) {
    opcache_reset();
    echo "✅ OPCache vidé\n";
} else {
    echo "❌ OPCache non disponible\n";
}

if (function_exists('apc_clear_cache')) {
    apc_clear_cache();
    echo "✅ APC vidé\n";
}

// Vider les caches Laravel
exec('php artisan cache:clear 2>&1', $output1);
exec('php artisan config:clear 2>&1', $output2);
exec('php artisan route:clear 2>&1', $output3);
exec('php artisan view:clear 2>&1', $output4);

echo "✅ Caches Laravel vidés\n";
echo "=== FIN ===\n";
