// Onglet « Besoins » de la barre mobile.
//  - Voyageur : publie ce qu'il cherche, reçoit les réponses des hôtes.
//  - Hôte     : voit les besoins des voyageurs de sa ville et y répond.
//  - Visiteur : explication + connexion.
// L'administration voit tout (pages/admin/AdminNeedsPage).
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus, MapPin, CalendarDays, Users, Wallet, Loader2, X, Home, Compass, Wrench, MessageSquareText, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import needsService, { type Need, type NeedType, type NewNeed } from '../../services/needs.service';
import hostService from '../../services/host.service';
import { BENIN_CITY_NAMES } from '../constants/beninCities';

const TYPES: { id: NeedType; label: string; icon: typeof Home }[] = [
  { id: 'logement', label: 'Logement', icon: Home },
  { id: 'experience', label: 'Expérience', icon: Compass },
  { id: 'service', label: 'Service', icon: Wrench },
];

const fcfa = (n?: number | null) => (n ? `${new Intl.NumberFormat('fr-FR').format(n).replace(/[  ]/g, ' ')} FCFA` : '');
const dayFr = (d?: string | null) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '');
const errorMessage = (e: any) => {
  const errors = e?.response?.data?.errors;
  return errors ? Object.values(errors).flat().join(' ') : (e?.response?.data?.message || 'Une erreur est survenue. Réessayez.');
};

function NeedSummary({ need }: { need: Need }) {
  const type = TYPES.find((t) => t.id === need.type)!;
  const dates = need.start_date ? `${dayFr(need.start_date)}${need.end_date ? ` → ${dayFr(need.end_date)}` : ''}` : 'Dates flexibles';
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 font-semibold text-[#0f2940]">
        <type.icon className="w-4 h-4 text-[#00806b]" />
        {type.label} à {need.city}{need.district ? ` · ${need.district}` : ''}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-slate-400" />{dates}</span>
        <span className="inline-flex items-center gap-1.5"><Users className="w-4 h-4 text-slate-400" />{need.guests} pers.</span>
        {need.budget_max ? <span className="inline-flex items-center gap-1.5"><Wallet className="w-4 h-4 text-slate-400" />{fcfa(need.budget_max)} max</span> : null}
      </div>
      {need.details && <p className="text-sm text-slate-700 whitespace-pre-line">{need.details}</p>}
    </div>
  );
}

const statusChip = (s: Need['status']) =>
  s === 'open' ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Ouvert</span>
  : s === 'expired' ? <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Dates passées</span>
  : <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Clôturé</span>;

// ============================================================ VOYAGEUR

function NeedForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [form, setForm] = useState<NewNeed & { budget?: string }>({ type: 'logement', city: '', guests: 2 });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: string, v: any) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })); };
  const today = new Date().toISOString().slice(0, 10);

  const mutation = useMutation({
    mutationFn: () => needsService.create({
      type: form.type, city: form.city.trim(), district: form.district?.trim() || undefined,
      start_date: form.start_date || undefined, end_date: form.end_date || undefined, guests: Number(form.guests) || 1,
      budget_max: form.budget ? Number(String(form.budget).replace(/\D/g, '')) || undefined : undefined,
      details: form.details?.trim() || undefined,
    }),
    onSuccess: (res) => { toast.success(res.message); onDone(); },
    onError: (e: any) => {
      const errs = e?.response?.data?.errors;
      if (errs) setErrors(Object.fromEntries(Object.entries(errs).map(([k, v]: any) => [k, v[0]])));
      else toast.error(errorMessage(e));
    },
  });

  const input = (err?: string) => `w-full px-3 py-2.5 rounded-xl border text-[15px] focus:outline-none focus:ring-2 focus:ring-[#00c9a7]/40 ${err ? 'border-red-500' : 'border-slate-200'}`;
  const Err = ({ k }: { k: string }) => (errors[k] ? <p className="text-xs text-red-600 mt-1">{errors[k]}</p> : null);

  return (
    <form className="bg-white rounded-3xl border border-[#e2f5f2] p-5 space-y-4 shadow-sm"
      onSubmit={(e) => { e.preventDefault(); if (!form.city.trim()) return setErrors({ city: 'Indiquez la ville.' }); mutation.mutate(); }}>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-[#0f2940]">Que cherchez-vous ?</h2>
        <button type="button" onClick={onCancel} aria-label="Fermer" className="p-1.5 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {TYPES.map(({ id, label, icon: Icon }) => (
          <button type="button" key={id} onClick={() => set('type', id)} aria-pressed={form.type === id}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-sm ${form.type === id ? 'border-[#00c9a7] bg-[#f4fffe] text-[#0f2940] font-semibold' : 'border-slate-200 text-slate-600'}`}>
            <Icon className="w-5 h-5" /> {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="need-city" className="block text-sm font-medium text-slate-700 mb-1">Ville</label>
          <input id="need-city" list="need-cities" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Cotonou" className={input(errors.city)} />
          <datalist id="need-cities">{BENIN_CITY_NAMES.map((c) => <option key={c} value={c} />)}</datalist>
          <Err k="city" />
        </div>
        <div>
          <label htmlFor="need-district" className="block text-sm font-medium text-slate-700 mb-1">Quartier <span className="text-slate-400 font-normal">(facultatif)</span></label>
          <input id="need-district" value={form.district ?? ''} onChange={(e) => set('district', e.target.value)} placeholder="Fidjrossè" className={input()} />
        </div>
        <div>
          <label htmlFor="need-start" className="block text-sm font-medium text-slate-700 mb-1">Du</label>
          <input id="need-start" type="date" min={today} value={form.start_date ?? ''} onChange={(e) => set('start_date', e.target.value)} className={input(errors.start_date)} />
          <Err k="start_date" />
        </div>
        <div>
          <label htmlFor="need-end" className="block text-sm font-medium text-slate-700 mb-1">Au</label>
          <input id="need-end" type="date" min={form.start_date || today} value={form.end_date ?? ''} onChange={(e) => set('end_date', e.target.value)} className={input(errors.end_date)} />
          <Err k="end_date" />
        </div>
        <div>
          <label htmlFor="need-guests" className="block text-sm font-medium text-slate-700 mb-1">Personnes</label>
          <input id="need-guests" type="number" min={1} max={50} value={form.guests} onChange={(e) => set('guests', e.target.value)} className={input(errors.guests)} />
          <Err k="guests" />
        </div>
        <div>
          <label htmlFor="need-budget" className="block text-sm font-medium text-slate-700 mb-1">Budget max <span className="text-slate-400 font-normal">(FCFA)</span></label>
          <input id="need-budget" inputMode="numeric" value={form.budget ?? ''} onChange={(e) => set('budget', e.target.value)} placeholder="60 000" className={input(errors.budget_max)} />
          <Err k="budget_max" />
        </div>
      </div>

      <div>
        <label htmlFor="need-details" className="block text-sm font-medium text-slate-700 mb-1">Précisions <span className="text-slate-400 font-normal">(facultatif)</span></label>
        <textarea id="need-details" rows={3} maxLength={1000} value={form.details ?? ''} onChange={(e) => set('details', e.target.value)}
          placeholder="Ex. calme, avec parking, proche de la plage…" className={input(errors.details)} />
      </div>

      <p className="text-xs text-slate-500">Les hôtes de cette ville verront votre prénom et votre demande, jamais vos coordonnées.</p>
      <button type="submit" disabled={mutation.isPending}
        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#00c9a7] to-[#0f2940] text-white py-3 rounded-xl font-semibold disabled:opacity-50">
        {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Publier mon besoin
      </button>
    </form>
  );
}

function TravelerNeeds({ onNavigate }: { onNavigate?: (route: any) => void }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { data: needs = [], isLoading } = useQuery({ queryKey: ['needs', 'mine'], queryFn: () => needsService.mine() });
  const close = useMutation({
    mutationFn: (id: number) => needsService.close(id),
    onSuccess: (res) => { toast.success(res.message); queryClient.invalidateQueries({ queryKey: ['needs'] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div className="space-y-4">
      {showForm
        ? <NeedForm onCancel={() => setShowForm(false)} onDone={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ['needs'] }); }} />
        : (
          <button onClick={() => setShowForm(true)}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#00c9a7] to-[#0f2940] text-white py-3 rounded-2xl font-semibold shadow-sm">
            <Plus className="w-5 h-5" /> Publier un besoin
          </button>
        )}

      {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-[#00c9a7] mx-auto" />
        : needs.length === 0 && !showForm ? (
          <p className="text-sm text-slate-500 text-center px-6 py-8">
            Décrivez ce que vous cherchez — un logement, une expérience, un service — et les hôtes de la ville vous répondent avec leurs propositions.
          </p>
        ) : needs.map((need) => (
          <article key={need.id} className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <NeedSummary need={need} />
              {statusChip(need.status)}
            </div>

            <div className="border-t border-slate-100 pt-3">
              <p className="text-sm font-medium text-[#0f2940] mb-2">
                {need.responses_count ? `${need.responses_count} réponse${need.responses_count > 1 ? 's' : ''}` : 'Pas encore de réponse'}
              </p>
              <div className="space-y-3">
                {need.responses?.map((r) => (
                  <div key={r.id} className="rounded-2xl bg-[#f4fffe] p-3">
                    <p className="text-sm font-semibold text-[#0f2940]">{r.host?.name ?? 'Un hôte'}</p>
                    <p className="text-sm text-slate-700 mt-1 whitespace-pre-line">{r.message}</p>
                    {/* La réponse ouvre une conversation : on y poursuit l'échange. */}
                    <button onClick={() => onNavigate?.({ name: 'messages' })}
                      className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#00806b]">
                      <MessageSquareText className="w-4 h-4" /> Répondre dans Messages
                    </button>
                    {r.property && (
                      <button onClick={() => onNavigate?.({ name: 'listing', id: String(r.property!.id) })}
                        className="mt-2 w-full flex items-center gap-3 rounded-xl bg-white border border-[#e2f5f2] p-2 text-left">
                        {r.property.photo ? <img src={r.property.photo} alt="" className="w-14 h-14 rounded-lg object-cover" /> : <span className="w-14 h-14 rounded-lg bg-slate-100" />}
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-[#0f2940] truncate">{r.property.title}</span>
                          <span className="block text-xs text-slate-500">{r.property.city} · {fcfa(r.property.price_per_night)}/nuit</span>
                          <span className="block text-xs text-[#00806b] font-medium mt-0.5">Voir le logement →</span>
                        </span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {need.status === 'open' && (
              <button onClick={() => close.mutate(need.id)} disabled={close.isPending} className="text-sm text-slate-500 hover:text-red-600">
                J’ai trouvé — clôturer ce besoin
              </button>
            )}
          </article>
        ))}
    </div>
  );
}

// ============================================================ HÔTE

function RespondForm({ need, onDone }: { need: Need; onDone: () => void }) {
  const [message, setMessage] = useState(need.my_response?.message ?? '');
  const [propertyId, setPropertyId] = useState<number | ''>(need.my_response?.property_id ?? '');
  const { data } = useQuery({ queryKey: ['host-properties-min'], queryFn: () => hostService.getProperties(), enabled: need.type === 'logement' });
  const listings: any[] = (data as any)?.data?.data || (data as any)?.data || [];
  const mutation = useMutation({
    mutationFn: () => needsService.respond(need.id, message.trim(), propertyId || null),
    onSuccess: (res) => { toast.success(res.message); onDone(); },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <form className="space-y-3 border-t border-slate-100 pt-3" onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
      <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000}
        placeholder={`Bonjour ${need.traveler_name?.split(' ')[0] ?? ''}, …`}
        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#00c9a7]/40" />
      {need.type === 'logement' && listings.length > 0 && (
        <select value={propertyId} onChange={(e) => setPropertyId(e.target.value ? Number(e.target.value) : '')}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white">
          <option value="">Joindre une de mes annonces (facultatif)</option>
          {listings.map((l) => <option key={l.id} value={l.id}>{l.title} — {l.city}</option>)}
        </select>
      )}
      <button type="submit" disabled={mutation.isPending || message.trim().length < 10}
        className="w-full inline-flex items-center justify-center gap-2 bg-[#0f2940] text-white py-2.5 rounded-xl font-semibold disabled:opacity-40">
        {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} {need.my_response ? 'Modifier ma réponse' : 'Envoyer ma réponse'}
      </button>
    </form>
  );
}

function HostNeeds({ onNavigate }: { onNavigate?: (route: any) => void }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<number | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ['needs', 'host'], queryFn: () => needsService.forHost() });
  const needs = data?.data ?? [];
  const hasArea = data ? Object.values(data.areas).some((n) => n > 0) : true;

  if (isLoading) return <Loader2 className="w-6 h-6 animate-spin text-[#00c9a7] mx-auto" />;
  if (!hasArea) return (
    <p className="text-sm text-slate-500 text-center px-6 py-8">
      Publiez une annonce, une expérience ou un service : vous verrez ici les besoins des voyageurs de votre ville.
    </p>
  );
  if (needs.length === 0) return (
    <p className="text-sm text-slate-500 text-center px-6 py-8">
      Aucun besoin ouvert dans votre ville pour le moment. Les nouvelles demandes apparaîtront ici.
    </p>
  );

  return (
    <div className="space-y-4">
      {needs.map((need) => (
        <article key={need.id} className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <NeedSummary need={need} />
            {need.my_response && <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0"><CheckCircle2 className="w-3.5 h-3.5" />Répondu</span>}
          </div>
          <p className="text-xs text-slate-500">Demande de {need.traveler_name} · {need.responses_count} réponse{need.responses_count > 1 ? 's' : ''}</p>
          {open === need.id
            ? <RespondForm need={need} onDone={() => { setOpen(null); queryClient.invalidateQueries({ queryKey: ['needs'] }); }} />
            : (
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <button onClick={() => setOpen(need.id)} className="inline-flex items-center gap-2 text-sm font-semibold text-[#00806b]">
                  <MessageSquareText className="w-4 h-4" /> {need.my_response ? 'Modifier ma réponse' : 'Répondre'}
                </button>
                {need.my_response && (
                  <button onClick={() => onNavigate?.({ name: 'host-messages' })} className="text-sm font-medium text-slate-600 hover:text-[#0f2940]">
                    Voir la conversation →
                  </button>
                )}
              </div>
            )}
        </article>
      ))}
    </div>
  );
}

// ============================================================ PAGE

export function NeedsPage({ onNavigate }: { onNavigate?: (route: any) => void }) {
  const { user, isAuthenticated } = useAuth();
  const isHost = user?.user_type === 'hote';

  return (
    <div className="min-h-screen bg-[#f7fbfb] px-4 pt-6 pb-28">
      <div className="max-w-2xl mx-auto space-y-5">
        <header>
          <h1 className="font-display text-3xl text-[#0f2940]">Besoins</h1>
          <p className="text-sm text-slate-600 mt-1">
            {isHost ? 'Les demandes des voyageurs de votre ville : répondez avec vos propositions.'
              : 'Dites ce que vous cherchez, les hôtes vous répondent.'}
          </p>
        </header>

        {!isAuthenticated ? (
          <div className="bg-white rounded-3xl border border-[#e2f5f2] p-6 text-center space-y-4">
            <MapPin className="w-8 h-8 text-[#00c9a7] mx-auto" />
            <p className="text-slate-700">Un logement à Ouidah pour 3 nuits ? Un guide à Abomey ? Publiez votre besoin : les hôtes de la ville vous font leurs propositions.</p>
            <button onClick={() => onNavigate?.({ name: 'auth' })}
              className="w-full bg-gradient-to-r from-[#00c9a7] to-[#0f2940] text-white py-3 rounded-xl font-semibold">
              Se connecter pour publier un besoin
            </button>
          </div>
        ) : isHost ? <HostNeeds onNavigate={onNavigate} /> : <TravelerNeeds onNavigate={onNavigate} />}
      </div>
    </div>
  );
}
