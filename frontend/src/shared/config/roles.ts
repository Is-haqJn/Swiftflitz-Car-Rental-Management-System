export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MANAGER: 'manager',
    STAFF: 'staff',
    //ACCOUNTANT: 'accountant',
    VIEWER: 'viewer',
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<RoleType, string> = {
    [ROLES.SUPER_ADMIN]: 'Super Administrator',
    [ROLES.ADMIN]: 'Administrator',
    [ROLES.MANAGER]: 'Manager',
    [ROLES.STAFF]: 'Staff',
    //[ROLES.ACCOUNTANT]: 'Accountant',
    [ROLES.VIEWER]: 'Viewer',
};

export const ROLE_DESCRIPTIONS: Record<RoleType, string> = {
    [ROLES.SUPER_ADMIN]:
        'Highest level of access with full control over the system, including user management and settings.',
    [ROLES.ADMIN]:
        'Full system access with ability to manage all aspects including users and settings.',
    [ROLES.MANAGER]:
        'Operational lead with access to most features, excluding sensitive system settings.',
    [ROLES.STAFF]:
        'Front desk staff focused on day-to-day rental operations and customer interaction.',
    //[ROLES.ACCOUNTANT]: 'Financial role with access to reports, analytics, and data exports.',
    [ROLES.VIEWER]:
        'Read-only access to view data without ability to make changes.',
};

export const getRoleLabel = (role: string): string => {
    return ROLE_LABELS[role as RoleType] || role;
};

export const getRoleDescription = (role: string): string => {
    return ROLE_DESCRIPTIONS[role as RoleType] || '';
};

export const getRolesArray = () => {
    return Object.values(ROLES).map(role => ({
        value: role,
        label: getRoleLabel(role),
        description: getRoleDescription(role),
    }));
};
