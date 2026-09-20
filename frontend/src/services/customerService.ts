// customerService.ts
import { apiClient } from '@/shared/api/apiClient';
import type { ApiResponse } from '@/shared/types';
import type {
    Customer,
    CustomerFilters,
    CustomerLookupResult,
    CreateCustomerData,
    UpdateCustomerData,
    PaginatedResponse,
} from '@/shared/types';

/* Collection type - single source of truth */
// Used by both customerDocumentService and any upload helpers
export type DocumentCollection = 'license' | 'id_document' | 'documents' | 'passport';

export const customerService = {
    // List customers (paginated)
    async list(
        filters: CustomerFilters = {}
    ): Promise<PaginatedResponse<Customer>> {
        const response = await apiClient.get<PaginatedResponse<Customer>>(
            '/customers',
            { params: filters }
        );
        return response;
    },

    // Get single customer - includes rentals and documents for the detail page
    async get(id: string): Promise<ApiResponse<Customer>> {
        const response = await apiClient.get<ApiResponse<Customer>>(
            `/customers/${id}`,
            { params: { include: 'rentals,customerDocuments' } }
        );
        return response;
    },

    // Global email lookup - bypasses branch scope, used for live matching in booking form
    async lookup(
        email: string
    ): Promise<ApiResponse<CustomerLookupResult | null>> {
        return apiClient.get<ApiResponse<CustomerLookupResult | null>>(
            '/customers/lookup',
            { params: { email } }
        );
    },

    // Create customer
    async create(data: CreateCustomerData): Promise<ApiResponse<Customer>> {
        const response = await apiClient.post<ApiResponse<Customer>>(
            '/customers',
            data
        );
        return response;
    },

    // Update customer
    async update(
        id: string,
        data: UpdateCustomerData
    ): Promise<ApiResponse<Customer>> {
        const response = await apiClient.put<ApiResponse<Customer>>(
            `/customers/${id}`,
            data
        );
        return response;
    },

    // Delete customer
    async delete(id: string): Promise<{ status: string; message: string }> {
        const response = await apiClient.delete<{
            status: string;
            message: string;
        }>(`/customers/${id}`);
        return response;
    },

    // Toggle blacklist
    async toggleBlacklist(
        id: string,
        reason?: string
    ): Promise<{ status: string; message: string }> {
        const response = await apiClient.patch<{
            status: string;
            message: string;
        }>(`/customers/${id}/toggle-blacklist`, {
            blacklist_reason: reason,
        });
        return response;
    },

    // Verify customer profile
    async verify(id: string): Promise<ApiResponse<Customer>> {
        return apiClient.patch<ApiResponse<Customer>>(
            `/customers/${id}/verify`
        );
    },

    // Request document reupload - sends an email to the customer
    async requestReupload(
        id: string
    ): Promise<{ status: string; message: string }> {
        return apiClient.post<{ status: string; message: string }>(
            `/customers/${id}/request-reupload`
        );
    },

    // Send a complete-profile link for new customers with minimal info
    async sendCompleteProfileLink(
        id: string
    ): Promise<{ status: string; message: string }> {
        return apiClient.post<{ status: string; message: string }>(
            `/customers/${id}/send-complete-profile-link`
        );
    },
};

/* Customer Document API */
export const customerDocumentService = {
    // Upload document - maps collection to backend route segment
    async upload(
        customerId: string,
        collection: DocumentCollection,
        file: File
    ): Promise<ApiResponse<Customer>> {
        const formData = new FormData();
        formData.append('files[]', file);

        const routeMap: Record<DocumentCollection, string> = {
            license: 'license',
            id_document: 'id-document',
            documents: 'additional',
            passport: 'passport',
        };

        const endpoint = routeMap[collection];

        if (!endpoint) {
            return Promise.reject(
                new Error(`Unknown document collection: "${collection}"`)
            );
        }

        const response = await apiClient.upload<ApiResponse<Customer>>(
            `/customers/${customerId}/documents/${endpoint}`,
            formData
        );

        return response;
    },

    // Delete a document by ID
    async delete(
        customerId: string,
        documentId: number
    ): Promise<{ status: string; message: string }> {
        const response = await apiClient.delete<{
            status: string;
            message: string;
        }>(`/customers/${customerId}/documents/${documentId}`);
        return response;
    },
};
