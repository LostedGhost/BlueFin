// « Besoins » : le voyageur publie ce qu'il cherche, les hôtes de la ville
// répondent, l'admin voit tout. Voir backend NeedController.
import { v1Api } from './api';

export type NeedType = 'logement' | 'experience' | 'service';
export type NeedStatus = 'open' | 'closed' | 'expired';

export interface NeedResponseItem {
  id: number;
  message: string;
  created_at: string;
  host: { id: number; name: string } | null;
  property: { id: number; title: string; city: string; price_per_night: number; photo?: string | null } | null;
}

export interface Need {
  id: number;
  type: NeedType;
  city: string;
  district?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  guests: number;
  budget_max?: number | null;
  details?: string | null;
  status: NeedStatus;
  closed_reason?: string | null;
  responses_count: number;
  created_at: string;
  responses?: NeedResponseItem[];
  // Vue hôte
  traveler_name?: string;
  my_response?: { message: string; property_id: number | null; updated_at: string } | null;
  // Vue admin
  traveler?: { id: number; name: string; email: string; phone: string };
}

export interface NewNeed {
  type: NeedType;
  city: string;
  district?: string;
  start_date?: string;
  end_date?: string;
  guests: number;
  budget_max?: number;
  details?: string;
}

const needsService = {
  async mine(): Promise<Need[]> {
    return (await v1Api.get('/needs/mine')).data.data;
  },
  async create(need: NewNeed): Promise<{ message: string; data: Need }> {
    return (await v1Api.post('/needs', need)).data;
  },
  async close(id: number): Promise<{ message: string; data: Need }> {
    return (await v1Api.post(`/needs/${id}/close`)).data;
  },
  async forHost(): Promise<{ data: Need[]; areas: Record<NeedType, number> }> {
    return (await v1Api.get('/needs/for-host')).data;
  },
  async respond(id: number, message: string, propertyId?: number | null): Promise<{ message: string; data: Need }> {
    return (await v1Api.post(`/needs/${id}/respond`, { message, property_id: propertyId || null })).data;
  },
  async adminList(status?: 'open' | 'closed'): Promise<Need[]> {
    return (await v1Api.get('/admin/needs', { params: { status } })).data.data;
  },
  async adminClose(id: number, reason?: string): Promise<{ message: string }> {
    return (await v1Api.post(`/admin/needs/${id}/close`, { reason })).data;
  },
};

export default needsService;
