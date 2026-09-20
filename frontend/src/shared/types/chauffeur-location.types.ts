export interface ChauffeurLocation {
    id: string;
    branch_id: string;
    branch?: { id: string; name: string; currency_symbol?: string | null };
    name: string;
    charge: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateChauffeurLocationData {
    branch_id: string;
    name: string;
    charge?: number | null;
    is_active?: boolean;
}

export type UpdateChauffeurLocationData = Partial<
    Omit<CreateChauffeurLocationData, 'branch_id'>
>;

export interface ChauffeurLocationFilters {
    page?: number;
    per_page?: number;
    'filter[branch_id]'?: string;
    'filter[is_active]'?: string;
    'filter[name]'?: string;
}
