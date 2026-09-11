// src/app/pages/admin/AdminHostPaymentsPage.tsx
//
// Versements aux hôtes. La plateforme n'envoie pas l'argent elle-même :
// l'admin fait le transfert (Mobile Money / virement) hors plateforme, puis le
// déclare ici avec la référence de la transaction. Voir
// backend/app/Http/Controllers/Api/Admin/HostPayoutController.php.
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  Wallet, Search, CheckCircle, Clock, AlertCircle, RefreshCw, Download, Loader2, X,
  Users, Undo2, Ban, Pencil, PlusCircle, TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import adminService, {
  type HostPayout, type HostPayoutAccount, type HostWithBalance,
} from '../../../services/admin.service';

const fcfa = (n: number | null | undefined) =>
  `${new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)).replace(/[  ]/g, ' ')} FCFA`;

const dateFr = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const errorMessage = (error: any) => {
  const errors = error?.response?.data?.errors;
  if (errors) return Object.values(errors).flat().join(' ');
  return error?.response?.data?.message || error?.message || 'Erreur inattendue';
};

type Tab = 'payouts' | 'hosts';
type StatusFilter = 'open' | 'completed' | 'failed' | 'all';
type ActionDialog =
  | { kind: 'mark-paid'; payout: HostPayout }
  | { kind: 'cancel'; payout: HostPayout }
  | { kind: 'undo'; payout: HostPayout }
  | { kind: 'account'; host: HostWithBalance }
  | null;

export function AdminHostPaymentsPage(_props: { onNavigate?: unknown }) {
  const { isDark } = useTheme();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('payouts');
  const [status, setStatus] = useState<StatusFilter>('open');
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState<ActionDialog>(null);

  const card = isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';
  const strong = isDark ? 'text-white' : 'text-slate-800';

  const statsQuery = useQuery({
    queryKey: ['host-payouts', 'stats'],
    queryFn: () => adminService.getHostPayoutStats(),
  });
  const payoutsQuery = useQuery({
    queryKey: ['host-payouts', 'list', status, search],
    queryFn: () => adminService.getHostPayouts({
      status: status === 'all' ? undefined : status,
      search: search || undefined,
      per_page: 100,
    }),
    enabled: tab === 'payouts',
  });
  const hostsQuery = useQuery({
    queryKey: ['host-payouts', 'hosts', search],
    queryFn: () => adminService.getHostsWithBalance({ search }),
    enabled: tab === 'hosts',
  });

  const refreshAll = () => queryClient.invalidateQueries({ queryKey: ['host-payouts'] });

  const generate = useMutation({
    mutationFn: (hostId?: number) => adminService.generateHostPayouts(hostId),
    onSuccess: (res) => {
      toast.success(res.message, { duration: 6000 });
      refreshAll();
      setTab('payouts');
      setStatus('open');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const exportCsv = async () => {
    try {
      const blob = await adminService.exportHostPayouts({
        status: status === 'all' ? undefined : status,
        search: search || undefined,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `versements-hotes-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const stats = statsQuery.data?.data;
  const payouts = payoutsQuery.data?.data?.data ?? [];
  const hosts = hostsQuery.data?.data ?? [];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'} p-4 md:p-6 lg:p-8`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className={`text-2xl md:text-3xl font-bold flex items-center gap-2 ${strong}`}>
              <Wallet className="w-6 h-6 text-[#00c9a7]" />
              Paiements Hôtes
            </h1>
            <p className={`text-sm mt-1 max-w-2xl ${muted}`}>
              Envoyez l'argent à l'hôte (Mobile Money ou virement), puis déclarez-le ici avec la référence de la transaction.
              {stats && <> Commission actuelle : <strong className="whitespace-nowrap">{stats.commission_rate} %</strong>, minimum de versement : <strong className="whitespace-nowrap">{fcfa(stats.min_payout_amount)}</strong>.</>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={refreshAll} className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-sm ${card} ${muted}`}>
              <RefreshCw className="w-4 h-4" /> Rafraîchir
            </button>
            <button onClick={exportCsv} className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-sm ${card} ${muted}`}>
              <Download className="w-4 h-4" /> Exporter (CSV)
            </button>
            <button
              onClick={() => generate.mutate(undefined)}
              disabled={generate.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#00c9a7] hover:bg-[#00b396] disabled:opacity-60"
              title="Crée un versement « à verser » pour chaque hôte dont le solde dû atteint le minimum"
            >
              {generate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
              Préparer les versements dus
            </button>
          </div>
        </div>

        {/* Chiffres clés */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat isDark={isDark} icon={Clock} tone="amber" label="À verser"
            value={stats ? fcfa(stats.open_total) : '…'}
            hint={stats ? `${stats.open_count} versement(s) en attente${stats.overdue_count ? ` · ${stats.overdue_count} en retard` : ''}` : ''} />
          <Stat isDark={isDark} icon={Wallet} tone="teal" label="Dû, pas encore préparé"
            value={stats ? fcfa(stats.owed_total) : '…'}
            hint={stats ? `${stats.hosts_owed} hôte(s) concerné(s)` : ''} />
          <Stat isDark={isDark} icon={CheckCircle} tone="green" label="Versé ce mois"
            value={stats ? fcfa(stats.paid_this_month) : '…'} hint="Versements déclarés effectués" />
          <Stat isDark={isDark} icon={TrendingUp} tone="slate" label="Commissions plateforme"
            value={stats ? fcfa(stats.commission_total) : '…'}
            hint={stats ? `${stats.hosts_count} hôtes · ${stats.hosts_without_account} sans coordonnées` : ''} />
        </div>

        {statsQuery.isError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" /> {errorMessage(statsQuery.error)}
          </div>
        )}

        {/* Onglets + filtres */}
        <div className={`border rounded-2xl ${card}`}>
          <div className={`flex flex-col md:flex-row md:items-center gap-3 p-3 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
            <div className={`inline-flex p-1 rounded-xl ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}>
              {([['payouts', 'Versements'], ['hosts', 'Hôtes et soldes']] as const).map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${tab === key
                    ? (isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-900 shadow-sm')
                    : muted}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${muted}`} />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={tab === 'payouts' ? 'Hôte, téléphone ou référence…' : 'Nom, e-mail ou téléphone…'}
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#00c9a7] ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
            </div>
            {tab === 'payouts' && (
              <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}
                className={`px-3 py-2 rounded-xl text-sm border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}>
                <option value="open">À verser</option>
                <option value="completed">Versés</option>
                <option value="failed">Annulés</option>
                <option value="all">Tous</option>
              </select>
            )}
          </div>

          <div className="overflow-x-auto">
            {tab === 'payouts'
              ? <PayoutsTable isDark={isDark} loading={payoutsQuery.isLoading} error={payoutsQuery.error}
                  payouts={payouts} onAction={setDialog} />
              : <HostsTable isDark={isDark} loading={hostsQuery.isLoading} error={hostsQuery.error}
                  hosts={hosts} onEditAccount={(host) => setDialog({ kind: 'account', host })}
                  onGenerate={(host) => generate.mutate(host.id)} generating={generate.isPending}
                  minimum={stats?.min_payout_amount ?? 0} />}
          </div>
        </div>
      </div>

      {dialog && (dialog.kind === 'account'
        ? <AccountDialog isDark={isDark} host={dialog.host} onClose={() => setDialog(null)} onSaved={refreshAll} />
        : <PayoutActionDialog isDark={isDark} dialog={dialog} onClose={() => setDialog(null)} onDone={refreshAll} />)}
    </div>
  );
}

// ============================================================

function Stat({ icon: Icon, label, value, hint, tone, isDark }: {
  icon: typeof Wallet; label: string; value: string; hint: string;
  tone: 'amber' | 'teal' | 'green' | 'slate'; isDark: boolean;
}) {
  const tones = {
    amber: 'text-amber-600 bg-amber-50',
    teal: 'text-[#00806b] bg-[#f4fffe]',
    green: 'text-emerald-600 bg-emerald-50',
    slate: 'text-slate-600 bg-slate-100',
  };
  return (
    <div className={`border rounded-2xl p-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tones[tone]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className={`text-xs mt-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
      <p className={`text-lg font-bold mt-0.5 tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
      <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{hint}</p>
    </div>
  );
}

function StatusBadge({ payout }: { payout: HostPayout }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    processing: 'bg-amber-100 text-amber-800',
    completed: 'bg-emerald-100 text-emerald-800',
    failed: 'bg-slate-200 text-slate-700',
  };
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[payout.status]}`}>{payout.status_label}</span>
      {payout.is_overdue && <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-700">En retard</span>}
    </span>
  );
}

function TableState({ loading, error, empty, colSpan, isDark }: {
  loading: boolean; error: unknown; empty: string; colSpan: number; isDark: boolean;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className={`px-4 py-10 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#00c9a7]" />
          : error ? <span className="text-red-600">{errorMessage(error)}</span>
          : empty}
      </td>
    </tr>
  );
}

function PayoutsTable({ payouts, loading, error, isDark, onAction }: {
  payouts: HostPayout[]; loading: boolean; error: unknown; isDark: boolean; onAction: (d: ActionDialog) => void;
}) {
  const th = `px-4 py-3 text-left text-xs font-medium uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`;
  const td = `px-4 py-3 text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`;
  return (
    <table className="w-full min-w-[900px]">
      <thead className={isDark ? 'bg-slate-900/40' : 'bg-slate-50'}>
        <tr>
          <th className={th}>Hôte</th><th className={th}>Montant</th><th className={th}>Envoyer sur</th>
          <th className={th}>Créé le</th><th className={th}>Statut</th><th className={th}>Suivi</th>
          <th className={`${th} text-right`}>Actions</th>
        </tr>
      </thead>
      <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
        {loading || error || payouts.length === 0
          ? <TableState loading={loading} error={error} colSpan={7} isDark={isDark}
              empty="Aucun versement dans cette vue. « Préparer les versements dus » crée ceux des hôtes ayant un solde." />
          : payouts.map((p) => (
            <tr key={p.id}>
              <td className={td}>
                <p className="font-medium">{p.host?.name ?? '—'}</p>
                <p className="text-xs opacity-70">{p.host?.phone}</p>
              </td>
              <td className={`${td} font-semibold tabular-nums whitespace-nowrap`}>{fcfa(p.amount)}</td>
              <td className={td}>
                <p>{p.method === 'mobile_money' ? 'Mobile Money' : 'Virement'}</p>
                <p className="text-xs font-mono opacity-80">{p.destination || '—'}</p>
                {p.beneficiary && <p className="text-xs opacity-70">au nom de {p.beneficiary}</p>}
              </td>
              <td className={`${td} whitespace-nowrap`}>
                {dateFr(p.created_at)}
                <p className="text-xs opacity-70">{p.origin === 'host_request' ? 'Demandé par l\'hôte' : 'Préparé par l\'admin'}</p>
              </td>
              <td className={td}><StatusBadge payout={p} /></td>
              <td className={`${td} text-xs`}>
                {p.status === 'completed' && <>Réf. <span className="font-mono">{p.payment_reference}</span><br />{dateFr(p.processed_at)}{p.paid_by && ` · ${p.paid_by}`}</>}
                {p.status === 'failed' && <span title={p.failure_reason ?? ''}>Motif : {p.failure_reason}</span>}
                {p.undo_count > 0 && <p className="text-amber-600">Remis en attente {p.undo_count} fois</p>}
              </td>
              <td className={`${td} text-right whitespace-nowrap`}>
                {(p.status === 'pending' || p.status === 'processing') && (
                  <div className="inline-flex gap-1.5">
                    <button onClick={() => onAction({ kind: 'mark-paid', payout: p })}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700">
                      <CheckCircle className="w-3.5 h-3.5" /> Marquer versé
                    </button>
                    <button onClick={() => onAction({ kind: 'cancel', payout: p })} title="Annuler ce versement"
                      className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                      <Ban className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {p.status === 'completed' && (
                  <button onClick={() => onAction({ kind: 'undo', payout: p })}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                    <Undo2 className="w-3.5 h-3.5" /> Remettre en attente
                  </button>
                )}
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

function HostsTable({ hosts, loading, error, isDark, onEditAccount, onGenerate, generating, minimum }: {
  hosts: HostWithBalance[]; loading: boolean; error: unknown; isDark: boolean;
  onEditAccount: (h: HostWithBalance) => void; onGenerate: (h: HostWithBalance) => void;
  generating: boolean; minimum: number;
}) {
  const th = `px-4 py-3 text-left text-xs font-medium uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`;
  const td = `px-4 py-3 text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`;
  return (
    <table className="w-full min-w-[900px]">
      <thead className={isDark ? 'bg-slate-900/40' : 'bg-slate-50'}>
        <tr>
          <th className={th}>Hôte</th><th className={th}>Gagné (net)</th><th className={th}>Déjà versé</th>
          <th className={th}>En attente</th><th className={th}>Dû</th><th className={th}>Coordonnées</th>
          <th className={`${th} text-right`}>Actions</th>
        </tr>
      </thead>
      <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
        {loading || error || hosts.length === 0
          ? <TableState loading={loading} error={error} colSpan={7} isDark={isDark} empty="Aucun hôte trouvé." />
          : hosts.map((h) => (
            <tr key={h.id}>
              <td className={td}>
                <p className="font-medium flex items-center gap-1.5"><Users className="w-3.5 h-3.5 opacity-60" />{h.name}</p>
                <p className="text-xs opacity-70">{h.email} · {h.phone}</p>
              </td>
              <td className={`${td} tabular-nums whitespace-nowrap`} title={`Brut ${fcfa(h.balance.gross)} − commission ${h.balance.commission_rate} %`}>
                {fcfa(h.balance.net)}
              </td>
              <td className={`${td} tabular-nums whitespace-nowrap`}>
                {fcfa(h.balance.paid)}
                {h.last_paid_at && <p className="text-xs opacity-70">dernier : {dateFr(h.last_paid_at)}</p>}
              </td>
              <td className={`${td} tabular-nums whitespace-nowrap`}>{fcfa(h.balance.open)}</td>
              <td className={`${td} font-semibold tabular-nums whitespace-nowrap ${h.balance.owed > 0 ? 'text-[#00806b]' : ''}`}>
                {fcfa(h.balance.owed)}
              </td>
              <td className={td}>
                {h.account
                  ? <><p>{h.account.payment_method === 'mobile_money' ? 'Mobile Money' : 'Virement'}</p>
                      <p className="text-xs font-mono opacity-80">{h.account.destination}</p></>
                  : <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">À renseigner</span>}
              </td>
              <td className={`${td} text-right whitespace-nowrap`}>
                <div className="inline-flex gap-1.5">
                  <button onClick={() => onEditAccount(h)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border ${isDark ? 'border-slate-600 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <Pencil className="w-3.5 h-3.5" /> Coordonnées
                  </button>
                  <button onClick={() => onGenerate(h)}
                    disabled={generating || !h.account || h.balance.owed <= 0 || h.balance.owed < minimum}
                    title={!h.account ? 'Renseignez d\'abord les coordonnées' : h.balance.owed < minimum ? `Solde inférieur au minimum (${fcfa(minimum)})` : 'Préparer le versement du solde dû'}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#00c9a7] hover:bg-[#00b396] disabled:opacity-40 disabled:cursor-not-allowed">
                    <PlusCircle className="w-3.5 h-3.5" /> Préparer
                  </button>
                </div>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

// ============================================================

function Modal({ title, subtitle, isDark, onClose, children }: {
  title: string; subtitle?: string; isDark: boolean; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-xl ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'}`}>
        <div className="flex justify-between items-start gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            {subtitle && <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Fermer" className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputClass = (isDark: boolean) =>
  `w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#00c9a7] ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'}`;

function PayoutActionDialog({ dialog, isDark, onClose, onDone }: {
  dialog: Exclude<ActionDialog, null | { kind: 'account' }>; isDark: boolean; onClose: () => void; onDone: () => void;
}) {
  const [value, setValue] = useState('');
  const { payout } = dialog;

  const config = {
    'mark-paid': {
      title: 'Déclarer le versement effectué',
      label: 'Référence de la transaction (Mobile Money ou virement)',
      placeholder: 'ex. MP240911.1532.A12345',
      min: 3,
      button: 'Confirmer le versement',
      run: () => adminService.markHostPayoutPaid(payout.id, value.trim()),
    },
    cancel: {
      title: 'Annuler ce versement',
      label: 'Motif (le montant redevient dû à l\'hôte)',
      placeholder: 'ex. numéro Mobile Money erroné',
      min: 5,
      button: 'Annuler le versement',
      run: () => adminService.cancelHostPayout(payout.id, value.trim()),
    },
    undo: {
      title: 'Remettre en attente',
      label: 'Motif de la correction',
      placeholder: 'ex. transfert refusé par l\'opérateur',
      min: 5,
      button: 'Remettre en attente',
      run: () => adminService.undoHostPayout(payout.id, value.trim()),
    },
  }[dialog.kind];

  const mutation = useMutation({
    mutationFn: config.run,
    onSuccess: (res) => { toast.success(res.message); onDone(); onClose(); },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Modal title={config.title} subtitle={`${payout.host?.name ?? ''} · ${fcfa(payout.amount)}`} isDark={isDark} onClose={onClose}>
      {dialog.kind === 'mark-paid' && (
        <div className={`mb-4 p-3 rounded-xl text-sm ${isDark ? 'bg-slate-900' : 'bg-[#f4fffe]'}`}>
          <p>Envoyer <strong>{fcfa(payout.amount)}</strong> par {payout.method === 'mobile_money' ? 'Mobile Money' : 'virement'} à :</p>
          <p className="font-mono mt-1">{payout.destination || '—'}</p>
          {payout.beneficiary && <p className="text-xs mt-1 opacity-80">au nom de {payout.beneficiary}</p>}
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); if (value.trim().length >= config.min) mutation.mutate(); }}>
        <label className="block text-sm font-medium mb-1.5">{config.label}</label>
        <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder={config.placeholder} className={inputClass(isDark)} />
        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className={`px-4 py-2 rounded-xl text-sm ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>Retour</button>
          <button type="submit" disabled={mutation.isPending || value.trim().length < config.min}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 ${dialog.kind === 'mark-paid' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-700 hover:bg-slate-800'}`}>
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} {config.button}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AccountDialog({ host, isDark, onClose, onSaved }: {
  host: HostWithBalance; isDark: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<HostPayoutAccount>(host.account ?? {
    payment_method: 'mobile_money', full_name: host.name, phone_number: host.phone ?? '',
    mobile_provider: 'MTN', bank_name: '', account_holder: '', iban: '', bic: '',
  });
  const set = (key: keyof HostPayoutAccount) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const mutation = useMutation({
    mutationFn: () => adminService.saveHostPayoutAccount(host.id, form),
    onSuccess: (res) => { toast.success(res.message); onSaved(); onClose(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const field = 'block text-sm font-medium mb-1.5';

  return (
    <Modal title="Coordonnées de versement" subtitle={host.name} isDark={isDark} onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
        <div>
          <label className={field}>Moyen de versement</label>
          <select value={form.payment_method} onChange={set('payment_method')} className={inputClass(isDark)}>
            <option value="mobile_money">Mobile Money</option>
            <option value="bank_transfer">Virement bancaire</option>
          </select>
        </div>
        <div>
          <label className={field}>Nom du bénéficiaire</label>
          <input required value={form.full_name} onChange={set('full_name')} className={inputClass(isDark)} />
        </div>
        {form.payment_method === 'mobile_money' ? (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={field}>Opérateur</label>
              <select value={form.mobile_provider ?? 'MTN'} onChange={set('mobile_provider')} className={inputClass(isDark)}>
                <option value="MTN">MTN</option><option value="Moov">Moov</option><option value="Celtiis">Celtiis</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className={field}>Numéro</label>
              <input required value={form.phone_number ?? ''} onChange={set('phone_number')} inputMode="tel" className={inputClass(isDark)} />
            </div>
          </div>
        ) : (
          <>
            <div>
              <label className={field}>Banque</label>
              <input required value={form.bank_name ?? ''} onChange={set('bank_name')} className={inputClass(isDark)} />
            </div>
            <div>
              <label className={field}>IBAN / RIB</label>
              <input required value={form.iban ?? ''} onChange={set('iban')} className={`${inputClass(isDark)} font-mono`} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={field}>Titulaire du compte</label>
                <input value={form.account_holder ?? ''} onChange={set('account_holder')} className={inputClass(isDark)} />
              </div>
              <div>
                <label className={field}>BIC (facultatif)</label>
                <input value={form.bic ?? ''} onChange={set('bic')} className={`${inputClass(isDark)} font-mono`} />
              </div>
            </div>
          </>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={`px-4 py-2 rounded-xl text-sm ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>Retour</button>
          <button type="submit" disabled={mutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#00c9a7] hover:bg-[#00b396] disabled:opacity-50">
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Enregistrer
          </button>
        </div>
      </form>
    </Modal>
  );
}
