// category.types.ts

export interface CategoryImage {
    id: number;
    urls: {
        original: string;
        large: string;
        medium: string;
        thumb: string;
    };
    file_name: string;
    mime_type: string;
    size: number;
}

export interface Category {
    id: string;
    name: string;
    slug?: string;
    description?: string;
    icon?: string;
    is_active: boolean;
    security_deposit?: number | null;
    young_driver_age_threshold?: number | null;
    young_driver_deposit?: number | null;
    cancellation_fee?: number | null;
    before_pickup_cancellation_fee?: number | null;
    after_pickup_cancellation_fee?: number | null;
    overdue_fee?: number | null;
    image?: CategoryImage | null; // ← Single Spatie image
    vehicles_count?: number; // ← From withCount()
    created_at?: string;
    updated_at?: string;
}

export interface CreateCategoryData {
    name: string;
    slug?: string;
    description?: string;
    icon?: string;
    is_active?: boolean;
    security_deposit?: number | null;
    young_driver_age_threshold?: number | null;
    young_driver_deposit?: number | null;
    cancellation_fee?: number | null;
    before_pickup_cancellation_fee?: number | null;
    after_pickup_cancellation_fee?: number | null;
    overdue_fee?: number | null;
}

export interface UpdateCategoryData {
    name?: string;
    slug?: string;
    description?: string;
    icon?: string;
    is_active?: boolean;
    security_deposit?: number | null;
    young_driver_age_threshold?: number | null;
    young_driver_deposit?: number | null;
    cancellation_fee?: number | null;
    before_pickup_cancellation_fee?: number | null;
    after_pickup_cancellation_fee?: number | null;
    overdue_fee?: number | null;
}

export interface CategoryResponse {
    status: string;
    message: string;
    data: Category;
}

export interface PaginatedData<T> {
    data: T[];
    links?: unknown;
    meta?: unknown;
}

export interface CategoriesListResponse {
    status: string;
    message: string;
    data: PaginatedData<Category>;
}

export interface CategoryFilters {
    page?: number;
    per_page?: number;
    search?: string;
    is_active?: boolean;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}
