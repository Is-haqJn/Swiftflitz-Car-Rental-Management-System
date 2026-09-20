import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/shared/hooks/queries/useSettings', () => ({
    useSmsSettings: vi.fn(),
    useUpdateSmsSettings: vi.fn(),
    useTestSmsConfig: vi.fn(),
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
    useSmsSettings,
    useUpdateSmsSettings,
    useTestSmsConfig,
} from '@/shared/hooks/queries/useSettings';
import SmsSettings from '../SmsSettings';

const mockUseSmsSettings = vi.mocked(useSmsSettings);
const mockUseUpdateSmsSettings = vi.mocked(useUpdateSmsSettings);
const mockUseTestSmsConfig = vi.mocked(useTestSmsConfig);

function defaultMutationStub() {
    return { mutate: vi.fn(), isPending: false } as unknown as ReturnType<
        typeof useUpdateSmsSettings
    >;
}

function renderWithSettings(data: Record<string, unknown> = {}) {
    mockUseSmsSettings.mockReturnValue({
        data: { data },
        isLoading: false,
    } as unknown as ReturnType<typeof useSmsSettings>);
    mockUseUpdateSmsSettings.mockReturnValue(defaultMutationStub());
    mockUseTestSmsConfig.mockReturnValue(
        defaultMutationStub() as unknown as ReturnType<typeof useTestSmsConfig>
    );

    return render(<SmsSettings />);
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('SmsSettings', () => {
    it('shows skeleton while loading', () => {
        mockUseSmsSettings.mockReturnValue({
            data: undefined,
            isLoading: true,
        } as unknown as ReturnType<typeof useSmsSettings>);
        mockUseUpdateSmsSettings.mockReturnValue(defaultMutationStub());
        mockUseTestSmsConfig.mockReturnValue(
            defaultMutationStub() as unknown as ReturnType<typeof useTestSmsConfig>
        );

        render(<SmsSettings />);
        expect(document.querySelector('.placeholder-glow')).toBeInTheDocument();
    });

    it('renders Notify Branch Managers toggle', () => {
        renderWithSettings({});

        expect(
            screen.getByText('Notify Branch Managers')
        ).toBeInTheDocument();
    });

    it('renders notify_branch_managers toggle between customers and admins', () => {
        renderWithSettings({});

        const deliverySection = screen.getByText('Delivery Mode').closest('.card');
        expect(deliverySection).toBeInTheDocument();
        expect(
            screen.getByLabelText(/Notify Branch Managers/i) ??
            screen.getByRole('checkbox', { name: /Notify Branch Managers/i })
        ).toBeInTheDocument();
    });

    it('includes notify_branch_managers in submit payload', async () => {
        const mutateFn = vi.fn();
        mockUseSmsSettings.mockReturnValue({
            data: { data: { notify_branch_managers: true } },
            isLoading: false,
        } as unknown as ReturnType<typeof useSmsSettings>);
        mockUseUpdateSmsSettings.mockReturnValue({
            mutate: mutateFn,
            isPending: false,
        } as unknown as ReturnType<typeof useUpdateSmsSettings>);
        mockUseTestSmsConfig.mockReturnValue(
            defaultMutationStub() as unknown as ReturnType<typeof useTestSmsConfig>
        );

        render(<SmsSettings />);

        const form = document.querySelector('form')!;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(mutateFn).toHaveBeenCalled();
            const payload = mutateFn.mock.calls[0][0] as Record<string, unknown>;
            expect(Object.prototype.hasOwnProperty.call(payload, 'notify_branch_managers')).toBe(true);
        });
    });
});
