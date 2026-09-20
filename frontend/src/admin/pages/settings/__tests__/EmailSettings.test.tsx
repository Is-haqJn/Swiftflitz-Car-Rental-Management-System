import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/shared/hooks/queries/useSettings', () => ({
    useEmailSettings: vi.fn(),
    useUpdateEmailSettings: vi.fn(),
    useTestEmailConfig: vi.fn(),
    isMasked: (v: unknown) => v === '••••••••••••••••',
}));

vi.mock('@/shared/hooks', () => ({
    useTitle: vi.fn().mockReturnValue(null),
}));

vi.mock('@/shared/components/common/PermissionGuard', () => ({
    PermisssionGuard: ({ children }: { children: React.ReactNode }) => (
        <>{children}</>
    ),
}));

import React from 'react';
import {
    useEmailSettings,
    useUpdateEmailSettings,
    useTestEmailConfig,
} from '@/shared/hooks/queries/useSettings';
import EmailSettings from '../EmailSettings';

const mockUseEmailSettings = vi.mocked(useEmailSettings);
const mockUseUpdateEmailSettings = vi.mocked(useUpdateEmailSettings);
const mockUseTestEmailConfig = vi.mocked(useTestEmailConfig);

function defaultMutationStub() {
    return { mutate: vi.fn(), isPending: false } as unknown as ReturnType<
        typeof useUpdateEmailSettings
    >;
}

function renderWithSettings(data: Record<string, unknown> = {}) {
    mockUseEmailSettings.mockReturnValue({
        data: { data },
        isLoading: false,
    } as unknown as ReturnType<typeof useEmailSettings>);
    mockUseUpdateEmailSettings.mockReturnValue(defaultMutationStub());
    mockUseTestEmailConfig.mockReturnValue(
        defaultMutationStub() as unknown as ReturnType<
            typeof useTestEmailConfig
        >
    );

    return render(<EmailSettings />);
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('EmailSettings', () => {
    it('shows skeleton while loading', () => {
        mockUseEmailSettings.mockReturnValue({
            data: undefined,
            isLoading: true,
        } as unknown as ReturnType<typeof useEmailSettings>);
        mockUseUpdateEmailSettings.mockReturnValue(defaultMutationStub());
        mockUseTestEmailConfig.mockReturnValue(
            defaultMutationStub() as unknown as ReturnType<
                typeof useTestEmailConfig
            >
        );

        render(<EmailSettings />);
        expect(document.querySelector('.placeholder-glow')).toBeInTheDocument();
    });

    it('renders Recipient Groups section heading', () => {
        renderWithSettings({});
        expect(screen.getByText('Recipient Groups')).toBeInTheDocument();
    });

    it('renders Notify Customers toggle in Recipient Groups section', () => {
        renderWithSettings({});
        expect(screen.getByText('Notify Customers')).toBeInTheDocument();
    });

    it('renders Notify Branch Managers toggle in Recipient Groups section', () => {
        renderWithSettings({});
        expect(screen.getByText('Notify Branch Managers')).toBeInTheDocument();
    });

    it('renders Notify Admins toggle in Recipient Groups section', () => {
        renderWithSettings({});
        expect(screen.getByText('Notify Admins')).toBeInTheDocument();
    });

    it('renders Admin Notification Triggers section heading', () => {
        renderWithSettings({});
        expect(
            screen.getByText('Admin Notification Triggers')
        ).toBeInTheDocument();
    });

    it('renders send_admin_new_booking toggle in Admin Notifications section', () => {
        renderWithSettings({});
        expect(screen.getByText('New booking alert')).toBeInTheDocument();
    });

    it('renders all 12 admin notification toggles', () => {
        renderWithSettings({});

        const adminLabels = [
            'New booking alert',
            'Rental cancelled',
            'Pickup reminder',
            'Return reminder',
            'Overdue alert',
            'Payment confirmed',
            'Rental status change',
            'Airport booking',
            'Airport booking cancelled',
            'Chauffeur booking',
            'Chauffeur booking cancelled',
            'Chauffeur pickup reminder',
        ];

        adminLabels.forEach(label => {
            expect(screen.getByText(label)).toBeInTheDocument();
        });
    });

    it('each admin notification trigger switch has an id matching its field name', () => {
        renderWithSettings({});

        const triggerFields = [
            { field: 'send_admin_new_booking', label: 'New booking alert' },
            { field: 'send_admin_rental_cancelled', label: 'Rental cancelled' },
            { field: 'send_admin_pickup_reminder', label: 'Pickup reminder' },
        ];

        triggerFields.forEach(({ label }) => {
            const switchInput = screen.getByRole('checkbox', { name: label });
            expect(switchInput).toHaveAttribute('id');
            expect(switchInput.getAttribute('id')).not.toBe('');
        });
    });

    it('includes all new recipient and admin fields in submit payload', async () => {
        const mutateFn = vi.fn();
        mockUseEmailSettings.mockReturnValue({
            data: {
                data: {
                    notify_customers: true,
                    notify_branch_managers: false,
                    notify_admins: true,
                    send_admin_new_booking: true,
                },
            },
            isLoading: false,
        } as unknown as ReturnType<typeof useEmailSettings>);
        mockUseUpdateEmailSettings.mockReturnValue({
            mutate: mutateFn,
            isPending: false,
        } as unknown as ReturnType<typeof useUpdateEmailSettings>);
        mockUseTestEmailConfig.mockReturnValue(
            defaultMutationStub() as unknown as ReturnType<
                typeof useTestEmailConfig
            >
        );

        render(<EmailSettings />);

        const form = document.querySelector('form')!;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(mutateFn).toHaveBeenCalled();
            const payload = mutateFn.mock.calls[0][0] as Record<
                string,
                unknown
            >;
            expect(
                Object.prototype.hasOwnProperty.call(
                    payload,
                    'notify_customers'
                )
            ).toBe(true);
            expect(
                Object.prototype.hasOwnProperty.call(
                    payload,
                    'notify_branch_managers'
                )
            ).toBe(true);
            expect(
                Object.prototype.hasOwnProperty.call(payload, 'notify_admins')
            ).toBe(true);
            expect(
                Object.prototype.hasOwnProperty.call(
                    payload,
                    'send_admin_new_booking'
                )
            ).toBe(true);
            expect(
                Object.prototype.hasOwnProperty.call(
                    payload,
                    'send_admin_chauffeur_pickup_reminder'
                )
            ).toBe(true);
        });
    });
});
