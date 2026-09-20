import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoleGuard } from '../RoleGuard';

// Mock usePermission - RoleGuard only reads hasRole + isAuthenticated
vi.mock('@/shared/hooks', () => ({
    usePermission: vi.fn(),
}));

import { usePermission } from '@/shared/hooks';

const mockUsePermission = vi.mocked(usePermission);

function makeHook(overrides: {
    isAuthenticated?: boolean;
    hasRole?: (role: string | string[]) => boolean;
}) {
    return {
        isAuthenticated: overrides.isAuthenticated ?? true,
        hasRole: overrides.hasRole ?? ((_role: string | string[]) => false),
        hasPermission: (_p: string | string[]) => true,
        hasAnyPermission: (_p: string[]) => true,
        hasAllPermissions: (_p: string[]) => true,
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

describe('RoleGuard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /* Authentication gate */
    it('renders fallback when not authenticated', () => {
        mockUsePermission.mockReturnValue(makeHook({ isAuthenticated: false }));

        render(
            <RoleGuard role="admin" fallback={<span>Not logged in</span>}>
                <span>Admin area</span>
            </RoleGuard>
        );

        expect(screen.queryByText('Admin area')).not.toBeInTheDocument();
        expect(screen.getByText('Not logged in')).toBeInTheDocument();
    });

    it('renders null (no fallback) when not authenticated', () => {
        mockUsePermission.mockReturnValue(makeHook({ isAuthenticated: false }));

        const { container } = render(
            <RoleGuard role="admin">
                <span>Admin area</span>
            </RoleGuard>
        );

        expect(container).toBeEmptyDOMElement();
    });

    /* Single role */
    it('renders children when user has the required role', () => {
        mockUsePermission.mockReturnValue(
            makeHook({
                isAuthenticated: true,
                hasRole: role => {
                    const roles = Array.isArray(role) ? role : [role];
                    return roles.includes('admin');
                },
            })
        );

        render(
            <RoleGuard role="admin">
                <span>Admin panel</span>
            </RoleGuard>
        );

        expect(screen.getByText('Admin panel')).toBeInTheDocument();
    });

    it('renders fallback when user lacks the required role', () => {
        mockUsePermission.mockReturnValue(
            makeHook({
                isAuthenticated: true,
                hasRole: () => false,
            })
        );

        render(
            <RoleGuard role="super_admin" fallback={<span>Forbidden</span>}>
                <span>Super admin only</span>
            </RoleGuard>
        );

        expect(screen.queryByText('Super admin only')).not.toBeInTheDocument();
        expect(screen.getByText('Forbidden')).toBeInTheDocument();
    });

    /* Array of roles */
    it('renders children when user has one of the allowed roles (array)', () => {
        mockUsePermission.mockReturnValue(
            makeHook({
                isAuthenticated: true,
                hasRole: role => {
                    const roles = Array.isArray(role) ? role : [role];
                    return roles.includes('manager');
                },
            })
        );

        render(
            <RoleGuard role={['admin', 'manager']}>
                <span>Manager or admin area</span>
            </RoleGuard>
        );

        expect(screen.getByText('Manager or admin area')).toBeInTheDocument();
    });

    it('renders fallback when user has none of the allowed roles (array)', () => {
        mockUsePermission.mockReturnValue(
            makeHook({
                isAuthenticated: true,
                hasRole: () => false,
            })
        );

        render(
            <RoleGuard
                role={['admin', 'manager']}
                fallback={<span>Insufficient role</span>}
            >
                <span>Admin or manager area</span>
            </RoleGuard>
        );

        expect(
            screen.queryByText('Admin or manager area')
        ).not.toBeInTheDocument();
        expect(screen.getByText('Insufficient role')).toBeInTheDocument();
    });

    /* Default fallback */
    it('renders nothing by default when access is denied (no fallback prop)', () => {
        mockUsePermission.mockReturnValue(
            makeHook({ isAuthenticated: true, hasRole: () => false })
        );

        const { container } = render(
            <RoleGuard role="admin">
                <span>Protected</span>
            </RoleGuard>
        );

        expect(container).toBeEmptyDOMElement();
    });
});
