import { apiClient } from '@/shared/api/apiClient';
import type { ApiResponse } from '@/shared/types';
import type { PricingBreakdown, PricingPreviewRequest } from '@/shared/types';

export const previewPricing = async (
    data: PricingPreviewRequest
): Promise<PricingBreakdown> => {
    const res = await apiClient.post<ApiResponse<PricingBreakdown>>(
        '/pricing/preview',
        data
    );
    return res.data;
};
