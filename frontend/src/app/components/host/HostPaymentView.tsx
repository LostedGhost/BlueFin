// components/host/HostPaymentView.tsx
import { useState, useEffect } from 'react';
import { DollarSign, Calendar, CheckCircle, Clock } from 'lucide-react';

export function HostPaymentView({ hostId }: { hostId: string }) {
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      const response = await fetch(`/api/host/payments/stats?hostId=${hostId}`);
      const data = await response.json();
      setPaymentData(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (!paymentData) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-[#e2f5f2]">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-[#00c9a7]" />
            <h3 className="text-sm font-medium text-[#6b7280]}>Total gagné</h3>
          </div>
          <p className="text-2xl font-bold text-[#0f2940]">
            {paymentData.totalAllTime?.toLocaleString() || 0} €
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#e2f5f2]">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-[#00c9a7]" />
            <h3 className="text-sm font-medium text-[#6b7280]}>Cette semaine</h3>
          </div>
          <p className="text-2xl font-bold text-[#0f2940]">
            {paymentData.totalWeekAmount?.toLocaleString() || 0} €
          </p>
          <p className="text-sm text-[#6b7280]">
            {paymentData.weeklyReservations || 0} réservations
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#e2f5f2]">
          <div className="flex items-center gap-2 mb-2">
            {paymentData.isPaid ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <Clock className="w-5 h-5 text-yellow-600" />
            )}
            <h3 className="text-sm font-medium text-[#6b7280]}>Statut</h3>
          </div>
          <p className="text-2xl font-bold text-[#0f2940]">
            {paymentData.isPaid ? '✅ Payé' : '⏳ En attente'}
          </p>
          {paymentData.nextPayoutDate && (
            <p className="text-sm text-[#6b7280]">
              Prochain paiement: {new Date(paymentData.nextPayoutDate).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Historique */}
      <div className="bg-white rounded-2xl border border-[#e2f5f2] p-6">
        <h3 className="font-semibold text-[#0f2940] mb-4">Historique des paiements</h3>
        <div className="space-y-3">
          {paymentData.payments?.map((payment: any) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-3 rounded-xl border border-[#e2f5f2]"
            >
              <div>
                <p className="font-medium text-[#0f2940]">
                  Semaine du {new Date(payment.weekStartDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-[#6b7280]">
                  {payment.reservationsCount} réservations
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-[#0f2940]">
                  {payment.amount.toLocaleString()} €
                </p>
                <span className={`text-sm ${
                  payment.isPaid ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {payment.isPaid ? '✅ Payé' : '⏳ En attente'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}