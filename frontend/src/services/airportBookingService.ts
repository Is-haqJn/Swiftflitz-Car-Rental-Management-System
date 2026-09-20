import { apiClient } from '@/shared/api/apiClient';
import type {
    AirportBooking,
    CreateAirportBookingData,
    UpdateAirportBookingData,
    AssignDriverData,
    RecordPaymentData,
    CancelBookingData,
    AirportBookingFilters,
} from '@/shared/types/airport-booking.types';
import type { ApiResponse, PaginatedResponse } from '@/shared/types';

export const airportBookingService = {
    async list(
        filters: AirportBookingFilters = {}
    ): Promise<PaginatedResponse<AirportBooking>> {
        return apiClient.get<PaginatedResponse<AirportBooking>>(
            '/airport-bookings',
            { params: filters }
        );
    },

    async get(id: string): Promise<ApiResponse<AirportBooking>> {
        return apiClient.get<ApiResponse<AirportBooking>>(
            `/airport-bookings/${id}`
        );
    },

    async create(
        data: CreateAirportBookingData
    ): Promise<ApiResponse<AirportBooking>> {
        return apiClient.post<ApiResponse<AirportBooking>>(
            '/airport-bookings',
            data
        );
    },

    async update(
        id: string,
        data: UpdateAirportBookingData
    ): Promise<ApiResponse<AirportBooking>> {
        return apiClient.put<ApiResponse<AirportBooking>>(
            `/airport-bookings/${id}`,
            data
        );
    },

    async delete(id: string): Promise<ApiResponse<null>> {
        return apiClient.delete<ApiResponse<null>>(`/airport-bookings/${id}`);
    },

    async confirm(id: string): Promise<ApiResponse<AirportBooking>> {
        return apiClient.patch<ApiResponse<AirportBooking>>(
            `/airport-bookings/${id}/confirm`
        );
    },

    async assignDriver(
        id: string,
        data: AssignDriverData
    ): Promise<ApiResponse<AirportBooking>> {
        return apiClient.patch<ApiResponse<AirportBooking>>(
            `/airport-bookings/${id}/assign-driver`,
            data
        );
    },

    async removeDriver(id: string): Promise<ApiResponse<AirportBooking>> {
        return apiClient.patch<ApiResponse<AirportBooking>>(
            `/airport-bookings/${id}/remove-driver`
        );
    },

    async startTrip(id: string): Promise<ApiResponse<AirportBooking>> {
        return apiClient.patch<ApiResponse<AirportBooking>>(
            `/airport-bookings/${id}/start-trip`
        );
    },

    async completeTrip(id: string): Promise<ApiResponse<AirportBooking>> {
        return apiClient.patch<ApiResponse<AirportBooking>>(
            `/airport-bookings/${id}/complete-trip`
        );
    },

    async cancel(
        id: string,
        data: CancelBookingData = {}
    ): Promise<ApiResponse<AirportBooking>> {
        return apiClient.patch<ApiResponse<AirportBooking>>(
            `/airport-bookings/${id}/cancel`,
            data
        );
    },

    async noShow(id: string): Promise<ApiResponse<AirportBooking>> {
        return apiClient.patch<ApiResponse<AirportBooking>>(
            `/airport-bookings/${id}/no-show`
        );
    },

    async recordPayment(
        id: string,
        data: RecordPaymentData
    ): Promise<ApiResponse<AirportBooking>> {
        return apiClient.post<ApiResponse<AirportBooking>>(
            `/airport-bookings/${id}/payment`,
            data
        );
    },

    async refund(id: string): Promise<ApiResponse<AirportBooking>> {
        return apiClient.patch<ApiResponse<AirportBooking>>(
            `/airport-bookings/${id}/refund`
        );
    },

    async blockedDates(
        branchId: string,
        from: string,
        to: string
    ): Promise<ApiResponse<{ blocked_dates: string[] }>> {
        return apiClient.get<ApiResponse<{ blocked_dates: string[] }>>(
            '/airport-bookings/blocked-dates',
            { params: { branch_id: branchId, from, to } }
        );
    },

    async sendPaymentLink(id: string): Promise<ApiResponse<null>> {
        return apiClient.post<ApiResponse<null>>(
            `/airport-bookings/${id}/send-payment-link`
        );
    },
};
