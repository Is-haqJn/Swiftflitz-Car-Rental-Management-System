import * as tus from 'tus-js-client';
import { tokenManager } from '@/shared/config/tokenManager';

/**
 * Derive the backend base URL (not the API prefix) so tus uploads point
 * to the correct origin.
 * e.g. http://backend.swiftflitz.test/api/v1 → http://backend.swiftflitz.test
 */
const backendOrigin = new URL(
    import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'
).origin;

export interface TusUploadOptions {
    /** API path relative to backend origin, e.g. "/api/v1/uploads/media" */
    endpoint: string;
    /** Called on each progress tick with bytes uploaded and total bytes */
    onProgress?: (bytesUploaded: number, bytesTotal: number) => void;
    /** Called when the upload completes successfully */
    onSuccess?: (upload: tus.Upload) => void;
    /** Called on error */
    onError?: (error: tus.DetailedError | Error) => void;
    /** Optional tus metadata fields (e.g. file name, type, collection) */
    metadata?: Record<string, string>;
    /** Chunk size in bytes. Defaults to 2 MB. */
    chunkSize?: number;
    /** Number of automatic retries on failure. Defaults to 3. */
    retryDelays?: number[];
}

export interface TusUploadHandle {
    /** The underlying tus Upload instance */
    upload: tus.Upload;
    /** Start or resume the upload */
    start: () => void;
    /** Abort/pause the upload */
    abort: () => Promise<void>;
}

/**
 * Create a resumable tus upload for the given file.
 *
 * Usage:
 * ```ts
 * const handle = tusClient.createUpload(file, {
 *   endpoint: '/api/v1/uploads/media',
 *   onProgress: (loaded, total) => setPercent(Math.round((loaded / total) * 100)),
 *   onSuccess: (upload) => console.log('Done', upload.url),
 *   metadata: { filename: file.name, filetype: file.type, collection: 'profile' },
 * });
 * handle.start();
 * ```
 */
function createUpload(file: File, options: TusUploadOptions): TusUploadHandle {
    const {
        endpoint,
        onProgress,
        onSuccess,
        onError,
        metadata,
        chunkSize = 2 * 1024 * 1024, // 2 MB - keep well within typical server post_max_size limits
        retryDelays = [0, 1000, 3000, 5000],
    } = options;

    const upload = new tus.Upload(file, {
        endpoint: `${backendOrigin}${endpoint}`,
        chunkSize,
        retryDelays,
        // ? Disable fingerprint storage - we never resume across page loads,
        // ? and concurrent uploads cause IndexedDB race conditions otherwise.
        storeFingerprintForResuming: false,
        metadata: {
            filename: file.name,
            filetype: file.type,
            ...metadata,
        },
        // ? Attach Bearer token so Sanctum can authenticate the request
        onBeforeRequest(req) {
            const token = tokenManager.getToken();
            if (token) {
                req.setHeader('Authorization', `Bearer ${token}`);
            }
        },
        onProgress(bytesUploaded, bytesTotal) {
            onProgress?.(bytesUploaded, bytesTotal);
        },
        onSuccess() {
            onSuccess?.(upload);
        },
        onError(error) {
            onError?.(error);
        },
    });

    return {
        upload,
        // ? Start directly - no findPreviousUploads() since storeFingerprintForResuming is off.
        start: () => upload.start(),
        abort: () => upload.abort(),
    };
}

export const tusClient = { createUpload };
