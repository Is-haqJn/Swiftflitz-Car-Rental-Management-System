import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: 'test-tx-id' }),
}));

vi.mock('@/shared/hooks', () => ({
    useTitle: vi.fn(),
    usePermission: vi.fn(() => ({
        hasPermission: vi.fn(() => false),
    })),
}));

vi.mock('@/shared/hooks/queries/useTransactions', () => ({
    useTransaction: vi.fn(),
    useResolveTransaction: vi.fn(() => ({
        mutate: vi.fn(),
        isPending: false,
    })),
}));

vi.mock('@/shared/hooks/queries/useSettings', () => ({
    useFormatCurrency: vi.fn(() => (n: number) => `GHS ${n.toFixed(2)}`),
    useGeneralSettings: vi.fn(() => ({
        data: { data: { currency_symbol: '₵', site_name: 'Swiftflitz' } },
    })),
    usePaymentSettings: vi.fn(() => ({ data: { data: {} } })),
}));

vi.mock('@/store', () => ({
    useAppSelector: vi.fn(() => null),
}));

vi.mock('@/store/slices/activeBranchSlice', () => ({
    selectActiveBranchId: vi.fn(),
}));

vi.mock('@/shared/components/common/PermissionGuard', () => ({
    PermisssionGuard: ({ children }: { children: React.ReactNode }) => (
        <>{children}</>
    ),
}));

vi.mock('@adminComponents/skeletons/DetailPageSkeleton', () => ({
    DetailPageSkeleton: () => <div data-testid="skeleton" />,
}));

import React from 'react';
import { useTransaction } from '@/shared/hooks/queries/useTransactions';
import TransactionDetail from '../TransactionDetail';
import type { Transaction } from '@/shared/types/transaction.types';

const mockUseTransaction = vi.mocked(useTransaction);

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
    return {
        id: 'tx-1',
        reference: 'TXN-ABC123',
        branch_id: null,
        branch: null,
        provider: 'manual',
        provider_reference: 'PROV-REF-999',
        channel: 'cash',
        payment_phone: null,
        card_bin: null,
        card_last4: null,
        card_type: null,
        card_display: null,
        type: 'payment',
        type_label: 'Payment',
        amount: 100,
        currency: 'GHS',
        currency_symbol: '₵',
        exchange_rate: null,
        gateway_amount: null,
        gateway_currency: null,
        gateway_charges: null,
        customer_amount: null,
        status: 'paid',
        status_label: 'Paid',
        description: null,
        discount_amount: null,
        discount_reason: null,
        paid_at: '2026-01-15T10:00:00Z',
        created_at: '2026-01-15T09:00:00Z',
        updated_at: '2026-01-15T10:00:00Z',
        payer: { name: 'John Doe', email: 'john@example.com', phone: '+233501234567' },
        transactable: null,
        processed_by: null,
        coupon: null,
        discount_rule: null,
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('TransactionDetail - Payment Details field order', () => {
    it('renders Provider Reference immediately after Reference', () => {
        mockUseTransaction.mockReturnValue({
            data: { data: makeTransaction() },
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useTransaction>);

        render(<TransactionDetail />);

        /* Collect all label spans inside the Payment Details section.
           InfoRow renders the label as a <span class="text-muted"> child of a flex row.
           We scope to the section identified by its header text. */
        const paymentDetailsHeader = screen.getByText('Payment Details');
        /* Walk up to the section container (the rounded div wrapping header + body) */
        const section = paymentDetailsHeader.closest('[id], .rounded-3') as HTMLElement;
        expect(section).toBeTruthy();

        const labelSpans = within(section).getAllByText(/^(Reference|Provider Reference|Provider|Channel)$/);
        const labels = labelSpans.map(el => el.textContent?.trim());

        const refIdx = labels.indexOf('Reference');
        const provRefIdx = labels.indexOf('Provider Reference');

        expect(refIdx).toBeGreaterThanOrEqual(0);
        expect(provRefIdx).toBeGreaterThanOrEqual(0);
        expect(provRefIdx).toBe(refIdx + 1);
    });

    it('omits Provider Reference row when provider_reference is null', () => {
        mockUseTransaction.mockReturnValue({
            data: { data: makeTransaction({ provider_reference: null }) },
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useTransaction>);

        render(<TransactionDetail />);

        expect(screen.queryByText('Provider Reference')).not.toBeInTheDocument();
    });
});
