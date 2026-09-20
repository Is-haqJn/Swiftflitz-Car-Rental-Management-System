import { describe, it, expect } from 'vitest';
import {
    PERMISSIONS,
    PERMISSION_LABELS,
    PERMISSION_GROUPS,
    ALL_PERMISSIONS,
    getPermissionLabel,
    getPermissionGroup,
    permissionExists,
    getPermissionCategory,
    getPermissionsArray,
} from '../permissions';

/** Flatten all permission strings from the PERMISSIONS object. */
function allPermissionValues(): string[] {
    return Object.values(PERMISSIONS).flatMap(group =>
        Object.values(group as Record<string, string>)
    );
}

describe('PERMISSION_LABELS', () => {
    it('has a label for every permission value in PERMISSIONS', () => {
        const missing: string[] = [];

        for (const value of allPermissionValues()) {
            if (!PERMISSION_LABELS[value]) {
                missing.push(value);
            }
        }

        expect(missing).toEqual([]);
    });

    it('has no duplicate permission keys', () => {
        const keys = Object.keys(PERMISSION_LABELS);
        const unique = new Set(keys);
        expect(unique.size).toBe(keys.length);
    });
});

describe('PERMISSION_GROUPS', () => {
    it('every permission value in PERMISSIONS belongs to at least one group', () => {
        const allGrouped = new Set(
            PERMISSION_GROUPS.flatMap(g => g.permissions as string[])
        );
        const missing: string[] = [];

        for (const value of allPermissionValues()) {
            if (!allGrouped.has(value)) {
                missing.push(value);
            }
        }

        expect(missing).toEqual([]);
    });

    it('no permission appears in more than one group', () => {
        const seen = new Map<string, string>();
        const duplicates: string[] = [];

        for (const group of PERMISSION_GROUPS) {
            for (const perm of group.permissions as string[]) {
                if (seen.has(perm)) {
                    duplicates.push(
                        `${perm} (in "${seen.get(perm)}" and "${group.name}")`
                    );
                } else {
                    seen.set(perm, group.name);
                }
            }
        }

        expect(duplicates).toEqual([]);
    });

    it('every group has a non-empty name and description', () => {
        for (const group of PERMISSION_GROUPS) {
            expect(group.name.trim().length).toBeGreaterThan(0);
            expect(group.description.trim().length).toBeGreaterThan(0);
        }
    });

    it('every group has at least one permission', () => {
        for (const group of PERMISSION_GROUPS) {
            expect(group.permissions.length).toBeGreaterThan(0);
        }
    });
});

describe('ALL_PERMISSIONS', () => {
    it('matches the keys of PERMISSION_LABELS', () => {
        expect(ALL_PERMISSIONS).toEqual(Object.keys(PERMISSION_LABELS));
    });

    it('contains all values from PERMISSIONS', () => {
        for (const value of allPermissionValues()) {
            expect(ALL_PERMISSIONS).toContain(value);
        }
    });
});

describe('getPermissionLabel', () => {
    it('returns the label for a known permission', () => {
        expect(getPermissionLabel('rentals.view_all')).toBe(
            PERMISSION_LABELS['rentals.view_all']
        );
    });

    it('returns the permission string itself for unknown permissions', () => {
        expect(getPermissionLabel('unknown.permission')).toBe(
            'unknown.permission'
        );
    });
});

describe('getPermissionGroup', () => {
    it('returns the group for a known permission', () => {
        const group = getPermissionGroup('rentals.view_all');
        expect(group).toBeDefined();
        expect(group?.name).toBe('Rentals');
    });

    it('returns undefined for an unknown permission', () => {
        expect(getPermissionGroup('not.a.real.permission')).toBeUndefined();
    });

    it('returns Airport Transfer group for airport_transfer permissions', () => {
        const group = getPermissionGroup(PERMISSIONS.AIRPORT_TRANSFER.VIEW_ALL);
        expect(group?.name).toBe('Airport Transfer');
    });

    it('returns Drivers group for drivers permissions', () => {
        const group = getPermissionGroup(PERMISSIONS.DRIVERS.VIEW_ALL);
        expect(group?.name).toBe('Drivers');
    });

    it('returns Fleet Vehicles group for fleet_vehicles permissions', () => {
        const group = getPermissionGroup(PERMISSIONS.FLEET_VEHICLES.VIEW_ALL);
        expect(group?.name).toBe('Fleet Vehicles');
    });
});

describe('permissionExists', () => {
    it('returns true for a known permission', () => {
        expect(permissionExists('rentals.create')).toBe(true);
    });

    it('returns false for an unknown permission', () => {
        expect(permissionExists('not.real')).toBe(false);
    });
});

describe('getPermissionCategory', () => {
    it('extracts the prefix before the first dot', () => {
        expect(getPermissionCategory('rentals.view_all')).toBe('rentals');
        expect(getPermissionCategory('airport_transfer.view_all')).toBe(
            'airport_transfer'
        );
        expect(getPermissionCategory('fleet_vehicles.create')).toBe(
            'fleet_vehicles'
        );
    });
});

describe('getPermissionsArray', () => {
    it('returns an entry for every permission in PERMISSION_LABELS', () => {
        const arr = getPermissionsArray();
        expect(arr).toHaveLength(ALL_PERMISSIONS.length);
    });

    it('every entry has value, label, and category', () => {
        for (const item of getPermissionsArray()) {
            expect(typeof item.value).toBe('string');
            expect(typeof item.label).toBe('string');
            expect(typeof item.category).toBe('string');
        }
    });

    it('airport_transfer permissions have a group assigned', () => {
        const arr = getPermissionsArray();
        const atPerms = arr.filter(p =>
            p.value.startsWith('airport_transfer.')
        );
        expect(atPerms.length).toBeGreaterThan(0);
        for (const perm of atPerms) {
            expect(perm.group).toBe('Airport Transfer');
        }
    });
});
