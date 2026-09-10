// components/PropertyList.tsx
import { useState, useEffect } from 'react';
import { PropertyCard } from './PropertyCard';
import propertyService from '../services/property.service';

interface PropertyListProps {
  initialFilters?: {
    destination?: string;
    check_in?: string;
    check_out?: string;
    guests?: number;
    min_price?: number;
    max_price?: number;
    property_type?: string;
  };
  onPropertyClick?: (propertyId: number) => void;
}

export function PropertyList({ initialFilters = {}, onPropertyClick }: PropertyListProps) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0
  });

  // Récupérer les propriétés depuis l'API
  const fetchProperties = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await propertyService.getAll({
        ...filters,
        page,
        per_page: 12
      });
      
      setProperties(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        total: response.data.total
      });
    } catch (err: any) {
      console.error('Erreur chargement propriétés:', err);
      setError(err.message || 'Erreur lors du chargement des propriétés');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [filters]);

  const handleSearch = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    fetchProperties(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden shadow animate-pulse">
            <div className="h-64 bg-gray-200"></div>
            <div className="p-4 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => fetchProperties()}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Aucune propriété trouvée</p>
        <p className="text-sm text-gray-400 mt-2">Essayez de modifier vos critères de recherche</p>
      </div>
    );
  }

  return (
    <div>
      {/* Résultats */}
      <div className="mb-4 text-sm text-gray-500">
        {pagination.total} propriété(s) trouvée(s)
      </div>

      {/* Grille des propriétés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {properties.map((property: any) => (
          <PropertyCard 
            key={property.id} 
            property={property}
            onNavigate={onPropertyClick}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="flex justify-center mt-8 gap-2">
          <button
            onClick={() => handlePageChange(pagination.current_page - 1)}
            disabled={pagination.current_page === 1}
            className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            ← Précédent
          </button>
          
          {[...Array(Math.min(5, pagination.last_page))].map((_, i) => {
            let pageNum;
            if (pagination.last_page <= 5) {
              pageNum = i + 1;
            } else if (pagination.current_page <= 3) {
              pageNum = i + 1;
            } else if (pagination.current_page >= pagination.last_page - 2) {
              pageNum = pagination.last_page - 4 + i;
            } else {
              pageNum = pagination.current_page - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-3 py-1 rounded border ${
                  pagination.current_page === pageNum
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            onClick={() => handlePageChange(pagination.current_page + 1)}
            disabled={pagination.current_page === pagination.last_page}
            className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}