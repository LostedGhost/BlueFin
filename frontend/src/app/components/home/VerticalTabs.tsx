import { Building2, Compass, Wrench } from 'lucide-react';

export type HomeVertical = 'logements' | 'hotels' | 'experiences' | 'services';

const VERTICALS: { id: HomeVertical; label: string; icon: typeof Building2 }[] = [
  { id: 'logements', label: 'Logements', icon: Building2 },
  // « Hôtels » retiré de l'accueil mobile à la demande du client : les hôtels
  // restent des logements, visibles dans l'onglet Logements.
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
    // pl-4 (et non un élément espaceur) pour l'inset de gauche : un espaceur
    // s'additionnerait au `gap` et décalerait la première pilule de 24px au
    // lieu de 16px, la désalignant des cartes et des titres de section.
    <div className="flex gap-2 overflow-x-auto pl-4 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {VERTICALS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex-shrink-0 flex items-center gap-1.5 pl-1 pr-3 h-8 rounded-full border transition-all ${
              isActive
                ? 'bg-[#00c9a7] border-[#00c9a7] text-white'
                : 'bg-transparent border-gray-200 text-[#0f2940]/80 hover:border-[#00c9a7]/50'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                isActive ? 'bg-white/20' : 'bg-[#f4fffe]'
              }`}
            >
              <Icon className={`w-3 h-3 ${isActive ? 'text-white' : 'text-[#00c9a7]'}`} />
            </span>
            <span className="text-[13px] font-medium whitespace-nowrap">{label}</span>
          </button>
        );
      })}
      <div className="w-4 flex-shrink-0" aria-hidden="true" />
    </div>
  );
}
