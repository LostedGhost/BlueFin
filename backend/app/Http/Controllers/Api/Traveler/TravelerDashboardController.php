<?php

namespace App\Http\Controllers\Api\Traveler;

use App\Services\PhotoStorage;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Message;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class TravelerDashboardController extends Controller
{
    /**
     * Get traveler dashboard overview
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // ==================== STATISTIQUES DE RÉSERVATION ====================
        $totalBookings = Booking::where('user_id', $user->id)->count();
        
        $upcomingBookings = Booking::where('user_id', $user->id)
            ->where('booking_status', 'confirmed')
            ->where('check_in', '>=', today())
            ->count();
        
        $completedBookings = Booking::where('user_id', $user->id)
            ->where('booking_status', 'completed')
            ->count();
        
        $pendingBookings = Booking::where('user_id', $user->id)
            ->where('booking_status', 'pending')
            ->count();
        
        $cancelledBookings = Booking::where('user_id', $user->id)
            ->where('booking_status', 'cancelled')
            ->count();
        
        // ==================== DÉPENSES TOTALES ====================
        $totalSpent = Booking::where('user_id', $user->id)
            ->where('booking_status', 'completed')
            ->sum('total_amount');
        
        // ==================== MESSAGES NON LUS ====================
        $unreadMessages = Message::where('receiver_id', $user->id)
            ->where('is_read', false)
            ->count();
        
        // ==================== AVIS ÉCRITS ====================
        $reviewsWritten = Review::where('user_id', $user->id)->count();
        
        // ==================== FAVORIS ====================
        $favoritesCount = DB::table('favorites')
            ->where('user_id', $user->id)
            ->count();
        
        // ==================== PROCHAINS SÉJOURS (5 prochains) ====================
        $upcomingTrips = Booking::with(['property', 'property.photos'])
            ->where('user_id', $user->id)
            ->where('booking_status', 'confirmed')
            ->where('check_in', '>=', today())
            ->orderBy('check_in', 'asc')
            ->limit(5)
            ->get()
            ->map(function($booking) {
                return [
                    'id' => $booking->id,
                    'reference' => $booking->booking_reference,
                    'property' => [
                        'id' => $booking->property->id,
                        'title' => $booking->property->title,
                        'city' => $booking->property->city,
                        'district' => $booking->property->district,
                        'photo' => $booking->property->coverPhoto?->photo_url,
                    ],
                    'check_in' => $booking->check_in->format('d/m/Y'),
                    'check_out' => $booking->check_out->format('d/m/Y'),
                    'nights' => $booking->nights_count,
                    'guests' => $booking->guests_count,
                    'status' => $booking->booking_status,
                ];
            });
        
        // ==================== RÉSERVATIONS RÉCENTES (5 dernières) ====================
        $recentBookings = Booking::with(['property', 'property.photos'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function($booking) {
                return [
                    'id' => $booking->id,
                    'reference' => $booking->booking_reference,
                    'property' => [
                        'id' => $booking->property->id,
                        'title' => $booking->property->title,
                        'city' => $booking->property->city,
                        'photo' => $booking->property->coverPhoto?->photo_url,
                    ],
                    'check_in' => $booking->check_in->format('d/m/Y'),
                    'check_out' => $booking->check_out->format('d/m/Y'),
                    'total_amount' => number_format($booking->total_amount, 0, ',', ' '),
                    'status' => $booking->booking_status,
                    'status_label' => $this->getStatusLabel($booking->booking_status),
                    'created_at' => $booking->created_at->diffForHumans(),
                ];
            });
        
        // ==================== DERNIERS MESSAGES ====================
        $recentMessages = Message::with(['sender', 'receiver', 'booking.property'])
            ->where('receiver_id', $user->id)
            ->orWhere('sender_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function($message) use ($user) {
                $otherUser = $message->sender_id === $user->id ? $message->receiver : $message->sender;
                return [
                    'id' => $message->id,
                    'from' => $message->sender_id === $user->id ? 'moi' : $otherUser->full_name,
                    'message' => strlen($message->message) > 50 ? substr($message->message, 0, 50) . '...' : $message->message,
                    'property' => $message->booking?->property?->title,
                    'is_read' => $message->is_read,
                    'created_at' => $message->created_at->diffForHumans(),
                ];
            });
        
        // ==================== RECOMMANDATIONS PERSONNALISÉES ====================
        $recommendations = $this->getRecommendations($user);
        
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
                    'member_since' => $user->created_at->format('F Y'),
                ],
                'stats' => [
                    'total_bookings' => $totalBookings,
                    'upcoming_bookings' => $upcomingBookings,
                    'completed_bookings' => $completedBookings,
                    'pending_bookings' => $pendingBookings,
                    'cancelled_bookings' => $cancelledBookings,
                    'total_spent' => number_format($totalSpent, 0, ',', ' '),
                    'unread_messages' => $unreadMessages,
                    'reviews_written' => $reviewsWritten,
                    'favorites_count' => $favoritesCount,
                ],
                'upcoming_trips' => $upcomingTrips,
                'recent_bookings' => $recentBookings,
                'recent_messages' => $recentMessages,
                'recommendations' => $recommendations,
            ],
        ]);
    }

    /**
     * Get personalized recommendations based on travel history
     */
    private function getRecommendations($user)
    {
        // Get cities where user has traveled before
        $visitedCities = Booking::where('user_id', $user->id)
            ->where('booking_status', 'completed')
            ->with('property')
            ->get()
            ->pluck('property.city')
            ->unique()
            ->toArray();
        
        // Get property types user likes
        $preferredTypes = Booking::where('user_id', $user->id)
            ->where('booking_status', 'completed')
            ->with('property')
            ->get()
            ->pluck('property.property_type')
            ->countBy()
            ->sortDesc()
            ->keys()
            ->take(2)
            ->toArray();
        
        // Build query for recommendations
        $query = \App\Models\Property::where('status', 'active')
            ->with('coverPhoto')
            ->whereNotIn('id', function($q) use ($user) {
                $q->select('property_id')
                  ->from('bookings')
                  ->where('user_id', $user->id);
            })
            ->limit(6);
        
        if (!empty($visitedCities)) {
            $query->whereIn('city', $visitedCities);
        }
        
        if (!empty($preferredTypes)) {
            $query->whereIn('property_type', $preferredTypes);
        }
        
        $recommendations = $query->get()->map(function($property) {
            return [
                'id' => $property->id,
                'title' => $property->title,
                'city' => $property->city,
                'district' => $property->district,
                'price_per_night' => number_format($property->price_per_night, 0, ',', ' '),
                'average_rating' => $property->average_rating,
                'photo' => $property->coverPhoto?->photo_url,
                'instant_booking' => $property->instant_booking,
                'bluefin_certified' => $property->bluefin_certified,
            ];
        });
        
        return $recommendations;
    }

    private function getStatusLabel($status)
    {
        $labels = [
            'pending' => 'En attente',
            'confirmed' => 'Confirmée',
            'completed' => 'Terminée',
            'cancelled' => 'Annulée',
        ];
        return $labels[$status] ?? $status;
    }

    // ==================== GESTION DU PROFIL VOYAGEUR ====================

    /**
     * Get traveler profile
     */
    public function showProfile(Request $request)
    {
        $user = $request->user();
        
        $totalBookings = Booking::where('user_id', $user->id)->count();
        $totalSpent = Booking::where('user_id', $user->id)
            ->where('booking_status', 'completed')
            ->sum('total_amount');
        $totalReviews = Review::where('user_id', $user->id)->count();
        $averageRating = Review::where('user_id', $user->id)->avg('rating') ?? 0;
        
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
                    'member_since' => $user->created_at->format('F Y'),
                    'email_verified' => $user->email_verified_at !== null,
                    'phone_verified' => $user->phone_verified_at !== null,
                ],
                'stats' => [
                    'total_bookings' => $totalBookings,
                    'total_spent' => number_format($totalSpent, 0, ',', ' '),
                    'total_reviews' => $totalReviews,
                    'average_rating' => round($averageRating, 1),
                ],
            ],
        ]);
    }

    /**
     * Update traveler profile
     */
    public function updateProfile(Request $request)
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
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->update($request->only([
            'first_name', 'last_name', 'email', 'phone', 'bio', 'languages', 'country', 'city'
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
        
        $stored = app(PhotoStorage::class)->upload($request->file('photo'), 'profile-photos');
        
        $user->update(['profile_photo' => $stored['path'] ?: $stored['url']]);

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
            'new_password' => 'required|string|min:8|confirmed',
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
     * Delete account
     */
    public function deleteAccount(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();

        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Mot de passe incorrect',
            ], 422);
        }

        // Check if user has upcoming bookings
        $hasUpcomingBookings = Booking::where('user_id', $user->id)
            ->where('booking_status', 'confirmed')
            ->where('check_in', '>=', today())
            ->exists();

        if ($hasUpcomingBookings) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas supprimer votre compte car vous avez des réservations à venir.',
            ], 422);
        }

        // Delete user data
        $user->tokens()->delete();
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Votre compte a été supprimé',
        ]);
    }
}