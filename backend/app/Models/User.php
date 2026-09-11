<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes, HasRoles;

    protected $table = 'users';

    protected $fillable = [
        // Identifiants
        'email', 'phone', 'password',
        
        // Informations personnelles
        'first_name', 'last_name', 'profile_photo', 'bio', 'languages',
        'country', 'city', 'address', 'birth_date',
        
        // Type et rôle
        'user_type', 'admin_role', 'admin_permissions',
        
        // Vérification
        'verification_status', 'identity_document', 'identity_document_type',
        'verified_at', 'verified_by',
        
        // Statut du compte
        'is_active', 'suspended_until', 'suspension_reason',
        
        // Vérifications
        'email_verified_at', 'phone_verified_at',
        
        // Préférences
        'receive_email_notifications', 'receive_whatsapp_notifications',
        'receive_sms_notifications', 'receive_push_notifications',
        
        // Activité
        'last_login_at', 'last_admin_activity', 'last_login_ip', 'last_login_device',
        
        // Statistiques
        'total_bookings', 'total_reviews', 'average_rating_as_host',
        'average_rating_as_guest', 'total_properties',
        
        // Stripe
        'stripe_account_id', 'stripe_onboarding_completed',
    ];

    protected $hidden = [
        'password', 'remember_token', 'google_id',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'phone_verified_at' => 'datetime',
        'verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'last_admin_activity' => 'datetime',
        'suspended_until' => 'datetime',
        'birth_date' => 'date',
        'languages' => 'array',
        'admin_permissions' => 'array',
        'is_active' => 'boolean',
        'receive_email_notifications' => 'boolean',
        'receive_whatsapp_notifications' => 'boolean',
        'receive_sms_notifications' => 'boolean',
        'receive_push_notifications' => 'boolean',
        'stripe_onboarding_completed' => 'boolean',
        'deleted_at' => 'datetime',
    ];

    // Relations
    public function properties()
    {
        return $this->hasMany(Property::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function experiences()
    {
        return $this->hasMany(Experience::class, 'host_id');
    }

    public function services()
    {
        return $this->hasMany(Service::class, 'host_id');
    }

    public function experienceBookings()
    {
        return $this->hasMany(ExperienceBooking::class);
    }

    public function serviceBookings()
    {
        return $this->hasMany(ServiceBooking::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function sentMessages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function receivedMessages()
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }

    public function favorites()
    {
        return $this->belongsToMany(Property::class, 'favorites')->withTimestamps();
    }

    public function payoutAccount()
    {
        return $this->hasOne(HostPayoutAccount::class);
    }

    public function payouts()
    {
        return $this->hasMany(Payout::class);
    }

    public function devices()
    {
        return $this->hasMany(UserDevice::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function adminNotifications()
    {
        return $this->hasMany(AdminNotification::class, 'admin_id');
    }

    public function moderatedProperties()
    {
        return $this->hasMany(Property::class, 'moderated_by');
    }

    public function verifiedUsers()
    {
        return $this->hasMany(User::class, 'verified_by');
    }

    // Accessors
    public function getFullNameAttribute()
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function getProfilePhotoUrlAttribute()
    {
        if (blank($this->profile_photo)) {
            return 'https://ui-avatars.com/api/?name='.urlencode($this->full_name).'&color=7F9CF5&background=EBF4FF';
        }

        // Une photo stockée hors du serveur (Cloudinary) est déjà une URL
        // absolue : la préfixer produirait « …/storage/https://res.cloudinary… ».
        if (str_starts_with($this->profile_photo, 'http://') || str_starts_with($this->profile_photo, 'https://')) {
            return $this->profile_photo;
        }

        return asset('storage/'.$this->profile_photo);
    }

    public function getIsAdminAttribute()
    {
        return $this->user_type === 'admin';
    }

    public function getIsHostAttribute()
    {
        return $this->user_type === 'hote';
    }

    public function getIsSuperAdminAttribute()
    {
        return $this->admin_role === 'super_admin';
    }

    public function getIsSuspendedAttribute()
    {
        return $this->suspended_until && now()->lessThan($this->suspended_until);
    }

    // Scopes
    public function scopeVerified($query)
    {
        return $query->where('verification_status', 'verified');
    }

    public function scopeHosts($query)
    {
        return $query->where('user_type', 'hote');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeAdmins($query)
    {
        return $query->where('user_type', 'admin');
    }

    // Methods
    public function canModerateProperties()
    {
        if (!$this->isAdmin) return false;
        if ($this->isSuperAdmin) return true;
        
        $permissions = $this->admin_permissions ?? [];
        return in_array('moderate_properties', $permissions);
    }

    public function canViewFinanceData()
    {
        if (!$this->isAdmin) return false;
        if ($this->isSuperAdmin) return true;
        
        $permissions = $this->admin_permissions ?? [];
        return in_array('view_finance', $permissions);
    }

    public function canManageUsers()
    {
        if (!$this->isAdmin) return false;
        if ($this->isSuperAdmin) return true;
        
        $permissions = $this->admin_permissions ?? [];
        return in_array('manage_users', $permissions);
    }

    public function getUnreadMessagesCount()
    {
        return $this->receivedMessages()->where('is_read', false)->count();
    }

    public function getAvailableBalance()
    {
        return app(\App\Services\HostEarnings::class)->owed($this);
    }

    public function hasCompletedVerification()
    {
        return $this->verification_status === 'verified' && 
               $this->email_verified_at && 
               $this->phone_verified_at;
    }

    public function updateStatistics()
    {
        $this->total_properties = $this->properties()->count();
        $this->total_bookings = $this->bookings()->count();
        $this->total_reviews = $this->reviews()->count();
        
        $this->average_rating_as_host = $this->properties()
            ->with('reviews')
            ->get()
            ->average(function($property) {
                return $property->reviews->avg('rating');
            }) ?? 0;
        
        $this->save();
    }

    
}