import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Header from '../Header';

import { useAppSelector, useAppDispatch } from '@/store';
import { useConfirm } from '@/shared/hooks/useConfirm';
import { tokenManager } from '@/shared/config/tokenManager';
import { clearActiveBranch } from '@/store/slices/activeBranchSlice';
import { clearAuth } from '@/store/slices/authSlice'; /* still used in expect assertion */
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(() => vi.fn()),
    persistor: {
        flush: vi.fn().mockResolvedValue(undefined),
        purge: vi.fn().mockResolvedValue(undefined),
    },
}));

import { selectActiveBranchId } from '@/store/slices/activeBranchSlice';
import { selectAuthUser } from '@/store/slices/authSlice';

vi.mock('@/store/slices/activeBranchSlice', () => ({
    selectActiveBranchId: vi.fn(),
    setActiveBranch: vi.fn(),
    clearActiveBranch: vi.fn().mockReturnValue({ type: 'clear' }),
}));

vi.mock('@/store/slices/authSlice', () => ({
    selectAuthUser: vi.fn(),
    clearAuth: vi.fn().mockReturnValue({ type: 'clearAuth' }),
}));

vi.mock('@/shared/hooks/useConfirm', () => ({
    useConfirm: vi.fn(),
}));

vi.mock('@/shared/config/tokenManager', () => ({
    tokenManager: {
        isImpersonating: vi.fn(),
        getOriginalUserName: vi.fn(),
        stopImpersonation: vi.fn(),
    },
}));

vi.mock('@/shared/hooks/queries/useNotifications', () => ({
    useUnreadCount: vi.fn().mockReturnValue({ data: { data: { count: 0 } } }),
    useNotifications: vi.fn().mockReturnValue({ data: { data: [] } }),
    useMarkAsRead: vi.fn().mockReturnValue(() => {}),
}));

vi.mock('@/admin/context/ThemeContext', () => ({
    useThemeContext: vi.fn().mockReturnValue({
        background: { value: 'light' },
        changeBackground: vi.fn(),
    }),
}));

vi.mock('../../../common/LogoutButton', () => ({
    LogoutButton: () => <button>Logout</button>,
}));

describe('Header Component', () => {
    let dispatchMock: ReturnType<typeof vi.fn>;
    let confirmMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        dispatchMock = vi.fn();
        vi.mocked(useAppDispatch).mockReturnValue((() => dispatchMock) as any);

        confirmMock = vi.fn().mockResolvedValue(true);
        vi.mocked(useConfirm).mockReturnValue({ confirm: confirmMock as any });

        vi.mocked(tokenManager.isImpersonating).mockReturnValue(false);
        vi.mocked(tokenManager.getOriginalUserName).mockReturnValue('Admin');

        sessionStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('clears stale activeBranchId when the loaded user has no branches (e.g. global admin)', async () => {
        // Mock useAppSelector to return specific values
        vi.mocked(useAppSelector).mockImplementation((selector: any) => {
            if (selector === selectActiveBranchId) return 'lagos_123';
            if (selector === selectAuthUser)
                return {
                    id: 1,
                    name: 'Admin User',
                    roles: ['super_admin'],
                    branches: [], // Global admin with no specific branches
                };
            return null;
        });

        render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );

        // Should call dispatch with clearActiveBranch
        await waitFor(() => {
            expect(dispatchMock).toHaveBeenCalledWith(clearActiveBranch());
        });
    });

    it('restores token then purges persisted state on stop impersonation', async () => {
        vi.mocked(useAppSelector).mockImplementation((selector: any) => {
            if (selector === selectActiveBranchId) return 'lagos_123';
            if (selector === selectAuthUser)
                return {
                    id: 2,
                    name: 'Impersonated User',
                    roles: ['manager'],
                    branches: [{ id: 'lagos_123', name: 'Lagos' }],
                };
            return null;
        });

        vi.mocked(tokenManager.isImpersonating).mockReturnValue(true);

        const executionOrder: string[] = [];

        vi.mocked(tokenManager.stopImpersonation).mockImplementation(() => {
            executionOrder.push('stopImpersonation');
        });

        /* spy on sessionStorage.setItem */
        const mockSetItem = vi
            .fn()
            .mockImplementation((key: string, _value: string) => {
                if (key === 'swiftflitz:stop_impersonation') {
                    executionOrder.push('sessionStorage');
                }
            });
        vi.stubGlobal('sessionStorage', {
            setItem: mockSetItem,
            getItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
        });

        render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );

        const user = userEvent.setup();
        const stopBtn = screen.getByRole('button', {
            name: /Return to Admin/i,
        });
        await user.click(stopBtn);

        await waitFor(() => {
            expect(confirmMock).toHaveBeenCalled();
        });

        /* token must be restored before session flag is set */
        expect(executionOrder).toEqual(['stopImpersonation', 'sessionStorage']);

        /* purge must be called to nuke persisted Redux state */
        const { persistor } = await import('@/store');
        expect(persistor.purge).toHaveBeenCalled();

        /* no auth dispatches - dispatch is no longer called in stop-impersonation path */
        expect(dispatchMock).not.toHaveBeenCalledWith(clearAuth());
    });
});
