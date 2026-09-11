import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import hostService from '../../services/host.service';
import toast from 'react-hot-toast';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PaymentMethodModal({ isOpen, onClose, onSuccess }: PaymentMethodModalProps) {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'MOBILE_MONEY' | 'BANK_TRANSFER' | 'PAYPAL'>('MOBILE_MONEY');
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    mobileProvider: '',
    bankName: '',
    accountHolder: '',
    iban: '',
    bic: '',
    paypalEmail: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Vérifier que l'utilisateur est connecté
      if (!user?.id) {
        toast.error('❌ Vous devez être connecté');
        return;
      }

      // Préparer les données pour l'API
      const payload = {
        paymentMethod: paymentMethod,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber || undefined,
        mobileProvider: formData.mobileProvider as 'ORANGE' | 'MTN' | 'MOOV' | 'WAVE' | undefined,
        bankName: formData.bankName || undefined,
        accountHolder: formData.accountHolder || undefined,
        iban: formData.iban || undefined,
        bic: formData.bic || undefined,
        paypalEmail: formData.paypalEmail || undefined,
      };

      // Appel API pour sauvegarder les infos de paiement
      const response = await hostService.updateMyPaymentInfo(payload);
      
      if (response.success) {
        setSuccess(true);
        toast.success('✅ Moyen de paiement enregistré avec succès !');
        
        setTimeout(() => {
          setSuccess(false);
          onClose();
          if (onSuccess) onSuccess();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement:', error);
      toast.error(`❌ ${error?.response?.data?.message || 'Erreur lors de l\'enregistrement'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPaymentForm = () => {
    switch (paymentMethod) {
      case 'BANK_TRANSFER':
        return (
          <div className="space-y-4">
            <div className="bg-[#f0fdfb] p-4 rounded-xl border border-[#00c9a7]/20">
              <label className="block text-sm font-medium text-[#0f2940] mb-1">
                Nom du bénéficiaire <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-[#6b7280] mb-2">
                👤 Ce nom apparaîtra sur les virements reçus
              </p>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-2 border border-[#e2f5f2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c9a7] bg-white"
                placeholder="Ex: Jean Dupont"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0f2940] mb-1">
                Nom de la banque <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full px-4 py-2 border border-[#e2f5f2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c9a7]"
                placeholder="Ex: Société Générale"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0f2940] mb-1">
                Titulaire du compte <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.accountHolder}
                onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                className="w-full px-4 py-2 border border-[#e2f5f2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c9a7]"
                placeholder="Nom complet du titulaire"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0f2940] mb-1">
                IBAN <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-[#e2f5f2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c9a7] uppercase"
                placeholder="FR76 1234 5678 9012 3456 7890 123"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0f2940] mb-1">
                BIC / SWIFT <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.bic}
                onChange={(e) => setFormData({ ...formData, bic: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-[#e2f5f2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c9a7] uppercase"
                placeholder="Ex: SOGEFRPP"
                required
              />
            </div>
          </div>
        );

      case 'MOBILE_MONEY':
        return (
          <div className="space-y-4">
            <div className="bg-[#f0fdfb] p-4 rounded-xl border border-[#00c9a7]/20">
              <label className="block text-sm font-medium text-[#0f2940] mb-1">
                Nom du bénéficiaire <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-[#6b7280] mb-2">
                👤 Ce nom apparaîtra sur les transactions Mobile Money
              </p>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-2 border border-[#e2f5f2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c9a7] bg-white"
                placeholder="Ex: Jean Dupont"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0f2940] mb-1">
                Numéro de téléphone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-4 py-2 border border-[#e2f5f2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c9a7]"
                placeholder="+229 61 12 34 56"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0f2940] mb-1">
                Opérateur Mobile Money <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.mobileProvider}
                onChange={(e) => setFormData({ ...formData, mobileProvider: e.target.value })}
                className="w-full px-4 py-2 border border-[#e2f5f2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c9a7] bg-white"
                required
              >
                <option value="">Sélectionnez un opérateur</option>
                <option value="ORANGE">🟧 Orange Money</option>
                <option value="MTN">🟨 MTN Mobile Money</option>
                <option value="MOOV">🟦 Moov Money</option>
                <option value="WAVE">🟩 Wave</option>
              </select>
            </div>
          </div>
        );

      case 'PAYPAL':
        return (
          <div className="space-y-4">
            <div className="bg-[#f0fdfb] p-4 rounded-xl border border-[#00c9a7]/20">
              <label className="block text-sm font-medium text-[#0f2940] mb-1">
                Nom du bénéficiaire <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-[#6b7280] mb-2">
                👤 Ce nom apparaîtra sur les transactions PayPal
              </p>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-2 border border-[#e2f5f2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c9a7] bg-white"
                placeholder="Ex: Jean Dupont"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0f2940] mb-1">
                Email PayPal <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.paypalEmail}
                onChange={(e) => setFormData({ ...formData, paypalEmail: e.target.value })}
                className="w-full px-4 py-2 border border-[#e2f5f2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c9a7]"
                placeholder="exemple@paypal.com"
                required
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-[#0f2940]">
            Moyens de paiement
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-[#0f2940]">
              Moyen de paiement enregistré !
            </p>
            <p className="text-sm text-[#6b7280] mt-2">
              Vous recevrez vos paiements chaque lundi
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Sélection du type de paiement */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#0f2940] mb-2">
                Choisissez votre méthode de réception
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'MOBILE_MONEY', label: 'Mobile Money', icon: '📱' },
                  { value: 'BANK_TRANSFER', label: 'Virement', icon: '🏦' },
                  { value: 'PAYPAL', label: 'PayPal', icon: '💳' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPaymentMethod(option.value as any)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      paymentMethod === option.value
                        ? 'border-[#00c9a7] bg-[#f0fdfb] shadow-sm'
                        : 'border-[#e2f5f2] hover:border-[#00c9a7]'
                    }`}
                  >
                    <div className="text-2xl mb-1">{option.icon}</div>
                    <span className="text-xs font-medium text-[#0f2940] block">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Formulaire selon la méthode choisie */}
            {renderPaymentForm()}

            {/* Résumé des infos */}
            <div className="mt-4 p-3 bg-[#f0fdfb] rounded-xl border border-[#00c9a7]/20">
              <p className="text-xs text-[#6b7280]">
                <span className="font-semibold">💡 Information :</span> Vous recevrez le transfert de vos réservations 
                <span className="font-medium text-[#0f2940]"> chaque lundi</span> sur le moyen de paiement sélectionné.
              </p>
            </div>

            {/* Boutons */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-[#e2f5f2] rounded-xl text-[#6b7280] hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.fullName}
                className="flex-1 px-4 py-2 bg-[#00c9a7] text-white rounded-xl hover:bg-[#00b898] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </button>
            </div>

            <p className="text-xs text-[#6b7280] text-center mt-4">
              🔒 Vos informations sont sécurisées et ne seront utilisées que pour les paiements.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}