<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Storage;
use App\Models\PropertyPhoto;

$photo = PropertyPhoto::first();
if ($photo) {
    echo "Photo URL: " . $photo->photo_url . "\n";
    echo "Full URL: " . config('app.url') . $photo->photo_url . "\n";
    echo "File exists: " . (Storage::disk('public')->exists($photo->photo_path) ? 'YES' : 'NO') . "\n";
} else {
    echo "No photos found\n";
}
