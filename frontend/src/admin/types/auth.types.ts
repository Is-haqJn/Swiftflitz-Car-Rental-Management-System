import type { ReactNode } from 'react';

export interface ProtectedRouteProps {
    children: ReactNode;
    permission?: string | string[]; //? single permission or array of permissions required to access the route
    role?: string | string[]; //? single role or array of roles required to access the route
    fallbackRoute?: string; //? route to redirect to if access is denied, default is "/login"
}
