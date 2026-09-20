import { apiClient } from '@/shared/api/apiClient';
import type { BookedInterval } from '@/services/publicChauffeurService';
import type {
    ChauffeurBooking,
    CreateChauffeurBookingData,
    UpdateChauffeurBookingData,
    AssignChauffeurDriverData,
    RecordChauffeurPaymentData,
    CancelChauffeurBookingData,
    ChauffeurPickupLogData,
    ChauffeurReturnLogData,
    ChauffeurBookingFilters,
} from '@/shared/types/chauffeur-booking.types';
import type { ApiResponse, PaginatedResponse } from '@/shared/types';

export const chauffeurBookingService = {
    async list(
        filters: ChauffeurBookingFilters = {}
    ): Promise<PaginatedResponse<ChauffeurBooking>> {
        return apiClient.get<PaginatedResponse<ChauffeurBooking>>(
            '/chauffeur-bookings',
            { params: filters }
        );
    },

    async get(id: string): Promise<ApiResponse<ChauffeurBooking>> {
        return apiClient.get<ApiResponse<ChauffeurBooking>>(
            `/chauffeur-bookings/${id}`
        );
    },

    async create(
        data: CreateChauffeurBookingData
    ): Promise<ApiResponse<ChauffeurBooking>> {
        return apiClient.post<ApiResponse<ChauffeurBooking>>(
            '/chauffeur-bookings',
            data
        );
    },

    async update(
        id: string,
        data: UpdateChauffeurBookingData
    ): Promise<ApiResponse<ChauffeurBooking>> {
        return apiClient.put<ApiResponse<ChauffeurBooking>>(
            `/chauffeur-bookings/${id}`,
            data
        );
    },

    async delete(id: string): Promise<ApiResponse<null>> {
        return apiClient.delete<ApiResponse<null>>(`/chauffeur-bookings/${id}`);
    },

    async confirm(id: string): Promise<ApiResponse<ChauffeurBooking>> {
        return apiClient.patch<ApiResponse<ChauffeurBooking>>(
            `/chauffeur-bookings/${id}/confirm`
        );
    },

    async assignDriver(
        id: string,
        data: AssignChauffeurDriverData
    ): Promise<ApiResponse<ChauffeurBooking>> {
        return apiClient.patch<ApiResponse<ChauffeurBooking>>(
            `/chauffeur-bookings/${id}/assign-driver`,
            data
        );
    },

    async removeDriver(id: string): Promise<ApiResponse<ChauffeurBooking>> {
        return apiClient.patch<ApiResponse<ChauffeurBooking>>(
            `/chauffeur-bookings/${id}/remove-driver`
        );
    },

    async startTrip(id: string): Promise<ApiResponse<ChauffeurBooking>> {
        return apiClient.patch<ApiResponse<ChauffeurBooking>>(
            `/chauffeur-bookings/${id}/start-trip`
        );
    },

    async completeTrip(id: string): Promise<ApiResponse<ChauffeurBooking>> {
        return apiClient.patch<ApiResponse<ChauffeurBooking>>(
            `/chauffeur-bookings/${id}/complete-trip`
        );
    },

    async cancel(
        id: string,
        data: CancelChauffeurBookingData = {}
    ): Promise<ApiResponse<ChauffeurBooking>> {
        return apiClient.patch<ApiResponse<ChauffeurBooking>>(
            `/chauffeur-bookings/${id}/cancel`,
            data
        );
    },

    async noShow(id: string): Promise<ApiResponse<ChauffeurBooking>> {
        return apiClient.patch<ApiResponse<ChauffeurBooking>>(
            `/chauffeur-bookings/${id}/no-show`
        );
    },

    async recordPayment(
        id: string,
        data: RecordChauffeurPaymentData
    ): Promise<ApiResponse<ChauffeurBooking>> {
        return apiClient.post<ApiResponse<ChauffeurBooking>>(
            `/chauffeur-bookings/${id}/payment`,
            data
        );
    },

    async logPickup(
        id: string,
        data: ChauffeurPickupLogData
    ): Promise<ApiResponse<ChauffeurBooking>> {
        return apiClient.post<ApiResponse<ChauffeurBooking>>(
            `/chauffeur-bookings/${id}/pickup-log`,
            data
        );
    },

    async logReturn(
        id: string,
        data: ChauffeurReturnLogData
    ): Promise<ApiResponse<ChauffeurBooking>> {
        return apiClient.post<ApiResponse<ChauffeurBooking>>(
            `/chauffeur-bookings/${id}/return-log`,
            data
        );
    },

    async refund(
        id: string,
        payload: { action: 'approve' | 'waive'; note?: string }
    ): Promise<ApiResponse<ChauffeurBooking>> {
        return apiClient.patch<ApiResponse<ChauffeurBooking>>(
            `/chauffeur-bookings/${id}/refund`,
            payload
        );
    },

    async getVehicleBookedDates(
        vehicleId: string
    ): Promise<{ data: BookedInterval[] }> {
        return apiClient.get(
            `/chauffeur-bookings/vehicle/${vehicleId}/booked-dates`
        );
    },

    async sendPaymentLink(id: string): Promise<ApiResponse<null>> {
        return apiClient.post<ApiResponse<null>>(
            `/chauffeur-bookings/${id}/send-payment-link`
        );
    },
};
