import { useEffect, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { usePublicMaintenanceStatus } from '@/shared/hooks/queries/useSystem';
import {
    selectIsAuthenticated,
    selectAuthUser,
} from '@/store/slices/authSlice';
import MaintenancePage from '@/shared/pages/MaintenancePage';

const BYPASS_SESSION_KEY = 'maintenance_bypass_token';

interface MaintenanceGuardProps {
    children: ReactNode;
}

/**
 * Wraps the public website routes. When maintenance mode is active:
 * - Authenticated users pass through unconditionally.
 * - Visitors with a valid bypass token (stored in sessionStorage after the
 *   first `?bypass=<token>` visit) pass through.
 * - Everyone else sees the MaintenancePage.
 *
 * Session-expired detection: if there is a Redux user record but the auth
 * flag is false, the session likely expired - the maintenance page will show
 * an advisory message.
 */
export function MaintenanceGuard({ children }: MaintenanceGuardProps) {
    const { data: maintRes } = usePublicMaintenanceStatus();
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const authUser = useSelector(selectAuthUser);
    const [searchParams, setSearchParams] = useSearchParams();

    const isMaintenanceMode = maintRes?.data?.enabled === true;
    const serverToken = maintRes?.data?.bypass_token ?? null;

    // A stale user record with isAuthenticated=false indicates an expired session.
    const sessionExpired = !isAuthenticated && authUser !== null;

    // Capture ?bypass=<token> (+ decorative params) from URL → sessionStorage,
    // then strip them so the URL stays clean.
    const urlBypass = searchParams.get('bypass');
    useEffect(() => {
        if (!urlBypass) {
            return;
        }
        sessionStorage.setItem(BYPASS_SESSION_KEY, urlBypass);
        setSearchParams(
            prev => {
                prev.delete('bypass');
                prev.delete('t');
                prev.delete('ref');
                return prev;
            },
            { replace: true }
        );
    }, [urlBypass, setSearchParams]);

    // Clear stale session token when maintenance is disabled or token rotates.
    // Guard: skip on initial render when maintRes is undefined (API still loading)
    // to avoid clearing a freshly-stored bypass token before we know maintenance is on.
    useEffect(() => {
        if (!maintRes) return;
        if (!isMaintenanceMode || !serverToken) {
            sessionStorage.removeItem(BYPASS_SESSION_KEY);
        }
    }, [isMaintenanceMode, serverToken, maintRes]);

    if (isMaintenanceMode && !isAuthenticated) {
        const sessionToken = sessionStorage.getItem(BYPASS_SESSION_KEY);
        const hasValidBypass =
            serverToken !== null && sessionToken === serverToken;

        if (!hasValidBypass) {
            return <MaintenancePage sessionExpired={sessionExpired} />;
        }
    }

    return <>{children}</>;
}
