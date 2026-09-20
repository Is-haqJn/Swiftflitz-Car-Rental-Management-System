import { useCallback, useRef, useState } from 'react';
import { tusClient, type TusUploadHandle } from '@/shared/api/tusClient';

export type TusFileStatus =
    | 'pending'
    | 'uploading'
    | 'paused'
    | 'success'
    | 'error';

export interface TusFileEntry {
    id: string;
    file: File;
    status: TusFileStatus;
    percent: number;
    /** The final TUS upload URL once complete (contains the upload token at the end) */
    uploadUrl: string | null;
    error: string | null;
}

export interface UseTusMultiUploadOptions {
    /** Backend TUS endpoint, e.g. "/api/v1/uploads/tus" */
    endpoint: string;
    /** Entity type metadata for the backend handler */
    entityType: string;
    /** Extra metadata fields to attach to every upload */
    extraMetadata?: Record<string, string>;
}

export interface UseTusMultiUploadReturn {
    files: TusFileEntry[];
    /** Queue one or more files - does NOT start uploading. Call startAll() to begin. Returns the assigned TUS IDs. */
    addFiles: (newFiles: File[]) => string[];
    /** Start all queued (pending) files sequentially (one at a time) */
    startAll: () => void;
    /** Pause a specific upload */
    pauseFile: (id: string) => void;
    /** Resume a paused upload */
    resumeFile: (id: string) => void;
    /** Abort and remove a specific file */
    removeFile: (id: string) => void;
    /** Remove all files and abort any in-progress uploads */
    clearAll: () => void;
    /** True when at least one file is still uploading */
    isUploading: boolean;
    /** True when at least one file is queued but not yet started */
    hasPending: boolean;
    /** True when all files have succeeded */
    allSucceeded: boolean;
    /** Extract TUS upload tokens from completed uploads */
    getUploadTokens: () => string[];
}

function generateId(): string {
    return Math.random().toString(36).slice(2);
}

function resolveTusError(error: unknown): string {
    const msg = error instanceof Error ? error.message : String(error);
    if (/413|payload too large|too large|exceeds/i.test(msg)) {
        return 'File is too large to upload.';
    }
    if (/401|403|unauthorized|forbidden/i.test(msg)) {
        return 'Upload not authorised. Please refresh and try again.';
    }
    if (/404/i.test(msg)) {
        return 'Upload endpoint not found. Please contact support.';
    }
    if (/5\d\d|server error|internal/i.test(msg)) {
        return 'Server error during upload. Please try again.';
    }
    if (/network|failed to fetch|connection|offline/i.test(msg)) {
        return 'Network error. Check your connection and try again.';
    }
    return 'Upload failed. Please try again.';
}

/**
 * Manages sequential TUS uploads (one at a time to avoid server-side concurrency issues).
 * Files are queued on addFiles() and only start when startAll() is called.
 * Each completed upload automatically triggers the next one in the queue.
 */
export function useTusMultiUpload(
    options: UseTusMultiUploadOptions
): UseTusMultiUploadReturn {
    const { endpoint, entityType, extraMetadata = {} } = options;

    const [files, setFiles] = useState<TusFileEntry[]>([]);
    const handlesRef = useRef<Map<string, TusUploadHandle>>(new Map());
    /** IDs of files queued (pending, not yet started) */
    const pendingIdsRef = useRef<Set<string>>(new Set());
    /** Sequential upload queue - IDs waiting to start after the current one finishes */
    const uploadQueueRef = useRef<string[]>([]);

    const updateFile = useCallback(
        (id: string, patch: Partial<TusFileEntry>) => {
            setFiles(prev =>
                prev.map(f => (f.id === id ? { ...f, ...patch } : f))
            );
        },
        []
    );

    /**
     * Starts the next upload in the sequential queue.
     * Stored in a ref so onSuccess/onError callbacks always call the latest version.
     */
    const startNextInQueueRef = useRef<() => void>(() => {});
    startNextInQueueRef.current = () => {
        const nextId = uploadQueueRef.current.shift();
        if (!nextId) return;
        const handle = handlesRef.current.get(nextId);
        if (!handle) {
            // Skip missing/removed handles and try the next
            startNextInQueueRef.current();
            return;
        }
        setFiles(prev =>
            prev.map(f => (f.id === nextId ? { ...f, status: 'uploading' } : f))
        );
        handle.start();
    };

    const addFiles = useCallback(
        (newFiles: File[]): string[] => {
            const entries: TusFileEntry[] = newFiles.map(file => ({
                id: generateId(),
                file,
                status: 'pending',
                percent: 0,
                uploadUrl: null,
                error: null,
            }));

            setFiles(prev => [...prev, ...entries]);

            entries.forEach(entry => {
                const handle = tusClient.createUpload(entry.file, {
                    endpoint,
                    metadata: {
                        entity_type: entityType,
                        ...extraMetadata,
                    },
                    onProgress(bytesUploaded, bytesTotal) {
                        updateFile(entry.id, {
                            status: 'uploading',
                            percent:
                                bytesTotal > 0
                                    ? Math.round(
                                          (bytesUploaded / bytesTotal) * 100
                                      )
                                    : 0,
                        });
                    },
                    onSuccess(upload) {
                        updateFile(entry.id, {
                            status: 'success',
                            percent: 100,
                            uploadUrl: upload.url ?? null,
                        });
                        // Start the next file in the sequential queue
                        startNextInQueueRef.current();
                    },
                    onError(error) {
                        updateFile(entry.id, {
                            status: 'error',
                            error: resolveTusError(error),
                        });
                        // Continue the queue even on error
                        startNextInQueueRef.current();
                    },
                });

                handlesRef.current.set(entry.id, handle);
                pendingIdsRef.current.add(entry.id);
            });

            return entries.map(e => e.id);
        },
        [endpoint, entityType, extraMetadata, updateFile]
    );

    const startAll = useCallback(() => {
        const toStart = [...pendingIdsRef.current];
        if (toStart.length === 0) return;
        pendingIdsRef.current.clear();

        // Put all except the first into the sequential queue
        uploadQueueRef.current = toStart.slice(1);

        // Start only the first file; the rest start via startNextInQueueRef
        const firstId = toStart[0];
        const handle = handlesRef.current.get(firstId);
        if (handle) {
            setFiles(prev =>
                prev.map(f =>
                    f.id === firstId ? { ...f, status: 'uploading' } : f
                )
            );
            handle.start();
        } else {
            startNextInQueueRef.current();
        }
    }, []);

    const pauseFile = useCallback((id: string) => {
        handlesRef.current.get(id)?.upload.abort();
        setFiles(prev =>
            prev.map(f => (f.id === id ? { ...f, status: 'paused' } : f))
        );
    }, []);

    const resumeFile = useCallback((id: string) => {
        const handle = handlesRef.current.get(id);
        if (!handle) return;
        setFiles(prev =>
            prev.map(f => (f.id === id ? { ...f, status: 'uploading' } : f))
        );
        handle.upload.start();
    }, []);

    const removeFile = useCallback((id: string) => {
        handlesRef.current.get(id)?.abort();
        handlesRef.current.delete(id);
        pendingIdsRef.current.delete(id);
        uploadQueueRef.current = uploadQueueRef.current.filter(
            qId => qId !== id
        );
        setFiles(prev => prev.filter(f => f.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        handlesRef.current.forEach(handle => handle.abort());
        handlesRef.current.clear();
        pendingIdsRef.current.clear();
        uploadQueueRef.current = [];
        setFiles([]);
    }, []);

    const getUploadTokens = useCallback((): string[] => {
        return files
            .filter(f => f.status === 'success' && f.uploadUrl)
            .map(f => {
                // Extract the upload token from the URL (last path segment)
                const url = f.uploadUrl!;
                return url.split('/').pop() ?? url;
            });
    }, [files]);

    const isUploading = files.some(f => f.status === 'uploading');
    const hasPending = files.some(f => f.status === 'pending');
    const allSucceeded =
        files.length > 0 && files.every(f => f.status === 'success');

    return {
        files,
        addFiles,
        startAll,
        pauseFile,
        resumeFile,
        removeFile,
        clearAll,
        isUploading,
        hasPending,
        allSucceeded,
        getUploadTokens,
    };
}
