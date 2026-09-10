# 🧪 GUIDE DE TEST COMPLET

## Test Intégration Complète

### Scénario: Un hôte soumet une propriété pour examen

---

## Phase 1: Préparation

### 1. Vérifier les données de test
```bash
# Connexion à la base de données
php artisan tinker

# Vérifier qu'il existe un hôte
>>> $host = User::where('user_type', 'hote')->first();
>>> echo $host->email . " - " . $host->phone;

# Vérifier qu'il existe un admin
>>> $admin = User::where('user_type', 'admin')->first();
>>> echo $admin->email . " - " . $admin->receive_email_notifications;

# Vérifier une propriété avec photos
>>> $property = Property::whereHas('photos')->first();
>>> echo $property->title . " - " . $property->photos()->count() . " photos";

# Sortir du tinker
>>> exit
```

---

## Phase 2: Soumettre une Propriété

### Méthode 1: Avec cURL
```bash
# Récupérer le token du hôte
# (remplacer EMAIL et PASSWORD par vos données)
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "host@example.com",
    "password": "password123"
  }' | jq -r '.token')

echo "Token: $TOKEN"

# Soumettre la propriété
curl -X POST http://localhost:8000/api/v1/host/properties/1/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Méthode 2: Avec Postman
1. **POST** → `http://localhost:8000/api/v1/host/properties/1/submit`
2. **Headers:**
   - `Authorization: Bearer YOUR_HOST_TOKEN`
   - `Content-Type: application/json`
3. **Body:** (empty or `{}`)
4. **Click Send**

### Réponse Attendue
```json
{
  "success": true,
  "message": "Propriété soumise avec succès pour examen",
  "data": {
    "id": 1,
    "title": "Villa Luxe",
    "status": "pending",
    "updated_at": "2024-12-15T14:30:00.000000Z"
  }
}
```

---

## Phase 3: Vérifier le Listener

### 1. Logs
```bash
# Vérifier que l'événement est déclenché
tail -f storage/logs/laravel.log | grep -i "property\|submitted\|notification"

# Vous devriez voir:
# - Event dispatch
# - Listener execution
# - Mail sent
# - Admin notification created
```

### 2. Base de Données
```bash
php artisan tinker

# Vérifier que AdminNotification a été créé
>>> AdminNotification::latest()->first();

>>> exit
```

---

## Phase 4: Vérifier l'Email

### Mode Développement (log)
```bash
# Les emails sont loggés dans laravel.log
grep -i "email\|mail" storage/logs/laravel.log

# Ou voir les dernières lignes
tail -50 storage/logs/laravel.log

# Vous devriez voir quelque chose comme:
# [2024-12-15 14:30:00] local.INFO: Email sent to admin@example.com
```

### Mode Production (SMTP réel)
- Vérifier l'inbox de l'admin
- Vérifier le dossier Spam
- Vérifier les bounces/erreurs d'envoi

---

## Phase 5: Vérifier les Images

### Via API
```bash
# Récupérer la propriété avec ses photos
curl -X GET http://localhost:8000/api/v1/properties/1 \
  -H "Content-Type: application/json"

# Réponse attendue:
{
  "id": 1,
  "title": "Villa Luxe",
  "photos": [
    {
      "id": 1,
      "photo_url": "/storage/properties/8/T70cc6R6AG42l4X1eOF5WbgbnhP976gUIr6NkYdU.jpg",
      "photo_path": "properties/8/T70cc6R6AG42l4X1eOF5WbgbnhP976gUIr6NkYdU.jpg"
    }
  ]
}
```

### Via Navigateur
```
URL: http://localhost:8000/storage/properties/8/T70cc6R6AG42l4X1eOF5WbgbnhP976gUIr6NkYdU.jpg

Résultat attendu: Image affichée
```

### Via Frontend
```javascript
// Fetch de la propriété
const response = await fetch('/api/v1/properties/1');
const property = await response.json();

// Utiliser l'URL
console.log(property.photos[0].photo_url);
// /storage/properties/8/...jpg

// Afficher l'image
const img = document.createElement('img');
img.src = 'http://localhost:8000' + property.photos[0].photo_url;
document.body.appendChild(img);
```

---

## Phase 6: Tester le Template Email

### Visualiser le template
```bash
# Via tinker
php artisan tinker

>>> $property = Property::first();
>>> $admin = User::where('user_type', 'admin')->first();

>>> $data = [
    'property' => [
        'id' => $property->id,
        'title' => $property->title,
        'description' => $property->description,
        'host_name' => $property->user->full_name,
        'host_phone' => $property->user->phone,
        'city' => $property->city,
        'district' => $property->district,
        'property_type' => 'Villa',
        'image_url' => '/storage/properties/8/T70cc6R6AG42l4X1eOF5WbgbnhP976gUIr6NkYdU.jpg',
        'created_at' => $property->created_at->format('d/m/Y H:i'),
        'price_per_night' => '50 000',
    ],
    'admin' => $admin
];

>>> view('emails.admin.property_submitted', $data);

# Copier le HTML et l'ouvrir dans un navigateur
```

### Envoyer un email de test
```bash
php artisan tinker

>>> $property = Property::first();
>>> $admin = User::where('user_type', 'admin')->first();

>>> Mail::send('emails.admin.property_submitted', [
    'property' => [
        'id' => $property->id,
        'title' => $property->title,
        'description' => $property->description,
        'host_name' => $property->user->full_name,
        'host_phone' => $property->user->phone,
        'city' => $property->city,
        'district' => $property->district,
        'property_type' => 'Villa',
        'image_url' => '/storage/properties/8/T70cc6R6AG42l4X1eOF5WbgbnhP976gUIr6NkYdU.jpg',
        'created_at' => $property->created_at->format('d/m/Y H:i'),
        'price_per_night' => '50 000',
    ],
    'admin' => $admin
], function ($message) use ($admin) {
    $message->to($admin->email)
            ->subject('Nouvelle propriété à valider')
            ->from('noreply@bluefin.local', 'Bluefin');
});

>>> exit
```

---

## Phase 7: Checker les Erreurs

### Si l'email n'est pas envoyé
```bash
# 1. Vérifier les logs
tail -200 storage/logs/laravel.log

# 2. Vérifier la configuration
php artisan config:show mail

# 3. Vérifier que le listener est enregistré
php artisan tinker
>>> Event::getListeners(\App\Events\PropertySubmittedForApproval::class)
```

### Si les images ne s'affichent pas
```bash
# 1. Vérifier le lien symbolique
ls -la public/storage

# 2. Vérifier les fichiers
ls -la storage/app/public/properties/

# 3. Tester l'URL directement
curl -I http://localhost:8000/storage/properties/8/...jpg

# 4. Vérifier le APP_URL
php artisan config:show app.url
```

### Si la propriété n'est pas soumise
```bash
# 1. Vérifier que le hôte a les permissions
php artisan tinker
>>> $host = User::find(1);
>>> $host->user_type

# 2. Vérifier que la propriété existe et appartient au hôte
>>> $property = Property::find(1);
>>> $property->user_id == $host->id

# 3. Vérifier la réponse d'erreur
# (regarder dans les logs du navigateur)
```

---

## 🎯 Checklist de Test

- [ ] Hôte reçoit le token correctement
- [ ] Propriété est soumise avec succès
- [ ] Événement PropertySubmittedForApproval est déclenché
- [ ] Listener reçoit et traite l'événement
- [ ] AdminNotification est créé en base
- [ ] Email est envoyé/loggé
- [ ] Template affiche les données correctement
- [ ] Image de propriété s'affiche dans l'email
- [ ] Image de propriété s'affiche via API
- [ ] Image s'affiche dans le navigateur
- [ ] Lien d'action dans l'email fonctionne
- [ ] Aucune erreur dans les logs

---

## 📊 Résultats Attendus

### Logs (tail -f storage/logs/laravel.log)
```
[2024-12-15 14:30:00] local.INFO: Event [PropertySubmittedForApproval] dispatched.
[2024-12-15 14:30:00] local.INFO: Email sent to admin@example.com
[2024-12-15 14:30:00] local.INFO: AdminNotification created for admin
```

### Base de Données (admin_notifications)
```
| id | admin_id | type               | title                              | priority |
|----+----------+--------------------+------------------------------------+----------|
| 1  | 1        | property_submitted | Nouvelle propriété en attente...   | high     |
```

### Photos (API Response)
```json
{
  "photos": [
    {
      "id": 1,
      "photo_url": "/storage/properties/8/T70cc6R6AG42l4X1eOF5WbgbnhP976gUIr6NkYdU.jpg",
      "photo_path": "properties/8/T70cc6R6AG42l4X1eOF5WbgbnhP976gUIr6NkYdU.jpg",
      "order": 1
    }
  ]
}
```

### Email Reçu
```
Subject: Nouvelle propriété à valider - Bluefin Immo

From: noreply@bluefin.local
To: admin@example.com

Body:
🏠 Nouvelle Propriété en Attente d'Examen

Villa Luxe
Propriétaire: Jean Dupont
Téléphone: +212612345678
Localisation: Casablanca, Anfa
Type: Villa
Statut: EN ATTENTE
Date de soumission: 15/12/2024 14:30

[Image affichée]

Description: Belle villa avec vue sur la mer...

[Bouton: Examiner la Propriété]
```

---

## 🔄 Relancer les Tests

```bash
# Réinitialiser pour un nouveau test
php artisan tinker

# Mettre la propriété en draft
>>> Property::find(1)->update(['status' => 'draft']);

# Supprimer les notifications précédentes
>>> AdminNotification::where('type', 'property_submitted')->delete();

# Sortir et relancer le test
>>> exit

# Puis relancer la soumission
curl -X POST http://localhost:8000/api/v1/host/properties/1/submit ...
```

---

## 💡 Tips

- Utiliser `tail -f` avec `grep` pour filtrer les logs
- Activer le mode debug dans `.env`: `APP_DEBUG=true`
- Utiliser `Tinker` pour tester rapidement le code
- Utiliser des breakpoints dans un IDE pour déboguer
- Vérifier les headers HTTP pour les erreurs d'authentification

