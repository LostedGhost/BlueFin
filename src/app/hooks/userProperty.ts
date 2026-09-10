// hooks/useProperties.ts
import { useState, useEffect } from 'react';
import propertyService, { PropertyFilters } from '../../services/property.service';

export const useProperties = (initialFilters?: PropertyFilters) => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0
    });

    const fetchProperties = async (filters?: PropertyFilters) => {
        setLoading(true);
        setError(null);
        try {
            const response = await propertyService.getAll(filters || initialFilters);
            setProperties(response.data.data);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                per_page: response.data.per_page,
                total: response.data.total
            });
        } catch (err: any) {
            setError(err.message || 'Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProperties();
    }, []);

    return {
        properties,
        loading,
        error,
        pagination,
        refetch: fetchProperties
    };
};