<?php

namespace App\Http\Controllers\Api\Host;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class HostProfileController extends Controller
{
    /**
     * Get host profile
     */
    public function show(Request $request)
    {
        $user = $request->user();
        
        $totalProperties = Property::where('user_id', $user->id)->count();
        $activeProperties = Property::where('user_id', $user->id)->where('status', 'active')->count();
        $totalBookings = $user->bookings()->where('booking_status', 'confirmed')->count();
        
        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'profile_photo' => $user->profile_photo_url,
                    'bio' => $user->bio,
                    'languages' => $user->languages,
                    'country' => $user->country,
                    'city' => $user->city,
                    'address' => $user->address,
                    'verification_status' => $user->verification_status,
                    'member_since' => $user->created_at->format('F Y'),
                    'email_verified' => $user->email_verified_at !== null,
                    'phone_verified' => $user->phone_verified_at !== null,
                ],
                'stats' => [
                    'total_properties' => $totalProperties,
                    'active_properties' => $activeProperties,
                    'total_bookings' => $totalBookings,
                ],
            ],
        ]);
    }

    /**
     * Update host profile
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'first_name' => 'string|max:255',
            'last_name' => 'string|max:255',
            'email' => 'email|unique:users,email,' . $user->id,
            'phone' => 'string|unique:users,phone,' . $user->id,
            'bio' => 'string|max:1000',
            'languages' => 'array',
            'country' => 'string|max:255',
            'city' => 'string|max:255',
            'address' => 'string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->update($request->only([
            'first_name', 'last_name', 'email', 'phone', 'bio', 'languages', 'country', 'city', 'address'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Profil mis à jour avec succès',
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'profile_photo' => $user->profile_photo_url,
                'bio' => $user->bio,
                'languages' => $user->languages,
                'country' => $user->country,
                'city' => $user->city,
                'address' => $user->address,
            ],
        ]);
    }

    /**
     * Upload profile photo
     */
    public function uploadPhoto(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'photo' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        
        // Delete old photo if exists
        if ($user->profile_photo) {
            Storage::disk('public')->delete($user->profile_photo);
        }
        
        $path = $request->file('photo')->store('profile-photos', 'public');
        
        $user->update(['profile_photo' => $path]);

        return response()->json([
            'success' => true,
            'message' => 'Photo de profil mise à jour',
            'profile_photo' => $user->profile_photo_url,
        ]);
    }

    /**
     * Change password
     */
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Mot de passe actuel incorrect',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Mot de passe modifié avec succès',
        ]);
    }

    /**
     * Get bank/payment information
     */
    public function getPaymentInfo(Request $request)
    {
        $user = $request->user();
        
        return response()->json([
            'success' => true,
            'data' => [
                'mobile_money_provider' => $user->mobile_money_provider,
                'mobile_money_number' => $user->mobile_money_number,
                'bank_name' => $user->bank_name,
                'bank_account' => $user->bank_account,
                'bank_code' => $user->bank_code,
            ],
        ]);
    }

    /**
     * Update bank/payment information
     */
    public function updatePaymentInfo(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'mobile_money_provider' => 'nullable|in:MTN,Moov,Orange',
            'mobile_money_number' => 'nullable|string',
            'bank_name' => 'nullable|string',
            'bank_account' => 'nullable|string',
            'bank_code'  => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        $user->update($request->only([
            'mobile_money_provider', 'mobile_money_number', 'bank_name', 'bank_account', 'bank_code'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Informations de paiement mises à jour',
        ]);
    }
}