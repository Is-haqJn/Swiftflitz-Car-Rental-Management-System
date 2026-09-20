import { useState, useCallback, useMemo } from 'react';
import type { ActivityLog, ActivityLogChange } from '@/shared/types';
import {
    useActivityLogs,
    useAllSessions,
    useRevokeAdminSession,
} from '@/shared/hooks/queries/useUsers';
import type { AdminSessionToken } from '@/services/profileService';
import DataTable, { type Column } from '@adminComponents/DataTable';
import DatePickerField from '@adminComponents/DatePickerField';
import FilterBox from '@adminComponents/ui/FilterBox';
import type { GenericFilters } from '@/shared/types';
import { Card, Col, Form, Row, Spinner, Button } from 'react-bootstrap';
import {
    FaChrome,
    FaFirefox,
    FaSafari,
    FaEdge,
    FaDesktop,
    FaDownload,
} from 'react-icons/fa';
import { FaTrashAlt } from 'react-icons/fa';
import { useConfirm } from '@/shared/hooks/useConfirm';
import { useTitle } from '@/shared/hooks';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';
import { useQueueAndDownloadExport } from '@/shared/hooks/queries/useExports';
import { formatDateTime } from '@/shared/libs/utils';

/** Parse token name like "Chrome - 192.168.1.1" into browser and IP parts */
function parseSessionName(name: string): { browser: string; ip: string } {
    const parts = name.split(' - ');
    if (parts.length === 2) {
        return { browser: parts[0].trim(), ip: parts[1].trim() };
    }
    return { browser: name, ip: '' };
}

function BrowserIcon({ browser }: { browser: string }) {
    const lower = browser.toLowerCase();
    if (lower.includes('chrome')) return <FaChrome className="text-warning" />;
    if (lower.includes('firefox')) return <FaFirefox className="text-danger" />;
    if (lower.includes('safari')) return <FaSafari className="text-info" />;
    if (lower.includes('edge')) return <FaEdge className="text-primary" />;
    return <FaDesktop className="text-muted" />;
}

/**
 * Semantic pill for the activity event (created/updated/deleted/etc.).
 * Styled like a title tag with coloured left border and matching text colour.
 */
function EventTag({
    event,
    logName,
}: {
    event?: string | null;
    logName: string;
}) {
    const value = (event ?? logName ?? 'event').toLowerCase();

    const palette: Record<string, { bg: string; text: string; bar: string }> = {
        created: { bg: '#dcfce7', text: '#166534', bar: '#22c55e' },
        updated: { bg: '#dbeafe', text: '#1e40af', bar: '#3b82f6' },
        deleted: { bg: '#fee2e2', text: '#991b1b', bar: '#ef4444' },
        restored: { bg: '#ede9fe', text: '#5b21b6', bar: '#8b5cf6' },
        login_as: { bg: '#fef3c7', text: '#92400e', bar: '#f59e0b' },
        impersonated: { bg: '#fef3c7', text: '#92400e', bar: '#f59e0b' },
    };
    const colors = palette[value] ?? {
        bg: '#f1f5f9',
        text: '#334155',
        bar: '#64748b',
    };

    const display = value.replace(/_/g, ' ');

    return (
        <span
            className="d-inline-flex align-items-center fw-semibold text-capitalize"
            style={{
                background: colors.bg,
                color: colors.text,
                borderLeft: `3px solid ${colors.bar}`,
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                letterSpacing: 0.2,
            }}
        >
            {display}
        </span>
    );
}

function formatValue(v: ActivityLogChange['from']): string {
    if (v === null || v === undefined || v === '') return '-';
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    const str = String(v);
    return str.length > 80 ? `${str.slice(0, 80)}…` : str;
}

function ChangesCell({ log }: { log: ActivityLog }) {
    const changes = log.changes ?? [];

    if (changes.length === 0) {
        return <span className="text-muted">-</span>;
    }

    return (
        <details style={{ maxWidth: 340 }}>
            <summary
                className="small text-primary"
                style={{ cursor: 'pointer' }}
            >
                {changes.length} change{changes.length === 1 ? '' : 's'}
            </summary>
            <div
                style={{
                    maxHeight: 200,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                }}
            >
                <ul className="list-unstyled mb-0 mt-2 ps-0">
                    {changes.map(c => (
                        <li
                            key={c.field}
                            style={{ fontSize: 12, wordBreak: 'break-word' }}
                            className="mb-1"
                        >
                            <span className="fw-semibold text-slate-700">
                                {c.label}
                            </span>
                            <span className="text-muted">: </span>
                            <span
                                className="text-danger text-decoration-line-through"
                                style={{ marginRight: 6 }}
                            >
                                {formatValue(c.from)}
                            </span>
                            <span className="text-muted">→</span>
                            <span
                                className="text-success"
                                style={{ marginLeft: 6 }}
                            >
                                {formatValue(c.to)}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </details>
    );
}

/* Login Sessions Panel */
function LoginSessionsPanel() {
    const { data: response, isLoading } = useAllSessions();
    const revokeMutation = useRevokeAdminSession();
    const { confirm } = useConfirm();

    const sessions: AdminSessionToken[] = useMemo(
        () => (response?.data as unknown as AdminSessionToken[]) ?? [],
        [response]
    );

    const handleRevoke = async (token: AdminSessionToken) => {
        const ok = await confirm({
            title: 'Revoke session?',
            message: `Revoke the session "${token.name}"? This will sign out that device.`,
            confirmText: 'Revoke',
            confirmVariant: 'danger',
        });
        if (ok) {
            revokeMutation.mutate(token.id);
        }
    };

    return (
        <Card>
            <Card.Header className="d-flex align-items-center justify-content-between bg-white border-bottom">
                <h4 className="heading mb-0">Login Sessions</h4>
                <small className="text-muted">
                    {sessions.length} active{' '}
                    {sessions.length === 1 ? 'session' : 'sessions'}
                </small>
            </Card.Header>
            <Card.Body className="p-0">
                {isLoading ? (
                    <div className="d-flex justify-content-center py-4">
                        <Spinner animation="border" size="sm" />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center text-muted py-5 small">
                        No active sessions found.
                    </div>
                ) : (
                    <ul className="list-group list-group-flush">
                        {sessions.map(token => {
                            const { browser, ip } = parseSessionName(
                                token.name
                            );
                            return (
                                <li
                                    key={token.id}
                                    className="list-group-item px-3 py-3"
                                >
                                    <div className="d-flex align-items-center gap-3">
                                        <div
                                            className="rounded-circle bg-light d-flex align-items-center justify-content-center flex-shrink-0"
                                            style={{ width: 40, height: 40 }}
                                        >
                                            <BrowserIcon browser={browser} />
                                        </div>
                                        <div className="flex-grow-1 min-w-0">
                                            <div className="fw-semibold small">
                                                {browser}
                                            </div>
                                            {token.tokenable && (
                                                <div
                                                    className="text-muted"
                                                    style={{ fontSize: 11 }}
                                                >
                                                    {token.tokenable.name}{' '}
                                                    <span className="text-secondary">
                                                        &middot;{' '}
                                                        {token.tokenable.email}
                                                    </span>
                                                </div>
                                            )}
                                            <div
                                                className="text-muted font-monospace"
                                                style={{ fontSize: 11 }}
                                            >
                                                {ip || '-'}
                                            </div>
                                        </div>
                                        <div
                                            className="text-end flex-shrink-0 me-2 d-none d-md-block"
                                            style={{ minWidth: 120 }}
                                        >
                                            <div
                                                className="text-muted"
                                                style={{ fontSize: 10 }}
                                            >
                                                LAST USED
                                            </div>
                                            <div className="small">
                                                {token.last_used_at
                                                    ? formatDateTime(
                                                          token.last_used_at
                                                      )
                                                    : 'Never'}
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            disabled={revokeMutation.isPending}
                                            onClick={() =>
                                                void handleRevoke(token)
                                            }
                                            title="Revoke session"
                                        >
                                            <FaTrashAlt
                                                style={{ fontSize: 11 }}
                                            />
                                        </Button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Card.Body>
        </Card>
    );
}

/* Main Export */
export default function ActivityLogs() {
    const title = useTitle('Activity Logs');
    const [filters, setFilters] = useState<GenericFilters>({ per_page: 15 });
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const { data: response, isLoading, isError } = useActivityLogs(filters);
    const exportMutation = useQueueAndDownloadExport();

    const logs = useMemo<ActivityLog[]>(() => response?.data ?? [], [response]);
    const meta = response?.meta ?? null;

    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }));
    }, []);

    const handlePerPageChange = useCallback((perPage: number) => {
        setFilters(prev => ({
            ...prev,
            per_page: perPage === -1 ? 200 : perPage,
            page: 1,
        }));
    }, []);

    const applyDateRange = useCallback(() => {
        setFilters(prev => ({
            ...prev,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            page: 1,
        }));
    }, [dateFrom, dateTo]);

    const clearDateRange = useCallback(() => {
        setDateFrom('');
        setDateTo('');
        setFilters(prev => ({
            ...prev,
            date_from: undefined,
            date_to: undefined,
            page: 1,
        }));
    }, []);

    const exportButton = (
        <Button
            variant="outline-secondary"
            size="sm"
            disabled={exportMutation.isPending || exportMutation.isWaiting}
            onClick={() =>
                exportMutation.mutate({ type: 'activity_logs', format: 'xlsx' })
            }
            className="d-flex align-items-center gap-1"
        >
            <FaDownload style={{ fontSize: 11 }} />
            {exportMutation.isPending || exportMutation.isWaiting
                ? 'Exporting...'
                : 'Export Logs'}
        </Button>
    );

    const columns: Column<ActivityLog>[] = [
        {
            key: 'date',
            label: 'Time',
            render: log => (
                <div style={{ minWidth: 140 }}>
                    <div className="small fw-semibold">
                        {formatDateTime(log.created_at)}
                    </div>
                </div>
            ),
        },
        {
            key: 'event',
            label: 'Event',
            render: log => (
                <EventTag event={log.event} logName={log.log_name} />
            ),
        },
        {
            key: 'description',
            label: 'Description',
            render: log => (
                <span style={{ fontSize: 13 }}>{log.description}</span>
            ),
        },
        {
            key: 'causer',
            label: 'By',
            render: log => (
                <span className="text-muted small">
                    {log.causer?.name ?? '-'}
                </span>
            ),
        },
        {
            key: 'subject',
            label: 'Subject',
            render: log => (
                <div>
                    <div className="small fw-medium">
                        {log.subject_type ?? '-'}
                    </div>
                    {log.subject_label && (
                        <div className="text-muted" style={{ fontSize: 11 }}>
                            {log.subject_label}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'changes',
            label: 'Changes',
            render: log => <ChangesCell log={log} />,
        },
    ];

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>Activity &amp; Sessions</h4>
                <p className="text-muted mb-0">
                    System audit trail and active login sessions.
                </p>
            </div>

            <Row className="g-3">
                <Col xs={12}>
                    <PermisssionGuard
                        permission={PERMISSIONS.LOGS.VIEW_ACTIVITY}
                    >
                        <FilterBox title="Filter Logs">
                            <Form
                                onSubmit={e => {
                                    e.preventDefault();
                                    applyDateRange();
                                }}
                            >
                                <Row className="g-2 align-items-end">
                                    <Col xs={6} md={3}>
                                        <Form.Label className="small fw-semibold text-muted mb-1">
                                            From
                                        </Form.Label>
                                        <DatePickerField
                                            value={dateFrom}
                                            onChange={setDateFrom}
                                            placeholder="Start date"
                                        />
                                    </Col>
                                    <Col xs={6} md={3}>
                                        <Form.Label className="small fw-semibold text-muted mb-1">
                                            To
                                        </Form.Label>
                                        <DatePickerField
                                            value={dateTo}
                                            onChange={setDateTo}
                                            placeholder="End date"
                                        />
                                    </Col>
                                    <Col xs="auto">
                                        <Button type="submit" variant="primary">
                                            Apply
                                        </Button>
                                    </Col>
                                    {(filters.date_from || filters.date_to) && (
                                        <Col xs="auto">
                                            <Button
                                                type="button"
                                                variant="outline-secondary"
                                                onClick={clearDateRange}
                                            >
                                                Clear
                                            </Button>
                                        </Col>
                                    )}
                                </Row>
                            </Form>
                        </FilterBox>

                        <Card className="border-0 shadow-sm">
                            <Card.Body className="p-0">
                                <DataTable
                                    title="Logs"
                                    data={logs}
                                    columns={columns}
                                    meta={meta}
                                    isLoading={isLoading}
                                    isError={isError}
                                    onPageChange={handlePageChange}
                                    perPage={
                                        filters.per_page === 200
                                            ? -1
                                            : (filters.per_page as number)
                                    }
                                    onPerPageChange={handlePerPageChange}
                                    emptyTitle="No activity logs"
                                    emptyMessage="System activity will appear here."
                                    headerActions={exportButton}
                                />
                            </Card.Body>
                        </Card>
                    </PermisssionGuard>
                </Col>

                <Col xs={12}>
                    <PermisssionGuard
                        permission={PERMISSIONS.LOGS.MANAGE_SESSIONS}
                    >
                        <LoginSessionsPanel />
                    </PermisssionGuard>
                </Col>
            </Row>
        </div>
    );
}
