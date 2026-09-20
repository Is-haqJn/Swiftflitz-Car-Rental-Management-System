<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;
use Symfony\Component\HttpFoundation\Response;

trait ApiResponse
{
    /**
     * Standardized success response
     */
    protected function successResponse(
        mixed $data = null,
        string $message = 'Request successful',
        int $statusCode = Response::HTTP_OK
    ): JsonResponse {
        // Handle the paginated data case
        if ($data instanceof JsonResource) {
            // For collections (paginated), extract data/meta/links from the wrapped response
            if ($data instanceof \Illuminate\Http\Resources\Json\ResourceCollection) {
                $responseData = $data->response()->getData(true);

                return response()->json([
                    'status' => 'success',
                    'message' => $message,
                    'data' => $responseData['data'] ?? null,
                    'meta' => $responseData['meta'] ?? null,
                    'links' => $responseData['links'] ?? null,
                ], $statusCode);
            }

            // For single resources, resolve directly to avoid key-collision wrapping issues
            return response()->json([
                'status' => 'success',
                'message' => $message,
                'data' => $data->resolve(request()),
            ], $statusCode);
        }

        // Standard data response
        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $data,
        ], $statusCode);
    }

    /**
     * Standardized error response
     */
    protected function errorResponse(
        string $message = 'An error occurred',
        int $statusCode = Response::HTTP_BAD_REQUEST,
        mixed $errors = null,
        string $errorCode = 'ERROR'
    ): JsonResponse {
        $response = [
            'status' => 'error',
            'error_code' => $errorCode,
            'message' => $message,
        ];
        if (! is_null($errors)) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Standardized creation response
     */
    protected function createdResponse(
        mixed $data = null,
        string $message = 'Resource created successfully'
    ): JsonResponse {
        return $this->successResponse(
            data: $data,
            message: $message,
            statusCode: Response::HTTP_CREATED
        );
    }

    /**
     * Standardized no content response
     */
    protected function noContentResponse(): JsonResponse
    {
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Standardized not found response
     */
    protected function notFoundResponse(
        string $message = 'Resource not found'
    ): JsonResponse {
        return $this->errorResponse(
            message: $message,
            statusCode: Response::HTTP_NOT_FOUND,
            errorCode: 'NOT_FOUND'
        );
    }

    /**
     * Standardized unauthorized response
     */
    protected function unauthorizedResponse(
        string $message = 'Unauthorized access'
    ): JsonResponse {
        return $this->errorResponse(
            message: $message,
            statusCode: Response::HTTP_UNAUTHORIZED,
            errorCode: 'UNAUTHORIZED'
        );
    }

    /**
     * Standardized forbidden response
     */
    protected function forbiddenResponse(
        string $message = 'Forbidden access'
    ): JsonResponse {
        return $this->errorResponse(
            message: $message,
            statusCode: Response::HTTP_FORBIDDEN,
            errorCode: 'FORBIDDEN'
        );
    }

    /**
     * Standardized validation error response
     */
    protected function validationErrorResponse(
        mixed $errors,
        string $message = 'Validation failed'
    ): JsonResponse {
        return $this->errorResponse(
            message: $message,
            statusCode: Response::HTTP_UNPROCESSABLE_ENTITY,
            errors: $errors,
            errorCode: 'VALIDATION_ERROR'
        );
    }

    /**
     * Standardized server error response
     */
    protected function serverErrorResponse(
        string $message = 'Internal server error'
    ): JsonResponse {
        return $this->errorResponse(
            message: $message,
            statusCode: Response::HTTP_INTERNAL_SERVER_ERROR,
            errorCode: 'SERVER_ERROR'
        );
    }

    /**
     * Standardized user with token response for authentication
     */
    protected function authResponse(
        mixed $data = null,
        ?string $token = null,
        string $message = 'Authentication successful',
        int $statusCode = Response::HTTP_OK
    ): JsonResponse {
        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $data,
            'token' => $token,
        ], $statusCode);
    }
}
