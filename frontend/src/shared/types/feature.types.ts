// ══════════════════════════════════════════════════════════════
// feature.types.ts
// ══════════════════════════════════════════════════════════════

export interface Feature {
    id: string;
    name: string;
    icon?: string | null;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface CreateFeatureData {
    name: string;
    icon?: string;
    is_active?: boolean;
}

export interface UpdateFeatureData {
    name?: string;
    icon?: string;
    is_active?: boolean;
}

export interface FeatureFilters {
    page?: number;
    per_page?: number;
    search?: string;
    is_active?: boolean;
}
