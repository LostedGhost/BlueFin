<?php

namespace App\Http\Controllers\Api;

use App\Support\PublicPayload;
use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Booking;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReviewController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get reviews for a property
     */
    public function getPropertyReviews($propertyId)
    {
        $reviews = Review::with('user')
            ->where('property_id', $propertyId)
            ->where('review_type', 'guest')
            ->where('is_approved', true)
            ->orderBy('created_at', 'desc')
            ->paginate(15);
        PublicPayload::reviews($reviews->getCollection());
        
        // Calculate average ratings
        $averages = Review::where('property_id', $propertyId)
            ->where('review_type', 'guest')
            ->where('is_approved', true)
            ->selectRaw('
                AVG(rating) as avg_rating,
                AVG(cleanliness_rating) as avg_cleanliness,
                AVG(communication_rating) as avg_communication,
                AVG(checkin_rating) as avg_checkin,
                AVG(accuracy_rating) as avg_accuracy,
                AVG(location_rating) as avg_location,
                AVG(value_rating) as avg_value
            ')
            ->first();
        
        return response()->json([
            'success' => true,
            'data' => $reviews,
            'averages' => $averages,
            'total_count' => Review::where('property_id', $propertyId)
                ->where('review_type', 'guest')
                ->where('is_approved', true)
                ->count()
        ]);
    }

    /**
     * Submit a review (guest review)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'booking_id' => 'required|exists:bookings,id',
            'rating' => 'required|integer|min:1|max:5',
            'cleanliness_rating' => 'required|integer|min:1|max:5',
            'communication_rating' => 'required|integer|min:1|max:5',
            'checkin_rating' => 'required|integer|min:1|max:5',
            'accuracy_rating' => 'required|integer|min:1|max:5',
            'location_rating' => 'required|integer|min:1|max:5',
            'value_rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|min:10|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $booking = Booking::with('property')->findOrFail($request->booking_id);
        
        // Check if user is the guest
        if ($booking->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas évaluer ce séjour'
            ], 403);
        }
        
        // Check if booking is completed
        if ($booking->booking_status !== 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez évaluer qu\'après la fin du séjour'
            ], 422);
        }
        
        // Check if review already exists
        $existingReview = Review::where('booking_id', $booking->id)
            ->where('review_type', 'guest')
            ->first();
        
        if ($existingReview) {
            return response()->json([
                'success' => false,
                'message' => 'Vous avez déjà laissé un avis pour ce séjour'
            ], 422);
        }
        
        $review = Review::create([
            'booking_id' => $booking->id,
            'user_id' => $request->user()->id,
            'property_id' => $booking->property_id,
            'rating' => $request->rating,
            'cleanliness_rating' => $request->cleanliness_rating,
            'communication_rating' => $request->communication_rating,
            'checkin_rating' => $request->checkin_rating,
            'accuracy_rating' => $request->accuracy_rating,
            'location_rating' => $request->location_rating,
            'value_rating' => $request->value_rating,
            'comment' => $request->comment,
            'review_type' => 'guest',
            'is_approved' => true, // Auto-approve, can be moderated later
        ]);
        
        // Update property average rating
        $review->property->updateAverageRating();
        
        // Notify host
        $this->notificationService->sendWhatsApp(
            $booking->property->user->phone,
            "⭐ Nouvel avis pour {$booking->property->title}\n"
            . "Note: {$request->rating}/5\n"
            . "\"{$request->comment}\"\n\n"
            . "Merci de répondre à cet avis depuis votre espace hôte."
        );
        
        return response()->json([
            'success' => true,
            'message' => 'Merci pour votre avis !',
            'data' => $review
        ], 201);
    }

    /**
     * Add host response to a review
     */
    public function addHostResponse(Request $request, $reviewId)
    {
        $validator = Validator::make($request->all(), [
            'response' => 'required|string|min:10|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $review = Review::with('property')->findOrFail($reviewId);
        
        // Check if user is the property owner
        if ($review->property->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'êtes pas autorisé à répondre à cet avis'
            ], 403);
        }
        
        // Check if response already exists
        if ($review->host_response) {
            return response()->json([
                'success' => false,
                'message' => 'Vous avez déjà répondu à cet avis'
            ], 422);
        }
        
        $review->update([
            'host_response' => $request->response,
            'host_response_at' => now(),
        ]);
        
        // Notify guest
        $this->notificationService->sendWhatsApp(
            $review->user->phone,
            "🏠 L'hôte a répondu à votre avis pour {$review->property->title}:\n\n"
            . "\"{$request->response}\"\n\n"
            . "Merci de votre confiance!"
        );
        
        return response()->json([
            'success' => true,
            'message' => 'Réponse ajoutée',
            'data' => $review
        ]);
    }

    /**
     * Get user's reviews (as guest)
     */
    public function getUserReviews(Request $request)
    {
        $reviews = Review::with('property')
            ->where('user_id', $request->user()->id)
            ->where('review_type', 'guest')
            ->orderBy('created_at', 'desc')
            ->paginate(10);
        
        return response()->json([
            'success' => true,
            'data' => $reviews
        ]);
    }

    /**
     * Get host reviews (reviews received by host's properties)
     */
    public function getHostReviews(Request $request)
    {
        $reviews = Review::with(['user', 'property'])
            ->whereHas('property', function($q) use ($request) {
                $q->where('user_id', $request->user()->id);
            })
            ->where('review_type', 'guest')
            ->orderBy('created_at', 'desc')
            ->paginate(15);
        
        // Calculate average rating for host
        $averageRating = $reviews->avg('rating');
        
        return response()->json([
            'success' => true,
            'data' => $reviews,
            'average_rating' => round($averageRating, 2),
            'total_reviews' => $reviews->total()
        ]);
    }

    /**
     * Submit host review (host reviews guest)
     */
    public function storeHostReview(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'booking_id' => 'required|exists:bookings,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|min:10|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $booking = Booking::with('property')->findOrFail($request->booking_id);
        
        // Check if user is the property owner
        if ($booking->property->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'êtes pas autorisé à évaluer ce voyageur'
            ], 403);
        }
        
        // Check if booking is completed
        if ($booking->booking_status !== 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez évaluer qu\'après la fin du séjour'
            ], 422);
        }
        
        // Check if host review already exists
        $existingReview = Review::where('booking_id', $booking->id)
            ->where('review_type', 'host')
            ->first();
        
        if ($existingReview) {
            return response()->json([
                'success' => false,
                'message' => 'Vous avez déjà évalué ce voyageur'
            ], 422);
        }
        
        $review = Review::create([
            'booking_id' => $booking->id,
            'user_id' => $booking->user_id,
            'property_id' => $booking->property_id,
            'rating' => $request->rating,
            'cleanliness_rating' => 0,
            'communication_rating' => 0,
            'checkin_rating' => 0,
            'accuracy_rating' => 0,
            'location_rating' => 0,
            'value_rating' => 0,
            'comment' => $request->comment,
            'review_type' => 'host',
            'is_approved' => true,
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Votre évaluation a été enregistrée',
            'data' => $review
        ], 201);
    }
}