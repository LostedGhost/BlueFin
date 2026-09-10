# Bluefin

Monorepo Bluefin Immo — plateforme de location courte durée (logements, expériences, services) au Bénin.

## Structure

- [`frontend/`](./frontend) — application React/Vite (déployée sur Vercel)
- [`backend/`](./backend) — API Laravel (déployée sur Hostinger)

Chaque dossier garde l'historique complet de son dépôt d'origine (fusionné via `git subtree`).

## Démarrage rapide

```bash
# Frontend
cd frontend
npm install
cp .env.example .env.development   # renseigner les valeurs réelles
npm run dev

# Backend
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

## CI/CD

Voir [`.github/workflows/`](./.github/workflows). Le frontend est déployé automatiquement par
Vercel (intégration GitHub native — configurer le "Root Directory" du projet Vercel sur `frontend/`).
Le backend est déployé sur Hostinger — voir `.github/workflows/deploy-backend.yml`.
