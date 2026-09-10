<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout', 'traveler/*', 'host/*', 'v1/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:5173', 
        'http://127.0.0.1:5173',
        'http://localhost:3000',
    'https://bluefin-immo.com',
    'https://www.bluefin-immo.com',
        'https://bluefin-immo.vercel.app',  // 👈 AJOUTE CETTE LIGNE
        'https://bluefin-immo-git-main.vercel.app', // Optionnel : tes preview branches
        'https://bluefin-immo-deboradevs-projects.vercel.app' // Optionnel
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,  // 👈 GARDE true si tu utilises sessions/auth
];
