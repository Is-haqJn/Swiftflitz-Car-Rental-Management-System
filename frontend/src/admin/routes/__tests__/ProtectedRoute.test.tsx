import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import type { AuthContextType } from '@/shared/types';

// Mock useAuth - ProtectedRoute reads isAuthenticated, hasRole, hasAnyPermission
vi.mock('@/shared/context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

import { useAuth } from '@/shared/context/AuthContext';

const mockUseAuth = vi.mocked(useAuth);

function makeAuth(overrides: {
    isAuthenticated?: boolean;
    hasRole?: (roles: string | string[]) => boolean;
    hasAnyPermission?: (perms: string[]) => boolean;
}) {
    return {
        isAuthenticated: overrides.isAuthenticated ?? true,
        hasRole: overrides.hasRole ?? ((_r: string | string[]) => false),
        hasAnyPermission:
            overrides.hasAnyPermission ?? ((_p: string[]) => true),
        hasPermission: (_p: string | string[]) => true,
        hasAllPermissions: (_p: string[]) => true,
        user: null,
        isLoading: false,
        isVerifying: false,
        isSuperAdmin: () => false,
        isAdmin: () => false,
        isManager: () => false,
        isStaff: () => false,
        isViewer: () => false,
    } as unknown as AuthContextType;
}

/** Render ProtectedRoute inside a MemoryRouter with target + fallback routes. */
function renderRoute(
    props: {
        permission?: string | string[];
        role?: string | string[];
        fallbackRoute?: string;
    },
    initialPath = '/protected'
) {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route
                    path="/protected"
                    element={
                        <ProtectedRoute {...props}>
                            <span>Protected content</span>
                        </ProtectedRoute>
                    }
                />
                <Route path="/auth/login" element={<span>Login page</span>} />
                <Route path="/403" element={<span>Forbidden</span>} />
                <Route
                    path="/custom-login"
                    element={<span>Custom login</span>}
                />
            </Routes>
        </MemoryRouter>
    );
}

describe('ProtectedRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /* Auth redirect */
    it('redirects to /auth/login when not authenticated', () => {
        mockUseAuth.mockReturnValue(makeAuth({ isAuthenticated: false }));

        renderRoute({});

        expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
        expect(screen.getByText('Login page')).toBeInTheDocument();
    });

    it('redirects to custom fallbackRoute when not authenticated', () => {
        mockUseAuth.mockReturnValue(makeAuth({ isAuthenticated: false }));

        renderRoute({ fallbackRoute: '/custom-login' });

        expect(screen.getByText('Custom login')).toBeInTheDocument();
    });

    /* Authenticated, no guards */
    it('renders children when authenticated and no permission/role required', () => {
        mockUseAuth.mockReturnValue(makeAuth({ isAuthenticated: true }));

        renderRoute({});

        expect(screen.getByText('Protected content')).toBeInTheDocument();
    });

    /* Permission checks */
    it('renders children when user has the required single permission', () => {
        mockUseAuth.mockReturnValue(
            makeAuth({
                isAuthenticated: true,
                hasAnyPermission: perms => perms.includes('rentals.view_all'),
            })
        );

        renderRoute({ permission: 'rentals.view_all' });

        expect(screen.getByText('Protected content')).toBeInTheDocument();
    });

    it('redirects to /403 when user lacks the required permission', () => {
        mockUseAuth.mockReturnValue(
            makeAuth({
                isAuthenticated: true,
                hasAnyPermission: () => false,
            })
        );

        renderRoute({ permission: 'rentals.delete' });

        expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
        expect(screen.getByText('Forbidden')).toBeInTheDocument();
    });

    it('renders children when user has ANY of the required permissions (array)', () => {
        mockUseAuth.mockReturnValue(
            makeAuth({
                isAuthenticated: true,
                hasAnyPermission: perms =>
                    perms.some(p =>
                        ['rentals.manage_active', 'rentals.view_all'].includes(
                            p
                        )
                    ),
            })
        );

        renderRoute({
            permission: ['rentals.view_all', 'rentals.manage_active'],
        });

        expect(screen.getByText('Protected content')).toBeInTheDocument();
    });

    it('redirects to /403 when user has none of the required permissions (array)', () => {
        mockUseAuth.mockReturnValue(
            makeAuth({
                isAuthenticated: true,
                hasAnyPermission: () => false,
            })
        );

        renderRoute({
            permission: ['rentals.view_all', 'rentals.manage_active'],
        });

        expect(screen.getByText('Forbidden')).toBeInTheDocument();
    });

    /* Role checks */
    it('renders children when user has the required role', () => {
        mockUseAuth.mockReturnValue(
            makeAuth({
                isAuthenticated: true,
                hasRole: r => {
                    const roles = Array.isArray(r) ? r : [r];
                    return roles.includes('super_admin');
                },
            })
        );

        renderRoute({ role: 'super_admin' });

        expect(screen.getByText('Protected content')).toBeInTheDocument();
    });

    it('redirects to /403 when user lacks the required role', () => {
        mockUseAuth.mockReturnValue(
            makeAuth({
                isAuthenticated: true,
                hasRole: () => false,
            })
        );

        renderRoute({ role: 'super_admin' });

        expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
        expect(screen.getByText('Forbidden')).toBeInTheDocument();
    });

    it('renders children when user has ANY of the required roles (array)', () => {
        mockUseAuth.mockReturnValue(
            makeAuth({
                isAuthenticated: true,
                hasRole: r => {
                    const roles = Array.isArray(r) ? r : [r];
                    return roles.includes('manager');
                },
            })
        );

        renderRoute({ role: ['admin', 'manager'] });

        expect(screen.getByText('Protected content')).toBeInTheDocument();
    });

    /* Role + permission combined */
    it('redirects to /403 when role passes but permission fails', () => {
        mockUseAuth.mockReturnValue(
            makeAuth({
                isAuthenticated: true,
                hasRole: r => {
                    const roles = Array.isArray(r) ? r : [r];
                    return roles.includes('admin');
                },
                hasAnyPermission: () => false,
            })
        );

        renderRoute({ role: 'admin', permission: 'settings.edit_general' });

        expect(screen.getByText('Forbidden')).toBeInTheDocument();
    });

    it('renders children when both role and permission checks pass', () => {
        mockUseAuth.mockReturnValue(
            makeAuth({
                isAuthenticated: true,
                hasRole: () => true,
                hasAnyPermission: () => true,
            })
        );

        renderRoute({ role: 'admin', permission: 'settings.edit_general' });

        expect(screen.getByText('Protected content')).toBeInTheDocument();
    });
});
