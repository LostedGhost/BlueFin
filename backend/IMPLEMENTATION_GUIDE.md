# Guide d'Implémentation - Notifications Email et Affichage Images

## 🎯 Fonctionnalités Implémentées

### 1. Notifications Email pour l'Admin (Propriété Soumise)
L'admin reçoit un email HTML lorsqu'un hôte soumet une propriété pour examen.

### 2. Affichage des Images de Propriété
Les images uploadées par les hôtes s'affichent correctement dans le frontend.

---

## 📋 Architecture Implémentée

### Flux de Notification Email

```
1. Hôte soumet propriété via POST /api/v1/host/properties/{id}/submit
   ↓
2. HostPropertyController déclenche PropertySubmittedForApproval event
   ↓
3. SendAdminPropertyNotification listener reçoit l'événement
   ↓
4. Pour chaque admin :
   - Crée un enregistrement AdminNotification en DB
   - Envoie notification WhatsApp (si enabled)
   - Envoie email HTML (si enabled)
   ↓
5. Email envoyé via Laravel Mail (voir config/mail.php)
```

### Structure des Fichiers Modifiés

```
📁 app/
├── 📁 Listeners/
│   └── SendAdminPropertyNotification.php (MODIFIÉ)
│       - Récupère la première photo de la propriété
│       - Passe les données formatées au template email
│
└── 📁 Services/
    └── NotificationService.php (EXISTANT)
        - sendEmail() utilise Laravel Mail
        - Utilise config mail.php

📁 resources/
└── 📁 views/
    └── 📁 emails/
        └── 📁 admin/
            └── property_submitted.blade.php (CRÉÉ)
                - Template HTML professionnel
                - Affiche détails propriété + image
                - Lien d'action pour modérer
```

---

## 🔧 Configuration Requise

### 1. Authentification Email
Vérifiez que `config/mail.php` et votre `.env` sont configurés :

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io  # ou votre serveur SMTP
MAIL_PORT=465
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@bluefin.local
MAIL_FROM_NAME="Bluefin Immo"
```

### 2. Permissions des Admins
L'admin doit avoir ces colonnes dans la table `users` :
- `receive_email_notifications` (boolean, default: true)
- `receive_whatsapp_notifications` (boolean, default: false)

### 3. Stockage des Images
✓ Lien symbolique créé : `public/storage` → `storage/app/public`
✓ Configuration automatique via Laravel

---

## 🧪 Tests d'Intégration

### Test 1: Vérifier le Stockage des Images

```bash
# Le lien symbolique doit exister
ls -la public/storage

# Doit retourner une image avec chemin correct
php test_image_urls.php
```

### Test 2: Tester la Soumission de Propriété

**Via cURL** :
```bash
curl -X POST http://localhost:8000/api/v1/host/properties/1/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Via API Client** :
```
POST /api/v1/host/properties/1/submit
Authorization: Bearer {host_token}
```

### Test 3: Vérifier les Logs

```bash
# Vérifier que l'email a été envoyé
tail -f storage/logs/laravel.log
```

### Test 4: Tester l'Email Directement

```php
// Dans tinker ou un contrôleur de test
php artisan tinker

>>> $admin = \App\Models\User::where('user_type', 'admin')->first();
>>> $property = \App\Models\Property::first();
>>> event(new \App\Events\PropertySubmittedForApproval($property));
```

---

## 📧 Template Email

Le template email `resources/views/emails/admin/property_submitted.blade.php` inclut :

✓ Header avec titre accrocheur
✓ Détails de la propriété (titre, hôte, localisation)
✓ Image de couverture (première photo)
✓ Prix par nuit
✓ Description
✓ Lien d'action pour examiner
✓ Footer professionnel

### Variables du Template

```php
// Le listener passe ces données :
[
    'property' => [
        'id' => $property->id,
        'title' => $property->title,
        'description' => $property->description,
        'host_name' => $property->user->full_name,
        'host_phone' => $property->user->phone,
        'city' => $property->city,
        'district' => $property->district,
        'property_type' => 'Villa',  // label traduit
        'image_url' => '/storage/properties/8/...jpg',  // URL complète
        'created_at' => '15/12/2024 14:30',  // format lisible
        'price_per_night' => '50 000',  // format avec espaces
    ],
    'admin' => $admin  // User object
]
```

---

## 🖼️ Affichage Images Frontend

### URLs Générées par l'API

Lorsqu'une propriété est retournée par l'API, ses images contiennent :

```json
{
  "id": 1,
  "title": "Villa Luxe",
  "photos": [
    {
      "id": 1,
      "photo_url": "/storage/properties/8/photo1.jpg",
      "photo_path": "properties/8/photo1.jpg"
    }
  ]
}
```

### Frontend (Vue/React)

```javascript
// Les URLs peuvent être utilisées directement
const imageUrl = photo.photo_url;
// Résultat: /storage/properties/8/photo1.jpg

// Le serveur les sert automatiquement
<img :src="`${baseURL}${photo.photo_url}`" />
// Résultat: http://localhost:8000/storage/properties/8/photo1.jpg
```

### Frontend (Web Simple)

```html
<img src="http://localhost:8000/storage/properties/8/photo1.jpg" />
```

---

## 🐛 Dépannage

### Les images ne s'affichent pas

1. **Vérifier le lien symbolique**
   ```bash
   php artisan storage:link
   ```

2. **Vérifier l'APP_URL**
   ```bash
   php artisan tinker
   >>> config('app.url')
   ```

3. **Vérifier les permissions**
   ```bash
   ls -la storage/app/public/properties/
   ```

### L'email n'est pas envoyé

1. **Vérifier la configuration mail**
   ```bash
   php artisan config:show mail
   ```

2. **Vérifier les logs**
   ```bash
   tail -f storage/logs/laravel.log
   ```

3. **Vérifier que l'admin a `receive_email_notifications = true`**
   ```bash
   php artisan tinker
   >>> \App\Models\User::where('user_type', 'admin')->first()->receive_email_notifications
   ```

---

## 📊 Flux de Données

### Stockage des Images

```
Hôte upload image (PC)
    ↓
HostPropertyController::addPhotos()
    ↓
Storage::store('properties/{id}', 'public')
    ↓
PropertyPhoto::create([
    'photo_path' => 'properties/8/...jpg',
    'photo_url' => '/storage/properties/8/...jpg'
])
    ↓
API retourne photo_url
    ↓
Frontend utilise http://localhost:8000/storage/properties/8/...jpg
    ↓
Nginx/Apache sert depuis storage/app/public via lien symbolique
```

### Notification Email

```
Property submitted
    ↓
PropertySubmittedForApproval event
    ↓
SendAdminPropertyNotification listener
    ↓
Pour chaque admin:
  - Récupère première photo: $firstPhoto = $property->photos()->first()
  - Extrait URL: $photoUrl = $firstPhoto->photo_url
  - Prépare données pour template
  - Mail::send('emails.admin.property_submitted', $data)
    ↓
SMTP envoie email HTML
    ↓
Admin reçoit email avec image et lien d'action
```

---

## ✅ Checklist de Déploiement

- [ ] `.env` configuré avec les paramètres SMTP
- [ ] Lien symbolique créé : `php artisan storage:link`
- [ ] Template email créé : `resources/views/emails/admin/property_submitted.blade.php`
- [ ] Listener modifié : `app/Listeners/SendAdminPropertyNotification.php`
- [ ] Admin a les permissions `receive_email_notifications = true`
- [ ] Queue configurée (si utilisation de background jobs)
- [ ] Tester la soumission d'une propriété
- [ ] Vérifier réception email
- [ ] Vérifier affichage des images

---

## 🚀 Prochaines Étapes Optionnelles

1. **Ajouter templates d'email pour autres notifications**
   - Propriété approuvée
   - Propriété rejetée
   - Nouveau message
   - Nouveau paiement

2. **Améliorer les emails**
   - Support i18n (français/anglais)
   - Images responsive
   - Dark mode

3. **Optimiser les images**
   - Compression automatique
   - Génération de thumbnails
   - Lazy loading

4. **Ajouter paramètres de notification**
   - Fréquence des notifications
   - Formats préférés
   - Heures de reception

