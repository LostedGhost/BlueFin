<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PropertyController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Host\CalendarController;
use App\Http\Controllers\Api\Host\PayoutController as HostPayoutController;
use App\Http\Controllers\Api\Traveler\TravelerAuthController;
use App\Http\Controllers\Api\Traveler\TravelerDashboardController;
use App\Http\Controllers\Api\Traveler\TravelerBookingController;
use App\Http\Controllers\Api\Traveler\TravelerMessageController;
use App\Http\Controllers\Api\Traveler\TravelerCalendarController;
use App\Http\Controllers\Api\Traveler\TravelerFavoriteController;
use App\Http\Controllers\Api\Host\HostAuthController;
use App\Http\Controllers\Api\Host\HostDashboardController;
use App\Http\Controllers\Api\Host\HostPropertyController;
use App\Http\Controllers\Api\Host\HostMessageController;
use App\Http\Controllers\Api\Host\HostBookingController;
use App\Http\Controllers\Api\Host\HostStatisticsController;
use App\Http\Controllers\Api\Host\HostProfileController;
use App\Http\Controllers\Api\Host\HostFavoriteController;
use App\Http\Controllers\Api\Admin\AdminAuthController;
use App\Http\Controllers\Api\Admin\PropertyModerationController;
use App\Http\Controllers\Api\Admin\UserManagementController;
use App\Http\Controllers\Api\Admin\IdentityDocumentController;
use App\Http\Controllers\Api\Admin\BookingMonitoringController;
use App\Http\Controllers\Api\Admin\PaymentMonitoringController;
use App\Http\Controllers\Api\Admin\MessageMonitoringController;
use App\Http\Controllers\Api\Admin\ReportController;
use App\Http\Controllers\Api\Admin\SettingsController;
use App\Http\Controllers\Api\ExperienceController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\Host\HostExperienceController;
use App\Http\Controllers\Api\Host\HostServiceController;
use App\Http\Controllers\Api\Host\HostUploadController;
use App\Http\Controllers\Api\Traveler\ExperienceBookingController;
use App\Http\Controllers\Api\Traveler\ServiceBookingController;
use App\Http\Controllers\Api\Admin\ExperienceModerationController;
use App\Http\Controllers\Api\Admin\ServiceModerationController;

/*
|--------------------------------------------------------------------------
| API Routes - Bluefin-Immo
|--------------------------------------------------------------------------
*/

// Route pour les images (hors V1)
Route::get('/property-image/{id}/{filename}', function ($id, $filename) {
    // Neutralise toute séquence "../" et n'autorise que des identifiants/noms de
    // fichiers simples, pour empêcher une lecture de fichier arbitraire sur le
    // serveur (path traversal) — voir audit sécurité.
    if (!ctype_digit((string) $id)) {
        abort(404);
    }

    $safeFilename = basename($filename);
    if (!preg_match('/^[\w.-]+\.(jpe?g|png|webp|gif)$/i', $safeFilename)) {
        abort(404);
    }

    $path = storage_path("app/public/properties/{$id}/{$safeFilename}");

    if (!file_exists($path)) {
        abort(404);
    }

    return response()->file($path, [
        'Content-Type' => mime_content_type($path),
        'Access-Control-Allow-Origin' => '*',
        'Cache-Control' => 'public, max-age=86400'
    ]);
})->name('property.image');

// ==================== ROUTES HORS V1 (AUTHENTIFICATION PUBLIQUE) ====================
// Authentification voyageur
Route::prefix('traveler')->middleware('throttle:auth')->group(function () {
    Route::post('/register', [TravelerAuthController::class, 'register']);
    Route::post('/login', [TravelerAuthController::class, 'login']);
    Route::post('/login-otp', [TravelerAuthController::class, 'loginWithOTP']);
    Route::post('/verify-otp', [TravelerAuthController::class, 'verifyOTP']);
});

// Authentification hôte
Route::prefix('host')->middleware('throttle:auth')->group(function () {
    Route::post('/register', [HostAuthController::class, 'register']);
    Route::post('/login', [HostAuthController::class, 'login']);
    Route::post('/login-otp', [HostAuthController::class, 'loginWithOTP']);
    Route::post('/verify-otp', [HostAuthController::class, 'verifyOTP']);
});

// ==================== ROUTES ADMIN PUBLIQUES ====================
// login-otp/verify-otp retirées : AdminAuthController ne définit pas ces
// méthodes (routes cassées — 500 "method does not exist" si appelées) et
// aucun code frontend ne les appelle. À réintroduire seulement si un vrai
// flux OTP admin est implémenté.
Route::prefix('admin')->middleware('throttle:auth')->group(function () {
    Route::post('/login', [AdminAuthController::class, 'login']);
});

// ==================== ROUTES V1 (API versionnées) ====================
Route::prefix('v1')->group(function () {
    
    // Routes publiques
    Route::prefix('auth')->middleware('throttle:auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/login-otp', [AuthController::class, 'loginWithOTP']);
        Route::post('/verify-otp', [AuthController::class, 'verifyOTP']);
    });
    
    Route::get('/properties', [PropertyController::class, 'index']);
    Route::get('/properties/{id}', [PropertyController::class, 'show']);
    Route::post('/properties/{id}/availability', [PropertyController::class, 'checkAvailability']);
    
    Route::get('/search', [SearchController::class, 'search']);
    Route::get('/search/autocomplete', [SearchController::class, 'autocomplete']);
    Route::get('/search/popular-destinations', [SearchController::class, 'popularDestinations']);
    Route::get('/search/popular-districts/{city}', [SearchController::class, 'popularDistricts']);
    Route::post('/search/advanced', [SearchController::class, 'advancedSearch']);
    Route::post('/search/map', [SearchController::class, 'mapSearch']);
    
    Route::get('/reviews/property/{propertyId}', [ReviewController::class, 'getPropertyReviews']);

    // Expériences (public)
    Route::get('/experiences', [ExperienceController::class, 'index']);
    Route::get('/experiences/featured', [ExperienceController::class, 'featured']);
    Route::get('/experiences/{id}', [ExperienceController::class, 'show']);

    // Services (public)
    Route::get('/services', [ServiceController::class, 'index']);
    Route::get('/services/featured', [ServiceController::class, 'featured']);
    Route::get('/services/category/{category}', [ServiceController::class, 'byCategory']);
    Route::get('/services/type/{serviceType}', [ServiceController::class, 'byType']);
    Route::get('/services/{id}', [ServiceController::class, 'show']);

    Route::post('/webhooks/payment', [PaymentController::class, 'webhook']);
    Route::post('/webhooks/mobile-money', [PaymentController::class, 'mobileMoneyWebhook']);
    
    // Routes protégées (authentification requise)
    Route::middleware('auth:sanctum')->group(function () {
        
        // Authentification générale
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
        Route::post('/auth/verify-identity', [AuthController::class, 'verifyIdentity']);
        
        // Propriétés (CRUD)
        Route::post('/properties', [PropertyController::class, 'store']);
        Route::put('/properties/{id}', [PropertyController::class, 'update']);
        Route::delete('/properties/{id}', [PropertyController::class, 'destroy']);
        Route::post('/properties/{id}/photos', [PropertyController::class, 'uploadPhotos']);
        Route::delete('/properties/{propertyId}/photos/{photoId}', [PropertyController::class, 'deletePhoto']);
        Route::put('/properties/{propertyId}/photos/{photoId}/cover', [PropertyController::class, 'setCoverPhoto']);
        
        // Réservations
        Route::post('/bookings', [BookingController::class, 'store'])->middleware('throttle.bookings');
        Route::get('/bookings/my', [BookingController::class, 'getUserBookings']);
        Route::get('/bookings/host', [BookingController::class, 'getHostBookings']);
        Route::get('/bookings/{id}', [BookingController::class, 'show']);
        Route::post('/bookings/{id}/confirm-payment', [BookingController::class, 'confirmPayment']);
        Route::post('/bookings/{id}/cancel', [BookingController::class, 'cancel']);
        Route::post('/bookings/{id}/checkin', [BookingController::class, 'checkIn']);
        Route::post('/bookings/{id}/checkout', [BookingController::class, 'checkOut']);
        
        // Avis
        Route::post('/reviews', [ReviewController::class, 'store']);
        Route::post('/reviews/host', [ReviewController::class, 'storeHostReview']);
        Route::post('/reviews/{id}/response', [ReviewController::class, 'addHostResponse']);
        Route::get('/reviews/my', [ReviewController::class, 'getUserReviews']);
        Route::get('/reviews/host', [ReviewController::class, 'getHostReviews']);
        
        // Messages généraux
        Route::get('/messages/conversations', [MessageController::class, 'getConversations']);
        Route::get('/messages/booking/{bookingId}', [MessageController::class, 'getMessages']);
        Route::post('/messages', [MessageController::class, 'sendMessage']);
        Route::post('/messages/inquiry', [MessageController::class, 'sendInquiryMessage']);
        Route::post('/messages/{id}/read', [MessageController::class, 'markAsRead']);
        Route::delete('/messages/{id}', [MessageController::class, 'deleteMessage']);
        Route::get('/messages/unread/count', [MessageController::class, 'getUnreadCount']);
        
        // Favoris généraux
        Route::get('/favorites', [FavoriteController::class, 'index']);
        Route::get('/favorites/lists', [FavoriteController::class, 'getLists']);
        Route::post('/favorites/lists', [FavoriteController::class, 'createList']);
        Route::delete('/favorites/lists/{listName}', [FavoriteController::class, 'deleteList']);
        Route::post('/favorites/{propertyId}/toggle', [FavoriteController::class, 'toggle']);
        Route::get('/favorites/{propertyId}/check', [FavoriteController::class, 'check']);
        Route::post('/favorites/{favoriteId}/note', [FavoriteController::class, 'addNote']);
        
        // Paiements
        Route::get('/payments/history', [PaymentController::class, 'getPaymentHistory']);
        Route::post('/payments/withdraw', [PaymentController::class, 'requestWithdrawal']);
        Route::get('/payments/payouts', [PaymentController::class, 'getPayoutsHistory']);
        Route::get('/payments/balance', [PaymentController::class, 'getBalance']);
        
        // ==================== ROUTES VOYAGEUR PROTÉGÉES ====================
        Route::prefix('traveler')->middleware(['traveler'])->group(function () {
            Route::post('/logout', [TravelerAuthController::class, 'logout']);
            Route::get('/dashboard', [TravelerDashboardController::class, 'index']);
            Route::get('/bookings', [TravelerBookingController::class, 'index']);
            Route::get('/bookings/{id}', [TravelerBookingController::class, 'show']);
            Route::post('/bookings/{id}/cancel', [TravelerBookingController::class, 'cancel']);
            Route::get('/messages/conversations', [TravelerMessageController::class, 'getConversations']);
            Route::get('/messages/booking/{bookingId}', [TravelerMessageController::class, 'getMessages']);
            Route::post('/messages/booking/{bookingId}', [TravelerMessageController::class, 'sendMessage']);
            Route::post('/messages/inquiry', [TravelerMessageController::class, 'sendInquiry']);
            Route::post('/messages/{messageId}/read', [TravelerMessageController::class, 'markAsRead']);
            Route::post('/messages/conversation/{bookingId}/read', [TravelerMessageController::class, 'markConversationAsRead']);
            Route::get('/messages/unread/count', [TravelerMessageController::class, 'getUnreadCount']);
            Route::get('/calendar/property/{propertyId}', [TravelerCalendarController::class, 'getPropertyCalendar']);
            Route::get('/calendar/property/{propertyId}/months', [TravelerCalendarController::class, 'getMonthsCalendar']);
            Route::get('/calendar/property/{propertyId}/available-dates', [TravelerCalendarController::class, 'getAvailableDates']);
            Route::post('/calendar/property/{propertyId}/check', [TravelerCalendarController::class, 'checkDateRange']);
            
            Route::get('/favorites', [TravelerFavoriteController::class, 'index']);
            Route::get('/favorites/lists', [TravelerFavoriteController::class, 'getLists']);
            Route::post('/favorites/lists', [TravelerFavoriteController::class, 'createList']);
            Route::delete('/favorites/lists/{listName}', [TravelerFavoriteController::class, 'deleteList']);
            Route::post('/favorites/{propertyId}/toggle', [TravelerFavoriteController::class, 'toggle']);
            Route::get('/favorites/{propertyId}/check', [TravelerFavoriteController::class, 'check']);
            Route::post('/favorites/{favoriteId}/move', [TravelerFavoriteController::class, 'moveToList']);
            Route::put('/favorites/{favoriteId}/notes', [TravelerFavoriteController::class, 'updateNotes']);
            
            Route::get('/profile', [TravelerDashboardController::class, 'showProfile']);
            Route::put('/profile', [TravelerDashboardController::class, 'updateProfile']);
            Route::post('/profile/photo', [TravelerDashboardController::class, 'uploadPhoto']);
            Route::post('/profile/change-password', [TravelerDashboardController::class, 'changePassword']);
            Route::delete('/profile/account', [TravelerDashboardController::class, 'deleteAccount']);

            Route::post('/experiences/{experienceId}/book', [ExperienceBookingController::class, 'book']);
            Route::post('/services/{serviceId}/book', [ServiceBookingController::class, 'book']);
        });
        
        // ==================== ROUTES HÔTE PROTÉGÉES ====================
        Route::prefix('host')->middleware(['host'])->group(function () {
            Route::post('/become-host', [HostAuthController::class, 'becomeHost']);
            Route::post('/logout', [HostAuthController::class, 'logout']);
            Route::post('/upload-identity', [HostAuthController::class, 'uploadIdentity']);
            Route::get('/verification-status', [HostAuthController::class, 'verificationStatus']);
            Route::get('/dashboard', [HostDashboardController::class, 'index']);
            Route::get('/properties', [HostPropertyController::class, 'index']);
            Route::post('/properties', [HostPropertyController::class, 'store']);
            Route::get('/properties/{id}', [HostPropertyController::class, 'show']);
            Route::put('/properties/{id}', [HostPropertyController::class, 'update']);
            Route::delete('/properties/{id}', [HostPropertyController::class, 'destroy']);
            Route::post('/properties/{id}/photos', [HostPropertyController::class, 'addPhotos']);
            Route::delete('/properties/{propertyId}/photos/{photoId}', [HostPropertyController::class, 'deletePhoto']);
            Route::put('/properties/{propertyId}/photos/{photoId}/cover', [HostPropertyController::class, 'setCoverPhoto']);
            Route::put('/properties/{id}/amenities', [HostPropertyController::class, 'updateAmenities']);
            Route::post('/properties/{id}/submit', [HostPropertyController::class, 'submitForReview']);
            Route::get('/statistics', [HostStatisticsController::class, 'index']);
            Route::get('/statistics/daily', [HostStatisticsController::class, 'dailyStats']);
            Route::get('/statistics/properties', [HostStatisticsController::class, 'propertyStats']);
            Route::get('/statistics/properties/{propertyId}/views', [HostStatisticsController::class, 'viewsDetails']);
            Route::get('/statistics/export', [HostStatisticsController::class, 'exportStats']);
            Route::get('/messages/conversations', [HostMessageController::class, 'getConversations']);
            Route::get('/messages/booking/{bookingId}', [HostMessageController::class, 'getMessages']);
            Route::post('/messages/booking/{bookingId}', [HostMessageController::class, 'sendMessage']);
            Route::get('/messages/quick-replies', [HostMessageController::class, 'getQuickReplies']);
            Route::post('/messages/conversation/{bookingId}/read', [HostMessageController::class, 'markConversationAsRead']);
            Route::get('/messages/unread/count', [HostMessageController::class, 'getUnreadCount']);
            Route::get('/bookings', [HostBookingController::class, 'index']);
            Route::get('/bookings/{id}', [HostBookingController::class, 'show']);
            Route::post('/bookings/{id}/confirm', [HostBookingController::class, 'confirm']);
            Route::post('/bookings/{id}/decline', [HostBookingController::class, 'decline']);
            Route::post('/bookings/{id}/checkin', [HostBookingController::class, 'checkIn']);
            Route::post('/bookings/{id}/checkout', [HostBookingController::class, 'checkOut']);
            Route::get('/calendar/{propertyId}', [CalendarController::class, 'index']);
            Route::post('/calendar/{propertyId}/availability', [CalendarController::class, 'updateAvailability']);
            Route::post('/calendar/{propertyId}/special-price', [CalendarController::class, 'updateSpecialPrice']);
            Route::get('/calendar/{propertyId}/export', [CalendarController::class, 'exportCalendar']);
            Route::post('/calendar/{propertyId}/sync', [CalendarController::class, 'syncCalendar']);
            Route::get('/payouts', [HostPayoutController::class, 'index']);
            Route::post('/payouts/request', [HostPayoutController::class, 'requestPayout']);
            Route::get('/payouts/balance', [HostPayoutController::class, 'getBalance']);
            Route::get('/profile', [HostProfileController::class, 'show']);
            Route::put('/profile', [HostProfileController::class, 'update']);
            Route::post('/profile/photo', [HostProfileController::class, 'uploadPhoto']);
            Route::post('/profile/change-password', [HostProfileController::class, 'changePassword']);
            Route::get('/profile/payment-info', [HostProfileController::class, 'getPaymentInfo']);
            Route::put('/profile/payment-info', [HostProfileController::class, 'updatePaymentInfo']);
            
            Route::prefix('favorites')->group(function () {
                Route::get('/', [HostFavoriteController::class, 'index']);
                Route::get('/grouped-by-property', [HostFavoriteController::class, 'getGroupedByProperty']);
                Route::get('/property/{propertyId}', [HostFavoriteController::class, 'getPropertyFavorites']);
                Route::get('/statistics', [HostFavoriteController::class, 'getStatistics']);
                Route::get('/export', [HostFavoriteController::class, 'exportFavorites']);
            });

            Route::post('/upload-images', [HostUploadController::class, 'store']);

            // Expériences
            Route::get('/experiences', [HostExperienceController::class, 'index']);
            Route::post('/experiences', [HostExperienceController::class, 'store']);
            Route::get('/experiences/messages', [HostExperienceController::class, 'getConversations']);
            Route::get('/experiences/messages/{experienceId}/{guestId}', [HostExperienceController::class, 'getMessages']);
            Route::post('/experiences/messages/{experienceId}/{guestId}', [HostExperienceController::class, 'sendMessage']);
            Route::get('/experiences/{id}', [HostExperienceController::class, 'show']);
            Route::put('/experiences/{id}', [HostExperienceController::class, 'update']);
            Route::delete('/experiences/{id}', [HostExperienceController::class, 'destroy']);
            Route::get('/experiences/{id}/availability', [HostExperienceController::class, 'getAvailability']);
            Route::put('/experiences/{id}/availability', [HostExperienceController::class, 'setAvailability']);

            // Services
            Route::get('/services', [HostServiceController::class, 'index']);
            Route::post('/services', [HostServiceController::class, 'store']);
            Route::get('/services/dashboard', [HostServiceController::class, 'dashboard']);
            Route::get('/services/{id}', [HostServiceController::class, 'show']);
            Route::put('/services/{id}', [HostServiceController::class, 'update']);
            Route::delete('/services/{id}', [HostServiceController::class, 'destroy']);
        });
        
        // ==================== ROUTES ADMIN PROTÉGÉES ====================
        Route::prefix('admin')->middleware(['admin'])->group(function () {
            Route::get('/dashboard', [DashboardController::class, 'index']);
            Route::get('/notifications', [DashboardController::class, 'notifications']);
            Route::post('/notifications/{id}/read', [DashboardController::class, 'markNotificationRead']);
            Route::post('/notifications/read-all', [DashboardController::class, 'markAllRead']);
            
            // ✅ GROUPEMENT CORRECT DES ROUTES PROPERTIES
            Route::prefix('properties')->group(function () {
                Route::get('/pending', [PropertyModerationController::class, 'pendingProperties']);
                Route::get('/moderation/stats', [PropertyModerationController::class, 'statistics']);
                Route::get('/{id}/moderate', [PropertyModerationController::class, 'show']);
                Route::post('/{id}/approve', [PropertyModerationController::class, 'approve']);
                Route::post('/{id}/reject', [PropertyModerationController::class, 'reject']);
                Route::post('/{id}/request-modifications', [PropertyModerationController::class, 'requestModifications']);
                Route::post('/bulk-approve', [PropertyModerationController::class, 'bulkApprove']);
                Route::post('/{id}/fix-publish', [PropertyModerationController::class, 'fixPublishedStatus']);
                Route::post('/{id}/reassign-host', [PropertyModerationController::class, 'reassignHost']);
                // ✅ ROUTE CORRECTEMENT PLACÉE
                Route::patch('/{id}/promote-hotel', [PropertyModerationController::class, 'toggleHotelPromotion']);
            });
            
            Route::prefix('experiences')->group(function () {
                Route::get('/', [ExperienceModerationController::class, 'index']);
                Route::get('/{id}', [ExperienceModerationController::class, 'show']);
                Route::post('/{id}/approve', [ExperienceModerationController::class, 'approve']);
                Route::post('/{id}/reject', [ExperienceModerationController::class, 'reject']);
            });

            Route::prefix('services')->group(function () {
                Route::get('/', [ServiceModerationController::class, 'index']);
                Route::get('/{id}', [ServiceModerationController::class, 'show']);
                Route::post('/{id}/approve', [ServiceModerationController::class, 'approve']);
                Route::post('/{id}/reject', [ServiceModerationController::class, 'reject']);
            });

            Route::apiResource('users', UserManagementController::class)->only(['index', 'show', 'destroy']);
            Route::post('/users/{id}/verify', [UserManagementController::class, 'verify']);
            // Diffuse la pièce d'identité elle-même : aucune URL du document
            // n'est renvoyée au navigateur. Chaque consultation est journalisée.
            Route::get('/users/{id}/identity-document', [IdentityDocumentController::class, 'show']);
            Route::post('/users/{id}/suspend', [UserManagementController::class, 'suspend']);
            Route::post('/users/{id}/activate', [UserManagementController::class, 'activate']);
            
            Route::prefix('bookings')->group(function () {
                Route::get('/', [BookingMonitoringController::class, 'index']);
                Route::get('/{id}', [BookingMonitoringController::class, 'show']);
                Route::post('/{id}/cancel', [BookingMonitoringController::class, 'cancel']);
            });
            
            Route::prefix('payments')->group(function () {
                Route::get('/', [PaymentMonitoringController::class, 'index']);
                Route::get('/{id}', [PaymentMonitoringController::class, 'show']);
                Route::post('/{id}/refund', [PaymentMonitoringController::class, 'refund']);
            });
            
            Route::prefix('messages')->group(function () {
                Route::get('/', [MessageMonitoringController::class, 'index']);
                Route::get('/conversation/{user1}/{user2}', [MessageMonitoringController::class, 'getConversation']);
                Route::get('/suspicious', [MessageMonitoringController::class, 'suspiciousConversations']);
            });
            
            Route::prefix('reports')->group(function () {
                Route::get('/summary', [ReportController::class, 'summary']);
                Route::get('/bookings', [ReportController::class, 'bookings']);
                Route::get('/properties', [ReportController::class, 'properties']);
                Route::get('/users', [ReportController::class, 'users']);
                // /export/{type} retirée : ReportController::export n'existe pas
                // (route cassée) et seul le code frontend mort (pages/admin/AdminReportsPage.tsx,
                // jamais chargé par App.tsx) l'appelait. À réimplémenter si un
                // vrai export est nécessaire.
            });

            // /settings retirée : SettingsController est une classe vide (index/update
            // inexistants, route cassée) et rien côté frontend ne l'appelle réellement
            // (admin.service.ts::getSettings/updateSettings ne sont utilisés par
            // aucune page). À réimplémenter avec une vraie validation si un panneau
            // de réglages plateforme est construit.
        });
        
    }); 
}); 