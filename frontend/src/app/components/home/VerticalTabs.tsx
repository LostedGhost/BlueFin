import { Building2, Landmark, Compass, Wrench } from 'lucide-react';

export type HomeVertical = 'logements' | 'hotels' | 'experiences' | 'services';

const VERTICALS: { id: HomeVertical; label: string; icon: typeof Building2 }[] = [
  { id: 'logements', label: 'Logements', icon: Building2 },
  { id: 'hotels', label: 'Hôtels', icon: Landmark },
  { id: 'experiences', label: 'Expériences', icon: Compass },
  { id: 'services', label: 'Services', icon: Wrench },
];

export function VerticalTabs({
  active,
  onChange,
}: {
  active: HomeVertical;
  onChange: (v: HomeVertical) => void;
}) {
  return (
    <div className="flex gap-2.5 overflow-x-auto px-4 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {VERTICALS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex-shrink-0 flex items-center gap-2 pl-1.5 pr-4 h-11 rounded-full border transition-all ${
              isActive
                ? 'bg-[#00c9a7] border-[#00c9a7] text-white shadow-sm'
                : 'bg-white border-gray-200 text-[#0f2940] hover:border-[#00c9a7]/50'
            }`}
          >
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                isActive ? 'bg-white/20' : 'bg-[#f4fffe]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#00c9a7]'}`} />
            </span>
            <span className="text-sm font-semibold whitespace-nowrap">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
