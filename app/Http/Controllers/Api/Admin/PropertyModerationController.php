<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\ModerationLog;
use App\Models\AdminNotification;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class PropertyModerationController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }
    
    /**
     * Get full URL for a photo path
     */
    private function getFullPhotoUrl($photoPath)
    {
        if (empty($photoPath)) {
            return null;
        }
        
        if (filter_var($photoPath, FILTER_VALIDATE_URL)) {
            return $photoPath;
        }
        
        return asset('storage/' . $photoPath);
    }

    /**
     * Get all pending properties
     */
    public function pendingProperties(Request $request)
    {
        try {
            $properties = Property::with(['user', 'photos'])
                ->where('status', 'pending')
                ->where('requires_review', true)
                ->orderBy('created_at', 'asc')
                ->paginate(20);

            $properties->getCollection()->transform(function ($property) {
                if ($property->photos && $property->photos->count() > 0) {
                    $property->photos->transform(function ($photo) {
                        $photo->makeVisible('full_url');
                        return $photo;
                    });
                }
                return $property;
            });

            $stats = [
                'total_pending' => Property::where('status', 'pending')->count(),
                'total_active' => Property::where('status', 'active')->count(),
                'total_rejected' => Property::where('status', 'rejected')->count(),
                'pending_today' => Property::where('status', 'pending')->whereDate('created_at', today())->count(),
            ];

            return response()->json([
                'success' => true, 
                'data' => $properties, 
                'stats' => $stats
            ]);
            
        } catch (\Exception $e) {
            \Log::error('pendingProperties error: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Erreur interne: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show property details for moderation
     */
    public function show($id)
    {
        $property = Property::with(['user', 'photos', 'reviews', 'bookings'])->findOrFail($id);
        $property->host_stats = [
            'total_properties' => Property::where('user_id', $property->user_id)->count(),
            'total_bookings' => $property->user->bookings()->count(),
            'average_rating' => $property->user->reviews()->avg('rating') ?? 0,
            'member_since' => $property->user->created_at->format('d/m/Y'),
        ];

        $similar = Property::where('city', $property->city)
            ->where('status', 'active')
            ->where('id', '!=', $property->id)
            ->limit(5)
            ->get(['id', 'title', 'price_per_night', 'average_rating']);

        return response()->json(['success' => true, 'data' => $property, 'similar' => $similar]);
    }

    /**
     * Approve a property
     */
    public function approve(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'notes' => 'nullable|string',
            'featured' => 'boolean',
            'is_hotel_promoted' => 'boolean', // ✅ Ajout pour promotion hôtel
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $property = Property::findOrFail($id);

        DB::beginTransaction();

        try {
            $property->update([
                'status' => 'active',
                'is_published' => 1,
                'published_at' => now(),
                'requires_review' => false,
                'moderated_by' => $request->user()->id,
                'moderated_at' => now(),
                'moderation_notes' => $request->notes,
                'bluefin_certified' => $request->featured ?? $property->bluefin_certified,
                'is_hotel_promoted' => $request->is_hotel_promoted ?? false, // ✅ Mise à jour
            ]);

            ModerationLog::create([
                'moderator_id' => $request->user()->id,
                'moderatable_type' => Property::class,
                'moderatable_id' => $property->id,
                'action' => 'approve',
                'reason' => $request->notes,
                'new_data' => [
                    'status' => 'active', 
                    'is_published' => 1,
                    'is_hotel_promoted' => $request->is_hotel_promoted ?? false,
                ],
            ]);

            AdminNotification::create([
                'admin_id' => null,
                'type' => 'property_approved',
                'title' => '✅ Propriété approuvée',
                'message' => "La propriété '{$property->title}' a été approuvée par {$request->user()->full_name}",
                'priority' => 'normal',
                'data' => [
                    'property_id' => $property->id,
                    'property_title' => $property->title,
                    'moderator_name' => $request->user()->full_name,
                    'is_hotel_promoted' => $request->is_hotel_promoted ?? false,
                ],
            ]);

            DB::commit();

            $this->notifyHostApproval($property, $request->notes);

            return response()->json([
                'success' => true, 
                'message' => 'Propriété approuvée et publiée avec succès', 
                'data' => $property
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Toggle hotel promotion for a property
     */
    public function toggleHotelPromotion(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'is_hotel_promoted' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $property = Property::findOrFail($id);

        // Vérifier que la propriété est active
        if ($property->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Seules les propriétés actives peuvent être promues en hôtel.'
            ], 422);
        }

        $property->update([
            'is_hotel_promoted' => $request->is_hotel_promoted
        ]);

        AdminNotification::create([
            'admin_id' => null,
            'type' => 'property_hotel_promotion',
            'title' => $request->is_hotel_promoted ? '⭐ Propriété promue en hôtel' : '🏨 Propriété retirée des hôtels',
            'message' => $request->is_hotel_promoted 
                ? "La propriété '{$property->title}' a été promue dans la section hôtels" 
                : "La propriété '{$property->title}' a été retirée de la section hôtels",
            'priority' => 'normal',
            'data' => [
                'property_id' => $property->id,
                'property_title' => $property->title,
                'is_hotel_promoted' => $request->is_hotel_promoted,
            ],
        ]);

        return response()->json([
            'success' => true,
            'message' => $request->is_hotel_promoted 
                ? 'Propriété promue dans la section hôtels' 
                : 'Propriété retirée de la section hôtels',
            'data' => $property
        ]);
    }

    /**
     * Reject a property
     */
    public function reject(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|min:10',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $property = Property::findOrFail($id);

        DB::beginTransaction();

        try {
            $property->update([
                'status' => 'rejected',
                'is_published' => 0,
                'published_at' => null,
                'requires_review' => false,
                'moderated_by' => $request->user()->id,
                'moderated_at' => now(),
                'moderation_notes' => $request->notes,
                'rejection_reason' => $request->reason,
                'moderation_attempts' => $property->moderation_attempts + 1,
            ]);

            ModerationLog::create([
                'moderator_id' => $request->user()->id,
                'moderatable_type' => Property::class,
                'moderatable_id' => $property->id,
                'action' => 'reject',
                'reason' => $request->reason,
                'notes' => $request->notes,
                'old_data' => ['status' => $property->getOriginal('status')],
                'new_data' => [
                    'status' => 'rejected', 
                    'reason' => $request->reason,
                    'notes' => $request->notes
                ],
            ]);

            AdminNotification::create([
                'admin_id' => null,
                'type' => 'property_rejected',
                'title' => '❌ Propriété rejetée',
                'message' => "La propriété '{$property->title}' a été rejetée par {$request->user()->full_name}",
                'priority' => 'high',
                'data' => [
                    'property_id' => $property->id,
                    'property_title' => $property->title,
                    'moderator_name' => $request->user()->full_name,
                    'reason' => $request->reason,
                ],
            ]);

            DB::commit();

            $this->notifyHostRejection($property, $request->reason, $request->notes);

            return response()->json([
                'success' => true, 
                'message' => 'Propriété rejetée', 
                'data' => $property
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Request modifications for a property
     */
    public function requestModifications(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'feedback' => 'required|string|min:20',
            'changes_needed' => 'required|array',
            'changes_needed.*' => 'string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $property = Property::findOrFail($id);

        $property->update([
            'moderation_notes' => $request->feedback,
            'requires_review' => true,
            'moderation_attempts' => $property->moderation_attempts + 1,
        ]);

        $this->notifyHostModifications($property, $request->feedback, $request->changes_needed);

        return response()->json(['success' => true, 'message' => 'Demande de modifications envoyée']);
    }

    /**
     * Bulk approve properties
     */
    public function bulkApprove(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'property_ids' => 'required|array',
            'property_ids.*' => 'exists:properties,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $properties = Property::whereIn('id', $request->property_ids)
            ->where('status', 'pending')
            ->get();

        $approved = 0;
        foreach ($properties as $property) {
            $property->update([
                'status' => 'active',
                'requires_review' => false,
                'moderated_by' => $request->user()->id,
                'moderated_at' => now(),
            ]);
            $approved++;
        }

        return response()->json(['success' => true, 'message' => "{$approved} propriété(s) approuvée(s)"]);
    }

    /**
     * Get moderation statistics
     */
    public function statistics(Request $request)
    {
        $stats = [
            'today' => [
                'pending' => Property::where('status', 'pending')->whereDate('created_at', today())->count(),
                'approved' => Property::where('moderated_at', '>=', today())->where('status', 'active')->count(),
                'rejected' => Property::where('moderated_at', '>=', today())->where('status', 'rejected')->count(),
            ],
            'this_week' => [
                'pending' => Property::where('status', 'pending')->where('created_at', '>=', now()->startOfWeek())->count(),
                'approved' => Property::where('moderated_at', '>=', now()->startOfWeek())->where('status', 'active')->count(),
                'rejected' => Property::where('moderated_at', '>=', now()->startOfWeek())->where('status', 'rejected')->count(),
            ],
            'average_moderation_time' => $this->getAverageModerationTime(),
            'top_moderators' => $this->getTopModerators(),
        ];
        return response()->json(['success' => true, 'data' => $stats]);
    }

    /**
     * Fix published status for a property
     */
    public function fixPublishedStatus($id)
    {
        $property = Property::findOrFail($id);
        
        if ($property->status === 'active' && $property->is_published === 0) {
            $property->update([
                'is_published' => 1,
                'published_at' => now(),
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Propriété corrigée et publiée',
                'data' => $property
            ]);
        }
        
        return response()->json([
            'success' => false,
            'message' => 'Cette propriété n\'a pas besoin de correction',
            'data' => $property
        ]);
    }

    /**
     * Reassign a property to another host
     */
    public function reassignHost(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'user_type' => 'required|in:voyageur,hote,admin',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $property = Property::findOrFail($id);
        $newOwner = User::findOrFail($request->user_id);

        if ($newOwner->user_type !== 'hote') {
            return response()->json([
                'success' => false,
                'message' => 'Le nouvel utilisateur doit être un hôte.'
            ], 422);
        }

        $oldOwnerId = $property->user_id;

        DB::beginTransaction();

        try {
            $property->update([
                'user_id' => $request->user_id,
            ]);

            ModerationLog::create([
                'moderator_id' => $request->user()->id,
                'moderatable_type' => Property::class,
                'moderatable_id' => $property->id,
                'action' => 'reassign_host',
                'reason' => "Propriété réassignée de l'utilisateur {$oldOwnerId} à l'utilisateur {$request->user_id}",
                'old_data' => ['user_id' => $oldOwnerId],
                'new_data' => ['user_id' => $request->user_id],
            ]);

            AdminNotification::create([
                'admin_id' => null,
                'type' => 'property_reassigned',
                'title' => '🔄 Propriété réassignée',
                'message' => "La propriété '{$property->title}' a été réassignée à {$newOwner->full_name} par {$request->user()->full_name}",
                'priority' => 'normal',
                'data' => [
                    'property_id' => $property->id,
                    'property_title' => $property->title,
                    'old_owner_id' => $oldOwnerId,
                    'new_owner_id' => $request->user_id,
                    'new_owner_name' => $newOwner->full_name,
                ],
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Propriété réassignée avec succès à {$newOwner->full_name}",
                'data' => $property->load('user'),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // ==================== MÉTHODES PRIVÉES ====================

    private function notifyHostApproval($property, $notes)
    {
        $message = "✅ *Félicitations ! Votre annonce est en ligne*\n\n"
            . "🏠 *Propriété:* {$property->title}\n"
            . "📍 *Adresse:* {$property->district}, {$property->city}\n"
            . "💰 *Prix:* " . number_format($property->price_per_night, 0, ',', ' ') . " FCFA/nuit\n\n"
            . "Votre annonce est maintenant visible par tous les voyageurs.\n"
            . "Vous pouvez commencer à recevoir des réservations !\n\n";
        
        if ($notes) {
            $message .= "📝 *Note de l'administrateur:*\n{$notes}\n\n";
        }
        
        $message .= "🔗 Gérez votre annonce: " . env('APP_URL') . "/host/properties/{$property->id}\n\n"
            . "Merci de faire partie de la communauté Bluefin ! 🎉";
        
        $this->notificationService->sendWhatsApp($property->user->phone, $message);
    }

    private function notifyHostRejection($property, $reason, $notes = null)
    {
        $message = "❌ *Votre annonce n'a pas été approuvée*\n\n"
            . "🏠 *Propriété:* {$property->title}\n"
            . "📍 *Adresse:* {$property->district}, {$property->city}\n\n"
            . "📋 *Raison du rejet:*\n{$reason}\n\n";
        
        if ($notes) {
            $message .= "📝 *Détails supplémentaires:*\n{$notes}\n\n";
        }
        
        $message .= "🔧 *Comment procéder:*\n"
            . "1. Connectez-vous à votre espace hôte\n"
            . "2. Modifiez votre annonce selon les recommandations\n"
            . "3. Soumettez à nouveau pour validation\n\n"
            . "💡 Besoin d'aide ? Contactez notre support.\n\n"
            . "Nous sommes là pour vous aider à améliorer votre annonce ! 💪";
        
        $this->notificationService->sendWhatsApp($property->user->phone, $message);
    }

    private function notifyHostModifications($property, $feedback, $changes)
    {
        $changesList = implode("\n", array_map(fn($c) => "• {$c}", $changes));
        
        $message = "📝 *Modifications demandées pour votre annonce*\n\n"
            . "🏠 *Propriété:* {$property->title}\n\n"
            . "🔧 *Changements à apporter:*\n{$changesList}\n\n"
            . "💬 *Commentaires détaillés:*\n{$feedback}\n\n"
            . "📝 Pour modifier votre annonce, connectez-vous à votre espace hôte.\n\n"
            . "Une fois les modifications effectuées, soumettez à nouveau pour validation.\n\n"
            . "Merci de votre collaboration ! 🤝";
        
        $this->notificationService->sendWhatsApp($property->user->phone, $message);
    }

    private function getAverageModerationTime()
    {
        $avgHours = Property::whereNotNull('moderated_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, created_at, moderated_at)) as avg_hours')
            ->value('avg_hours');
        return round($avgHours ?? 0, 1);
    }

    private function getTopModerators()
    {
        return ModerationLog::select('moderator_id')
            ->with('moderator:id,first_name,last_name')
            ->selectRaw('COUNT(*) as total')
            ->groupBy('moderator_id')
            ->orderBy('total', 'desc')
            ->limit(5)
            ->get();
    }
}