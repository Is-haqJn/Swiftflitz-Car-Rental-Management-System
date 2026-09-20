import { usePermission } from '@/shared/hooks';
import type { PermissionsGuardProps } from '@/shared/types';

export const PermisssionGuard = ({
    permission,
    role,
    requireAll = false,
    fallback = null,
    children,
}: PermissionsGuardProps) => {
    const { hasRole, hasAnyPermission, hasAllPermissions, isAuthenticated } =
        usePermission();

    //! check if not authenticated
    if (!isAuthenticated) return <>{fallback}</>;

    //! check role
    if (role) {
        const roles = Array.isArray(role) ? role : [role]; //? normalize to array for easier checking
        if (!hasRole(roles)) return <>{fallback}</>;
    }

    //! check permissons
    if (permission) {
        const perms = Array.isArray(permission) ? permission : [permission]; //? normalize to array for easier checking
        const hasAccess = requireAll
            ? hasAllPermissions(perms)
            : hasAnyPermission(perms);
        if (!hasAccess) return <>{fallback}</>;
    }

    return <>{children}</>;
};
