import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PermisssionGuard } from '../PermissionGuard';

// Mock usePermission so tests don't need a Redux store or real auth state.
vi.mock('@/shared/hooks', () => ({
    usePermission: vi.fn(),
}));

import { usePermission } from '@/shared/hooks';

const mockUsePermission = vi.mocked(usePermission);

/**
 * Build a UsePermissionResult mock with safe defaults.
 * - isAuthenticated defaults to true
 * - hasAnyPermission defaults to allow-all
 * - hasAllPermissions defaults to allow-all
 * - hasRole defaults to deny (no roles by default)
 * Pass overrides to control individual behaviours per test.
 */
function makePermissionHook(overrides: {
    isAuthenticated?: boolean;
    hasAnyPermission?: (perms: string[]) => boolean;
    hasAllPermissions?: (perms: string[]) => boolean;
    hasRole?: (role: string | string[]) => boolean;
}) {
    return {
        isAuthenticated: overrides.isAuthenticated ?? true,
        hasAnyPermission:
            overrides.hasAnyPermission ?? ((_perms: string[]) => true),
        hasAllPermissions:
            overrides.hasAllPermissions ?? ((_perms: string[]) => true),
        hasRole: overrides.hasRole ?? ((_role: string | string[]) => false),
        hasPermission: (_perm: string | string[]) => true,
        user: null,
        roles: [],
        permissions: [],
        isSuperAdmin: () => false,
        isAdmin: () => false,
        isManager: () => false,
        isStaff: () => false,
        isViewer: () => false,
    };
}

describe('PermisssionGuard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /* Permission checks */
    it('renders children when authenticated and has required permission', () => {
        mockUsePermission.mockReturnValue(
            makePermissionHook({
                isAuthenticated: true,
                hasAnyPermission: () => true,
            })
        );

        render(
            <PermisssionGuard permission="rentals.view_all">
                <span>Protected content</span>
            </PermisssionGuard>
        );

        expect(screen.getByText('Protected content')).toBeInTheDocument();
    });

    it('renders fallback when user lacks the required permission', () => {
        // hasAnyPermission returns false → guard should show fallback, not children
        mockUsePermission.mockReturnValue(
            makePermissionHook({
                isAuthenticated: true,
                hasAnyPermission: () => false,
            })
        );

        render(
            <PermisssionGuard
                permission="rentals.delete"
                fallback={<span>Access denied</span>}
            >
                <span>Protected content</span>
            </PermisssionGuard>
        );

        expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
        expect(screen.getByText('Access denied')).toBeInTheDocument();
    });

    it('renders null (no fallback) when user lacks permission and no fallback provided', () => {
        // Without a fallback prop the guard must render nothing (empty DOM)
        mockUsePermission.mockReturnValue(
            makePermissionHook({
                isAuthenticated: true,
                hasAnyPermission: () => false,
            })
        );

        const { container } = render(
            <PermisssionGuard permission="rentals.delete">
                <span>Protected content</span>
            </PermisssionGuard>
        );

        expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
        expect(container).toBeEmptyDOMElement();
    });

    /* Auth checks */
    it('renders fallback when not authenticated', () => {
        // Unauthenticated users should always be denied regardless of permissions
        mockUsePermission.mockReturnValue(
            makePermissionHook({ isAuthenticated: false })
        );

        render(
            <PermisssionGuard
                permission="rentals.view_all"
                fallback={<span>Please log in</span>}
            >
                <span>Protected content</span>
            </PermisssionGuard>
        );

        expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
        expect(screen.getByText('Please log in')).toBeInTheDocument();
    });

    /* Role checks */
    it('renders fallback when user lacks required role', () => {
        mockUsePermission.mockReturnValue(
            makePermissionHook({
                isAuthenticated: true,
                hasRole: () => false,
            })
        );

        render(
            <PermisssionGuard
                role="super_admin"
                fallback={<span>Insufficient role</span>}
            >
                <span>Admin only</span>
            </PermisssionGuard>
        );

        expect(screen.queryByText('Admin only')).not.toBeInTheDocument();
        expect(screen.getByText('Insufficient role')).toBeInTheDocument();
    });

    it('renders children when user has required role', () => {
        // hasRole returns true → children should be visible
        mockUsePermission.mockReturnValue(
            makePermissionHook({
                isAuthenticated: true,
                hasRole: () => true,
            })
        );

        render(
            <PermisssionGuard role="admin">
                <span>Admin panel</span>
            </PermisssionGuard>
        );

        expect(screen.getByText('Admin panel')).toBeInTheDocument();
    });

    /* requireAll mode */
    // By default the guard uses hasAnyPermission (ANY match is enough).
    // With requireAll=true it switches to hasAllPermissions (every permission
    // must be present).

    it('requires ALL permissions when requireAll=true', () => {
        mockUsePermission.mockReturnValue(
            makePermissionHook({
                isAuthenticated: true,
                hasAllPermissions: perms =>
                    perms.every(p =>
                        ['rentals.view_all', 'rentals.edit'].includes(p)
                    ),
            })
        );

        render(
            <PermisssionGuard
                permission={['rentals.view_all', 'rentals.edit']}
                requireAll
            >
                <span>Full access</span>
            </PermisssionGuard>
        );

        expect(screen.getByText('Full access')).toBeInTheDocument();
    });

    it('denies when requireAll=true and only some permissions present', () => {
        mockUsePermission.mockReturnValue(
            makePermissionHook({
                isAuthenticated: true,
                hasAllPermissions: () => false,
            })
        );

        render(
            <PermisssionGuard
                permission={['rentals.view_all', 'rentals.delete']}
                requireAll
                fallback={<span>Missing permissions</span>}
            >
                <span>Full access</span>
            </PermisssionGuard>
        );

        expect(screen.queryByText('Full access')).not.toBeInTheDocument();
        expect(screen.getByText('Missing permissions')).toBeInTheDocument();
    });
});
