import { apiClient } from '@/shared/api/apiClient';
import type {
    ConvertQuoteData,
    ExtendPreview,
    ExtendRentalData,
    GenerateQuoteData,
    QuoteRequest,
    QuoteRequestFilters,
    Rental,
    CreateRentalData,
    UpdateRentalData,
    RentalFilters,
    ProcessPickupData,
    ProcessReturnData,
    ApproveReturnData,
    CancelRentalData,
    CancelPreview,
    SettleRentalData,
    SettleDamageData,
    RecordRepairCostData,
    SwitchVehicleData,
    SettleRefundData,
} from '@/shared/types/rental.types';
import type { ApiResponse, PaginatedResponse } from '@/shared/types';

export const rentalService = {
    async list(
        filters: RentalFilters = {}
    ): Promise<PaginatedResponse<Rental>> {
        return apiClient.get<PaginatedResponse<Rental>>('/rentals', {
            params: filters,
        });
    },

    async get(id: string): Promise<ApiResponse<Rental>> {
        return apiClient.get<ApiResponse<Rental>>(`/rentals/${id}`);
    },

    async create(data: CreateRentalData): Promise<ApiResponse<Rental>> {
        return apiClient.post<ApiResponse<Rental>>('/rentals', data);
    },

    async update(
        id: string,
        data: UpdateRentalData
    ): Promise<ApiResponse<Rental>> {
        return apiClient.put<ApiResponse<Rental>>(`/rentals/${id}`, data);
    },

    async delete(id: string): Promise<{ status: string; message: string }> {
        return apiClient.delete<{ status: string; message: string }>(
            `/rentals/${id}`
        );
    },

    async confirm(id: string): Promise<ApiResponse<Rental>> {
        return apiClient.post<ApiResponse<Rental>>(`/rentals/${id}/confirm`);
    },

    async processPickup(
        id: string,
        data: ProcessPickupData
    ): Promise<ApiResponse<Rental>> {
        return apiClient.post<ApiResponse<Rental>>(
            `/rentals/${id}/pickup`,
            data
        );
    },

    async processReturn(
        id: string,
        data: ProcessReturnData
    ): Promise<ApiResponse<Rental>> {
        return apiClient.post<ApiResponse<Rental>>(
            `/rentals/${id}/return`,
            data
        );
    },

    async uploadPickupVideos(
        id: string,
        videoTusTokens: string[]
    ): Promise<ApiResponse<Rental>> {
        return apiClient.post<ApiResponse<Rental>>(
            `/rentals/${id}/upload-pickup-videos`,
            { video_tus_tokens: videoTusTokens }
        );
    },

    async uploadReturnVideos(
        id: string,
        videoTusTokens: string[]
    ): Promise<ApiResponse<Rental>> {
        return apiClient.post<ApiResponse<Rental>>(
            `/rentals/${id}/upload-return-videos`,
            { video_tus_tokens: videoTusTokens }
        );
    },

    async approveReturn(
        id: string,
        data?: ApproveReturnData
    ): Promise<ApiResponse<Rental>> {
        return apiClient.post<ApiResponse<Rental>>(
            `/rentals/${id}/approve-return`,
            data
        );
    },

    async getCancelPreview(id: string): Promise<ApiResponse<CancelPreview>> {
        return apiClient.get<ApiResponse<CancelPreview>>(
            `/rentals/${id}/cancel-preview`
        );
    },

    async cancel(
        id: string,
        data: CancelRentalData
    ): Promise<ApiResponse<Rental>> {
        return apiClient.post<ApiResponse<Rental>>(
            `/rentals/${id}/cancel`,
            data
        );
    },

    async switchVehicle(
        id: string,
        data: SwitchVehicleData
    ): Promise<ApiResponse<Rental>> {
        return apiClient.post<ApiResponse<Rental>>(
            `/rentals/${id}/switch-vehicle`,
            data
        );
    },

    async settle(
        id: string,
        data: SettleRentalData
    ): Promise<ApiResponse<Rental>> {
        return apiClient.post<ApiResponse<Rental>>(
            `/rentals/${id}/settle`,
            data
        );
    },

    async settleDamage(
        id: string,
        data: SettleDamageData
    ): Promise<ApiResponse<Rental>> {
        return apiClient.post<ApiResponse<Rental>>(
            `/rentals/${id}/settle-damage`,
            data
        );
    },

    async recordRepairCost(
        id: string,
        data: RecordRepairCostData
    ): Promise<ApiResponse<Rental>> {
        return apiClient.patch<ApiResponse<Rental>>(
            `/rentals/${id}/record-repair-cost`,
            data
        );
    },

    async collectDamageBalance(id: string): Promise<ApiResponse<Rental>> {
        return apiClient.post<ApiResponse<Rental>>(
            `/rentals/${id}/collect-damage-balance`
        );
    },

    async collectDeposit(id: string): Promise<ApiResponse<Rental>> {
        return apiClient.post<ApiResponse<Rental>>(
            `/rentals/${id}/collect-deposit`
        );
    },

    async refundDeposit(id: string): Promise<ApiResponse<Rental>> {
        return apiClient.post<ApiResponse<Rental>>(
            `/rentals/${id}/refund-deposit`
        );
    },

    async settleWithDeposit(id: string): Promise<ApiResponse<Rental>> {
        return apiClient.post<ApiResponse<Rental>>(
            `/rentals/${id}/settle-with-deposit`
        );
    },

    async waiveOverdue(
        id: string,
        reason: string
    ): Promise<ApiResponse<Rental>> {
        return apiClient.post<ApiResponse<Rental>>(
            `/rentals/${id}/waive-overdue`,
            { reason }
        );
    },

    async settleRefund(
        id: string,
        data: SettleRefundData
    ): Promise<ApiResponse<Rental>> {
        return apiClient.post<ApiResponse<Rental>>(
            `/rentals/${id}/settle-refund`,
            data
        );
    },

    async getExtendPreview(
        id: string,
        newReturnDate: string
    ): Promise<ApiResponse<ExtendPreview>> {
        return apiClient.get<ApiResponse<ExtendPreview>>(
            `/rentals/${id}/extend-preview`,
            { params: { new_return_date: newReturnDate } }
        );
    },

    async extendRental(
        id: string,
        data: ExtendRentalData
    ): Promise<ApiResponse<Rental>> {
        return apiClient.post<ApiResponse<Rental>>(
            `/rentals/${id}/extend`,
            data
        );
    },

    async sendPaymentLink(id: string): Promise<ApiResponse<null>> {
        return apiClient.post<ApiResponse<null>>(
            `/rentals/${id}/send-payment-link`
        );
    },

    async sendDamagePaymentLink(id: string): Promise<ApiResponse<null>> {
        return apiClient.post<ApiResponse<null>>(
            `/rentals/${id}/send-damage-payment-link`
        );
    },

    async sendSecurityDepositPaymentLink(
        id: string
    ): Promise<ApiResponse<null>> {
        return apiClient.post<ApiResponse<null>>(
            `/rentals/${id}/send-security-deposit-payment-link`
        );
    },

    async sendInvoice(
        id: string,
        note?: string
    ): Promise<ApiResponse<null>> {
        return apiClient.post<ApiResponse<null>>(
            `/rentals/${id}/send-invoice`,
            { note: note ?? null }
        );
    },
};

export const quoteRequestService = {
    async list(
        filters: QuoteRequestFilters = {}
    ): Promise<PaginatedResponse<QuoteRequest>> {
        return apiClient.get<PaginatedResponse<QuoteRequest>>(
            '/quote-requests',
            {
                params: filters,
            }
        );
    },

    async get(id: string): Promise<ApiResponse<QuoteRequest>> {
        return apiClient.get<ApiResponse<QuoteRequest>>(
            `/quote-requests/${id}`
        );
    },

    async delete(id: string): Promise<void> {
        return apiClient.delete<void>(`/quote-requests/${id}`);
    },

    async markContacted(id: string): Promise<ApiResponse<QuoteRequest>> {
        return apiClient.patch<ApiResponse<QuoteRequest>>(
            `/quote-requests/${id}/contact`
        );
    },

    async generateQuote(
        id: string,
        data: GenerateQuoteData
    ): Promise<ApiResponse<QuoteRequest>> {
        return apiClient.patch<ApiResponse<QuoteRequest>>(
            `/quote-requests/${id}/generate`,
            data
        );
    },

    async sendQuote(id: string): Promise<ApiResponse<QuoteRequest>> {
        return apiClient.patch<ApiResponse<QuoteRequest>>(
            `/quote-requests/${id}/send`
        );
    },

    async convert(
        id: string,
        data: ConvertQuoteData
    ): Promise<ApiResponse<Rental>> {
        return apiClient.patch<ApiResponse<Rental>>(
            `/quote-requests/${id}/convert`,
            data
        );
    },

    async emailPreview(id: string): Promise<ApiResponse<{ html: string }>> {
        return apiClient.get<ApiResponse<{ html: string }>>(
            `/quote-requests/${id}/email-preview`
        );
    },

    async markConverted(
        id: string,
        rentalId: string
    ): Promise<ApiResponse<QuoteRequest>> {
        return apiClient.patch<ApiResponse<QuoteRequest>>(
            `/quote-requests/${id}/mark-converted`,
            { rental_id: rentalId }
        );
    },

    async resolveConflict(
        id: string,
        action: 'update_and_proceed' | 'merge_and_proceed' | 'reject'
    ): Promise<ApiResponse<{ rental_reference?: string }>> {
        return apiClient.post<ApiResponse<{ rental_reference?: string }>>(
            `/quote-requests/${id}/resolve`,
            { action }
        );
    },
};
