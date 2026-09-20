import type { ProtectedRouteProps } from '@/admin/types';
import { AppBootSkeleton } from '@adminComponents/skeletons/AppBootSkeleton';
import { useAuth } from '@/shared/context/AuthContext';
import { tokenManager } from '@/shared/config/tokenManager';
import { ROUTES } from '@/shared/routes';
import { Navigate, useLocation } from 'react-router-dom';

export const ProtectedRoute = ({
    permission,
    role,
    fallbackRoute = ROUTES.AUTH.AUTH_LOGIN,
    children,
}: ProtectedRouteProps) => {
    const { isAuthenticated, isVerifying, hasRole, hasAnyPermission } =
        useAuth();
    const location = useLocation();

    /* token exists but auth state not loaded yet (initial page load or after
       impersonation stop / session restore). Show skeleton - never redirect to
       login here, because the /api/v1/auth/me call is already in-flight. */
    if (isVerifying && !!tokenManager.getToken()) {
        return <AppBootSkeleton />;
    }

    if (!isAuthenticated)
        return (
            <Navigate to={fallbackRoute} state={{ from: location }} replace />
        );

    //! check role if specified
    if (role) {
        const roles = Array.isArray(role) ? role : [role];
        //! nvaigate to 403 if user doesn't have required role
        if (!hasRole?.(roles))
            return <Navigate to={ROUTES.ERROR.FORBIDDEN} replace />;
    }

    //! check permission if specified
    if (permission) {
        const perms = Array.isArray(permission) ? permission : [permission];
        if (!hasAnyPermission?.(perms))
            return <Navigate to={ROUTES.ERROR.FORBIDDEN} replace />;
    }

    return <>{children}</>;
};
