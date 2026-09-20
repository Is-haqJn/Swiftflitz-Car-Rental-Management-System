import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/shared/hooks/queries/useSystem', () => ({
    useSystemInfo: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
    useClearAllCache: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
    useClearConfigCache: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
    useClearRouteCache: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
    useClearViewCache: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
    useMaintenanceMode: vi.fn().mockReturnValue({ data: undefined }),
    useToggleMaintenanceMode: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
    useRunMaintenance: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
    useRunBackup: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
    useRunSystemBackup: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
    useListBackups: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
    useDownloadBackup: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
    useDeleteBackup: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
    useBackupSettings: vi.fn().mockReturnValue({ data: undefined }),
    useUpdateBackupSettings: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
    useQueueStatus: vi.fn().mockReturnValue({ data: undefined, isLoading: false, refetch: vi.fn(), isFetching: false }),
    useRestartQueue: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
    useFlushFailedJobs: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
    useRetryFailedJobs: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
    useMigrateStorage: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
    useTestS3Connection: vi.fn().mockReturnValue({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/shared/hooks/queries/useSettings', () => ({
    useGeneralSettings: vi.fn().mockReturnValue({
        data: { data: { storage_disk: 'media' } },
    }),
    useS3Settings: vi.fn().mockReturnValue({
        data: {
            data: {
                aws_access_key_id: '••••••••••••••••',
                aws_secret_access_key: '••••••••••••••••',
                aws_default_region: 'us-east-1',
                aws_bucket: 'my-bucket',
                aws_url: '',
                aws_endpoint: '',
                use_path_style_endpoint: false,
            },
        },
        isLoading: false,
    }),
    useUpdateS3Settings: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
    MASKED: '••••••••••••••••',
}));

vi.mock('@/shared/hooks/useConfirm', () => ({
    useConfirm: vi.fn().mockReturnValue({ confirm: vi.fn().mockResolvedValue(true) }),
}));

vi.mock('@/shared/components/common/PermissionGuard', () => ({
    PermisssionGuard: ({ children }: { children: React.ReactNode }) => (
        <>{children}</>
    ),
}));

vi.mock('@/shared/config/permissions', () => ({
    PERMISSIONS: {
        SETTINGS: {
            EDIT_BACKUP: 'settings.edit_backup',
            DELETE_BACKUP: 'settings.delete_backup',
        },
    },
}));

vi.mock('@/shared/hooks', () => ({
    useTitle: vi.fn().mockReturnValue(null),
}));

import React from 'react';
import BackupMaintenance from '../BackupMaintenance';
import {
    useGeneralSettings,
    useS3Settings,
    useUpdateS3Settings,
} from '@/shared/hooks/queries/useSettings';
import {
    useMigrateStorage,
    useTestS3Connection,
} from '@/shared/hooks/queries/useSystem';
import { useConfirm } from '@/shared/hooks/useConfirm';

const mockUseGeneralSettings = vi.mocked(useGeneralSettings);
const mockUseS3Settings = vi.mocked(useS3Settings);
const mockUseUpdateS3Settings = vi.mocked(useUpdateS3Settings);
const mockUseMigrateStorage = vi.mocked(useMigrateStorage);
const mockUseTestS3Connection = vi.mocked(useTestS3Connection);
const mockUseConfirm = vi.mocked(useConfirm);

beforeEach(() => {
    vi.clearAllMocks();
    mockUseGeneralSettings.mockReturnValue({
        data: { data: { storage_disk: 'media' } },
    } as unknown as ReturnType<typeof useGeneralSettings>);
    mockUseS3Settings.mockReturnValue({
        data: {
            data: {
                aws_access_key_id: '••••••••••••••••',
                aws_secret_access_key: '••••••••••••••••',
                aws_default_region: 'us-east-1',
                aws_bucket: 'my-bucket',
                aws_url: '',
                aws_endpoint: '',
                use_path_style_endpoint: false,
            },
        },
        isLoading: false,
    } as unknown as ReturnType<typeof useS3Settings>);
    mockUseUpdateS3Settings.mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
    } as unknown as ReturnType<typeof useUpdateS3Settings>);
    mockUseMigrateStorage.mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
    } as unknown as ReturnType<typeof useMigrateStorage>);
    mockUseTestS3Connection.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
    } as unknown as ReturnType<typeof useTestS3Connection>);
    mockUseConfirm.mockReturnValue({
        confirm: vi.fn().mockResolvedValue(true),
    });
});

describe('BackupMaintenance - S3 Configuration card', () => {
    it('renders current storage disk from generalSettings', () => {
        render(<BackupMaintenance />);
        expect(screen.getByText('Local Disk')).toBeInTheDocument();
    });

    it('renders S3 config form with credential fields', () => {
        render(<BackupMaintenance />);
        expect(screen.getByText('S3 Configuration')).toBeInTheDocument();
        expect(screen.getByText('Access Key ID')).toBeInTheDocument();
        expect(screen.getByText('Secret Access Key')).toBeInTheDocument();
        expect(screen.getByText('Region')).toBeInTheDocument();
        expect(screen.getByText('Bucket')).toBeInTheDocument();
    });

    it('shows S3 badge when storage_disk is s3', () => {
        mockUseGeneralSettings.mockReturnValue({
            data: { data: { storage_disk: 's3' } },
        } as unknown as ReturnType<typeof useGeneralSettings>);
        render(<BackupMaintenance />);
        expect(screen.getByText('S3 (Cloud)')).toBeInTheDocument();
    });

    it('calls useMigrateStorage mutate after confirm', async () => {
        const mutateMock = vi.fn();
        mockUseMigrateStorage.mockReturnValue({
            mutate: mutateMock,
            isPending: false,
        } as unknown as ReturnType<typeof useMigrateStorage>);
        mockUseConfirm.mockReturnValue({
            confirm: vi.fn().mockResolvedValue(true),
        });

        render(<BackupMaintenance />);
        const toggle = screen.getByRole('checkbox', {
            name: /local|s3/i,
        });
        fireEvent.click(toggle);

        await new Promise(r => setTimeout(r, 50));
        expect(mutateMock).toHaveBeenCalledWith('s3');
    });

    it('calls testS3Connection on Test Connection click', () => {
        const mutateAsyncMock = vi.fn().mockResolvedValue({ data: { success: true } });
        mockUseTestS3Connection.mockReturnValue({
            mutate: vi.fn(),
            mutateAsync: mutateAsyncMock,
            isPending: false,
        } as unknown as ReturnType<typeof useTestS3Connection>);

        render(<BackupMaintenance />);
        const btn = screen.getByRole('button', { name: /test connection/i });
        fireEvent.click(btn);
        expect(mutateAsyncMock).toHaveBeenCalled();
    });
});
