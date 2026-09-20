import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePermission } from '../usePermission';
import {
    selectAuthUser,
    selectIsAuthenticated,
} from '@/store/slices/authSlice';

// Mock the Redux store hook so tests don't need a real Provider/store.
// usePermission calls useAppSelector(selectAuthUser) then
// useAppSelector(selectIsAuthenticated). We use mockImplementation to
// dispatch the right value based on which selector is passed.
vi.mock('@/store', () => ({
    useAppSelector: vi.fn(),
}));

import { useAppSelector } from '@/store';

const mockUseAppSelector = vi.mocked(useAppSelector);

type MockUser = {
    all_permissions: string[];
    roles: string[];
} | null;

/** Wire up useAppSelector to return controlled auth state. */
function setupHook(user: MockUser, isAuthenticated = true) {
    mockUseAppSelector.mockImplementation((selector: unknown) => {
        if (selector === selectAuthUser) return user;
        if (selector === selectIsAuthenticated) return isAuthenticated;
        return undefined;
    });
}

describe('usePermission', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /* isAuthenticated */
    it('returns isAuthenticated=true when store says authenticated', () => {
        setupHook({ all_permissions: [], roles: [] }, true);
        const { result } = renderHook(() => usePermission());
        expect(result.current.isAuthenticated).toBe(true);
    });

    it('returns isAuthenticated=false when store says not authenticated', () => {
        setupHook(null, false);
        const { result } = renderHook(() => usePermission());
        expect(result.current.isAuthenticated).toBe(false);
    });

    /* hasRole */
    it('returns false from hasRole when not authenticated', () => {
        setupHook(null, false);
        const { result } = renderHook(() => usePermission());
        expect(result.current.hasRole('admin')).toBe(false);
    });

    it('returns true when user has the role', () => {
        setupHook({ all_permissions: [], roles: ['admin'] }, true);
        const { result } = renderHook(() => usePermission());
        expect(result.current.hasRole('admin')).toBe(true);
    });

    it('returns false when user lacks the role', () => {
        setupHook({ all_permissions: [], roles: ['staff'] }, true);
        const { result } = renderHook(() => usePermission());
        expect(result.current.hasRole('admin')).toBe(false);
    });

    it('returns true when user has any of the roles (array check)', () => {
        setupHook({ all_permissions: [], roles: ['manager'] }, true);
        const { result } = renderHook(() => usePermission());
        expect(result.current.hasRole(['admin', 'manager'])).toBe(true);
    });

    it('returns false when user has none of the roles (array check)', () => {
        setupHook({ all_permissions: [], roles: ['viewer'] }, true);
        const { result } = renderHook(() => usePermission());
        expect(result.current.hasRole(['admin', 'manager'])).toBe(false);
    });

    /* hasPermission */
    it('returns false from hasPermission when not authenticated', () => {
        setupHook(null, false);
        const { result } = renderHook(() => usePermission());
        expect(result.current.hasPermission('rentals.view_all')).toBe(false);
    });

    it('returns true when user has the permission', () => {
        setupHook(
            {
                all_permissions: ['rentals.view_all', 'rentals.edit'],
                roles: ['staff'],
            },
            true
        );
        const { result } = renderHook(() => usePermission());
        expect(result.current.hasPermission('rentals.view_all')).toBe(true);
    });

    it('returns false when user lacks the permission', () => {
        setupHook(
            { all_permissions: ['rentals.edit'], roles: ['staff'] },
            true
        );
        const { result } = renderHook(() => usePermission());
        expect(result.current.hasPermission('rentals.delete')).toBe(false);
    });

    /* super_admin bypass */
    it('super_admin bypasses hasPermission - returns true for any permission', () => {
        setupHook({ all_permissions: [], roles: ['super_admin'] }, true);
        const { result } = renderHook(() => usePermission());
        expect(
            result.current.hasPermission('some.nonexistent.permission')
        ).toBe(true);
    });

    it('super_admin bypasses hasAnyPermission', () => {
        setupHook({ all_permissions: [], roles: ['super_admin'] }, true);
        const { result } = renderHook(() => usePermission());
        expect(
            result.current.hasAnyPermission([
                'does.not.exist',
                'neither.does.this',
            ])
        ).toBe(true);
    });

    it('super_admin bypasses hasAllPermissions', () => {
        setupHook({ all_permissions: [], roles: ['super_admin'] }, true);
        const { result } = renderHook(() => usePermission());
        expect(
            result.current.hasAllPermissions(['perm.a', 'perm.b', 'perm.c'])
        ).toBe(true);
    });

    /* hasAnyPermission */
    it('returns true when user has at least one of the permissions', () => {
        setupHook(
            {
                all_permissions: ['rentals.manage_active'],
                roles: ['staff'],
            },
            true
        );
        const { result } = renderHook(() => usePermission());
        expect(
            result.current.hasAnyPermission([
                'rentals.view_all',
                'rentals.manage_active',
            ])
        ).toBe(true);
    });

    it('returns false when user has none of the permissions', () => {
        setupHook(
            { all_permissions: ['rentals.edit'], roles: ['staff'] },
            true
        );
        const { result } = renderHook(() => usePermission());
        expect(
            result.current.hasAnyPermission([
                'rentals.delete',
                'rentals.view_all',
            ])
        ).toBe(false);
    });

    /* hasAllPermissions */
    it('returns true when user has all of the required permissions', () => {
        setupHook(
            {
                all_permissions: [
                    'rentals.view_all',
                    'rentals.edit',
                    'rentals.delete',
                ],
                roles: ['admin'],
            },
            true
        );
        const { result } = renderHook(() => usePermission());
        expect(
            result.current.hasAllPermissions([
                'rentals.view_all',
                'rentals.edit',
            ])
        ).toBe(true);
    });

    it('returns false when user is missing one of the required permissions', () => {
        setupHook(
            {
                all_permissions: ['rentals.view_all'],
                roles: ['admin'],
            },
            true
        );
        const { result } = renderHook(() => usePermission());
        expect(
            result.current.hasAllPermissions([
                'rentals.view_all',
                'rentals.delete',
            ])
        ).toBe(false);
    });

    it('returns false from hasAllPermissions when not authenticated', () => {
        setupHook(null, false);
        const { result } = renderHook(() => usePermission());
        expect(result.current.hasAllPermissions(['rentals.view_all'])).toBe(
            false
        );
    });

    /* Convenience role helpers */
    it('isSuperAdmin returns true when user has super_admin role', () => {
        setupHook({ all_permissions: [], roles: ['super_admin'] }, true);
        const { result } = renderHook(() => usePermission());
        expect(result.current.isSuperAdmin()).toBe(true);
    });

    it('isAdmin returns true when user has admin role', () => {
        setupHook({ all_permissions: [], roles: ['admin'] }, true);
        const { result } = renderHook(() => usePermission());
        expect(result.current.isAdmin()).toBe(true);
    });

    it('isManager returns true when user has manager role', () => {
        setupHook({ all_permissions: [], roles: ['manager'] }, true);
        const { result } = renderHook(() => usePermission());
        expect(result.current.isManager()).toBe(true);
    });

    it('isViewer returns true when user has viewer role', () => {
        setupHook({ all_permissions: [], roles: ['viewer'] }, true);
        const { result } = renderHook(() => usePermission());
        expect(result.current.isViewer()).toBe(true);
    });

    it('isStaff returns false when user has admin role', () => {
        setupHook({ all_permissions: [], roles: ['admin'] }, true);
        const { result } = renderHook(() => usePermission());
        expect(result.current.isStaff()).toBe(false);
    });

    /* permissions / roles arrays */
    it('exposes all_permissions as permissions array', () => {
        setupHook(
            {
                all_permissions: ['rentals.view_all', 'vehicles.view'],
                roles: ['viewer'],
            },
            true
        );
        const { result } = renderHook(() => usePermission());
        expect(result.current.permissions).toEqual([
            'rentals.view_all',
            'vehicles.view',
        ]);
    });

    it('exposes roles array from user', () => {
        setupHook({ all_permissions: [], roles: ['admin', 'manager'] }, true);
        const { result } = renderHook(() => usePermission());
        expect(result.current.roles).toEqual(['admin', 'manager']);
    });

    it('returns empty arrays when user is null', () => {
        setupHook(null, false);
        const { result } = renderHook(() => usePermission());
        expect(result.current.roles).toEqual([]);
        expect(result.current.permissions).toEqual([]);
    });
});
