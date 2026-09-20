import type { User } from './users.types';

export interface LoginCredentials {
    email: string;
    password: string;
    remember?: boolean; //? optional remember me field
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export interface ForgotPasswordData {
    email: string;
}

export interface ResetPasswordData {
    email: string;
    password: string;
    password_confirmation: string;
    token: string;
}

export interface AuthResponse {
    status: string;
    message: string;
    data: {
        user: User;
        expires_at?: string;
    };
    token?: string;
}

export interface AuthUserState extends User {
    roles?: string[];
    permissions?: string[];
}

export interface AuthState {
    user: AuthUserState | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isVerifying: boolean;
    error?: string | null;
}

export interface PermissionHelpers {
    isSuperAdmin?: () => boolean;
    isAdmin?: () => boolean;
    isManager?: () => boolean;
    isStaff?: () => boolean;
    isViewer?: () => boolean;
}

export interface AuthContextType extends AuthState, PermissionHelpers {
    hasRole?: (role: string | string[]) => boolean;
    hasAnyRole?: (roles: string[]) => boolean;
    hasPermission?: (permission: string) => boolean;
    hasAnyPermission?: (permissions: string[]) => boolean;
    hasAllPermissions?: (permissions: string[]) => boolean;
}

export interface UsePermissionResult extends PermissionHelpers {
    user: AuthUserState | null;
    roles: string[];
    permissions: string[];
    isAuthenticated: boolean;
    hasRole?: (role: string | string[]) => boolean;
    hasPermission?: (permission: string) => boolean;
    hasAnyPermission?: (permissions: string[]) => boolean;
    hasAllPermissions?: (permissions: string[]) => boolean;
}
