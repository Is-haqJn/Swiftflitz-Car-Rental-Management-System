<?php

namespace App\Exceptions;

use App\Exceptions\ApiException as AppApiException;
use App\Traits\ApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    use ApiResponse;

    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });

        $this->renderable(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return $this->errorResponse(
                    $e->getMessage(),
                    Response::HTTP_UNAUTHORIZED
                );
            }
            // return null;
        });

        //? handle authorization exceptions (403 Forbidden)
        $this->renderable(function (AuthorizationException $e, Request $request) {
            if ($request->is('api/*')) {
                return $this->errorResponse(
                    $e->getMessage() ?: 'You do not have permission to perform this action.',
                    Response::HTTP_FORBIDDEN
                );
            }
            // return null;
        });

        $this->renderable(function (ValidationException $e, Request $request) {
            if ($request->is('api/*')) {
                return $this->validationErrorResponse(
                    $e->validator->errors(),
                    'The given data was invalid.',
                );
            }
            // return null;
        });

        $this->renderable(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return $this->notFoundResponse(
                    message: 'Resource not found.'
                );
            }
            // return null;
        });

        // ? handle HttpExceptions (abort_if, abort) with the correct HTTP status code
        $this->renderable(function (HttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return $this->errorResponse(
                    message: $e->getMessage() ?: Response::$statusTexts[$e->getStatusCode()] ?? 'Error',
                    statusCode: $e->getStatusCode()
                );
                // return response()->json([
                //     'message' => $e->getMessage() ?: Response::$statusTexts[$e->getStatusCode()] ?? 'Error',
                // ], $e->getStatusCode());
            }
        });

        // ? handle 500 error
        $this->renderable(function (Throwable $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'An unexpected error occurred.',
                    'error' => $e->getMessage(),
                    'debug' => config('app.debug') ? [
                        'file' => $e->getFile(),
                        'line' => $e->getLine(),
                        'trace' => $e->getTrace(),
                        'exception' => get_class($e),
                    ] : null,
                ], Response::HTTP_INTERNAL_SERVER_ERROR);
            }
            // return null;
        });
    }

    public function render($request, Throwable $e)
    {
        if ($e instanceof AppApiException) {
            return response()->json([
                'status' => 'error',
                'error_code' => $e->getCode(),
                'message' => $e->getMessage(),
                'debug' => config('app.debug') ? [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTrace(),
                    'exception' => get_class($e),
                ] : null,
            ], $e->getStatus());
        }

        return parent::render($request, $e);

    }
}
