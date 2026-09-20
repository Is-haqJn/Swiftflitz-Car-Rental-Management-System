import { useEffect, useState } from 'react';
import {
    Card,
    Row,
    Col,
    Badge,
    Button,
    Spinner,
    Form,
    Table,
    InputGroup,
    Modal,
} from 'react-bootstrap';
import {
    SkeletonFormRows,
    SkeletonTableRows,
} from '@/shared/components/ui/Skeleton';
import { FaArrowsRotate } from 'react-icons/fa6';
import {
    useSystemInfo,
    useClearAllCache,
    useClearConfigCache,
    useClearRouteCache,
    useClearViewCache,
    useMaintenanceMode,
    useToggleMaintenanceMode,
    useRunMaintenance,
    useRunBackup,
    useRunSystemBackup,
    useListBackups,
    useDownloadBackup,
    useDeleteBackup,
    useBackupSettings,
    useUpdateBackupSettings,
    useQueueStatus,
    useRestartQueue,
    useFlushFailedJobs,
    useRetryFailedJobs,
    useMigrateStorage,
    useTestS3Connection,
} from '@/shared/hooks/queries/useSystem';
import {
    useGeneralSettings,
    useS3Settings,
    useUpdateS3Settings,
    MASKED,
} from '@/shared/hooks/queries/useSettings';
import { useConfirm } from '@/shared/hooks/useConfirm';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';
import { useTitle } from '@/shared/hooks';
import type { SystemBackupOptions } from '@/services/systemService';
import type { S3SettingsData } from '@/shared/types';

interface InfoRowProps {
    label: string;
    value: string | boolean;
}

function InfoRow({ label, value }: InfoRowProps) {
    return (
        <tr>
            <td className="text-muted fw-semibold" style={{ width: '40%' }}>
                {label}
            </td>
            <td>
                {typeof value === 'boolean' ? (
                    <Badge bg={value ? 'danger' : 'success'}>
                        {value ? 'On' : 'Off'}
                    </Badge>
                ) : (
                    <code className="fs-13">{value}</code>
                )}
            </td>
        </tr>
    );
}

interface CacheActionProps {
    label: string;
    description: string;
    onClear: () => void;
    isPending: boolean;
    variant?: string;
    buttonText?: string;
    pendingText?: string;
}

function CacheAction({
    label,
    description,
    onClear,
    isPending,
    variant = 'outline-secondary',
    buttonText = 'Clear',
    pendingText = 'Clearing...',
}: CacheActionProps) {
    return (
        <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
            <div>
                <div className="fw-semibold">{label}</div>
                <small className="text-muted">{description}</small>
            </div>
            <Button
                variant={variant}
                size="sm"
                onClick={onClear}
                disabled={isPending}
            >
                {isPending ? (
                    <>
                        <Spinner
                            animation="border"
                            size="sm"
                            className="me-1"
                        />
                        {pendingText}
                    </>
                ) : (
                    buttonText
                )}
            </Button>
        </div>
    );
}

interface SystemBackupModalProps {
    show: boolean;
    onHide: () => void;
    onConfirm: (options: SystemBackupOptions) => void;
    isPending: boolean;
}

function SystemBackupModal({
    show,
    onHide,
    onConfirm,
    isPending,
}: SystemBackupModalProps) {
    const [includeDatabase, setIncludeDatabase] = useState(true);
    const [includeEnv, setIncludeEnv] = useState(true);
    const [includeLogs, setIncludeLogs] = useState(false);
    const [includeStorage, setIncludeStorage] = useState(false);

    useEffect(() => {
        if (show) {
            setIncludeDatabase(true);
            setIncludeEnv(true);
            setIncludeLogs(false);
            setIncludeStorage(false);
        }
    }, [show]);

    const noneSelected =
        !includeDatabase && !includeEnv && !includeLogs && !includeStorage;

    const handleConfirm = () => {
        onConfirm({
            include_database: includeDatabase,
            include_env: includeEnv,
            include_logs: includeLogs,
            include_storage: includeStorage,
        });
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton={!isPending}>
                <Modal.Title className="fs-5">Full System Backup</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p className="text-muted mb-3">
                    Select what to include in the backup ZIP archive.
                </p>
                <Form>
                    <Form.Check
                        type="checkbox"
                        id="backup-database"
                        label={
                            <span>
                                <span className="fw-semibold">
                                    Database (SQL dump)
                                </span>
                                <br />
                                <small className="text-muted">
                                    Full export of all database tables
                                </small>
                            </span>
                        }
                        checked={includeDatabase}
                        onChange={e => setIncludeDatabase(e.target.checked)}
                        className="mb-3"
                    />
                    <Form.Check
                        type="checkbox"
                        id="backup-env"
                        label={
                            <span>
                                <span className="fw-semibold">
                                    Environment Config (.env)
                                </span>
                                <br />
                                <small className="text-muted">
                                    Application configuration and secrets
                                </small>
                            </span>
                        }
                        checked={includeEnv}
                        onChange={e => setIncludeEnv(e.target.checked)}
                        className="mb-3"
                    />
                    <Form.Check
                        type="checkbox"
                        id="backup-logs"
                        label={
                            <span>
                                <span className="fw-semibold">
                                    Application Logs
                                </span>
                                <br />
                                <small className="text-muted">
                                    Files from <code>storage/logs/</code>
                                </small>
                            </span>
                        }
                        checked={includeLogs}
                        onChange={e => setIncludeLogs(e.target.checked)}
                        className="mb-3"
                    />
                    <Form.Check
                        type="checkbox"
                        id="backup-storage"
                        label={
                            <span>
                                <span className="fw-semibold">
                                    Storage / Uploads
                                </span>
                                <br />
                                <small className="text-muted">
                                    Files from <code>storage/app/public/</code>
                                </small>
                            </span>
                        }
                        checked={includeStorage}
                        onChange={e => setIncludeStorage(e.target.checked)}
                        className="mb-0"
                    />
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button
                    variant="secondary"
                    onClick={onHide}
                    disabled={isPending}
                >
                    Cancel
                </Button>
                <Button
                    variant="success"
                    onClick={handleConfirm}
                    disabled={noneSelected || isPending}
                >
                    {isPending ? (
                        <>
                            <Spinner
                                animation="border"
                                size="sm"
                                className="me-1"
                            />
                            Backing up...
                        </>
                    ) : (
                        'Create Backup'
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default function BackupMaintenance() {
    const title = useTitle('Backup & Maintenance');
    const { data: infoRes, isLoading } = useSystemInfo();
    const clearAll = useClearAllCache();
    const clearConfig = useClearConfigCache();
    const clearRoutes = useClearRouteCache();
    const clearViews = useClearViewCache();
    const { data: maintRes } = useMaintenanceMode();
    const toggleMaintenance = useToggleMaintenanceMode();
    const runMaintenance = useRunMaintenance();
    const runBackup = useRunBackup();
    const runSystemBackup = useRunSystemBackup();
    const {
        data: queueRes,
        isLoading: queueLoading,
        refetch: refetchQueue,
        isFetching: queueFetching,
    } = useQueueStatus();
    const restartQueue = useRestartQueue();
    const flushFailedJobs = useFlushFailedJobs();
    const retryFailedJobs = useRetryFailedJobs();
    const { confirm } = useConfirm();
    const { data: backupsRes, isLoading: backupsLoading } = useListBackups();
    const downloadBackup = useDownloadBackup();
    const deleteBackup = useDeleteBackup();
    const { data: backupSettingsRes } = useBackupSettings();
    const updateBackupSettings = useUpdateBackupSettings();
    const backupSettings = backupSettingsRes?.data;
    const { data: generalRes } = useGeneralSettings();
    const { data: s3Res, isLoading: s3Loading } = useS3Settings();
    const updateS3 = useUpdateS3Settings();
    const migrateStorage = useMigrateStorage();
    const testS3 = useTestS3Connection();
    const [s3Form, setS3Form] = useState<S3SettingsData>({});
    const [s3TestResult, setS3TestResult] = useState<{
        success: boolean;
        error?: string;
    } | null>(null);
    const [copied, setCopied] = useState(false);
    const [showBackupModal, setShowBackupModal] = useState(false);

    const storageDisk = generalRes?.data?.storage_disk ?? 'media';
    const s3Settings = s3Res?.data;

    useEffect(() => {
        if (s3Settings) {
            setS3Form({
                aws_access_key_id: s3Settings.aws_access_key_id ?? '',
                aws_secret_access_key: s3Settings.aws_secret_access_key ?? '',
                aws_default_region: s3Settings.aws_default_region ?? '',
                aws_bucket: s3Settings.aws_bucket ?? '',
                aws_url: s3Settings.aws_url ?? '',
                aws_endpoint: s3Settings.aws_endpoint ?? '',
                use_path_style_endpoint:
                    s3Settings.use_path_style_endpoint ?? false,
            });
        }
    }, [s3Settings]);

    const info = infoRes?.data;
    const maintenanceEnabled = maintRes?.data?.enabled ?? false;
    const bypassToken = maintRes?.data?.bypass_token ?? null;
    const bypassUrl = bypassToken
        ? `${window.location.origin}/?bypass=${bypassToken}&t=${Math.floor(Date.now() / 1000)}&ref=maintenance`
        : null;

    const handleCopyBypass = () => {
        if (!bypassUrl) {
            return;
        }
        navigator.clipboard.writeText(bypassUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>Backup & Maintenance</h4>
                <p className="text-muted mb-0">
                    System information, cache management, maintenance mode, and
                    backups.
                </p>
            </div>

            <Row className="g-3">
                {/* System Info */}
                <Col lg={6}>
                    <Card className="h-100">
                        <Card.Header>
                            <Card.Title>System Information</Card.Title>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {isLoading ? (
                                <SkeletonFormRows rows={4} />
                            ) : info ? (
                                <table className="table table-sm table-borderless mb-0">
                                    <tbody>
                                        <InfoRow
                                            label="PHP Version"
                                            value={info.php_version}
                                        />
                                        <InfoRow
                                            label="Laravel Version"
                                            value={info.laravel_version}
                                        />
                                        <InfoRow
                                            label="Environment"
                                            value={info.environment}
                                        />
                                        <InfoRow
                                            label="Debug Mode"
                                            value={info.debug_mode}
                                        />
                                        <InfoRow
                                            label="Timezone"
                                            value={info.timezone}
                                        />
                                        <InfoRow
                                            label="Database Driver"
                                            value={info.database_driver}
                                        />
                                        <InfoRow
                                            label="Cache Driver"
                                            value={info.cache_driver}
                                        />
                                        <InfoRow
                                            label="Queue Driver"
                                            value={info.queue_driver}
                                        />
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-muted text-center py-4">
                                    Unable to load system info.
                                </p>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Cache Management */}
                <Col lg={6}>
                    <Card className="h-100">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <Card.Title className="mb-0">
                                Cache Management
                            </Card.Title>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => clearAll.mutate()}
                                disabled={clearAll.isPending}
                            >
                                {clearAll.isPending ? (
                                    <>
                                        <Spinner
                                            animation="border"
                                            size="sm"
                                            className="me-1"
                                        />
                                        Clearing All...
                                    </>
                                ) : (
                                    'Clear All Caches'
                                )}
                            </Button>
                        </Card.Header>
                        <Card.Body>
                            <CacheAction
                                label="Config Cache"
                                description="Clears cached configuration files."
                                onClear={() => clearConfig.mutate()}
                                isPending={clearConfig.isPending}
                            />
                            <CacheAction
                                label="Route Cache"
                                description="Clears cached route definitions."
                                onClear={() => clearRoutes.mutate()}
                                isPending={clearRoutes.isPending}
                            />
                            <CacheAction
                                label="View Cache"
                                description="Clears compiled Blade view files."
                                onClear={() => clearViews.mutate()}
                                isPending={clearViews.isPending}
                            />
                        </Card.Body>
                    </Card>
                </Col>

                {/* Maintenance Mode */}
                <Col lg={6}>
                    <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <Card.Title className="mb-0">
                                Maintenance Mode
                            </Card.Title>
                            <Badge
                                bg={maintenanceEnabled ? 'danger' : 'success'}
                            >
                                {maintenanceEnabled ? 'ENABLED' : 'DISABLED'}
                            </Badge>
                        </Card.Header>
                        <Card.Body>
                            <p className="text-muted small mb-3">
                                When enabled, the public website shows a
                                maintenance screen to unauthenticated visitors.
                                Logged-in users are unaffected. Share the bypass
                                link below to grant temporary access to specific
                                guests without disabling maintenance mode.
                            </p>
                            <div className="d-flex align-items-center gap-3 mb-3">
                                <Form.Check
                                    type="switch"
                                    id="maintenance-mode-switch"
                                    checked={maintenanceEnabled}
                                    disabled={toggleMaintenance.isPending}
                                    onChange={async e => {
                                        const newValue = e.target.checked;
                                        const ok = await confirm({
                                            title: newValue
                                                ? 'Enable maintenance mode?'
                                                : 'Disable maintenance mode?',
                                            message: newValue
                                                ? 'Unauthenticated visitors will see a maintenance screen. A bypass link will be generated.'
                                                : 'All visitors will regain access. The current bypass link will be invalidated.',
                                            confirmText: newValue
                                                ? 'Enable'
                                                : 'Disable',
                                            confirmVariant: newValue
                                                ? 'danger'
                                                : 'primary',
                                        });
                                        if (ok)
                                            toggleMaintenance.mutate(newValue);
                                    }}
                                    label={
                                        maintenanceEnabled
                                            ? 'Maintenance mode is ON'
                                            : 'Maintenance mode is OFF'
                                    }
                                />
                                {toggleMaintenance.isPending && (
                                    <Spinner
                                        animation="border"
                                        size="sm"
                                        variant="primary"
                                    />
                                )}
                            </div>
                            {maintenanceEnabled && bypassUrl && (
                                <div>
                                    <Form.Label className="small fw-semibold text-muted mb-1">
                                        Bypass Link
                                    </Form.Label>
                                    <InputGroup size="sm">
                                        <Form.Control
                                            readOnly
                                            value={bypassUrl}
                                            className="font-monospace small"
                                        />
                                        <Button
                                            variant={
                                                copied
                                                    ? 'success'
                                                    : 'outline-secondary'
                                            }
                                            onClick={handleCopyBypass}
                                        >
                                            {copied ? 'Copied!' : 'Copy'}
                                        </Button>
                                    </InputGroup>
                                    <Form.Text className="text-muted">
                                        Share this link to allow access during
                                        maintenance. It is invalidated when
                                        maintenance mode is turned off.
                                    </Form.Text>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Queue Management */}
                <Col lg={6}>
                    <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <div>
                                <Card.Title className="mb-0">
                                    Queue Management
                                </Card.Title>
                                {!queueLoading && (
                                    <small className="text-muted">
                                        Worker:{' '}
                                        <span
                                            className={
                                                queueRes?.data
                                                    ?.worker_status ===
                                                'running'
                                                    ? 'text-success fw-semibold'
                                                    : 'text-danger fw-semibold'
                                            }
                                        >
                                            {queueRes?.data?.worker_status ===
                                            'running'
                                                ? '● Running'
                                                : '● Stopped'}
                                        </span>
                                    </small>
                                )}
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                {queueLoading ? (
                                    <small className="text-muted">
                                        Loading...
                                    </small>
                                ) : (
                                    <>
                                        <Badge
                                            bg="secondary"
                                            className="fw-normal"
                                        >
                                            {queueRes?.data?.pending_jobs ?? 0}{' '}
                                            pending
                                        </Badge>
                                        <Badge
                                            bg={
                                                (queueRes?.data?.failed_jobs ??
                                                    0) > 0
                                                    ? 'danger'
                                                    : 'success'
                                            }
                                            className="fw-normal"
                                        >
                                            {queueRes?.data?.failed_jobs ?? 0}{' '}
                                            failed
                                        </Badge>
                                    </>
                                )}
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => refetchQueue()}
                                    disabled={queueFetching}
                                    title="Refresh queue status"
                                >
                                    <FaArrowsRotate
                                        className={queueFetching ? 'spin' : ''}
                                    />
                                </Button>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            <CacheAction
                                label="Restart Queue Workers"
                                description="Signals all workers to restart after finishing their current job."
                                variant="outline-primary"
                                buttonText="Restart Workers"
                                pendingText="Restarting..."
                                onClear={async () => {
                                    const ok = await confirm({
                                        title: 'Restart queue workers?',
                                        message:
                                            'Workers will finish their current job then restart. No jobs will be lost.',
                                        confirmText: 'Restart',
                                        confirmVariant: 'primary',
                                    });
                                    if (ok) restartQueue.mutate();
                                }}
                                isPending={restartQueue.isPending}
                            />
                            <CacheAction
                                label="Retry Failed Jobs"
                                description="Re-queues all failed jobs so they are attempted again."
                                variant="outline-warning"
                                buttonText="Retry Failed"
                                pendingText="Retrying..."
                                onClear={async () => {
                                    const ok = await confirm({
                                        title: 'Retry all failed jobs?',
                                        message:
                                            'All failed jobs will be re-queued and attempted again. Jobs that fail repeatedly may require investigation.',
                                        confirmText: 'Retry All',
                                        confirmVariant: 'primary',
                                    });
                                    if (ok) retryFailedJobs.mutate();
                                }}
                                isPending={retryFailedJobs.isPending}
                            />
                            <CacheAction
                                label="Clear Failed Jobs"
                                description="Permanently deletes all failed job records from the queue."
                                variant="outline-danger"
                                buttonText="Clear Failed"
                                pendingText="Clearing..."
                                onClear={async () => {
                                    const ok = await confirm({
                                        title: 'Clear all failed jobs?',
                                        message:
                                            'This will permanently delete all failed job records. This action cannot be undone.',
                                        confirmText: 'Clear Failed Jobs',
                                        confirmVariant: 'danger',
                                    });
                                    if (ok) flushFailedJobs.mutate();
                                }}
                                isPending={flushFailedJobs.isPending}
                            />
                        </Card.Body>
                    </Card>
                </Col>

                {/* Housekeeping Actions */}
                <Col lg={6}>
                    <Card>
                        <Card.Header>
                            <Card.Title className="mb-0">
                                Housekeeping & Backup
                            </Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <CacheAction
                                label="System Cleanup"
                                description="Purges expired exports and runs scheduled cleanup tasks immediately."
                                variant="outline-warning"
                                buttonText="Run Now"
                                pendingText="Running..."
                                onClear={async () => {
                                    const ok = await confirm({
                                        title: 'Run system cleanup?',
                                        message:
                                            'This will queue a maintenance job to purge expired exports and clean up stale data.',
                                        confirmText: 'Run Now',
                                        confirmVariant: 'primary',
                                    });
                                    if (ok) runMaintenance.mutate();
                                }}
                                isPending={runMaintenance.isPending}
                            />
                            <CacheAction
                                label="Database Backup"
                                description="Creates a full SQL dump of the database and saves it to storage."
                                variant="outline-primary"
                                buttonText="Back Up Now"
                                pendingText="Backing up..."
                                onClear={async () => {
                                    const ok = await confirm({
                                        title: 'Create database backup?',
                                        message:
                                            'A full SQL dump will be created and saved to the server storage. This may take a moment.',
                                        confirmText: 'Back Up Now',
                                        confirmVariant: 'primary',
                                    });
                                    if (ok) runBackup.mutate();
                                }}
                                isPending={runBackup.isPending}
                            />
                            <CacheAction
                                label="Full System Backup"
                                description="Choose what to include: database, config, logs, or storage files."
                                variant="outline-success"
                                buttonText="Choose & Backup"
                                pendingText="Backing up..."
                                onClear={() => setShowBackupModal(true)}
                                isPending={runSystemBackup.isPending}
                            />
                        </Card.Body>
                    </Card>
                </Col>

                {/* Scheduled Backup Toggles */}
                {backupSettings && (
                    <Col lg={6}>
                        <Card>
                            <Card.Header>
                                <Card.Title className="mb-0">
                                    Scheduled Backups
                                </Card.Title>
                            </Card.Header>
                            <Card.Body>
                                <p className="text-muted small mb-3">
                                    Controls whether scheduled cron jobs run
                                    automatically. Manual backup buttons always
                                    work regardless of these switches.
                                </p>
                                <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                                    <div>
                                        <div className="fw-semibold">
                                            Scheduled Database Backup
                                        </div>
                                        <small className="text-muted">
                                            Runs daily at 03:00 -{' '}
                                            <code>db:backup</code>
                                        </small>
                                    </div>
                                    <PermisssionGuard
                                        permission={
                                            PERMISSIONS.SETTINGS.EDIT_BACKUP
                                        }
                                        fallback={
                                            <Form.Check
                                                type="switch"
                                                id="scheduled-db-backup-ro"
                                                checked={
                                                    backupSettings.scheduled_db_backup_enabled
                                                }
                                                disabled
                                                readOnly
                                            />
                                        }
                                    >
                                        <Form.Check
                                            type="switch"
                                            id="scheduled-db-backup"
                                            checked={
                                                backupSettings.scheduled_db_backup_enabled
                                            }
                                            disabled={
                                                updateBackupSettings.isPending
                                            }
                                            onChange={e =>
                                                updateBackupSettings.mutate({
                                                    scheduled_db_backup_enabled:
                                                        e.target.checked,
                                                })
                                            }
                                        />
                                    </PermisssionGuard>
                                </div>
                                <div className="d-flex justify-content-between align-items-center py-3">
                                    <div>
                                        <div className="fw-semibold">
                                            Scheduled Full System Backup
                                        </div>
                                        <small className="text-muted">
                                            Runs every Sunday at 04:00 -{' '}
                                            <code>system:backup</code>
                                        </small>
                                    </div>
                                    <PermisssionGuard
                                        permission={
                                            PERMISSIONS.SETTINGS.EDIT_BACKUP
                                        }
                                        fallback={
                                            <Form.Check
                                                type="switch"
                                                id="scheduled-system-backup-ro"
                                                checked={
                                                    backupSettings.scheduled_system_backup_enabled
                                                }
                                                disabled
                                                readOnly
                                            />
                                        }
                                    >
                                        <Form.Check
                                            type="switch"
                                            id="scheduled-system-backup"
                                            checked={
                                                backupSettings.scheduled_system_backup_enabled
                                            }
                                            disabled={
                                                updateBackupSettings.isPending
                                            }
                                            onChange={e =>
                                                updateBackupSettings.mutate({
                                                    scheduled_system_backup_enabled:
                                                        e.target.checked,
                                                })
                                            }
                                        />
                                    </PermisssionGuard>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                )}

                {/* S3 Configuration */}
                <Col lg={6}>
                    <Card>
                        <Card.Header>
                            <Card.Title className="mb-0">
                                S3 Configuration
                            </Card.Title>
                        </Card.Header>
                        <Card.Body>
                            {s3Loading ? (
                                <SkeletonFormRows rows={5} />
                            ) : (
                                <>
                                    <p className="text-muted small mb-3">
                                        AWS S3 credentials for cloud file
                                        storage. Credentials are encrypted at
                                        rest.
                                    </p>
                                    <Form
                                        onSubmit={async e => {
                                            e.preventDefault();
                                            updateS3.mutate(s3Form);
                                        }}
                                    >
                                        {(
                                            [
                                                [
                                                    'aws_access_key_id',
                                                    'Access Key ID',
                                                    'text',
                                                ],
                                                [
                                                    'aws_secret_access_key',
                                                    'Secret Access Key',
                                                    'password',
                                                ],
                                                [
                                                    'aws_default_region',
                                                    'Region',
                                                    'text',
                                                ],
                                                ['aws_bucket', 'Bucket', 'text'],
                                                ['aws_url', 'URL', 'text'],
                                                [
                                                    'aws_endpoint',
                                                    'Endpoint',
                                                    'text',
                                                ],
                                            ] as [
                                                keyof S3SettingsData,
                                                string,
                                                string,
                                            ][]
                                        ).map(([field, label, inputType]) => (
                                            <Form.Group
                                                key={field}
                                                className="mb-3"
                                            >
                                                <Form.Label className="small fw-semibold">
                                                    {label}
                                                </Form.Label>
                                                <Form.Control
                                                    type={inputType}
                                                    size="sm"
                                                    value={
                                                        (s3Form[
                                                            field
                                                        ] as string) ?? ''
                                                    }
                                                    placeholder={
                                                        inputType === 'password'
                                                            ? MASKED
                                                            : ''
                                                    }
                                                    onChange={e =>
                                                        setS3Form(prev => ({
                                                            ...prev,
                                                            [field]: e.target
                                                                .value,
                                                        }))
                                                    }
                                                />
                                            </Form.Group>
                                        ))}
                                        <Form.Group className="mb-3">
                                            <Form.Check
                                                type="switch"
                                                id="use-path-style-endpoint"
                                                label="Use Path-Style Endpoint"
                                                checked={
                                                    s3Form.use_path_style_endpoint ??
                                                    false
                                                }
                                                onChange={e =>
                                                    setS3Form(prev => ({
                                                        ...prev,
                                                        use_path_style_endpoint:
                                                            e.target.checked,
                                                    }))
                                                }
                                            />
                                        </Form.Group>
                                        <div className="d-flex gap-2 mt-3">
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                size="sm"
                                                disabled={updateS3.isPending}
                                            >
                                                {updateS3.isPending ? (
                                                    <>
                                                        <Spinner
                                                            animation="border"
                                                            size="sm"
                                                            className="me-1"
                                                        />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    'Save S3 Settings'
                                                )}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline-secondary"
                                                size="sm"
                                                disabled={testS3.isPending}
                                                onClick={async () => {
                                                    setS3TestResult(null);
                                                    const res =
                                                        await testS3.mutateAsync();
                                                    setS3TestResult(
                                                        res.data ?? {
                                                            success: false,
                                                        }
                                                    );
                                                }}
                                            >
                                                {testS3.isPending ? (
                                                    <>
                                                        <Spinner
                                                            animation="border"
                                                            size="sm"
                                                            className="me-1"
                                                        />
                                                        Testing...
                                                    </>
                                                ) : (
                                                    'Test Connection'
                                                )}
                                            </Button>
                                        </div>
                                        {s3TestResult !== null && (
                                            <div
                                                className={`mt-2 small ${s3TestResult.success ? 'text-success' : 'text-danger'}`}
                                            >
                                                {s3TestResult.success
                                                    ? 'Connection successful.'
                                                    : `Connection failed: ${s3TestResult.error ?? 'Unknown error'}`}
                                            </div>
                                        )}
                                    </Form>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Storage Migration */}
                <Col lg={6}>
                    <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <Card.Title className="mb-0">
                                Storage Migration
                            </Card.Title>
                            <Badge
                                bg={
                                    storageDisk === 's3' ? 'info' : 'secondary'
                                }
                            >
                                {storageDisk === 's3'
                                    ? 'S3 (Cloud)'
                                    : 'Local Disk'}
                            </Badge>
                        </Card.Header>
                        <Card.Body>
                            <p className="text-muted small mb-3">
                                Migrate all uploaded files between local disk
                                and Amazon S3. The migration runs in the
                                background and you will be notified by email
                                when complete.
                            </p>
                            <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                                <div>
                                    <div className="fw-semibold">
                                        Active Storage Disk
                                    </div>
                                    <small className="text-muted">
                                        Currently using{' '}
                                        <code>
                                            {storageDisk === 's3'
                                                ? 'S3 cloud storage'
                                                : 'local media disk'}
                                        </code>
                                    </small>
                                </div>
                                <Form.Check
                                    type="switch"
                                    id="storage-disk-toggle"
                                    label={
                                        storageDisk === 's3' ? 'S3' : 'Local'
                                    }
                                    checked={storageDisk === 's3'}
                                    disabled={migrateStorage.isPending}
                                    onChange={async e => {
                                        const target = e.target.checked
                                            ? 's3'
                                            : 'media';
                                        const label =
                                            target === 's3'
                                                ? 'Amazon S3'
                                                : 'local disk';
                                        const ok = await confirm({
                                            title: `Migrate to ${label}?`,
                                            message: `All files will be copied to ${label}. This runs in the background and may take a while. You will be notified by email when complete.`,
                                            confirmText: 'Start Migration',
                                            confirmVariant: 'primary',
                                        });
                                        if (ok) {
                                            migrateStorage.mutate(target);
                                        }
                                    }}
                                />
                            </div>
                            {migrateStorage.isPending && (
                                <div className="d-flex align-items-center gap-2 pt-3 text-muted small">
                                    <Spinner animation="border" size="sm" />
                                    Migration queued...
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Backup Files */}
                <Col lg={12}>
                    <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <Card.Title className="mb-0">
                                Database Backup Files
                            </Card.Title>
                            <small className="text-muted">
                                Stored in <code>storage/app/backups/</code>
                            </small>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {backupsLoading ? (
                                <SkeletonTableRows rows={3} cols={4} />
                            ) : (backupsRes?.data?.length ?? 0) === 0 ? (
                                <p className="text-muted text-center py-4 mb-0">
                                    No backup files found. Run a backup to get
                                    started.
                                </p>
                            ) : (
                                <Table
                                    responsive
                                    hover
                                    className="mb-0"
                                    size="sm"
                                >
                                    <thead className="table-light">
                                        <tr>
                                            <th>File</th>
                                            <th>Size</th>
                                            <th>Created</th>
                                            <th className="text-end">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {backupsRes?.data?.map(backup => (
                                            <tr key={backup.name}>
                                                <td>
                                                    <code className="small">
                                                        {backup.name}
                                                    </code>
                                                </td>
                                                <td className="text-muted small">
                                                    {(
                                                        backup.size / 1024
                                                    ).toFixed(1)}{' '}
                                                    KB
                                                </td>
                                                <td className="text-muted small">
                                                    {new Date(
                                                        backup.created_at
                                                    ).toLocaleString('en-GB', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </td>
                                                <td className="text-end">
                                                    <div className="d-flex gap-2 justify-content-end">
                                                        <Button
                                                            size="sm"
                                                            variant="outline-primary"
                                                            disabled={
                                                                downloadBackup.isPending
                                                            }
                                                            onClick={() =>
                                                                downloadBackup.mutate(
                                                                    backup.name
                                                                )
                                                            }
                                                        >
                                                            {downloadBackup.isPending &&
                                                            downloadBackup.variables ===
                                                                backup.name ? (
                                                                <Spinner
                                                                    animation="border"
                                                                    size="sm"
                                                                />
                                                            ) : (
                                                                'Download'
                                                            )}
                                                        </Button>
                                                        <PermisssionGuard
                                                            permission={
                                                                PERMISSIONS
                                                                    .SETTINGS
                                                                    .DELETE_BACKUP
                                                            }
                                                        >
                                                            <Button
                                                                size="sm"
                                                                variant="outline-danger"
                                                                disabled={
                                                                    deleteBackup.isPending &&
                                                                    deleteBackup.variables ===
                                                                        backup.name
                                                                }
                                                                onClick={async () => {
                                                                    const ok =
                                                                        await confirm(
                                                                            {
                                                                                title: 'Delete backup?',
                                                                                message: `Permanently delete "${backup.name}"? This cannot be undone.`,
                                                                                confirmText:
                                                                                    'Delete',
                                                                                confirmVariant:
                                                                                    'danger',
                                                                            }
                                                                        );
                                                                    if (ok)
                                                                        deleteBackup.mutate(
                                                                            backup.name
                                                                        );
                                                                }}
                                                            >
                                                                {deleteBackup.isPending &&
                                                                deleteBackup.variables ===
                                                                    backup.name ? (
                                                                    <Spinner
                                                                        animation="border"
                                                                        size="sm"
                                                                    />
                                                                ) : (
                                                                    'Delete'
                                                                )}
                                                            </Button>
                                                        </PermisssionGuard>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <SystemBackupModal
                show={showBackupModal}
                onHide={() => setShowBackupModal(false)}
                onConfirm={options => {
                    runSystemBackup.mutate(options);
                    setShowBackupModal(false);
                }}
                isPending={runSystemBackup.isPending}
            />
        </div>
    );
}
