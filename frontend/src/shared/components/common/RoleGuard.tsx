import { usePermission } from '@/shared/hooks';
import type { RoleGuardProps } from '@/shared/types';

export const RoleGuard = ({
    role,
    fallback = null,
    children,
}: RoleGuardProps) => {
    const { hasRole, isAuthenticated } = usePermission();

    //! check if not authenticated
    if (!isAuthenticated) return <>{fallback}</>;

    //! check role
    const roles = Array.isArray(role) ? role : [role]; //? normalize to array for easier checking
    if (!hasRole(roles)) return <>{fallback}</>;

    return <>{children}</>;
};
