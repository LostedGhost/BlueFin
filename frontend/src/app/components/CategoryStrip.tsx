// components/CategoryStrip.tsx
import { useNavigate, useSearchParams } from 'react-router-dom';

export interface Category {
  id: string;
  icon: string;
  label: string;
  filter: { [key: string]: any };
}

// Catégories synchronisées avec les filtres de l'API
const categories: Category[] = [
  { id: 'beach', icon: '🏖️', label: 'Plage & Mer', filter: { property_type: 'villa', district: 'Fidjrossè' } },
  { id: 'center', icon: '🏙️', label: 'Cotonou Centre', filter: { city: 'Cotonou', district: 'Haie Vive' } },
  { id: 'airport', icon: '✈️', label: 'Près aéroport', filter: { district: 'Aéroport' } },
  { id: 'business', icon: '💼', label: 'Business', filter: { has_wifi: true, instant_booking: true } },
  { id: 'eco', icon: '🌿', label: 'Éco-tourisme', filter: { property_type: 'ecolodge' } },
  { id: 'cultural', icon: '🏛️', label: 'Culturel', filter: { city: 'Ouidah' } },
  { id: 'pool', icon: '🏊', label: 'Piscine', filter: { has_pool: true } },
  { id: 'luxury', icon: '👑', label: 'Luxe', filter: { bluefin_certified: true, min_price: 100000 } },
  { id: 'budget', icon: '💰', label: 'Petit budget', filter: { max_price: 30000 } },
  { id: 'villa', icon: '🏡', label: 'Villa entière', filter: { property_type: 'villa' } },
];

interface CategoryStripProps {
  onCategorySelect?: (filters: { [key: string]: any }) => void;
}

export function CategoryStrip({ onCategorySelect }: CategoryStripProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category');

  const handleCategoryClick = (category: Category) => {
    if (activeCategory === category.id) {
      // Désactiver le filtre
      searchParams.delete('category');
      Object.keys(category.filter).forEach(key => searchParams.delete(key));
      setSearchParams(searchParams);
      onCategorySelect?.({});
    } else {
      // Appliquer le filtre
      const newParams = new URLSearchParams();
      newParams.set('category', category.id);
      Object.entries(category.filter).forEach(([key, value]) => {
        newParams.set(key, value.toString());
      });
      setSearchParams(newParams);
      onCategorySelect?.(category.filter);
    }
  };

  return (
    <div className="bg-[#f4fffe] border-y border-[#e2f5f2] overflow-x-auto scrollbar-hide">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-4 flex gap-2 lg:gap-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat)}
            className={`
              flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all
              ${activeCategory === cat.id
                ? 'bg-[#00c9a7] text-white shadow-md'
                : 'bg-white text-[#0f2940] border border-[#e2f5f2] hover:border-[#00c9a7] hover:shadow-sm'
              }
            `}
          >
            <span className="text-base">{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}