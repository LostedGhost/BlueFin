// components/PaymentStatusBadge.tsx
export const PaymentStatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
    success: { label: 'Payé ✅', color: 'bg-green-100 text-green-700' },
    failed: { label: 'Échoué ❌', color: 'bg-red-100 text-red-700' },
    cancelled: { label: 'Annulé', color: 'bg-gray-100 text-gray-700' }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};