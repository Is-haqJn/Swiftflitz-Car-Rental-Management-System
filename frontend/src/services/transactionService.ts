import { apiClient } from '@/shared/api/apiClient';
import { API_ENDPOINTS } from '@/shared/api/endpoints';
import type { ApiResponse } from '@/shared/types';
import type {
    Transaction,
    TransactionFilters,
    TransactionListResponse,
    TransactionTrendsResponse,
} from '@/shared/types/transaction.types';

export const transactionService = {
    async list(filters?: TransactionFilters): Promise<TransactionListResponse> {
        return apiClient.get<TransactionListResponse>(
            API_ENDPOINTS.TRANSACTIONS.LIST,
            { params: filters }
        );
    },

    async getById(id: string): Promise<ApiResponse<Transaction>> {
        return apiClient.get<ApiResponse<Transaction>>(
            API_ENDPOINTS.TRANSACTIONS.DETAIL(id)
        );
    },

    async trends(
        period: string = '30d'
    ): Promise<ApiResponse<TransactionTrendsResponse>> {
        return apiClient.get<ApiResponse<TransactionTrendsResponse>>(
            API_ENDPOINTS.TRANSACTIONS.TRENDS,
            { params: { period } }
        );
    },

    async resolve(
        id: string,
        action: 'approve' | 'reject',
        notes?: string
    ): Promise<ApiResponse<Transaction>> {
        return apiClient.post<ApiResponse<Transaction>>(
            API_ENDPOINTS.TRANSACTIONS.RESOLVE(id),
            { action, notes }
        );
    },
};
