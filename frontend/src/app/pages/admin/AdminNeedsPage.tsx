// Besoins publiés par les voyageurs, vus par l'administration (choix client :
// les hôtes de la ville répondent, l'admin voit tout pour relancer ou agir).
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Loader2, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../../../contexts/ThemeContext';
import needsService, { type Need } from '../../../services/needs.service';

const TYPE_LABEL = { logement: 'Logement', experience: 'Expérience', service: 'Service' } as const;
const dayFr = (d?: string | null) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const fcfa = (n?: number | null) => (n ? `${new Intl.NumberFormat('fr-FR').format(n).replace(/[  ]/g, ' ')} FCFA` : '—');

export function AdminNeedsPage(_props: { onNavigate?: unknown }) {
  const { isDark } = useTheme();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'open' | 'closed' | ''>('open');
  const { data: needs = [], isLoading } = useQuery({
    queryKey: ['admin-needs', status],
    queryFn: () => needsService.adminList(status || undefined),
  });
  const close = useMutation({
    mutationFn: (id: number) => needsService.adminClose(id),
    onSuccess: (res) => { toast.success(res.message); queryClient.invalidateQueries({ queryKey: ['admin-needs'] }); },
  });

  const card = isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800';
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'} p-4 md:p-6 lg:p-8`}>
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className={`text-2xl md:text-3xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              <ClipboardList className="w-6 h-6 text-[#00c9a7]" /> Besoins des voyageurs
            </h1>
            <p className={`text-sm mt-1 ${muted}`}>Demandes publiées et réponses des hôtes. Les coordonnées du voyageur ne sont visibles qu'ici.</p>
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value as any)}
            className={`px-3 py-2 rounded-xl text-sm border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
            <option value="open">Ouverts</option>
            <option value="closed">Clôturés</option>
            <option value="">Tous</option>
          </select>
        </div>

        {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-[#00c9a7]" />
          : needs.length === 0 ? <p className={`text-sm ${muted}`}>Aucun besoin dans cette vue.</p>
          : needs.map((n: Need) => (
            <article key={n.id} className={`border rounded-2xl p-5 space-y-3 ${card}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{TYPE_LABEL[n.type]} à {n.city}{n.district ? ` · ${n.district}` : ''}</p>
                  <p className={`text-sm ${muted}`}>
                    {n.start_date ? `${dayFr(n.start_date)} → ${dayFr(n.end_date)}` : 'Dates flexibles'} · {n.guests} pers. · budget {fcfa(n.budget_max)}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${n.status === 'open' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                  {n.status === 'open' ? 'Ouvert' : n.status === 'expired' ? 'Dates passées' : 'Clôturé'}
                </span>
              </div>
              {n.details && <p className="text-sm whitespace-pre-line">{n.details}</p>}
              {n.traveler && (
                <p className={`text-sm flex flex-wrap gap-x-4 gap-y-1 ${muted}`}>
                  <span className="font-medium">{n.traveler.name}</span>
                  <a href={`tel:${n.traveler.phone}`} className="inline-flex items-center gap-1 hover:underline"><Phone className="w-3.5 h-3.5" />{n.traveler.phone}</a>
                  <a href={`mailto:${n.traveler.email}`} className="inline-flex items-center gap-1 hover:underline"><Mail className="w-3.5 h-3.5" />{n.traveler.email}</a>
                </p>
              )}
              <div className="border-t border-slate-200/60 pt-3 space-y-2">
                <p className="text-sm font-medium">{n.responses_count} réponse{n.responses_count > 1 ? 's' : ''} d'hôtes</p>
                {n.responses?.map((r) => (
                  <p key={r.id} className={`text-sm ${muted}`}>
                    <span className="font-medium">{r.host?.name}</span>{r.property ? ` (${r.property.title})` : ''} : {r.message}
                  </p>
                ))}
              </div>
              {n.status === 'open' && (
                <button onClick={() => close.mutate(n.id)} disabled={close.isPending} className="text-sm text-red-600 hover:underline">
                  Clôturer ce besoin
                </button>
              )}
            </article>
          ))}
      </div>
    </div>
  );
}
