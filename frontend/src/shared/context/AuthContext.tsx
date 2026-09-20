import { createContext, useContext, type ReactNode } from 'react';
import type { AuthContextType } from '../types';
import { useAppSelector } from '@/store';
import {
    selectAuthUser,
    selectIsAuthenticated,
} from '@/store/slices/authSlice';
import { useCurrentUser, usePermission } from '@/shared/hooks';

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const user = useAppSelector(selectAuthUser);
    const isAuthenticated = useAppSelector(selectIsAuthenticated);

    //! verify perisisted auth state on app load
    const { isLoading, isFetching } = useCurrentUser();

    const {
        hasRole,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isSuperAdmin,
        isAdmin,
        isManager,
        isStaff,
        isViewer,
    } = usePermission();

    const contextValue: AuthContextType = {
        user,
        isAuthenticated,
        isLoading: isLoading || isFetching, //? consider fetching as loading state for better UX
        isVerifying: isLoading, //? separate loading state for verifying auth status on app load
        hasRole,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isSuperAdmin,
        isAdmin,
        isManager,
        isStaff,
        isViewer,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context)
        throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
