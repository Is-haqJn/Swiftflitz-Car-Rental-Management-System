import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFilteredMenu } from '../useFilteredMenu';
import { sideBarItems } from '@admin/constants/sideBarItems';
import type { SideBarItems } from '@admin/types';
import type { AuthContextType } from '@/shared/types';
import { PERMISSIONS } from '@/shared/config/permissions';

// Mock useAuth so tests don't need a real Redux store or AuthProvider.
// The hook only uses hasRole and hasAnyPermission from the context.
vi.mock('@/shared/context', () => ({ useAuth: vi.fn() }));

import { useAuth } from '@/shared/context';

const mockUseAuth = vi.mocked(useAuth);

/**
 * Build a minimal AuthContext mock.
 * - super_admin role bypasses all permission checks (mirrors usePermission behaviour).
 * - Cast to AuthContextType so TypeScript doesn't complain about missing fields
 *   that useFilteredMenu never reads.
 */
function makeAuth(permissions: string[], roles: string[] = []) {
    return {
        hasRole: (role: string | string[]) => {
            const r = Array.isArray(role) ? role : [role];
            return r.some(x => roles.includes(x));
        },
        hasAnyPermission: (perms: string[]) =>
            roles.includes('super_admin') ||
            perms.some(p => permissions.includes(p)),
    } as unknown as AuthContextType;
}

/** Find a top-level sidebar section by its title (skips menu-title dividers). */
function getSection(items: SideBarItems[], title: string) {
    return items.find(i => i.title === title && i.classChange !== 'menu-title');
}

/** Return the child item titles for a given section, or [] if the section is absent. */
function getSubTitles(items: SideBarItems[], sectionTitle: string): string[] {
    return getSection(items, sectionTitle)?.content?.map(c => c.title) ?? [];
}

describe('useFilteredMenu', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /* A: No permissions */
    // A user with zero permissions should see no sections (except ungated ones
    // like Dashboard that carry no permission requirement).
    describe('A - no permissions', () => {
        it('hides all permissioned sections when user has no permissions', () => {
            mockUseAuth.mockReturnValue(makeAuth([]));

            const { result } = renderHook(() => useFilteredMenu(sideBarItems));
            const items = result.current;

            const permissionedSections = [
                ' Regular Rentals',
                'Vehicles',
                'Customers',
                'Reports',
                'Notifications',
                'Rental Coupon',
                'Exports & Downloads',
                'Users & Access',
                'Branches',
                'Settings',
                'Website Content',
            ];

            for (const title of permissionedSections) {
                expect(getSection(items, title)).toBeUndefined();
            }
        });

        it('always shows the Dashboard (no permission required)', () => {
            mockUseAuth.mockReturnValue(makeAuth([]));

            const { result } = renderHook(() => useFilteredMenu(sideBarItems));

            expect(getSection(result.current, 'Dashboard')).toBeDefined();
        });
    });

    /* B: Staff */
    // Staff have granular rental permissions (manage_active, create, etc.) but
    // NOT view_all. The bug this tests: the Rentals parent section was gated on
    // view_all alone, so staff could never see it. Fix: parent uses an array of
    // all child permissions and hasAnyPermission shows it if ANY matches.
    describe('B - staff (granular rental permissions only)', () => {
        const staffPerms = [
            PERMISSIONS.RENTALS.MANAGE_ACTIVE,
            PERMISSIONS.RENTALS.CREATE,
            PERMISSIONS.RENTALS.MANAGE_PENDING_BOOKINGS,
            PERMISSIONS.RENTALS.MANAGE_OVERDUE,
            PERMISSIONS.RENTALS.MARK_RETURNED,
            PERMISSIONS.RENTALS.VIEW_OWN,
            PERMISSIONS.RENTALS.PROCESS_PICKUP,
        ];

        it('shows the Rentals section', () => {
            mockUseAuth.mockReturnValue(makeAuth(staffPerms));

            const { result } = renderHook(() => useFilteredMenu(sideBarItems));

            expect(
                getSection(result.current, ' Regular Rentals')
            ).toBeDefined();
        });

        it('shows only staff-accessible rental children', () => {
            mockUseAuth.mockReturnValue(makeAuth(staffPerms));

            const { result } = renderHook(() => useFilteredMenu(sideBarItems));
            const children = getSubTitles(result.current, ' Regular Rentals');

            // Items gated on permissions the staff user has
            expect(children).toContain('Active Rentals');
            expect(children).toContain('Create Rental');
            expect(children).toContain('New Booking');
            expect(children).toContain('Pending Bookings');
            expect(children).toContain('Overdue Rentals');

            // Items gated on view_all / view_inspections / view_quotes - staff lacks these
            expect(children).not.toContain('All Rentals');
            expect(children).not.toContain('Returned Rentals');
            expect(children).not.toContain('Completed Rentals');
            expect(children).not.toContain('Cancelled Rentals');
            expect(children).not.toContain('Quote Requests');
            expect(children).not.toContain('Inspection Log');
        });

        it('hides Vehicles, Customers, Reports, Settings, Users & Access', () => {
            mockUseAuth.mockReturnValue(makeAuth(staffPerms));

            const { result } = renderHook(() => useFilteredMenu(sideBarItems));
            const items = result.current;

            expect(getSection(items, 'Vehicles')).toBeUndefined();
            expect(getSection(items, 'Customers')).toBeUndefined();
            expect(getSection(items, 'Reports')).toBeUndefined();
            expect(getSection(items, 'Settings')).toBeUndefined();
            expect(getSection(items, 'Users & Access')).toBeUndefined();
        });
    });

    /* C: Viewer */
    // Viewers have view_all + view_quotes - read-only access to completed rental
    // data. They must NOT see operational items like Active Rentals or Create.
    describe('C - viewer (view_all + view_quotes)', () => {
        const viewerPerms = [
            PERMISSIONS.RENTALS.VIEW_ALL,
            PERMISSIONS.RENTALS.VIEW_QUOTES,
            PERMISSIONS.RENTALS.VIEW_DOCUMENTS,
        ];

        it('shows the Rentals section', () => {
            mockUseAuth.mockReturnValue(makeAuth(viewerPerms));

            const { result } = renderHook(() => useFilteredMenu(sideBarItems));

            expect(
                getSection(result.current, ' Regular Rentals')
            ).toBeDefined();
        });

        it('shows only viewer-accessible rental children', () => {
            mockUseAuth.mockReturnValue(makeAuth(viewerPerms));

            const { result } = renderHook(() => useFilteredMenu(sideBarItems));
            const children = getSubTitles(result.current, ' Regular Rentals');

            // Read-only items the viewer can access
            expect(children).toContain('All Rentals');
            expect(children).toContain('Returned Rentals');
            expect(children).toContain('Completed Rentals');
            expect(children).toContain('Cancelled Rentals');
            expect(children).toContain('Quote Requests');

            // Operational items the viewer cannot access
            expect(children).not.toContain('Active Rentals');
            expect(children).not.toContain('Create Rental');
            expect(children).not.toContain('New Booking');
            expect(children).not.toContain('Pending Bookings');
            expect(children).not.toContain('Overdue Rentals');
        });
    });

    /* D: Manager */
    // Manager has full rental + vehicle access, plus limited customer/report
    // access. Verifies that partial permissions show the section with trimmed
    // children rather than hiding the section entirely.
    describe('D - manager (all rentals + all vehicles + customers.view_all + reports.view_revenue)', () => {
        const managerPerms = [
            ...Object.values(PERMISSIONS.RENTALS),
            ...Object.values(PERMISSIONS.VEHICLES),
            PERMISSIONS.CUSTOMERS.VIEW_ALL, // only this customer permission
            PERMISSIONS.REPORTS.VIEW_REVENUE, // only this report permission
        ];

        it('shows Rentals with all 15 children', () => {
            mockUseAuth.mockReturnValue(makeAuth(managerPerms));

            const { result } = renderHook(() => useFilteredMenu(sideBarItems));
            const children = getSubTitles(result.current, ' Regular Rentals');

            expect(children).toHaveLength(15);
        });

        it('shows Self-Drive Fleet with all 7 children', () => {
            mockUseAuth.mockReturnValue(makeAuth(managerPerms));

            const { result } = renderHook(() => useFilteredMenu(sideBarItems));
            const children = getSubTitles(result.current, 'Self-Drive Fleet');

            expect(children).toHaveLength(7);
        });

        it('shows Customers with only All Customers', () => {
            // Manager has view_all but not create/blacklist/license/history
            mockUseAuth.mockReturnValue(makeAuth(managerPerms));

            const { result } = renderHook(() => useFilteredMenu(sideBarItems));
            const children = getSubTitles(result.current, 'Customers');

            expect(children).toEqual(['All Customers']);
        });

        it('shows Reports with only Revenue Reports', () => {
            // Manager has view_revenue but not the other report permissions
            mockUseAuth.mockReturnValue(makeAuth(managerPerms));

            const { result } = renderHook(() => useFilteredMenu(sideBarItems));
            const children = getSubTitles(result.current, 'Reports');

            expect(children).toEqual(['Revenue Reports']);
        });

        it('hides Users & Access, Branches, Settings, Website Content', () => {
            mockUseAuth.mockReturnValue(makeAuth(managerPerms));

            const { result } = renderHook(() => useFilteredMenu(sideBarItems));
            const items = result.current;

            expect(getSection(items, 'Users & Access')).toBeUndefined();
            expect(getSection(items, 'Branches')).toBeUndefined();
            expect(getSection(items, 'Settings')).toBeUndefined();
            expect(getSection(items, 'Website Content')).toBeUndefined();
        });
    });

    /* E: Super Admin */
    // super_admin role bypasses all permission checks in hasAnyPermission,
    // so every section and every child item must be visible.
    describe('E - super admin (role: super_admin)', () => {
        it('shows all sections', () => {
            mockUseAuth.mockReturnValue(makeAuth([], ['super_admin']));

            const { result } = renderHook(() => useFilteredMenu(sideBarItems));
            const items = result.current;

            const allSections = [
                ' Regular Rentals',
                'Self-Drive Fleet',
                'Customers',
                'Reports',
                'Notifications',
                'Rental Coupon',
                'Users & Access',
                'Branches',
                'Settings',
                'Website Content',
            ];

            for (const title of allSections) {
                expect(getSection(items, title)).toBeDefined();
            }
        });

        it('shows all children in every section', () => {
            mockUseAuth.mockReturnValue(makeAuth([], ['super_admin']));

            const { result } = renderHook(() => useFilteredMenu(sideBarItems));

            // Child counts must match sideBarItems.tsx exactly
            expect(
                getSubTitles(result.current, ' Regular Rentals')
            ).toHaveLength(15);
            expect(getSubTitles(result.current, 'Self-Drive Fleet')).toHaveLength(7);
            expect(getSubTitles(result.current, 'Customers')).toHaveLength(6);
            expect(getSubTitles(result.current, 'Settings')).toHaveLength(17);
            expect(
                getSubTitles(result.current, 'Website Content')
            ).toHaveLength(9);
        });
    });

    /* F: Settings-only */
    // A user with only a subset of settings permissions should see the Settings
    // section but only the children that match their specific permissions.
    describe('F - settings-only user', () => {
        const settingsPerms = [
            PERMISSIONS.SETTINGS.EDIT_RENTAL,
            PERMISSIONS.SETTINGS.EDIT_PRICING,
        ];

        it('shows only the Settings section', () => {
            mockUseAuth.mockReturnValue(makeAuth(settingsPerms));

            const { result } = renderHook(() => useFilteredMenu(sideBarItems));
            const items = result.current;

            expect(getSection(items, 'Settings')).toBeDefined();

            expect(getSection(items, ' Regular Rentals')).toBeUndefined();
            expect(getSection(items, 'Vehicles')).toBeUndefined();
            expect(getSection(items, 'Customers')).toBeUndefined();
            expect(getSection(items, 'Users & Access')).toBeUndefined();
            expect(getSection(items, 'Website Content')).toBeUndefined();
        });

        it('shows only Rental Settings and Pricing Settings children', () => {
            mockUseAuth.mockReturnValue(makeAuth(settingsPerms));

            const { result } = renderHook(() => useFilteredMenu(sideBarItems));
            const children = getSubTitles(result.current, 'Settings');

            // Children the user has permission for
            expect(children).toContain('Rental Settings');
            expect(children).toContain('Pricing Settings');

            // Children the user does NOT have permission for
            expect(children).not.toContain('General Settings');
            expect(children).not.toContain('Email Configuration');
            expect(children).not.toContain('WhatsApp Settings');
            expect(children).not.toContain('Payment Settings');
            expect(children).not.toContain('Backup & Maintenance');
            expect(children).not.toContain('Notification Settings');
        });
    });
});
