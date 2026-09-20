import type { TransactableType } from './payment.types';

export type TransactionType =
    | 'payment'
    | 'refund'
    | 'cancellation_fee'
    | 'overdue_charge'
    | 'security_deposit'
    | 'deposit_refund'
    | 'deposit_waived'
    | 'manual_payment'
    | 'initial_payment'
    | 'part_payment'
    | 'full_payment'
    | 'discount'
    | 'damage_charge'
    | 'repair_cost'
    | 'resolve_debt'
    | 'cancellation_refund';

export type TransactionStatus =
    | 'pending'
    | 'paid'
    | 'failed'
    | 'under_review'
    | 'refunded';

export type TransactionChannel =
    | 'momo'
    | 'card'
    | 'cash'
    | 'bank_transfer'
    | 'online'
    | 'manual';

export interface TransactionPayer {
    name: string;
    email: string;
    phone: string;
}

export interface TransactionTransactable {
    type: TransactableType;
    id: string;
    reference: string | null;
}

export interface TransactionProcessedBy {
    id: number;
    name: string;
}

export interface TransactionCoupon {
    coupon_usage_id: string;
    code: string | null;
    name: string | null;
}

export interface TransactionDiscountRule {
    usage_id: string;
    name: string | null;
}

export interface TransactionBranch {
    id: string;
    name: string;
}

export interface Transaction {
    id: string;
    reference: string;
    branch_id: string | null;
    branch: TransactionBranch | null;
    provider: string;
    provider_reference: string | null;
    channel: TransactionChannel | null;
    payment_phone: string | null;
    card_bin: string | null;
    card_last4: string | null;
    card_type: string | null;
    card_display: string | null;
    type: TransactionType;
    type_label: string;
    amount: number;
    currency: string;
    currency_symbol: string | null;
    exchange_rate: number | null;
    gateway_amount: number | null;
    gateway_currency: string | null;
    gateway_charges: number | null;
    customer_amount: number | null;
    status: TransactionStatus;
    status_label: string;
    description: string | null;
    discount_amount: number | null;
    discount_reason: string | null;
    paid_at: string | null;
    created_at: string;
    updated_at: string;
    payer: TransactionPayer;
    transactable: TransactionTransactable | null;
    processed_by: TransactionProcessedBy | null;
    coupon: TransactionCoupon | null;
    discount_rule: TransactionDiscountRule | null;
}

export interface TransactionSummaryStats {
    total_paid: number;
    total_pending: number;
    total_refunded: number;
    total_collected: number;
    net_revenue: number;
    count: number;
}

export interface TransactionFilters {
    'filter[status]'?: TransactionStatus;
    'filter[type]'?: TransactionType;
    'filter[provider]'?: string;
    'filter[channel]'?: TransactionChannel;
    'filter[transactable_type]'?: TransactableType;
    'filter[transactable_id]'?: string;
    'filter[date_from]'?: string;
    'filter[date_to]'?: string;
    'filter[search]'?: string;
    per_page?: number;
    page?: number;
}

export interface TransactionListResponse {
    data: Transaction[];
    stats: TransactionSummaryStats;
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
    };
    links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
    };
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
    payment: 'Payment',
    refund: 'Refund',
    cancellation_fee: 'Cancellation Fee',
    overdue_charge: 'Overdue Charge',
    security_deposit: 'Security Deposit',
    deposit_refund: 'Deposit Refund',
    deposit_waived: 'Deposit Waived',
    manual_payment: 'Manual Payment',
    initial_payment: 'Initial Payment',
    part_payment: 'Part Payment',
    full_payment: 'Full Payment',
    discount: 'Discount',
    damage_charge: 'Damage Charge',
    repair_cost: 'Repair Cost',
    resolve_debt: 'Debt Settlement',
    cancellation_refund: 'Cancellation Refund',
};

export const TRANSACTION_CHANNEL_LABELS: Record<TransactionChannel, string> = {
    momo: 'Mobile Money',
    card: 'Card',
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    online: 'Online',
    manual: 'Manual Payment',
};

export function formatChannelLabel(channel: string | null | undefined): string {
    if (!channel) return '-';
    const known = TRANSACTION_CHANNEL_LABELS[channel as TransactionChannel];
    if (known) return known;
    /* Title-case underscore/dash separated values for unknown future channels */
    return channel
        .split(/[_-]/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

export function getChannelVariant(channel: string | null | undefined): string {
    if (!channel) return 'secondary';
    const map: Record<string, string> = {
        momo: 'warning',
        card: 'primary',
        cash: 'success',
        bank_transfer: 'info',
        online: 'secondary',
        manual: 'dark',
    };
    return map[channel] ?? 'secondary';
}

export interface TransactionTrendPoint {
    date: string;
    label: string;
    collected: number;
    refunded: number;
    count: number;
}

export interface TransactionChannelBreakdown {
    channel: TransactionChannel | 'manual';
    total: number;
    count: number;
}

export interface TransactionTrendsResponse {
    period: string;
    from: string;
    to: string;
    trend: TransactionTrendPoint[];
    channels: TransactionChannelBreakdown[];
}

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
    paid: 'Paid',
    pending: 'Pending',
    failed: 'Failed',
    under_review: 'Under Review',
    refunded: 'Refunded',
};

export const TRANSACTABLE_TYPE_LABELS: Record<TransactableType, string> = {
    rental: 'Rental',
    airport_booking: 'Airport Transfer',
    chauffeur_booking: 'Chauffeur Rental',
};
