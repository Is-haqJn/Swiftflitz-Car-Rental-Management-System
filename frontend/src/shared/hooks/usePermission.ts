import { useAppSelector } from '@/store';
import {
    selectAuthUser,
    selectIsAuthenticated,
} from '@/store/slices/authSlice';
import { useCallback, useMemo } from 'react';
import { ROLES } from '@/shared/config/roles';

export const usePermission = () => {
    const user = useAppSelector(selectAuthUser);
    // const roles = useAppSelector(selectUserRoles);
    const roles = useMemo(() => user?.roles || [], [user?.roles]);
    // Use all_permissions (role-derived minus revoked + direct grants) so that
    // revoked permissions are correctly denied and direct grants are honoured.
    const permissions = useMemo(
        () => user?.all_permissions || [],
        [user?.all_permissions]
    );

    const isAuthenticated = useAppSelector(selectIsAuthenticated);

    //! check if the user has the incoming role
    const hasRole = useCallback(
        (role: string | string[]): boolean => {
            if (!isAuthenticated) return false; //? not authenticated, no roles

            const check = Array.isArray(role) ? role : [role]; //? normalize to array for easier checking
            return check.some(r => roles.includes(r));
        },
        [roles, isAuthenticated]
    );

    //! check if the user has the incoming permission
    const hasPermission = useCallback(
        (permission: string | string[]) => {
            if (!isAuthenticated) return false; //? not authenticated, no permissions

            //* super admin has all permissions
            if (roles.includes(ROLES.SUPER_ADMIN)) return true;

            //* otherwise check if user permissions include the required permission
            const check = Array.isArray(permission) ? permission : [permission]; //? normalize to array for easier checking
            return check.some(p => permissions.includes(p));
        },
        [permissions, roles, isAuthenticated]
    );

    const hasAnyPermission = useCallback(
        (perms: string[]) => {
            if (!isAuthenticated) return false; //? not authenticated, no permissions

            //* super admin has all permissions
            if (roles.includes(ROLES.SUPER_ADMIN)) return true;

            //* otherwise check if user permissions include any of the required permissions
            return perms.some(p => permissions.includes(p));
            //? user permissions looks like this - permissions: ['create_user', 'edit_user', 'delete_user']
        },
        [isAuthenticated, permissions, roles]
    );

    const hasAllPermissions = useCallback(
        (perms: string[]) => {
            if (!isAuthenticated) return false; //? not authenticated, no permissions

            //* super admin has all permissions
            if (roles.includes(ROLES.SUPER_ADMIN)) return true;

            //* otherwise check if user permissions include all of the required permissions
            return perms.every(p => permissions.includes(p));
        },
        [isAuthenticated, permissions, roles]
    );

    return {
        user,
        roles,
        permissions,
        isAuthenticated,
        hasRole,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isSuperAdmin: useCallback(() => hasRole(ROLES.SUPER_ADMIN), [hasRole]),
        isAdmin: useCallback(() => hasRole(ROLES.ADMIN), [hasRole]),
        isManager: useCallback(() => hasRole(ROLES.MANAGER), [hasRole]),
        isStaff: useCallback(() => hasRole(ROLES.STAFF), [hasRole]),
        //isAccountant: useCallback(() => hasRole(ROLES.ACCOUNTANT), [hasRole]),
        isViewer: useCallback(() => hasRole(ROLES.VIEWER), [hasRole]),
    };
};
