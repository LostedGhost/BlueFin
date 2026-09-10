// components/admin/MetricCard.tsx
export function MetricCard({ 
  title, value, subtitle, color, icon, stars 
}: {
  title: string;
  value: string;
  subtitle: string;
  color: 'indigo' | 'emerald' | 'rose' | 'amber';
  icon: React.ReactNode;
  stars?: boolean;
}) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-lg border border-gray-100">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-lg sm:text-xl font-bold text-[#0f2940]">{value}</p>
          <p className="text-xs text-gray-500">{title}</p>
          <p className="text-xs text-gray-400">{subtitle}</p>
          {stars && (
            <div className="flex text-yellow-400 text-sm mt-1">★★★★★</div>
          )}
        </div>
      </div>
    </div>
  );
}