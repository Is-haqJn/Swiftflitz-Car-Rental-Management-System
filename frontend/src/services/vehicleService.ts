import { apiClient } from '@/shared/api/apiClient';
import type {
    Vehicle,
    VehicleImage,
    CreateVehicleData,
    UpdateVehicleData,
    VehicleFilters,
    VehicleExpense,
    StoreExpensePayload,
    CompleteMaintenancePayload,
} from '@/shared/types/vehicles.types';
import type { ApiResponse, PaginatedResponse } from '@/shared/types';
import type { Category } from '@/shared/types/category.types';

/* Helpers */
/** Fields that must be sent as `filter[x]` for Spatie QueryBuilder. */
const SPATIE_FILTER_FIELDS: (keyof VehicleFilters)[] = [
    'category_id',
    'status',
    'fuel_type',
    'transmission',
    'color',
    'seats',
    'is_featured',
    'min_price',
    'max_price',
    'min_year',
    'max_year',
    'roadworthy_expiry_status',
    'insurance_expiry_status',
    'branch_id',
];

function buildVehicleParams(filters: VehicleFilters): Record<string, unknown> {
    const params: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null) {
            continue;
        }
        if (SPATIE_FILTER_FIELDS.includes(key as keyof VehicleFilters)) {
            params[`filter[${key}]`] = value;
        } else {
            params[key] = value;
        }
    }
    return params;
}

/* Vehicle CRUD */
export const vehicleService = {
    async list(
        filters: VehicleFilters = {}
    ): Promise<PaginatedResponse<Vehicle>> {
        const response = await apiClient.get<PaginatedResponse<Vehicle>>(
            '/vehicles',
            { params: buildVehicleParams(filters) }
        );
        return response;
    },

    async get(id: string): Promise<ApiResponse<Vehicle>> {
        const response = await apiClient.get<ApiResponse<Vehicle>>(
            `/vehicles/${id}`
        );
        return response;
    },

    async create(data: CreateVehicleData): Promise<ApiResponse<Vehicle>> {
        const response = await apiClient.post<ApiResponse<Vehicle>>(
            '/vehicles',
            data
        );
        return response;
    },

    async update(
        id: string,
        data: UpdateVehicleData
    ): Promise<ApiResponse<Vehicle>> {
        const response = await apiClient.put<ApiResponse<Vehicle>>(
            `/vehicles/${id}`,
            data
        );
        return response;
    },

    async delete(id: string): Promise<{ status: string; message: string }> {
        const response = await apiClient.delete<{
            status: string;
            message: string;
        }>(`/vehicles/${id}`);
        return response;
    },

    async toggleFeatured(id: string): Promise<ApiResponse<Vehicle>> {
        const response = await apiClient.patch<ApiResponse<Vehicle>>(
            `/vehicles/${id}/toggle-featured`
        );
        return response;
    },

    async togglePriceVisible(id: string): Promise<ApiResponse<Vehicle>> {
        const response = await apiClient.patch<ApiResponse<Vehicle>>(
            `/vehicles/${id}/toggle-price-visible`
        );
        return response;
    },

    async updateStatus(
        id: string,
        status: string
    ): Promise<ApiResponse<Vehicle>> {
        const response = await apiClient.patch<ApiResponse<Vehicle>>(
            `/vehicles/${id}/status`,
            { status }
        );
        return response;
    },

    async featured(): Promise<ApiResponse<Vehicle[]>> {
        const response =
            await apiClient.get<ApiResponse<Vehicle[]>>('/vehicles/featured');
        return response;
    },

    async getBookedDates(
        id: string,
        excludeRentalId?: string
    ): Promise<Array<{ from: string; to: string }>> {
        const params = excludeRentalId ? { exclude_rental_id: excludeRentalId } : {};
        const response = await apiClient.get<
            ApiResponse<Array<{ from: string; to: string }>>
        >(`/vehicles/${id}/booked-dates`, { params });
        return response.data;
    },

    async storeExpense(
        payload: StoreExpensePayload
    ): Promise<ApiResponse<VehicleExpense>> {
        const formData = new FormData();
        formData.append('vehicle_id', payload.vehicle_id);
        formData.append('type', payload.type);
        formData.append('amount', String(payload.amount));
        if (payload.description)
            formData.append('description', payload.description);
        if (payload.expense_date)
            formData.append('expense_date', payload.expense_date);
        (payload.receipts ?? []).forEach((file, i) => {
            formData.append(`receipts[${i}]`, file);
        });
        (payload.receipt_tus_tokens ?? []).forEach((token, i) => {
            formData.append(`receipt_tus_tokens[${i}]`, token);
        });
        return apiClient.upload<ApiResponse<VehicleExpense>>(
            '/vehicle-expenses',
            formData
        );
    },

    async completeMaintenance(
        vehicleId: string,
        payload: CompleteMaintenancePayload
    ): Promise<ApiResponse<Vehicle>> {
        const formData = new FormData();
        if (payload.amount !== undefined)
            formData.append('amount', String(payload.amount));
        if (payload.description)
            formData.append('description', payload.description);
        if (payload.expense_date)
            formData.append('expense_date', payload.expense_date);
        (payload.receipts ?? []).forEach((file, i) => {
            formData.append(`receipts[${i}]`, file);
        });
        (payload.receipt_tus_tokens ?? []).forEach((token, i) => {
            formData.append(`receipt_tus_tokens[${i}]`, token);
        });
        return apiClient.upload<ApiResponse<Vehicle>>(
            `/vehicles/${vehicleId}/complete-maintenance`,
            formData
        );
    },
};

/* Vehicle Image */
export const vehicleImageService = {
    async list(vehicleId: string): Promise<ApiResponse<VehicleImage[]>> {
        const response = await apiClient.get<ApiResponse<VehicleImage[]>>(
            `/vehicles/${vehicleId}/images`
        );
        return response;
    },

    async upload(
        vehicleId: string,
        files: File[],
        onProgress?: (percent: number) => void,
        primaryIndex?: number
    ): Promise<ApiResponse<VehicleImage[]>> {
        const formData = new FormData();
        files.forEach((file, index) => {
            const newFile = replaceSpaceInFile(file);
            formData.append(`images[${index}]`, newFile);
        });

        if (primaryIndex !== undefined) {
            formData.append('primary_index', String(primaryIndex));
        }

        const response = await apiClient.upload<ApiResponse<VehicleImage[]>>(
            `/vehicles/${vehicleId}/images`,
            formData,
            onProgress
        );
        return response;
    },

    async setPrimary(
        vehicleId: string,
        mediaId: number
    ): Promise<ApiResponse<VehicleImage>> {
        const response = await apiClient.patch<ApiResponse<VehicleImage>>(
            `/vehicles/${vehicleId}/images/${mediaId}/primary`
        );
        return response;
    },

    async reorder(
        vehicleId: string,
        imageIds: number[]
    ): Promise<ApiResponse<VehicleImage[]>> {
        const response = await apiClient.put<ApiResponse<VehicleImage[]>>(
            `/vehicles/${vehicleId}/images/reorder`,
            { image_ids: imageIds }
        );
        return response;
    },

    async delete(
        vehicleId: string,
        mediaId: number
    ): Promise<{ status: string; message: string }> {
        const response = await apiClient.delete<{
            status: string;
            message: string;
        }>(`/vehicles/${vehicleId}/images/${mediaId}`);
        return response;
    },
};

/* Category API */
export const categoryService = {
    async list(): Promise<PaginatedResponse<Category>> {
        const response =
            await apiClient.get<PaginatedResponse<Category>>('/categories');
        return response;
    },
};

export function replaceSpaceInFile(file: File): File {
    const newName = file.name.replace(/\s/g, '-');
    return new File([file], newName, { type: file.type });
}
