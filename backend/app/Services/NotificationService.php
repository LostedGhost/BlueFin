<?php

namespace App\Services;

use Twilio\Rest\Client;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    protected $twilio;
    protected $whatsappNumber;
    protected $smsNumber;

    public function __construct()
    {
        $twilioSid = env('TWILIO_SID');
        $twilioToken = env('TWILIO_TOKEN');
        $whatsappNumber = env('TWILIO_WHATSAPP_NUMBER');
        $smsNumber = env('TWILIO_PHONE_NUMBER');

        if ($twilioSid && $twilioToken && $whatsappNumber && $smsNumber) {
            try {
                $this->twilio = new Client($twilioSid, $twilioToken);
                $this->whatsappNumber = "whatsapp:" . $whatsappNumber;
                $this->smsNumber = $smsNumber;
            } catch (\Exception $e) {
                Log::warning('Twilio init failed: ' . $e->getMessage());
            }
        } else {
            Log::info('Twilio not configured – notifications disabled');
        }
    }

    public function sendWhatsApp($phone, $message)
    {
        if (!$this->twilio) {
            Log::info('WhatsApp skipped: Twilio not configured');
            return false;
        }
        try {
            $phone = $this->formatPhoneNumber($phone);
            $this->twilio->messages->create("whatsapp:{$phone}", [
                'from' => $this->whatsappNumber,
                'body' => $message,
            ]);
            Log::info("WhatsApp sent to {$phone}");
            return true;
        } catch (\Exception $e) {
            Log::error('WhatsApp failed: ' . $e->getMessage());
            return false;
        }
    }

  /**
     * Send push notification via FCM
     */
    public function sendPushNotification($deviceTokens, $title, $body, $data = [])
    {
        if (empty($deviceTokens)) {
            return false;
        }

        if (!is_array($deviceTokens)) {
            $deviceTokens = [$deviceTokens];
        }

        $response = Http::withHeaders([
            'Authorization' => 'key=' . env('FCM_SERVER_KEY'),
            'Content-Type' => 'application/json',
        ])->post('https://fcm.googleapis.com/fcm/send', [
            'registration_ids' => $deviceTokens,
            'notification' => [
                'title' => $title,
                'body' => $body,
                'sound' => 'default',
                'badge' => 1,
            ],
            'data' => $data,
            'priority' => 'high',
        ]);

        if ($response->successful()) {
            Log::info("Push notifications sent to " . count($deviceTokens) . " devices");
            return true;
        }

        Log::error('Push notification failed: ' . $response->body());
        return false;
    }

    /**
     * Send email notification
     */
    public function sendEmail($to, $subject, $view, $data = [])
    {
        try {
            Mail::send($view, $data, function ($message) use ($to, $subject) {
                $message->to($to)
                        ->subject($subject)
                        ->from(env('MAIL_FROM_ADDRESS'), env('MAIL_FROM_NAME'));
            });
            Log::info("Email sent to {$to}");
            return true;
        } catch (\Exception $e) {
            Log::error('Email failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send multi-channel notification
     */
    public function sendNotification($user, $title, $message, $channels = ['whatsapp', 'push'])
    {
        $results = [];

        if (in_array('whatsapp', $channels) && $user->phone) {
            $results['whatsapp'] = $this->sendWhatsApp($user->phone, $message);
        }

        if (in_array('sms', $channels) && $user->phone) {
            $results['sms'] = $this->sendSMS($user->phone, $message);
        }

        if (in_array('email', $channels) && $user->email) {
            $results['email'] = $this->sendEmail($user->email, $title, 'emails.notification', [
                'title' => $title,
                'message' => $message,
                'user' => $user,
            ]);
        }

        if (in_array('push', $channels) && $user->devices) {
            $deviceTokens = $user->devices()->where('is_active', true)->pluck('device_token')->toArray();
            $results['push'] = $this->sendPushNotification($deviceTokens, $title, $message);
        }

        return $results;
    }

    private function formatPhoneNumber($phone)
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);
        if (substr($phone, 0, 1) === '0') $phone = substr($phone, 1);
        if (strlen($phone) === 8) $phone = '229' . $phone;
        if (substr($phone, 0, 1) !== '+') $phone = '+' . $phone;
        return $phone;
    }

    
}