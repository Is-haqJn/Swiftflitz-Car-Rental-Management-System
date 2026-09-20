import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BannerSection, CarGridSection } from './sections';
import { useTitle } from '@/shared/hooks';
import {
    publicQuoteService,
    type PublicVehicle,
} from '@/services/publicQuoteService';
import { apiClient } from '@/shared/api/apiClient';
import type { FleetVehicle } from '@/shared/types/fleetVehicle.types';
import type { ApiResponse } from '@/shared/types';

export interface UnifiedListing {
    id: string;
    type: 'rental' | 'chauffeur';
    name: string;
    seats: number;
    fuel_type?: string | null;
    transmission?: string | null;
    image?: string | null;
    branch_id?: string | null;
    branch_name?: string | null;
    category_name?: string | null;
    features?: string[];
    price?: number | null;
    price_visible: boolean;
    price_unit: 'day' | 'trip';
    detail_url: string;
    unavailable_dates: Array<{ from: string; to: string }>;
    currency?: string | null;
    currency_symbol?: string | null;
    exchange_rate?: number | null;
    daily_rate_global?: number | null;
    global_currency?: string | null;
    global_currency_symbol?: string | null;
    show_converted_price?: boolean | null;
}

const stripBranch = (name: string) => name.replace(/\s*branch\s*$/i, '').trim();

const normalizeRental = (
    v: PublicVehicle,
    showPrice: boolean
): UnifiedListing => ({
    id: v.id,
    type: 'rental',
    name: v.name,
    seats: v.seats,
    fuel_type: v.fuel_type,
    transmission: v.transmission,
    image: v.image,
    branch_id: v.branch_id,
    branch_name: v.branch_name ?? null,
    category_name: v.category?.name ?? null,
    features: v.features ?? [],
    price: v.daily_rate,
    price_visible: showPrice && v.price_visible,
    price_unit: 'day',
    detail_url: `/listings/${v.id}`,
    unavailable_dates: v.unavailable_dates ?? [],
    currency: v.currency ?? undefined,
    currency_symbol: v.currency_symbol ?? undefined,
    exchange_rate: v.exchange_rate ?? undefined,
    daily_rate_global: v.daily_rate_global ?? undefined,
    global_currency: v.global_currency ?? undefined,
    global_currency_symbol: v.global_currency_symbol ?? undefined,
    show_converted_price: v.show_converted_price ?? false,
});

const normalizeChauffeur = (v: FleetVehicle): UnifiedListing => {
    const assignment = v.service_assignments?.find(
        a => a.service_type === 'chauffeur'
    );
    return {
        id: v.id,
        type: 'chauffeur',
        name: `${v.make} ${v.model}`,
        seats: v.seats,
        fuel_type: v.fuel_type,
        transmission: v.transmission,
        image: v.photos?.[0]?.urls.medium ?? null,
        branch_id: v.branch_id,
        branch_name: v.branch ? stripBranch(v.branch.name) : null,
        category_name: assignment?.category?.name ?? null,
        price: assignment?.base_price ?? null,
        price_visible:
            assignment?.base_price !== null &&
            assignment?.base_price !== undefined,
        price_unit: 'trip',
        detail_url: `/chauffeur-services/${v.id}`,
        unavailable_dates: [],
        currency: v.branch?.currency ?? null,
        currency_symbol: v.branch?.currency_symbol ?? null,
        exchange_rate: v.branch?.exchange_rate ?? null,
        show_converted_price: v.branch?.show_converted_price ?? false,
    };
};

const isDateUnavailable = (
    date: string,
    ranges: Array<{ from: string; to: string }>
): boolean => {
    const d = new Date(date);
    return ranges.some(r => d >= new Date(r.from) && d <= new Date(r.to));
};

const Listings = () => {
    const title = useTitle('Car Listings');
    const [searchParams] = useSearchParams();
    const [listings, setListings] = useState<UnifiedListing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            publicQuoteService.getVehicles(),
            apiClient.get<ApiResponse<FleetVehicle[]>>(
                '/public/chauffeur-vehicles'
            ),
        ])
            .then(([rentalRes, chauffeurRes]) => {
                const showPrice = rentalRes.data.show_prices_on_website;
                const rentals = rentalRes.data.vehicles.map(v =>
                    normalizeRental(v, showPrice)
                );
                const chauffeurs = chauffeurRes.data.map(normalizeChauffeur);
                setListings([...rentals, ...chauffeurs]);
            })
            .finally(() => setLoading(false));
    }, []);

    const branchId = searchParams.get('branch_id') ?? '';
    const category = searchParams.get('category') ?? '';
    const date = searchParams.get('date') ?? '';
    const service = searchParams.get('service') ?? '';

    const filtered = listings.filter(l => {
        if (branchId && l.branch_id !== branchId) return false;
        if (category && l.category_name !== category) return false;
        if (service === 'rental' && l.type !== 'rental') return false;
        if (service === 'chauffeur' && l.type !== 'chauffeur') return false;
        if (
            date &&
            l.type === 'rental' &&
            isDateUnavailable(date, l.unavailable_dates)
        )
            return false;
        return true;
    });

    return (
        <>
            {title}
            <BannerSection listings={listings} />
            <CarGridSection listings={filtered} loading={loading} />
        </>
    );
};

export default Listings;
