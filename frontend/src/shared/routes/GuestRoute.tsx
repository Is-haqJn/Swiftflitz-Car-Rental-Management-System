import { useAuth } from '@/shared/context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/shared/routes';
import { type ReactNode } from 'react';

export const GuestRoute = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    //! show a loadin state when verifying auth status on app load
    //* TODO: add real loader
    if (isLoading) return <div>Loading...</div>;

    //! if authenticated, navigate to dashboard or intended page
    if (isAuthenticated) {
        const from =
            (location.state as { from?: { pathname: string } })?.from
                ?.pathname || ROUTES.DASHBOARD.ROOT;
        return <Navigate to={from} replace />;
    }

    return <>{children}</>;
};
