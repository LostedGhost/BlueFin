<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use App\Events\PropertySubmittedForApproval;
use App\Events\NewMessageSent;
use App\Events\PaymentReceived;
use App\Events\NewUserRegistered;
use App\Listeners\SendAdminPropertyNotification;
use App\Listeners\SendAdminMessageNotification;
use App\Listeners\SendAdminPaymentNotification;
use App\Listeners\SendAdminUserNotification;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        PropertySubmittedForApproval::class => [
            SendAdminPropertyNotification::class,
        ],
        NewMessageSent::class => [
            SendAdminMessageNotification::class,
        ],
        PaymentReceived::class => [
            SendAdminPaymentNotification::class,
        ],
        NewUserRegistered::class => [
            SendAdminUserNotification::class,
        ],
         \App\Listeners\SendAdminNotification::class,
    ];


    public function boot()
    {
        parent::boot();
    }
};