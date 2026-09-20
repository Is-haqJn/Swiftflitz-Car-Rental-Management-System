import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BannerSection, FleetGridSection } from './sections';
import { useTitle } from '@/shared/hooks';
import { apiClient } from '@/shared/api/apiClient';
import type { FleetVehicle } from '@/shared/types/fleetVehicle.types';
import type { ApiResponse } from '@/shared/types';

const ChauffeurServices = () => {
    const title = useTitle('Chauffeur Services');
    const [searchParams] = useSearchParams();
    const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient
            .get<ApiResponse<FleetVehicle[]>>('/public/chauffeur-vehicles')
            .then(res => setVehicles(res.data))
            .finally(() => setLoading(false));
    }, []);

    const branchId = searchParams.get('branch_id') ?? '';
    const category = searchParams.get('category') ?? '';

    const filtered = vehicles.filter(v => {
        if (branchId && v.branch_id !== branchId) return false;
        if (category) {
            const assignment = v.service_assignments?.find(
                a => a.service_type === 'chauffeur'
            );
            if (assignment?.category?.name !== category) return false;
        }
        return true;
    });

    return (
        <>
            {title}
            <BannerSection vehicles={vehicles} />
            <FleetGridSection vehicles={filtered} loading={loading} />
        </>
    );
};

export default ChauffeurServices;
