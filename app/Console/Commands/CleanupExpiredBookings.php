<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:cleanup-expired-bookings')]
#[Description('Command description')]
class CleanupExpiredBookings extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        //
    }
}
