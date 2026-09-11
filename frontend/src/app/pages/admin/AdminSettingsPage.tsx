// src/app/pages/admin/AdminSettingsPage.tsx
//
// Réglages de la plateforme. Chaque réglage affiché est réellement utilisé par
// le backend (calcul des soldes hôtes et des versements) — voir
// backend/app/Models/PlatformSetting.php. Modification réservée au super admin.
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import adminService, { type PlatformSettingItem } from '../../../services/admin.service';

type Key = PlatformSettingItem['key'];

const HELP: Record<Key, { unit: string; step: number; help: string }> = {
  commission_rate: {
    unit: '%', step: 0.5,
    help: 'Prélevée sur le montant total de chaque réservation terminée. Tout changement s\'applique immédiatement au solde de tous les hôtes.',
  },
  min_payout_amount: {
    unit: 'FCFA', step: 500,
    help: 'En dessous de ce solde, un hôte ne peut pas demander de retrait et aucun versement n\'est préparé pour lui.',
  },
  payout_overdue_days: {
    unit: 'jours', step: 1,
    help: 'Un versement en attente depuis plus longtemps est signalé « En retard » dans Paiements Hôtes.',
  },
};

export function AdminSettingsPage(_props: { onNavigate?: unknown }) {
  const { isDark } = useTheme();
  const { user } = useAuth() as { user: any };
  const queryClient = useQueryClient();
  const canEdit = user?.admin_role === 'super_admin';

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminService.getSettings(),
  });
  const settings = data?.data ?? [];

  const [draft, setDraft] = useState<Partial<Record<Key, string>>>({});
  useEffect(() => {
    setDraft(Object.fromEntries(settings.map((s) => [s.key, String(s.value)])));
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const changed = settings.filter((s) => draft[s.key] !== undefined && Number(draft[s.key]) !== s.value);

  const save = useMutation({
    mutationFn: () => adminService.updateSettings(
      Object.fromEntries(changed.map((s) => [s.key, Number(draft[s.key])]))
    ),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.setQueryData(['admin-settings'], res);
      queryClient.invalidateQueries({ queryKey: ['host-payouts'] });
    },
    onError: (e: any) => {
      const errors = e?.response?.data?.errors;
      toast.error(errors ? Object.values(errors).flat().join(' ') : (e?.response?.data?.message || e.message));
    },
  });

  const card = isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'} p-4 md:p-6 lg:p-8`}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#12b8c9]" /> Réglages
          </h1>
          <p className={`text-sm mt-1 ${muted}`}>
            Règles financières de la plateforme.
            {!canEdit && ' Lecture seule : seul un super administrateur peut les modifier.'}
          </p>
        </div>

        {isLoading && <Loader2 className="w-6 h-6 animate-spin text-[#12b8c9]" />}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" /> Impossible de charger les réglages.
          </div>
        )}

        {settings.length > 0 && (
          <form onSubmit={(e) => { e.preventDefault(); if (changed.length) save.mutate(); }}
            className={`border rounded-2xl divide-y ${card} ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
            {settings.map((s) => {
              const meta = HELP[s.key];
              const isDefault = Number(draft[s.key]) === s.default;
              return (
                <div key={s.key} className="p-5 grid md:grid-cols-[1fr_220px] gap-3 md:gap-6 items-start">
                  <div>
                    <label htmlFor={s.key} className="font-medium">{s.label}</label>
                    <p className={`text-sm mt-1 ${muted}`}>{meta?.help}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <input id={s.key} type="number" inputMode="decimal" min={0} step={meta?.step ?? 1}
                        disabled={!canEdit}
                        value={draft[s.key] ?? ''}
                        onChange={(e) => setDraft((d) => ({ ...d, [s.key]: e.target.value }))}
                        className={`w-full px-3 py-2 rounded-xl text-sm border tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-[#12b8c9] disabled:opacity-60 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                      <span className={`text-sm w-12 ${muted}`}>{meta?.unit}</span>
                    </div>
                    {canEdit && !isDefault && (
                      <button type="button" onClick={() => setDraft((d) => ({ ...d, [s.key]: String(s.default) }))}
                        className={`mt-1.5 inline-flex items-center gap-1 text-xs ${muted} hover:underline`}>
                        <RotateCcw className="w-3 h-3" /> Valeur par défaut ({s.default})
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {canEdit && (
              <div className="p-4 flex items-center justify-end gap-3">
                {changed.length > 0 && <span className={`text-sm ${muted}`}>{changed.length} modification(s) non enregistrée(s)</span>}
                <button type="submit" disabled={!changed.length || save.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[#12b8c9] hover:bg-[#0fa0b0] disabled:opacity-40">
                  {save.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Enregistrer
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
