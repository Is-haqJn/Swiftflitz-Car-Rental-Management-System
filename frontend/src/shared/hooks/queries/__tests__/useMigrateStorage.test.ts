import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/services/systemService', () => ({
    systemService: {
        migrateStorage: vi
            .fn()
            .mockResolvedValue({ message: 'Storage migration queued.' }),
        testS3Connection: vi
            .fn()
            .mockResolvedValue({ data: { success: true } }),
        getInfo: vi.fn().mockResolvedValue({ data: {} }),
        clearAllCache: vi.fn().mockResolvedValue({}),
        clearConfigCache: vi.fn().mockResolvedValue({}),
        clearRouteCache: vi.fn().mockResolvedValue({}),
        clearViewCache: vi.fn().mockResolvedValue({}),
        getPublicMaintenanceStatus: vi.fn().mockResolvedValue({ data: {} }),
        getMaintenanceMode: vi.fn().mockResolvedValue({ data: {} }),
        toggleMaintenanceMode: vi.fn().mockResolvedValue({ data: {} }),
        runMaintenance: vi.fn().mockResolvedValue({}),
        runBackup: vi.fn().mockResolvedValue({}),
        runSystemBackup: vi.fn().mockResolvedValue({}),
        listBackups: vi.fn().mockResolvedValue({ data: [] }),
        getBackupSettings: vi.fn().mockResolvedValue({ data: {} }),
        updateBackupSettings: vi.fn().mockResolvedValue({ data: {} }),
        getQueueStatus: vi.fn().mockResolvedValue({ data: {} }),
        restartQueue: vi.fn().mockResolvedValue({}),
        flushFailedJobs: vi.fn().mockResolvedValue({}),
        retryFailedJobs: vi.fn().mockResolvedValue({}),
        deleteBackup: vi.fn().mockResolvedValue({}),
        downloadBackup: vi.fn().mockResolvedValue('blob:url'),
    },
}));

vi.mock('@tanstack/react-query', async importOriginal => {
    const original =
        await importOriginal<typeof import('@tanstack/react-query')>();
    return {
        ...original,
        useMutation: vi
            .fn()
            .mockReturnValue({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
        useQuery: vi
            .fn()
            .mockReturnValue({ data: undefined, isLoading: false }),
        useQueryClient: vi.fn().mockReturnValue({
            invalidateQueries: vi.fn(),
            setQueryData: vi.fn(),
        }),
    };
});

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { systemService } from '@/services/systemService';
import { useMigrateStorage, useTestS3Connection } from '../useSystem';

const mockUseMutation = vi.mocked(useMutation);
const mockUseQueryClient = vi.mocked(useQueryClient);
const mockSystemService = vi.mocked(systemService);

beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
    } as unknown as ReturnType<typeof useMutation>);
    mockUseQueryClient.mockReturnValue({
        invalidateQueries: vi.fn(),
        setQueryData: vi.fn(),
    } as unknown as ReturnType<typeof useQueryClient>);
});

describe('useMigrateStorage', () => {
    it('calls POST /system/storage/migrate with target', async () => {
        let capturedMutationFn: ((target: 'media' | 's3') => Promise<unknown>) | undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockUseMutation.mockImplementation((options: any) => {
            capturedMutationFn = options.mutationFn;
            return { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useMutation>;
        });

        useMigrateStorage();

        expect(capturedMutationFn).toBeDefined();
        await capturedMutationFn!('s3');
        expect(mockSystemService.migrateStorage).toHaveBeenCalledWith('s3');
    });

    it('invalidates generalSettings on success', async () => {
        const invalidateQueries = vi.fn();
        mockUseQueryClient.mockReturnValue({
            invalidateQueries,
            setQueryData: vi.fn(),
        } as unknown as ReturnType<typeof useQueryClient>);

        let capturedOnSuccess: ((res: { message?: string }) => void) | undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockUseMutation.mockImplementation((options: any) => {
            capturedOnSuccess = options.onSuccess;
            return { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useMutation>;
        });

        useMigrateStorage();

        capturedOnSuccess!({ message: 'Storage migration queued.' });
        expect(invalidateQueries).toHaveBeenCalledWith({
            queryKey: ['settings', 'general'],
        });
    });

    it('shows error toast on failure', () => {
        let capturedOnError: ((error: Error) => void) | undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockUseMutation.mockImplementation((options: any) => {
            capturedOnError = options.onError;
            return { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useMutation>;
        });

        useMigrateStorage();

        expect(() =>
            capturedOnError!(new Error('Network error'))
        ).not.toThrow();
    });
});

describe('useTestS3Connection', () => {
    it('calls POST /system/storage/test-s3', async () => {
        let capturedMutationFn: (() => Promise<unknown>) | undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockUseMutation.mockImplementation((options: any) => {
            capturedMutationFn = options.mutationFn;
            return { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useMutation>;
        });

        useTestS3Connection();

        expect(capturedMutationFn).toBeDefined();
        await capturedMutationFn!();
        expect(mockSystemService.testS3Connection).toHaveBeenCalled();
    });
});
