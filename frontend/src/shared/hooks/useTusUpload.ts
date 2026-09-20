import { useCallback, useRef, useState } from 'react';
import {
    tusClient,
    type TusUploadOptions,
    type TusUploadHandle,
} from '@/shared/api/tusClient';

export type TusUploadStatus =
    | 'idle'
    | 'uploading'
    | 'paused'
    | 'success'
    | 'error';

export interface TusUploadState {
    status: TusUploadStatus;
    /** Upload progress as 0–100 */
    percent: number;
    /** Bytes uploaded so far */
    bytesUploaded: number;
    /** Total file size in bytes */
    bytesTotal: number;
    /** Final upload URL once complete */
    uploadUrl: string | null;
    /** Error message if status === 'error' */
    error: string | null;
}

export interface UseTusUploadReturn extends TusUploadState {
    /** Start or resume uploading a file */
    upload: (
        file: File,
        options: Omit<TusUploadOptions, 'onProgress' | 'onSuccess' | 'onError'>
    ) => void;
    /** Pause the current upload */
    pause: () => void;
    /** Resume a paused upload */
    resume: () => void;
    /** Abort and reset state */
    abort: () => void;
    /** Reset state back to idle */
    reset: () => void;
    /** Whether an upload is actively in progress */
    isUploading: boolean;
}

const initialState: TusUploadState = {
    status: 'idle',
    percent: 0,
    bytesUploaded: 0,
    bytesTotal: 0,
    uploadUrl: null,
    error: null,
};

/**
 * React hook wrapping `tusClient` with tracked upload state.
 *
 * Example:
 * ```tsx
 * const { upload, percent, status } = useTusUpload();
 *
 * const handleFile = (file: File) => {
 *   upload(file, {
 *     endpoint: '/api/v1/uploads/media',
 *     metadata: { collection: 'profile' },
 *   });
 * };
 * ```
 */
export function useTusUpload(): UseTusUploadReturn {
    const [state, setState] = useState<TusUploadState>(initialState);
    const handleRef = useRef<TusUploadHandle | null>(null);

    const upload = useCallback(
        (
            file: File,
            options: Omit<
                TusUploadOptions,
                'onProgress' | 'onSuccess' | 'onError'
            >
        ) => {
            setState({
                ...initialState,
                status: 'uploading',
                bytesTotal: file.size,
            });

            const handle = tusClient.createUpload(file, {
                ...options,
                onProgress(bytesUploaded, bytesTotal) {
                    setState(prev => ({
                        ...prev,
                        status: 'uploading',
                        bytesUploaded,
                        bytesTotal,
                        percent:
                            bytesTotal > 0
                                ? Math.round((bytesUploaded / bytesTotal) * 100)
                                : 0,
                    }));
                },
                onSuccess(tusUpload) {
                    setState(prev => ({
                        ...prev,
                        status: 'success',
                        percent: 100,
                        uploadUrl: tusUpload.url ?? null,
                    }));
                },
                onError(error) {
                    setState(prev => ({
                        ...prev,
                        status: 'error',
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    }));
                },
            });

            handleRef.current = handle;
            handle.start();
        },
        []
    );

    const pause = useCallback(() => {
        handleRef.current?.upload.abort();
        setState(prev => ({ ...prev, status: 'paused' }));
    }, []);

    const resume = useCallback(() => {
        if (!handleRef.current) return;
        setState(prev => ({ ...prev, status: 'uploading' }));
        handleRef.current.upload.start();
    }, []);

    const abort = useCallback(() => {
        handleRef.current?.abort();
        handleRef.current = null;
        setState(initialState);
    }, []);

    const reset = useCallback(() => {
        handleRef.current = null;
        setState(initialState);
    }, []);

    return {
        ...state,
        isUploading: state.status === 'uploading',
        upload,
        pause,
        resume,
        abort,
        reset,
    };
}
