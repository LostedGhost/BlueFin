// components/MobileSearchBar.tsx
import { Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function MobileSearchBar() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (destination.trim()) {
      navigate(`/search?destination=${encodeURIComponent(destination)}`);
    } else {
      navigate('/search');
    }
  };

  return (
    <div className="px-4 py-3">
      <form onSubmit={handleSearch} className="bg-[#f4fffe] border border-[#e2f5f2] rounded-full shadow-md p-4 flex items-center gap-3">
        <Search className="w-5 h-5 text-[#00c9a7]" />
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="📍 Où allez-vous au Bénin ? (Cotonou, Ouidah...)"
          className="flex-1 bg-transparent outline-none text-[#0f2940] placeholder:text-[#6b7280] text-sm"
        />
        <button
          type="button"
          onClick={() => setShowFilters(true)}
          className="p-1"
        >
          <SlidersHorizontal className="w-5 h-5 text-[#0f2940]" />
        </button>
      </form>

      {/* Modal de filtres simplifiés (optionnel) */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowFilters(false)}>
          <div className="bg-white rounded-t-3xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">Filtres</h3>
            {/* Ajoutez ici les filtres mobiles simples (prix, voyageurs, etc.) */}
            <button
              onClick={() => setShowFilters(false)}
              className="w-full bg-[#00c9a7] text-white py-3 rounded-full mt-4"
            >
              Appliquer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}