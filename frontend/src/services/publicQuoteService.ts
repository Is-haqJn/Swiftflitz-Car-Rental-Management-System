// publicQuoteService.ts
// Unauthenticated API calls for the public quote confirmation flow and public contact form.

import { apiClient } from '@/shared/api/apiClient';
import type { QuoteRequest } from '@/shared/types/rental.types';

export interface PublicCategory {
    id: string;
    name: string;
    image: string | null;
}

export interface PublicVehicle {
    id: string;
    name: string;
    make: string;
    model: string;
    year: number;
    seats: number;
    fuel_type?: string;
    transmission?: string;
    daily_rate: number;
    price_visible: boolean;
    is_featured?: boolean;
    branch_id?: string | null;
    branch_name?: string | null;
    category?: { name: string };
    features?: string[];
    image?: string | null;
    unavailable_dates?: Array<{ rental_id?: string; from: string; to: string }>;
    currency?: string | null;
    currency_symbol?: string | null;
    exchange_rate?: number | null;
    daily_rate_global?: number | null;
    global_currency?: string | null;
    global_currency_symbol?: string | null;
    show_converted_price?: boolean | null;
}

export interface PublicFeaturedFleetVehicle {
    id: string;
    name: string;
    make: string;
    model: string;
    year: number;
    seats: number;
    fuel_type?: string | null;
    transmission?: string | null;
    is_featured: boolean;
    image?: string | null;
    category?: { id: string; name: string; slug: string } | null;
    chauffeur_base_price?: number | null;
    currency_symbol?: string | null;
    global_currency_symbol?: string | null;
}

export interface PublicAddon {
    id: string;
    name: string;
    description?: string | null;
    amount: number;
    charge_type: 'flat' | 'per_day' | 'percentage';
}

export interface PublicAutoCharge {
    id: string;
    name: string;
    amount: number;
    charge_type: 'flat' | 'per_day' | 'percentage';
}

export interface PublicVehicleImage {
    url: string;
    thumb: string;
    is_primary: boolean;
}

export interface PublicVehicleDetail extends PublicVehicle {
    branch_id?: string;
    color?: string;
    engine_size?: string;
    description?: string | null;
    images: PublicVehicleImage[];
    addons: PublicAddon[];
    auto_charges: PublicAutoCharge[];
    show_prices_on_website: boolean;
    vat_enabled: boolean;
    vat_rate: number;
}

export interface PublicQuoteConfirmPayload {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    customer_alt_phone?: string;
    customer_address?: string;
    customer_date_of_birth?: string;
    license_number: string;
    license_expiry_date: string;
    id_type: string;
    id_number: string;
    pickup_time: string;
    return_time: string;
    dropoff_location_id?: string;
    selected_option_ids?: string[];
    customer_notes?: string;
}

export interface PublicQuoteRequestPayload {
    name: string;
    email: string;
    phone: string;
    pickup_date: string;
    return_date: string;
    pickup_location_id?: string;
    dropoff_location_id?: string;
    vehicle_id?: string;
    vehicle_preference?: string;
    message?: string;
    // Extended fields when submitting from the vehicle detail page
    session_id?: string;
    addon_ids?: string[];
    pickup_time?: string;
    return_time?: string;
}

export interface BookingConfirmedData {
    rental_id: string;
    rental_reference: string;
    status: string;
    amount?: number;
    payer_name?: string | null;
    payer_email?: string | null;
    payer_phone?: string | null;
}

export type ConfirmQuoteResponse =
    | {
          data: BookingConfirmedData;
          message: string;
      }
    | {
          status: 'pending_review';
          message: string;
          data?: undefined;
      };

export interface PricingPreviewResult {
    rentalDays: number;
    dailyRate: number;
    base: number;
    addonTotal: number;
    addonBreakdown: Array<{
        id: string;
        name: string;
        type: string;
        quantity: number;
        days: number;
        unit: number;
        amount: number;
        auto?: boolean;
    }>;
    locationTotal: number;
    locationBreakdown?: Array<{
        type: string;
        location: string;
        amount: number;
    }>;
    subtotal: number;
    ruleDiscountAmount: number;
    couponDiscountAmount: number;
    manualDiscountAmount: number;
    totalDiscountAmount: number;
    discountedSubtotal: number;
    taxAmount: number;
    totalAmount: number;
    depositAmount: number;
}

export const publicQuoteService = {
    /** GET /public/quotes/{token} - fetch quote by token (no auth) */
    get(token: string): Promise<{ data: QuoteRequest }> {
        return apiClient.get(`/public/quotes/${token}`);
    },

    /** POST /public/quotes/{token}/confirm - customer confirms with full details */
    confirm(
        token: string,
        payload: PublicQuoteConfirmPayload,
        licenseFile: File | null = null,
        idDocFile: File | null = null
    ): Promise<ConfirmQuoteResponse> {
        const fd = new FormData();
        const scalar: Array<keyof PublicQuoteConfirmPayload> = [
            'customer_name',
            'customer_email',
            'customer_phone',
            'customer_alt_phone',
            'customer_address',
            'customer_date_of_birth',
            'license_number',
            'license_expiry_date',
            'id_type',
            'id_number',
            'pickup_time',
            'return_time',
            'dropoff_location_id',
            'customer_notes',
        ];
        scalar.forEach(k => {
            const v = payload[k];
            if (v !== undefined && v !== null && v !== '')
                fd.append(k, String(v));
        });
        if (payload.selected_option_ids?.length) {
            payload.selected_option_ids.forEach(id =>
                fd.append('selected_option_ids[]', id)
            );
        }
        if (licenseFile) fd.append('license_file', licenseFile);
        if (idDocFile) fd.append('id_document_file', idDocFile);

        return apiClient.upload(`/public/quotes/${token}/confirm`, fd);
    },

    /** POST /public/quotes/{token}/cancel - customer cancels */
    cancel(token: string): Promise<{ message: string }> {
        return apiClient.post(`/public/quotes/${token}/cancel`);
    },

    /** POST /public/bookings - submit a new quote request (public form) */
    submitRequest(
        payload: PublicQuoteRequestPayload
    ): Promise<{ message: string }> {
        return apiClient.post('/public/bookings', payload);
    },

    /** POST /public/quotes/{token}/book-returning - returning customer confirms quote directly */
    bookReturning(
        token: string,
        altPhone?: string
    ): Promise<{ data: BookingConfirmedData; message: string }> {
        return apiClient.post(
            `/public/quotes/${token}/book-returning`,
            altPhone ? { alt_phone: altPhone } : {}
        );
    },

    /** GET /public/rental-locations/pickup - pickup location list, optionally filtered by branch */
    getPickupLocations(branchId?: string): Promise<{
        data: Array<{
            id: string;
            name: string;
            pickup_charge: number | null;
            is_airport?: boolean;
        }>;
    }> {
        const params = branchId ? { branch_id: branchId } : {};
        return apiClient.get('/public/rental-locations/pickup', { params });
    },

    /** GET /public/categories - active vehicle categories with name and image */
    getCategories(): Promise<{ data: PublicCategory[] }> {
        return apiClient.get('/public/categories');
    },

    /** GET /public/vehicles - available vehicles for public listings page and quote-request dropdown */
    getVehicles(): Promise<{
        data: {
            show_prices_on_website: boolean;
            vehicles: PublicVehicle[];
        };
    }> {
        return apiClient.get('/public/vehicles');
    },

    /** GET /public/vehicles/{id} - full vehicle detail for the vehicle detail page */
    getVehicle(id: string): Promise<{
        data: {
            show_prices_on_website: boolean;
            allow_online_booking: boolean;
            vat_enabled: boolean;
            vat_rate: number;
            charge_deposit: boolean;
            security_deposit_amount: number;
            vehicle: PublicVehicleDetail;
        };
    }> {
        return apiClient.get(`/public/vehicles/${id}`);
    },

    /** GET /public/rental-locations/dropoff - dropoff location list, optionally filtered by branch */
    getDropoffLocations(branchId?: string): Promise<{
        data: Array<{
            id: string;
            name: string;
            dropoff_charge: number | null;
            is_airport?: boolean;
        }>;
    }> {
        const params = branchId ? { branch_id: branchId } : {};
        return apiClient.get('/public/rental-locations/dropoff', { params });
    },

    /** GET /public/reupload/{token} - validate reupload token, get customer data */
    getReuploadInfo(token: string): Promise<{
        data: {
            name: string;
            address: string | null;
            license_number: string | null;
            license_expiry_date: string | null;
            id_type: string | null;
            id_number: string | null;
        };
        message: string;
    }> {
        return apiClient.get(`/public/reupload/${token}`);
    },

    /** POST /public/reupload/{token} - submit new documents with extended fields */
    submitReupload(
        token: string,
        licenseFile: File | null,
        idDocFile: File | null,
        fields?: {
            address?: string;
            license_number?: string;
            license_expiry_date?: string;
            id_type?: string;
            id_number?: string;
            passport_image?: File | null;
        }
    ): Promise<{ message: string }> {
        const fd = new FormData();
        if (licenseFile) fd.append('license_file', licenseFile);
        if (idDocFile) fd.append('id_document_file', idDocFile);
        if (fields) {
            if (fields.address) fd.append('address', fields.address);
            if (fields.license_number)
                fd.append('license_number', fields.license_number);
            if (fields.license_expiry_date)
                fd.append('license_expiry_date', fields.license_expiry_date);
            if (fields.id_type) fd.append('id_type', fields.id_type);
            if (fields.id_number) fd.append('id_number', fields.id_number);
            if (fields.passport_image)
                fd.append('passport_image', fields.passport_image);
        }
        return apiClient.upload(`/public/reupload/${token}`, fd);
    },

    /** GET /public/chauffeur-vehicles?featured=true - featured fleet vehicles */
    getFeaturedChauffeurVehicles(): Promise<{
        data: PublicFeaturedFleetVehicle[];
        message: string;
    }> {
        return apiClient.get('/public/chauffeur-vehicles', {
            params: { featured: true },
        });
    },

    /** POST /public/booking/request-verification - check email + send verification link */
    requestVerification(email: string): Promise<{
        data: { session_id: string; masked_email: string };
        message: string;
    }> {
        return apiClient.post('/public/booking/request-verification', {
            email,
        });
    },

    /** GET /public/booking/verify-status?session=xxx - polling endpoint */
    verifyStatus(
        sessionId: string
    ): Promise<{ data: { verified: boolean; customer_name: string | null } }> {
        return apiClient.get('/public/booking/verify-status', {
            params: { session: sessionId },
        });
    },

    /** POST /public/booking/verify/{token} - mark token as verified (called from landing page) */
    confirmVerification(
        token: string
    ): Promise<{ data: { message: string; customer_name: string | null } }> {
        return apiClient.post(`/public/booking/verify/${token}`);
    },

    /** POST /public/booking/book - create a confirmed rental for a verified returning customer */
    bookDirect(payload: {
        session_id: string;
        vehicle_id: string;
        pickup_date: string;
        return_date: string;
        pickup_time?: string;
        return_time?: string;
        pickup_location_id?: string;
        dropoff_location_id?: string;
        addon_ids?: string[];
        customer_notes?: string;
        coupon_code?: string;
        date_of_birth?: string;
    }): Promise<{ data: BookingConfirmedData; message: string }> {
        return apiClient.post('/public/booking/book', payload);
    },

    /** POST /public/booking/check-email - silently check if an email is already registered */
    checkEmail(email: string): Promise<{ data: { exists: boolean } }> {
        return apiClient.post('/public/booking/check-email', { email });
    },

    /** POST /public/booking/book-new - create a new customer + confirmed rental; sends profile completion email */
    bookNewCustomer(payload: {
        name: string;
        email: string;
        phone: string;
        vehicle_id: string;
        pickup_date: string;
        return_date: string;
        pickup_time?: string;
        return_time?: string;
        pickup_location_id?: string;
        dropoff_location_id?: string;
        addon_ids?: string[];
        customer_notes?: string;
        coupon_code?: string;
        date_of_birth?: string;
    }): Promise<{ data: BookingConfirmedData; message: string }> {
        return apiClient.post('/public/booking/book-new', payload);
    },

    /** POST /public/vehicles/{id}/pricing-preview - get accurate backend pricing including discount rules */
    getPricingPreview(
        vehicleId: string,
        payload: {
            pickup_date: string;
            return_date: string;
            addon_ids?: string[];
            pickup_location_id?: string;
            dropoff_location_id?: string;
            date_of_birth?: string;
        }
    ): Promise<{ data: PricingPreviewResult }> {
        return apiClient.post(
            `/public/vehicles/${vehicleId}/pricing-preview`,
            payload
        );
    },

    /** GET /public/customer/complete-profile/{token} - fetch customer basic info for pre-filling the form */
    getProfileData(
        token: string
    ): Promise<{ data: { name: string; email: string; phone: string; date_of_birth: string | null } }> {
        return apiClient.get(`/public/customer/complete-profile/${token}`);
    },

    /** POST /public/customer/complete-profile/{token} - submit full profile details + document uploads */
    submitProfile(
        token: string,
        formData: FormData
    ): Promise<{ message: string }> {
        return apiClient.upload(
            `/public/customer/complete-profile/${token}`,
            formData
        );
    },

    /** GET /public/rental-settings - pickup window times (no auth) */
    getRentalSettings(): Promise<{
        data: {
            pickup_window_start: string;
            pickup_window_end: string;
            min_rental_days?: number | null;
            documents_required?: boolean;
            return_time_threshold?: number | null;
        };
    }> {
        return apiClient.get('/public/rental-settings');
    },

    /** GET /public/contact/branches - branch location cards for the contact page */
    getContactBranches(): Promise<{
        data: Array<{
            id: string;
            name: string;
            address?: string | null;
            phone?: string | null;
            email?: string | null;
        }>;
    }> {
        return apiClient.get('/public/contact/branches');
    },

    /** POST /public/contact - submit the website contact form */
    submitContactForm(payload: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
        message: string;
    }): Promise<{ message: string }> {
        return apiClient.post('/public/contact', payload);
    },

    /** GET /public/rentals/track/{reference} - look up a rental by reference for public tracking */
    trackRental(reference: string): Promise<{
        data: {
            reference: string;
            status: string;
            vehicle: { name: string; image: string | null };
            pickup_date: string;
            return_date: string;
            pickup_location: string | null;
            dropoff_location: string | null;
        };
    }> {
        return apiClient.get(`/public/rentals/track/${reference}`);
    },
};
