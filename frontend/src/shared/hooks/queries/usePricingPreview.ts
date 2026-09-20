import { useMutation } from '@tanstack/react-query';
import { previewPricing } from '@/services';

export const usePricingPreview = () =>
    useMutation({
        mutationFn: previewPricing,
    });
