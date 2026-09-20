import type { Branch } from './branch.types';

export interface User {
    id: number;
    name: string;
    email: string;
    username: string;
    email_verified: string | boolean;
    phone?: string;
    profile_photo_url?: string;
    is_active: boolean;
    last_login_at?: string;
    created_at: string;
    updated_at: string;
    roles?: string[];
    permissions?: string[];
    branches?: Branch[];
    direct_permissions?: string[];
    all_permissions?: string[];
}

export interface UserAccess {
    id: number;
    name: string;
    email: string;
    username: string;
    email_verified: string | boolean;
    phone?: string;
    profile_photo_url?: string;
    is_active: boolean;
    last_login_at?: string;
    created_at: string;
    updated_at: string;
    roles?: Role[];
    permissions?: string[];
    branches?: Branch[];
    direct_permissions?: string[];
    all_permissions?: string[];
}

export interface CreateUserData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    roles: string[];
    permissions?: string[];
    is_active?: boolean; //? optional is_active field
    profile_photo_url?: string; //? optional profile photo URL
}

export interface UpdateUserData {
    name?: string;
    email?: string;
    password?: string;
    password_confirmation?: string;
    roles?: string[]; //? optional roles array
    permissions?: string[];
    is_active?: boolean; //? optional is_active field
    profile_photo_url?: string; //? optional profile photo URL
}

export interface UserResponse {
    status: string;
    message: string;
    data: User;
}

export interface UsersListResponse {
    status: string;
    message: string;
    data: User[];
}

export interface Role {
    id: number;
    name: string;
    label?: string;
    description?: string;
    is_system?: boolean;
    permissions_count?: number;
    permissions?: Permission[];
}

export interface Permission {
    id: number;
    name: string;
    description?: string;
    group?: string;
}

export interface ActivityLogChange {
    field: string;
    label: string;
    from: string | number | boolean | null;
    to: string | number | boolean | null;
}

export interface ActivityLog {
    id: number;
    log_name: string;
    description: string;
    event?: string | null;
    subject_type?: string;
    subject_label?: string | null;
    causer_id?: number;
    causer?: { id: number; name: string; email?: string } | null;
    changes?: ActivityLogChange[];
    /** @deprecated - legacy Spatie property blob; use `changes` instead */
    properties?: {
        old?: Record<string, unknown>;
        attributes?: Record<string, unknown>;
        [key: string]: unknown;
    };
    created_at: string;
}
