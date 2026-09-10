// services/favorite.service.ts
import { v1Api } from './api';

class FavoriteService {
  // Récupérer les favoris
  async getFavorites(listName: string = 'default') {
    // ✅ CORRECTION : Utiliser v1Api
    const response = await v1Api.get(`/traveler/favorites?list_name=${listName}`);
    return response.data;
  }

  // Ajouter/retirer des favoris
  async toggle(propertyId: number, listName: string = 'default', notes?: string) {
    // ✅ CORRECTION : Utiliser v1Api
    const response = await v1Api.post(`/traveler/favorites/${propertyId}/toggle`, {
      list_name: listName,
      notes
    });
    return response.data;
  }

  // Vérifier si en favori
  async check(propertyId: number) {
    // ✅ CORRECTION : Utiliser v1Api
    const response = await v1Api.get(`/traveler/favorites/${propertyId}/check`);
    return response.data;
  }

  // Créer une liste
  async createList(listName: string) {
    // ✅ CORRECTION : Utiliser v1Api
    const response = await v1Api.post('/traveler/favorites/lists', { list_name: listName });
    return response.data;
  }

  // Supprimer une liste
  async deleteList(listName: string) {
    // ✅ CORRECTION : Utiliser v1Api
    const response = await v1Api.delete(`/traveler/favorites/lists/${listName}`);
    return response.data;
  }

  // Ajouter une note à un favori
  async addNote(favoriteId: number, notes: string) {
    // ✅ CORRECTION : Utiliser v1Api
    const response = await v1Api.post(`/traveler/favorites/${favoriteId}/note`, { notes });
    return response.data;
  }
}

export default new FavoriteService();