// src/app/components/PaymentInfoModal.tsx
import { useState, useEffect } from 'react';
import { X, Pencil, Wallet, Calendar, DollarSign, TrendingUp, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { format, isValid } from 'date-fns';
import hostService from '../../services/host.service';
import toast from 'react-hot-toast';

interface PaymentInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onRefresh?: () => void;
  paymentInfo: {
    id: string;
    fullName: string;
    paymentMethod: string;
    phoneNumber?: string;
    mobileProvider?: string;
    bankName?: string;
    accountHolder?: string;
    iban?: string;
    bic?: string;
    paypalEmail?: string;
    totalWeekAmount: number;
    totalMonthAmount: number;
    totalAllTime: number;
    weeklyReservations: number;
    monthlyReservations: number;
    isPaid: boolean;
    nextPayoutDate?: string;
    lastPayoutDate?: string;
  };
  paymentHistory?: any[];
  loadingHistory?: boolean;
}

// ✅ Fonction utilitaire pour formater les dates en toute sécurité
const safeFormatDate = (date: string | null | undefined, formatStr: string = 'dd/MM/yyyy'): string => {
  if (!date) return 'N/A';
  const parsedDate = new Date(date);
  if (!isValid(parsedDate)) return 'N/A';
  return format(parsedDate, formatStr);
};

export function PaymentInfoModal({ 
  isOpen, 
  onClose, 
  onEdit, 
  onRefresh,
  paymentInfo, 
  paymentHistory: initialHistory = [],
  loadingHistory: initialLoading = false
}: PaymentInfoModalProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>(initialHistory);
  const [loadingHistory, setLoadingHistory] = useState(initialLoading);

  // Charger l'historique quand on l'affiche
  const loadHistory = async () => {
    if (showHistory) return;
    
    setLoadingHistory(true);
    try {
      const response = await hostService.getMyPaymentHistory(12);
      if (response.success) {
        setHistory(response.data || []);
      } else {
        toast.error('❌ Impossible de charger l\'historique');
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
      toast.error('❌ Erreur lors du chargement de l\'historique');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen && showHistory && history.length === 0 && !loadingHistory) {
      loadHistory();
    }
  }, [isOpen, showHistory]);

  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return amount ? amount.toLocaleString() : '0';
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'MOBILE_MONEY': return 'Mobile Money';
      case 'BANK_TRANSFER': return 'Virement bancaire';
      case 'PAYPAL': return 'PayPal';
      default: return method;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'MOBILE_MONEY': return '📱';
      case 'BANK_TRANSFER': return '🏦';
      case 'PAYPAL': return '💳';
      default: return '💰';
    }
  };

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case 'ORANGE': return 'Orange Money';
      case 'MTN': return 'MTN Mobile Money';
      case 'MOOV': return 'Moov Money';
      case 'WAVE': return 'Wave';
      default: return provider;
    }
  };

  const getStatusBadge = (isPaid: boolean) => {
    return isPaid ? (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
        <CheckCircle className="w-4 h-4" />
        À jour
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
        <Clock className="w-4 h-4" />
        En attente
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#0f2940]">Mes informations de paiement</h2>
            <p className="text-sm text-[#6b7280]">Gérez vos coordonnées bancaires et suivez vos paiements</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#f0fdfb] rounded-xl p-4 border border-[#00c9a7]/20">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-[#00c9a7]" />
              <span className="text-xs text-[#6b7280]">Total reçu</span>
            </div>
            <p className="text-xl font-bold text-[#0f2940]">{formatCurrency(paymentInfo.totalAllTime)} FCFA</p>
          </div>
          <div className="bg-[#f0fdfb] rounded-xl p-4 border border-[#00c9a7]/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-[#00c9a7]" />
              <span className="text-xs text-[#6b7280]">Cette semaine</span>
            </div>
            <p className="text-xl font-bold text-[#0f2940]">{formatCurrency(paymentInfo.totalWeekAmount)} FCFA</p>
            <p className="text-xs text-[#6b7280]">{paymentInfo.weeklyReservations || 0} réservations</p>
          </div>
          <div className="bg-[#f0fdfb] rounded-xl p-4 border border-[#00c9a7]/20">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-[#00c9a7]" />
              <span className="text-xs text-[#6b7280]">Prochain paiement</span>
            </div>
            <p className="text-xl font-bold text-[#0f2940]">
              {safeFormatDate(paymentInfo.nextPayoutDate)}
            </p>
            <div className="mt-1">{getStatusBadge(paymentInfo.isPaid)}</div>
          </div>
        </div>

        {/* Informations de paiement */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-[#0f2940] mb-3 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#00c9a7]" />
            Coordonnées bancaires
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-[#6b7280]">Méthode</p>
              <p className="font-medium">{getMethodIcon(paymentInfo.paymentMethod)} {getMethodLabel(paymentInfo.paymentMethod)}</p>
            </div>
            <div>
              <p className="text-xs text-[#6b7280]">Bénéficiaire</p>
              <p className="font-medium">{paymentInfo.fullName || 'N/A'}</p>
            </div>
            
            {paymentInfo.paymentMethod === 'MOBILE_MONEY' && (
              <>
                <div>
                  <p className="text-xs text-[#6b7280]">Numéro de téléphone</p>
                  <p className="font-medium">{paymentInfo.phoneNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6b7280]">Opérateur</p>
                  <p className="font-medium">{getProviderLabel(paymentInfo.mobileProvider || '') || 'N/A'}</p>
                </div>
              </>
            )}

            {paymentInfo.paymentMethod === 'BANK_TRANSFER' && (
              <>
                <div>
                  <p className="text-xs text-[#6b7280]">Nom de la banque</p>
                  <p className="font-medium">{paymentInfo.bankName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6b7280]">Titulaire du compte</p>
                  <p className="font-medium">{paymentInfo.accountHolder || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-[#6b7280]">IBAN</p>
                  <p className="font-medium font-mono text-sm">{paymentInfo.iban || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6b7280]">BIC / SWIFT</p>
                  <p className="font-medium font-mono">{paymentInfo.bic || 'N/A'}</p>
                </div>
              </>
            )}

            {paymentInfo.paymentMethod === 'PAYPAL' && (
              <div className="col-span-2">
                <p className="text-xs text-[#6b7280]">Email PayPal</p>
                <p className="font-medium">{paymentInfo.paypalEmail || 'N/A'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onEdit}
            className="flex-1 px-4 py-3 bg-[#00c9a7] text-white rounded-xl hover:bg-[#00b898] transition flex items-center justify-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            Modifier mes coordonnées
          </button>
          <button
            onClick={async () => {
              const newState = !showHistory;
              setShowHistory(newState);
              if (newState && history.length === 0) {
                await loadHistory();
              }
            }}
            className="flex-1 px-4 py-3 border border-[#e2f5f2] rounded-xl text-[#0f2940] hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            {showHistory ? 'Cacher l\'historique' : 'Voir l\'historique'}
          </button>
        </div>

        {/* Historique des paiements */}
        {showHistory && (
          <div className="mt-4 border-t border-[#e2f5f2] pt-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-sm text-[#0f2940]">Historique des paiements</h4>
              <button
                onClick={async () => {
                  setLoadingHistory(true);
                  await loadHistory();
                  setLoadingHistory(false);
                }}
                className="text-xs text-[#00c9a7] hover:underline flex items-center gap-1"
                disabled={loadingHistory}
              >
                <RefreshCw className={`w-3 h-3 ${loadingHistory ? 'animate-spin' : ''}`} />
                Rafraîchir
              </button>
            </div>
            
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00c9a7]"></div>
                <span className="ml-3 text-sm text-[#6b7280]">Chargement...</span>
              </div>
            ) : history.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {history.map((historyItem: any, idx: number) => {
                  // ✅ Vérification de la date
                  const weekStart = historyItem.weekStartDate ? new Date(historyItem.weekStartDate) : null;
                  const isDateValid = weekStart && !isNaN(weekStart.getTime());
                  
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-[#0f2940]">
                          Semaine du {isDateValid ? format(weekStart, 'dd/MM/yyyy') : 'Date inconnue'}
                        </p>
                        <p className="text-xs text-[#6b7280]">{historyItem.reservationsCount || 0} réservations</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(historyItem.amount)} FCFA</p>
                        <span className={`text-xs ${historyItem.isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                          {historyItem.isPaid ? '✅ Payé' : '⏳ En attente'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-[#6b7280] py-4 text-sm">
                Aucun historique de paiement disponible
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-[#6b7280] text-center mt-4">
          🔒 Vos informations sont sécurisées et ne seront utilisées que pour les paiements.
        </p>
      </div>
    </div>
  );
}