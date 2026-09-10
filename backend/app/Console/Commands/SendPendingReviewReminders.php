<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:send-pending-review-reminders')]
#[Description('Command description')]
class SendPendingReviewReminders extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        //
    }
}
