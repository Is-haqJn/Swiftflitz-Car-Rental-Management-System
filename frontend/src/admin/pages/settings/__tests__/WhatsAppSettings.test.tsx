import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/shared/hooks/queries/useSettings', () => ({
    useWhatsAppSettings: vi.fn(),
    useUpdateWhatsAppSettings: vi.fn(),
    useTestWhatsAppConfig: vi.fn(),
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
    useWhatsAppSettings,
    useUpdateWhatsAppSettings,
    useTestWhatsAppConfig,
} from '@/shared/hooks/queries/useSettings';
import WhatsAppSettings from '../WhatsAppSettings';

const mockUseWhatsAppSettings = vi.mocked(useWhatsAppSettings);
const mockUseUpdateWhatsAppSettings = vi.mocked(useUpdateWhatsAppSettings);
const mockUseTestWhatsAppConfig = vi.mocked(useTestWhatsAppConfig);

function defaultMutationStub() {
    return { mutate: vi.fn(), isPending: false } as unknown as ReturnType<
        typeof useUpdateWhatsAppSettings
    >;
}

function renderWithSettings(data: Record<string, unknown> = {}) {
    mockUseWhatsAppSettings.mockReturnValue({
        data: { data },
        isLoading: false,
    } as unknown as ReturnType<typeof useWhatsAppSettings>);
    mockUseUpdateWhatsAppSettings.mockReturnValue(defaultMutationStub());
    mockUseTestWhatsAppConfig.mockReturnValue(
        defaultMutationStub() as unknown as ReturnType<
            typeof useTestWhatsAppConfig
        >
    );

    return render(<WhatsAppSettings />);
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('WhatsAppSettings', () => {
    it('shows skeleton while loading', () => {
        mockUseWhatsAppSettings.mockReturnValue({
            data: undefined,
            isLoading: true,
        } as unknown as ReturnType<typeof useWhatsAppSettings>);
        mockUseUpdateWhatsAppSettings.mockReturnValue(defaultMutationStub());
        mockUseTestWhatsAppConfig.mockReturnValue(
            defaultMutationStub() as unknown as ReturnType<
                typeof useTestWhatsAppConfig
            >
        );

        render(<WhatsAppSettings />);
        expect(document.querySelector('.placeholder-glow')).toBeInTheDocument();
    });

    it('renders app_secret field as password input', () => {
        renderWithSettings({ enabled: false });

        const appSecretInput = screen.getByPlaceholderText(
            'App secret from Meta App Dashboard'
        );
        expect(appSecretInput).toBeInTheDocument();
        expect(appSecretInput).toHaveAttribute('type', 'password');
    });

    it('renders webhook_verify_token field', () => {
        renderWithSettings({ enabled: false });

        const tokenInput = screen.getByPlaceholderText('your-verify-token');
        expect(tokenInput).toBeInTheDocument();
    });

    it('does not show webhook urls card when enabled is false', () => {
        renderWithSettings({ enabled: false });

        expect(screen.queryByText('Webhook URLs')).not.toBeInTheDocument();
    });

    it('shows webhook urls card when enabled is true', () => {
        renderWithSettings({ enabled: true });

        expect(screen.getByText('Webhook URLs')).toBeInTheDocument();
    });

    it('webhook urls alert references Webhook Verify Token, not .env', () => {
        renderWithSettings({ enabled: true });

        const alerts = screen.getAllByText(/Webhook Verify Token/);
        expect(alerts.length).toBeGreaterThan(0);
        expect(screen.queryByText(/\.env/)).not.toBeInTheDocument();
    });

    it('renders api credentials section with access token field', () => {
        renderWithSettings({});

        expect(screen.getByText('API Credentials')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('EAAxxxxxx...')).toBeInTheDocument();
    });

    it('renders Notify Branch Managers toggle', () => {
        renderWithSettings({});

        expect(screen.getByText('Notify Branch Managers')).toBeInTheDocument();
    });

    it('includes notify_branch_managers in submit payload', async () => {
        const mutateFn = vi.fn();
        mockUseWhatsAppSettings.mockReturnValue({
            data: { data: { notify_branch_managers: true } },
            isLoading: false,
        } as unknown as ReturnType<typeof useWhatsAppSettings>);
        mockUseUpdateWhatsAppSettings.mockReturnValue({
            mutate: mutateFn,
            isPending: false,
        } as unknown as ReturnType<typeof useUpdateWhatsAppSettings>);
        mockUseTestWhatsAppConfig.mockReturnValue(
            defaultMutationStub() as unknown as ReturnType<
                typeof useTestWhatsAppConfig
            >
        );

        render(<WhatsAppSettings />);

        const form = document.querySelector('form')!;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(mutateFn).toHaveBeenCalled();
            const payload = mutateFn.mock.calls[0][0] as Record<string, unknown>;
            expect(Object.prototype.hasOwnProperty.call(payload, 'notify_branch_managers')).toBe(true);
        });
    });
});
