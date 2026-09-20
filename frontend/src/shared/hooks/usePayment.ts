import { useQuery } from '@tanstack/react-query';
import { paymentService } from '@/services/paymentService';
import type {
    InitiatePaymentPayload,
    PaymentInitiateResult,
} from '@/shared/types/payment.types';
import type { PublicPaymentConfig } from '@/shared/types';

export interface UsePaymentReturn {
    /** Initiate a payment - returns the backend result with reference and authorization_url. */
    pay: (payload: InitiatePaymentPayload) => Promise<PaymentInitiateResult>;
    /** Redirect the browser to the provider's checkout URL. */
    redirect: (authorizationUrl: string) => void;
    /** Public payment configuration (provider, keys, logos). */
    config: PublicPaymentConfig | undefined;
    /** True while config is loading. */
    isLoading: boolean;
}

export function usePayment(): UsePaymentReturn {
    const { data: configRes, isLoading } = useQuery({
        queryKey: ['payment', 'public-config'],
        queryFn: () => paymentService.getPublicConfig(),
        staleTime: 5 * 60 * 1000,
    });

    const pay = async (
        payload: InitiatePaymentPayload
    ): Promise<PaymentInitiateResult> => {
        const res = await paymentService.initiate(payload);
        return res.data;
    };

    const redirect = (authorizationUrl: string): void => {
        window.location.href = authorizationUrl;
    };

    return {
        pay,
        redirect,
        config: configRes?.data,
        isLoading,
    };
}
