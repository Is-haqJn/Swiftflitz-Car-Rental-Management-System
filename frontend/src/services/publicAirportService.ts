import type { ApiResponse } from '@/shared/types';
import type { Airport } from '@/shared/types/airport.types';
import type { AirportPackage } from '@/shared/types/airport-package.types';
import type { AirportPackageAssignment } from '@/shared/types/airport-package-assignment.types';
import axios from 'axios';

const publicApi = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
    withCredentials: true,
});

export interface PublicPackageItem {
    id: string;
    name: string;
    description: string | null;
    features: string[];
    package_photo: AirportPackage['package_photo'];
    base_price: string | null;
    vat_rate: number | null;
    vat_inclusive_price: number | null;
    is_available_for_pickup: boolean;
    is_available_for_dropoff: boolean;
    currency?: string | null;
    currency_symbol?: string | null;
    exchange_rate?: number | null;
    show_converted_price?: boolean | null;
    global_currency?: string | null;
    global_currency_symbol?: string | null;
    base_price_global?: number | null;
}

export interface PublicTerminal {
    id: string;
    name: string;
}

export interface PublicArea {
    id: string;
    name: string;
    has_charge: boolean;
    charge_amount: string;
}

export interface PublicBookingPayload {
    package_assignment_id: string;
    direction: 'pickup' | 'dropoff';
    terminal_location_id: string;
    area_location_id: string;
    scheduled_at: string;
    passenger_count: number;
    customer_full_name: string;
    customer_email: string;
    customer_phone: string;
    specific_address?: string;
    notes?: string;
    payment_method?: 'paystack';
    payment_reference?: string;
    coupon_code?: string;
}

export interface PublicPaymentConfig {
    paystack_public_key: string;
    payment_currency: string;
    enable_paystack: boolean;
    enable_online_payments: boolean;
}

export interface PublicBookingResult {
    id: string;
    booking_reference: string;
    direction: string;
    total_amount: number;
    scheduled_at: string;
    booking_status: string;
}

function normalisePackages(
    data: AirportPackage[] | AirportPackageAssignment[]
): PublicPackageItem[] {
    if (data.length === 0) {
        return [];
    }

    // Assignments have a `base_price` field directly and embed the package
    if ('package' in data[0]) {
        return (data as AirportPackageAssignment[]).map(assignment => ({
            id: assignment.id,
            name: assignment.package?.name ?? '',
            description: assignment.package?.description ?? null,
            features: assignment.package?.features ?? [],
            package_photo: assignment.package?.package_photo ?? null,
            base_price: assignment.base_price,
            vat_rate: assignment.vat_rate ?? null,
            vat_inclusive_price: assignment.vat_inclusive_price ?? null,
            is_available_for_pickup:
                assignment.package?.is_available_for_pickup ?? false,
            is_available_for_dropoff:
                assignment.package?.is_available_for_dropoff ?? false,
            currency: assignment.currency ?? null,
            currency_symbol: assignment.currency_symbol ?? null,
            exchange_rate: assignment.exchange_rate ?? null,
            show_converted_price: assignment.show_converted_price ?? null,
            global_currency: assignment.global_currency ?? null,
            global_currency_symbol: assignment.global_currency_symbol ?? null,
            base_price_global: assignment.base_price_global ?? null,
        }));
    }

    // Plain packages - no airport selected, price unknown
    return (data as AirportPackage[]).map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        features: pkg.features,
        package_photo: pkg.package_photo,
        base_price: null,
        vat_rate: null,
        vat_inclusive_price: null,
        is_available_for_pickup: pkg.is_available_for_pickup,
        is_available_for_dropoff: pkg.is_available_for_dropoff,
    }));
}

export const publicAirportService = {
    async airports(): Promise<ApiResponse<Airport[]>> {
        const response =
            await publicApi.get<ApiResponse<Airport[]>>('/public/airports');
        return response.data;
    },

    async packages(airportId?: string): Promise<PublicPackageItem[]> {
        const params = airportId ? { airport_id: airportId } : {};
        const response = await publicApi.get<
            ApiResponse<AirportPackage[] | AirportPackageAssignment[]>
        >('/public/airport-packages', { params });
        return normalisePackages(response.data.data ?? []);
    },

    async terminals(airportId: string): Promise<PublicTerminal[]> {
        const response = await publicApi.get<ApiResponse<PublicTerminal[]>>(
            `/public/airports/${airportId}/terminals`
        );
        return response.data.data ?? [];
    },

    async areas(airportId: string): Promise<PublicArea[]> {
        const response = await publicApi.get<ApiResponse<PublicArea[]>>(
            `/public/airports/${airportId}/areas`
        );
        return response.data.data ?? [];
    },

    async book(data: PublicBookingPayload): Promise<PublicBookingResult> {
        const response = await publicApi.post<ApiResponse<PublicBookingResult>>(
            '/public/airport-bookings',
            data
        );
        return response.data.data!;
    },

    async paymentConfig(): Promise<PublicPaymentConfig> {
        const response = await publicApi.get<ApiResponse<PublicPaymentConfig>>(
            '/settings/payment-config'
        );
        return response.data.data!;
    },
};
