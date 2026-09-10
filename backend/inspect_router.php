<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
echo get_class($kernel) . PHP_EOL;
$reflection = new ReflectionClass($kernel);
$aliasProp = $reflection->getProperty('middlewareAliases');
$aliasProp->setAccessible(true);
var_export($aliasProp->getValue($kernel));
echo PHP_EOL;
$router = $app->make('router');
var_export($router->getMiddleware());
