export type TransactableType =
    | 'rental'
    | 'airport_booking'
    | 'chauffeur_booking';

export interface InitiatePaymentPayload {
    amount: number;
    currency: string;
    payer_email: string;
    payer_phone: string;
    payer_name: string;
    transactable_type: TransactableType;
    transactable_id: string;
    callback_url?: string;
    return_url?: string;
    metadata?: Record<string, unknown>;
}

export interface PaymentInitiateResult {
    success: boolean;
    reference: string;
    authorization_url: string;
    meta?: Record<string, unknown>;
}

export interface PaymentVerifyResult {
    success: boolean;
    status: 'paid' | 'pending' | 'failed';
    amount?: number;
    meta?: Record<string, unknown>;
}

export interface PayableAmountResult {
    amount: number;
    currency: string;
    customer_profile_complete?: boolean;
    profile_error_code?: string | null;
    profile_complete_token?: string | null;
    already_paid?: boolean;
}
