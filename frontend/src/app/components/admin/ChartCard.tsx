// components/admin/ChartCard.tsx
export function ChartCard({ 
  title, icon, children, action 
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 md:p-5 shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-base md:text-lg flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}