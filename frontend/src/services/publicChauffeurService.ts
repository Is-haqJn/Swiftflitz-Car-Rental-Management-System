import { apiClient } from '@/shared/api/apiClient';

export interface ChauffeurCustomerLookup {
    exists: boolean;
    full_name: string | null;
    phone: string | null;
}

export interface PublicChauffeurBookingPayload {
    vehicle_id: string;
    pickup_location_id?: string;
    pickup_time: string;
    customer_full_name: string;
    customer_email?: string;
    customer_phone: string;
    expected_destination?: string;
    coupon_code?: string;
}

export interface BookedInterval {
    start: string;
    end: string;
}

export const publicChauffeurService = {
    /** GET /public/chauffeur-vehicles/{vehicleId}/booked-dates */
    getBookedDates(vehicleId: string): Promise<{ data: BookedInterval[] }> {
        return apiClient.get(
            `/public/chauffeur-vehicles/${vehicleId}/booked-dates`
        );
    },

    /** GET /public/chauffeur/check-customer?email=xxx */
    checkCustomer(email: string): Promise<{ data: ChauffeurCustomerLookup }> {
        return apiClient.get('/public/chauffeur/check-customer', {
            params: { email },
        });
    },

    /** POST /public/chauffeur-bookings */
    book(payload: PublicChauffeurBookingPayload): Promise<{
        data: {
            booking_id: string;
            booking_reference: string;
            amount?: number;
            payer_name?: string | null;
            payer_email?: string | null;
            payer_phone?: string | null;
        };
        message: string;
    }> {
        return apiClient.post('/public/chauffeur-bookings', payload);
    },
};
