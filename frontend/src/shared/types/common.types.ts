import type { ReactNode } from 'react';

export interface PaginatedMeta {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
}

export interface PaginatedResponse<T> {
    status: string;
    message: string;
    data: T[];
    meta?: PaginatedMeta;
    links?: {
        first?: string;
        last?: string;
        prev?: string | null;
        next?: string | null;
    };
}

export interface ApiResponse<T> {
    status: string;
    message?: string;
    data: T;
}

export interface ApiError {
    status: string;
    message: string;
    errors?: Record<string, string[]>;
}

export interface SelectOption {
    value: string | number;
    label: string;
}

export interface FilterParams {
    search?: string;
    status?: string;
    category?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
    [key: string]: unknown; //? allow additional filter parameters
}

export interface Meta {
    title?: string;
    description?: string;
    keywords?: string[];
}

export interface PermissionsGuardProps {
    permission?: string | string[]; //? single permission or array of permissions required to access the component
    role?: string | string[]; //? single role or array of roles required to access the component
    requireAll?: boolean; //? if true, user must have all specified permissions/roles, if false, user must have at least one of the specified permissions/roles
    fallback?: ReactNode; //? component to render if user does not have required permissions/roles, defaults to null (renders nothing)
    children: ReactNode; //? component(s) that require the specified permissions/roles to access
}

export interface RoleGuardProps {
    role: string | string[]; //? single role or array of roles required to access the component
    fallback?: ReactNode; //? component to render if user does not have required role(s), defaults to null (renders nothing)
    children: ReactNode; //? component(s) that require the specified role(s) to access
}

//* Generic for query plugin spatie
export interface GenericFilters {
    per_page?: number;
    sort?: string;
    include?: string;
    [key: string]: string | number | boolean | undefined;
}
