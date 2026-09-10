<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PropertyPhoto extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
        'photo_url',
        'photo_path',
        'order',
        'is_cover',
    ];

    protected $appends = ['full_url'];

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    /**
     * Accesseur pour obtenir l'URL complète de la photo
     */
    public function getFullUrlAttribute()
    {
        // Priorité à photo_path (stockage local)
        if (!empty($this->photo_path)) {
            return $this->buildUrl($this->photo_path);
        }

        // Fallback sur photo_url
        if (!empty($this->photo_url)) {
            if (filter_var($this->photo_url, FILTER_VALIDATE_URL)) {
                // Si c'est une URL HTTP/HTTPS, la retourner directement
                // mais remplacer l'ancien domaine par le nouveau si nécessaire
                if (strpos($this->photo_url, 'api.bluefin-immo.com') !== false) {
                    // Remplacer l'ancienne URL par la nouvelle
                    $filename = basename($this->photo_url);
                    return $this->buildUrl($filename);
                }
                return $this->photo_url;
            }
            return $this->buildUrl($this->photo_url);
        }

        return null;
    }

    /**
     * Construire l'URL complète vers le storage public
     */
    protected function buildUrl($path)
    {
        if (!$path) {
            return null;
        }
        
        // Extraire uniquement le nom du fichier du chemin
        $filename = basename($path);
        
        // Récupérer le property_id pour construire le chemin
        $propertyId = $this->property_id;
        
        if ($propertyId && $filename) {
            // ✅ Chemin correct vers le storage public
            return "https://api.bluefin-immo.com/storage/properties/{$propertyId}/{$filename}";
        }
        
        // Fallback: utiliser le chemin nettoyé
        $cleanPath = ltrim($path, '/');
        $cleanPath = preg_replace(
            '/^\/?(api\/storage\/photos\/|storage\/photos\/|storage\/app\/public\/|storage\/|photos\/|properties\/\d+\/)/', 
            '', 
            $cleanPath
        );
        
        return "https://api.bluefin-immo.com/storage/properties/{$propertyId}/{$cleanPath}";
    }

    /**
     * Accesseur pour compatibilité
     */
    public function getPhotoUrlAttribute($value)
    {
        if (empty($value)) {
            return null;
        }
        
        if (filter_var($value, FILTER_VALIDATE_URL)) {
            // Remplacer l'ancien domaine par le nouveau si nécessaire
            if (strpos($value, 'api.bluefin-immo.com') !== false) {
                return $this->getFullUrlAttribute();
            }
            return $value;
        }
        
        return $this->buildUrl($value);
    }
}
