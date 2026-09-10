<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run()
    {
        User::create([
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'email' => 'admin@bluefin-immo.com',
            'phone' => '+22990000000',
            'password' => Hash::make('Admin@123'),
            'user_type' => 'admin',
            'admin_role' => 'super_admin',
            'is_active' => true,
            'verification_status' => 'verified',
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
            'admin_permissions' => ['all'],
        ]);
        
        // Create moderator
        User::create([
            'first_name' => 'Moderator',
            'last_name' => 'Bluefin',
            'email' => 'moderator@bluefin-immo.com',
            'phone' => '+22990000001',
            'password' => Hash::make('Moderator@123'),
            'user_type' => 'admin',
            'admin_role' => 'moderator',
            'is_active' => true,
            'verification_status' => 'verified',
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
            'admin_permissions' => ['moderate_properties', 'view_users'],
        ]);
    }
}