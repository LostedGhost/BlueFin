import { useEffect, useRef, useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import Logo from '../../assets/Bluefin Immo_01.jpg.jpeg';
import { BENIN_CITIES } from '../../constants/destinations';

export function HomeMobileHeader({ onNavigate }: { onNavigate?: (route: any) => void }) {
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setCityMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const goToCity = (city: string) => {
    setCityMenuOpen(false);
    onNavigate?.({ name: 'search-logements', search: `destination=${encodeURIComponent(city)}` });
  };

  return (
    <div className="flex items-center justify-between px-4 pt-3 pb-2">
      <button onClick={() => onNavigate?.({ name: 'home' })} className="flex items-center gap-2">
        <img src={Logo} alt="Bluefin Immo" className="w-8 h-8 rounded-lg object-contain" />
        <span className="font-semibold text-[#0f2940]">Bluefin-Immo</span>
      </button>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setCityMenuOpen((v) => !v)}
          className="flex items-center gap-1.5 bg-[#f4fffe] border border-[#e2f5f2] rounded-full pl-3 pr-2.5 py-1.5"
        >
          <MapPin className="w-3.5 h-3.5 text-[#00c9a7]" />
          <span className="text-xs font-medium text-[#0f2940]">Bénin</span>
          <ChevronDown className={`w-3 h-3 text-[#0f2940] transition-transform ${cityMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {cityMenuOpen && (
          <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2 max-h-72 overflow-y-auto">
            <p className="px-3 pb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Rechercher une ville</p>
            {BENIN_CITIES.map((city) => (
              <button
                key={city}
                onClick={() => goToCity(city)}
                className="w-full text-left px-3 py-2 text-sm text-[#0f2940] hover:bg-[#f4fffe] flex items-center gap-2"
              >
                <MapPin className="w-3.5 h-3.5 text-[#00c9a7]" />
                {city}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
