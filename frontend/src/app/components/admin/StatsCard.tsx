// components/admin/StatsCard.tsx
export function StatsCard({ 
  icon, title, value, subValue, trend, color, animated 
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subValue: string;
  trend?: number;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  animated?: boolean;
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className={`bg-white rounded-2xl p-4 sm:p-5 shadow-lg border border-gray-100 transition-all duration-500 ${animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex justify-between items-start">
        <div className={`p-2 rounded-xl ${colors[color]}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend > 0 ? 'text-green-500' : 'text-red-500'} bg-gray-50 px-2 py-1 rounded-full`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-[#0f2940] mt-3">{value}</p>
      <p className="text-xs sm:text-sm text-gray-500 mt-1">{title}</p>
      <p className="text-xs text-gray-400 mt-1">{subValue}</p>
    </div>
  );
}