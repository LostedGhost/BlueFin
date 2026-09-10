// components/admin/AdminPayments.tsx
import { useState, useEffect } from 'react';
import { Calendar, DollarSign, Users, CheckCircle, XCircle } from 'lucide-react';

interface Payment {
  id: string;
  hostId: string;
  hostName: string;
  totalWeekAmount: number;
  totalMonthAmount: number;
  weeklyReservations: number;
  monthlyReservations: number;
  isPaid: boolean;
  lastPayoutDate: string;
  payments: PaymentHistory[];
}

interface PaymentHistory {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  amount: number;
  reservationsCount: number;
  isPaid: boolean;
  paidAt?: string;
  paidBy?: string;
}

export function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState('current');
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/admin/payments/all');
      const data = await response.json();
      setPayments(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (historyId: string, paymentReference: string) => {
    try {
      const response = await fetch('/api/admin/payments/mark-paid', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          historyId,
          adminId: 'admin-id', // Récupérer depuis la session
          paymentReference,
        }),
      });
      
      if (response.ok) {
        await fetchPayments(); // Rafraîchir
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const getTotalPending = () => {
    return payments.reduce((total, p) => {
      const unpaid = p.payments.filter(h => !h.isPaid);
      return total + unpaid.reduce((sum, h) => sum + h.amount, 0);
    }, 0);
  };

  const getTotalPaidThisMonth = () => {
    return payments.reduce((total, p) => {
      const paid = p.payments.filter(h => h.isPaid && h.paidAt);
      return total + paid.reduce((sum, h) => sum + h.amount, 0);
    }, 0);
  };

  const filteredPayments = payments.filter(p => {
    if (filter === 'paid') return p.isPaid;
    if (filter === 'unpaid') return !p.isPaid;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00c9a7]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-[#e2f5f2]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-xl">
              <DollarSign className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="text-sm font-medium text-[#6b7280]">En attente de paiement</h3>
          </div>
          <p className="text-2xl font-bold text-[#0f2940]">
            {getTotalPending().toLocaleString()} €
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#e2f5f2]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-sm font-medium text-[#6b7280]">Déjà payé ce mois</h3>
          </div>
          <p className="text-2xl font-bold text-[#0f2940]">
            {getTotalPaidThisMonth().toLocaleString()} €
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#e2f5f2]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-sm font-medium text-[#6b7280]">Hôtes actifs</h3>
          </div>
          <p className="text-2xl font-bold text-[#0f2940]">
            {payments.length}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'Tous' },
            { value: 'unpaid', label: 'Non payés' },
            { value: 'paid', label: 'Payés' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === option.value
                  ? 'bg-[#00c9a7] text-white'
                  : 'bg-white text-[#6b7280] hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des paiements */}
      <div className="bg-white rounded-2xl border border-[#e2f5f2] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8fffe] border-b border-[#e2f5f2]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0f2940]">Hôte</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0f2940]">Méthode</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-[#0f2940]">Semaine</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-[#0f2940]">Mois</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-[#0f2940]">Réservations</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-[#0f2940]">Statut</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-[#0f2940]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2f5f2]">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-[#f8fffe] transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-[#0f2940]">{payment.hostName}</div>
                    <div className="text-xs text-[#6b7280]">{payment.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[#0f2940]">
                      {payment.paymentMethod === 'MOBILE_MONEY' ? '📱 Mobile Money' :
                       payment.paymentMethod === 'BANK_TRANSFER' ? '🏦 Virement' :
                       '💳 PayPal'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-semibold text-[#0f2940]">
                      {payment.totalWeekAmount.toLocaleString()} €
                    </div>
                    <div className="text-xs text-[#6b7280]">
                      {payment.weeklyReservations} réservations
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-semibold text-[#0f2940]">
                      {payment.totalMonthAmount.toLocaleString()} €
                    </div>
                    <div className="text-xs text-[#6b7280]">
                      {payment.monthlyReservations} réservations
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 text-sm">
                      <Calendar className="w-4 h-4 text-[#6b7280]" />
                      {payment.payments?.length || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {payment.isPaid ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Payé
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                        <XCircle className="w-4 h-4" />
                        En attente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {!payment.isPaid && payment.payments?.some(h => !h.isPaid) && (
                      <button
                        onClick={() => {
                          const historyId = payment.payments.find(h => !h.isPaid)?.id;
                          if (historyId) {
                            const ref = prompt('Numéro de transaction / Référence:');
                            if (ref) markAsPaid(historyId, ref);
                          }
                        }}
                        className="px-4 py-2 bg-[#00c9a7] text-white rounded-xl hover:bg-[#00b898] transition-colors text-sm font-medium"
                      >
                        Marquer payé
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}