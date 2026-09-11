// src/app/hooks/useFavorites.ts
//
// Favoris de l'utilisateur, partagés par toute l'application via le cache
// React Query : UNE requête, quel que soit le nombre de cartes affichées.
// Auparavant chaque carte chargeait la liste complète (20 cartes = 20
// requêtes identiques), ce qui entamait le quota de 60 requêtes/minute.
import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import favoriteService from '../../services/favorite.service';
import { useAuth } from '../../contexts/AuthContext';

export interface FavoriteItem {
  id: number;
  property: {
    id: number;
    title: string;
    city: string;
    district: string;
    price_per_night: number;
    average_rating: number;
    reviews_count: number;
    property_type?: string;
    cover_photo?: { photo_url?: string; full_url?: string };
    bluefin_certified?: boolean;
  };
  title?: string;
  location?: string;
  price?: number;
  priceDisplay?: string;
  rating?: number;
  reviews?: number;
  image?: string;
  type?: string;
  notes?: string;
  addedAt: string;
}

const fcfa = (n: number) => new Intl.NumberFormat('fr-FR').format(n || 0).replace(/[  ]/g, ' ');

const toItem = (fav: any): FavoriteItem => ({
  id: fav.id,
  property: fav.property,
  notes: fav.notes,
  addedAt: fav.created_at,
  title: fav.property?.title,
  location: [fav.property?.district, fav.property?.city].filter(Boolean).join(', '),
  price: Number(fav.property?.price_per_night) || 0,
  priceDisplay: `${fcfa(Number(fav.property?.price_per_night) || 0)} FCFA / nuit`,
  rating: Number(fav.property?.average_rating) || 0,
  reviews: fav.property?.reviews_count,
  image: fav.property?.cover_photo?.full_url || fav.property?.cover_photo?.photo_url,
  type: fav.property?.property_type || 'Logement',
});

export const FAVORITES_KEY = ['favorites'];

export function useFavorites() {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.user_type === 'admin';
  const enabled = Boolean(isAuthenticated && user && !isAdmin);

  const query = useQuery({
    queryKey: [...FAVORITES_KEY, user?.id],
    queryFn: async () => {
      const response = await favoriteService.getFavorites();
      return ((response?.data?.favorites as any[]) || []).map(toItem);
    },
    enabled,
    staleTime: 60 * 1000,
  });
  const favorites: FavoriteItem[] = enabled ? query.data ?? [] : [];

  const isFavorite = useCallback(
    (propertyId: number) => favorites.some((f) => f.property?.id === Number(propertyId)),
    [favorites]
  );

  const mutation = useMutation({
    mutationFn: (propertyId: number) => favoriteService.toggle(propertyId),
    // Mise à jour immédiate du cœur, sans attendre le serveur.
    onMutate: async (propertyId: number) => {
      const key = [...FAVORITES_KEY, user?.id];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<FavoriteItem[]>(key);
      if (previous?.some((f) => f.property?.id === propertyId)) {
        queryClient.setQueryData<FavoriteItem[]>(key, previous.filter((f) => f.property?.id !== propertyId));
      }
      return { previous, key };
    },
    onError: (_e, _id, context) => { if (context?.previous) queryClient.setQueryData(context.key, context.previous); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: FAVORITES_KEY }),
  });

  const toggleFavorite = useCallback(async (property: any) => {
    if (!enabled) return { success: false, needsLogin: !isAuthenticated, message: 'Connectez-vous pour enregistrer vos favoris.' };
    const propertyId = Number(property?.id ?? property);
    try {
      const response = await mutation.mutateAsync(propertyId);
      return { success: true, action: response?.action, message: response?.action === 'added' ? 'Ajouté aux favoris' : 'Retiré des favoris' };
    } catch (err: any) {
      return { success: false, message: err?.response?.data?.message || 'Impossible de modifier vos favoris.' };
    }
  }, [enabled, isAuthenticated, mutation]);

  const addFavorite = useCallback(async (property: any) => {
    const id = Number(property?.id ?? property);
    return isFavorite(id) ? true : (await toggleFavorite(id)).success;
  }, [isFavorite, toggleFavorite]);

  const removeFavorite = useCallback(async (propertyId: number) => {
    return isFavorite(propertyId) ? (await toggleFavorite(propertyId)).success : false;
  }, [isFavorite, toggleFavorite]);

  return {
    favorites,
    formattedFavorites: favorites.map((f) => ({
      id: f.property?.id, title: f.title, location: f.location, price: f.price, priceDisplay: f.priceDisplay,
      rating: f.rating || 0, reviews: f.reviews || 0, image: f.image || '/placeholder-photo.svg', type: 'Logement',
      addedAt: f.addedAt, notes: f.notes,
    })),
    loading: enabled && query.isLoading,
    error: query.error ? 'Erreur lors du chargement des favoris' : null,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    favoriteCount: favorites.length,
    refreshFavorites: () => queryClient.invalidateQueries({ queryKey: FAVORITES_KEY }),
  };
}
