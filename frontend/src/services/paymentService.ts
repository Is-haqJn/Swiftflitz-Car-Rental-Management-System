import { apiClient } from '@/shared/api/apiClient';
import { API_ENDPOINTS } from '@/shared/api/endpoints';
import { PaymentInitiateResponseSchema } from '@/shared/libs/schemas/payment.schemas';
import type { ApiResponse, PublicPaymentConfig } from '@/shared/types';
import type {
    InitiatePaymentPayload,
    PayableAmountResult,
    PaymentInitiateResult,
    PaymentVerifyResult,
} from '@/shared/types/payment.types';

export const paymentService = {
    async getPublicConfig(): Promise<ApiResponse<PublicPaymentConfig>> {
        return apiClient.get<ApiResponse<PublicPaymentConfig>>(
            API_ENDPOINTS.PUBLIC.PAYMENT_CONFIG
        );
    },

    async initiate(
        payload: InitiatePaymentPayload
    ): Promise<ApiResponse<PaymentInitiateResult>> {
        const response = await apiClient.post<
            ApiResponse<PaymentInitiateResult>
        >(API_ENDPOINTS.PAYMENTS.INITIATE, payload);
        const validation = PaymentInitiateResponseSchema.safeParse(response);
        if (!validation.success) {
            console.warn(
                '[paymentService] Initiate response schema mismatch:',
                validation.error.issues
            );
        }
        return response;
    },

    async getPayableAmount(
        transactableType: string,
        transactableId: string,
        purpose?: string | null
    ): Promise<ApiResponse<PayableAmountResult>> {
        return apiClient.get<ApiResponse<PayableAmountResult>>(
            API_ENDPOINTS.PAYMENTS.PAYABLE_AMOUNT,
            {
                params: {
                    transactable_type: transactableType,
                    transactable_id: transactableId,
                    ...(purpose ? { purpose } : {}),
                },
            }
        );
    },

    async verify(reference: string): Promise<ApiResponse<PaymentVerifyResult>> {
        return apiClient.get<ApiResponse<PaymentVerifyResult>>(
            API_ENDPOINTS.PAYMENTS.VERIFY(reference)
        );
    },

    async getStatus(
        reference: string
    ): Promise<ApiResponse<PaymentVerifyResult>> {
        return apiClient.get<ApiResponse<PaymentVerifyResult>>(
            API_ENDPOINTS.PAYMENTS.STATUS(reference)
        );
    },
};
