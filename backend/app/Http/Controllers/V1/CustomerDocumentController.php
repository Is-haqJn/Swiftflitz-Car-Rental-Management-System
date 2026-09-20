<?php

namespace App\Http\Controllers\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadCustomerDocumentsRequest;
use App\Http\Requests\UploadCustomerIdDocumentRequest;
use App\Http\Requests\UploadCustomerLicenseRequest;
use App\Services\Contracts\CustomerDocumentServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class CustomerDocumentController extends Controller
{
    use ApiResponse;

    public function __construct(protected CustomerDocumentServiceInterface $customerDocumentService) {}

    /**
     * Get all documents for a customer.
     */
    public function index(string $customerId): JsonResponse
    {
        $documents = $this->customerDocumentService->getDocuments($customerId);

        return $this->successResponse($documents, 'Documents retrieved successfully');
    }

    /**
     * Upload license document.
     */
    public function uploadLicense(UploadCustomerLicenseRequest $request, string $customerId): JsonResponse
    {
        $documents = $this->customerDocumentService->uploadLicense($customerId, $request->file('files'));

        return $this->successResponse($documents, 'License documents uploaded successfully');
    }

    /**
     * Upload ID document.
     */
    public function uploadIdDocument(UploadCustomerIdDocumentRequest $request, string $customerId): JsonResponse
    {
        $documents = $this->customerDocumentService->uploadIdDocument($customerId, $request->file('files'));

        return $this->successResponse($documents, 'ID documents uploaded successfully');
    }

    /**
     * Upload passport document.
     */
    public function uploadPassport(UploadCustomerIdDocumentRequest $request, string $customerId): JsonResponse
    {
        $documents = $this->customerDocumentService->uploadPassport($customerId, $request->file('files'));

        return $this->successResponse($documents, 'Passport uploaded successfully');
    }

    /**
     * Upload additional documents.
     */
    public function uploadDocument(UploadCustomerDocumentsRequest $request, string $customerId): JsonResponse
    {
        $documents = $this->customerDocumentService->uploadDocument($customerId, $request->file('files'));

        return $this->successResponse($documents, 'Documents uploaded successfully');
    }

    /**
     * Delete a specific document.
     */
    public function destroy(string $customerId, int $mediaId): JsonResponse
    {
        $this->customerDocumentService->deleteDocument($customerId, $mediaId);

        return $this->successResponse(null, 'Document deleted successfully');
    }

    /**
     * Format media for API response.
     */
    // formatMedia moved to service implementation
}
