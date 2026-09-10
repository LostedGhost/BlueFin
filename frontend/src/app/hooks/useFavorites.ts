// src/app/hooks/useFavorites.ts
import { useState, useEffect, useCallback } from 'react';
import favoriteService from '../../services/favorite.service';
import { useAuth } from './useAuth';

// Interface correspondant à l'API Laravel
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
    cover_photo?: {
      photo_url: string;
    };
    bluefin_certified?: boolean;
  };
  // Propriétés aplaties pour un accès facile
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

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();

  // ✅ Vérifier si l'utilisateur est admin
  const isAdmin = user?.user_type === 'admin';

  // Charger les favoris depuis l'API
  const loadFavorites = useCallback(async () => {
    // ✅ Si admin, ne pas charger les favoris
    if (!isAuthenticated || isAdmin) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await favoriteService.getFavorites();
      // Adapter la réponse à notre interface
      const favoritesData = response.data?.favorites?.map((fav: any) => ({
        id: fav.id,
        property: fav.property,
        notes: fav.notes,
        addedAt: fav.created_at,
        // Propriétés aplaties pour accès facile
        title: fav.property?.title,
        location: `${fav.property?.city}${fav.property?.district ? ', ' + fav.property.district : ''}`,
        price: fav.property?.price_per_night,
        priceDisplay: `${fav.property?.price_per_night?.toLocaleString() || 0} FCFA / nuit`,
        rating: fav.property?.average_rating,
        reviews: fav.property?.reviews_count,
        image: fav.property?.cover_photo?.photo_url,
        type: fav.property?.property_type || 'Logement'
      })) || [];
      setFavorites(favoritesData);
    } catch (err: any) {
      console.error('Erreur chargement favoris:', err);
      setError(err.message || 'Erreur lors du chargement des favoris');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isAdmin]);

  // Recharger quand l'utilisateur se connecte
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites, isAuthenticated, isAdmin]);

  // Vérifier si une propriété est en favori
  const isFavorite = useCallback((propertyId: number): boolean => {
    // ✅ Si admin, retourner false directement
    if (isAdmin) return false;
    return favorites.some(fav => fav.property?.id === propertyId);
  }, [favorites, isAdmin]);

  // Ajouter un favori
  const addFavorite = useCallback(async (property: any, listName?: string, notes?: string) => {
    // ✅ Si admin, ne pas permettre l'ajout
    if (!isAuthenticated || isAdmin) {
      console.warn('Utilisateur non connecté ou admin, impossible d\'ajouter aux favoris');
      return false;
    }

    try {
      const propertyId = property.id || property;
      const response = await favoriteService.toggle(propertyId, listName || 'default', notes);
      
      if (response.action === 'added') {
        await loadFavorites(); // Recharger la liste
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Erreur ajout favori:', err);
      setError(err.message);
      return false;
    }
  }, [isAuthenticated, isAdmin, loadFavorites]);

  // Supprimer un favori
  const removeFavorite = useCallback(async (propertyId: number) => {
    // ✅ Si admin, ne pas permettre la suppression
    if (!isAuthenticated || isAdmin) {
      return false;
    }

    try {
      const response = await favoriteService.toggle(propertyId);
      
      if (response.action === 'removed') {
        await loadFavorites(); // Recharger la liste
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Erreur suppression favori:', err);
      setError(err.message);
      return false;
    }
  }, [isAuthenticated, isAdmin, loadFavorites]);

  // Basculer l'état favori
  const toggleFavorite = useCallback(async (property: any, listName?: string, notes?: string) => {
    // ✅ Si admin, ne pas permettre le toggle
    if (!isAuthenticated || isAdmin) {
      console.warn('Veuillez vous connecter pour ajouter aux favoris');
      return { success: false, message: 'Connexion requise' };
    }

    const propertyId = property.id || property;
    const isCurrentlyFavorite = isFavorite(propertyId);
    
    try {
      const response = await favoriteService.toggle(propertyId, listName || 'default', notes);
      await loadFavorites(); // Recharger après modification
      
      return { 
        success: true, 
        action: response.action,
        message: response.action === 'added' ? 'Ajouté aux favoris' : 'Retiré des favoris'
      };
    } catch (err: any) {
      console.error('Erreur toggle favori:', err);
      return { success: false, message: err.message };
    }
  }, [isAuthenticated, isAdmin, isFavorite, loadFavorites]);

  // Obtenir les favoris formatés pour PropertyCard
  const getFormattedFavorites = useCallback(() => {
    // ✅ Si admin, retourner un tableau vide
    if (isAdmin) return [];
    
    return favorites.map(fav => ({
      id: fav.property?.id,
      title: fav.property?.title,
      location: `${fav.property?.district || ''}, ${fav.property?.city || ''}`,
      price: fav.property?.price_per_night,
      priceDisplay: `${fav.property?.price_per_night?.toLocaleString() || 0} FCFA / nuit`,
      rating: fav.property?.average_rating || 0,
      reviews: fav.property?.reviews_count || 0,
      image: fav.property?.cover_photo?.photo_url || '/placeholder.jpg',
      type: 'Logement',
      addedAt: fav.addedAt,
      notes: fav.notes
    }));
  }, [favorites, isAdmin]);

  return {
    favorites,
    formattedFavorites: getFormattedFavorites(),
    loading,
    error,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    favoriteCount: isAdmin ? 0 : favorites.length,
    refreshFavorites: loadFavorites
  };
}