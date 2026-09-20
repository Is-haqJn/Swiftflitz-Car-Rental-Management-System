import PaystackPop from '@paystack/inline-js';

export interface UsePaystackOptions {
    publicKey: string;
    email: string;
    /** Amount in major currency unit (e.g. GHS 50.00) - converted to smallest unit internally */
    amount: number;
    currency: string;
    onSuccess: (reference: string) => void;
    onCancel: () => void;
}

export function usePaystack() {
    const initiate = (opts: UsePaystackOptions) => {
        const popup = new PaystackPop();
        popup.newTransaction({
            key: opts.publicKey,
            email: opts.email,
            amount: Math.round(opts.amount * 100),
            currency: opts.currency,
            onSuccess: (transaction: { reference: string }) =>
                opts.onSuccess(transaction.reference),
            onCancel: opts.onCancel,
        });
    };

    return { initiate };
}
