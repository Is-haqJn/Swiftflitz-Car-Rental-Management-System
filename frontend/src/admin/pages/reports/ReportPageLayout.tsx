import { type ReactNode, useState } from 'react';
import { Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { ReportSkeleton } from '@adminComponents/skeletons/ReportSkeleton';
import type { ReportFilters } from '@/shared/types';
import { useConfirm } from '@/shared/hooks/useConfirm';
import FilterBox from '@adminComponents/ui/FilterBox';
import DatePickerField from '@adminComponents/DatePickerField';
import { PERMISSIONS } from '@/shared/config/permissions';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';

interface DateRangeFilterProps {
    filters: ReportFilters;
    onChange: (filters: ReportFilters) => void;
}

export function DateRangeFilter({ filters, onChange }: DateRangeFilterProps) {
    const [localFrom, setLocalFrom] = useState(filters.start_date ?? '');
    const [localTo, setLocalTo] = useState(filters.end_date ?? '');

    const applyDateRange = (from: string, to: string) => {
        if ((from && to) || (!from && !to)) {
            onChange({
                ...filters,
                start_date: from || undefined,
                end_date: to || undefined,
            });
        }
    };

    const handleFromChange = (value: string) => {
        setLocalFrom(value);
        applyDateRange(value, localTo);
    };

    const handleToChange = (value: string) => {
        setLocalTo(value);
        applyDateRange(localFrom, value);
    };

    const handleClearDates = () => {
        setLocalFrom('');
        setLocalTo('');
        onChange({
            ...filters,
            start_date: undefined,
            end_date: undefined,
            period: undefined,
        });
    };

    const hasPendingDate = (localFrom && !localTo) || (!localFrom && localTo);

    return (
        <Row className="g-3 align-items-end">
            <Col md={2}>
                <Form.Label className="small fw-semibold text-muted mb-1">
                    From
                </Form.Label>
                <DatePickerField
                    value={localFrom}
                    onChange={handleFromChange}
                    placeholder="Start date"
                />
                {hasPendingDate && (
                    <Form.Text className="text-warning small d-block mt-1">
                        Set both dates to apply
                    </Form.Text>
                )}
            </Col>
            <Col md={2}>
                <Form.Label className="small fw-semibold text-muted mb-1">
                    To
                </Form.Label>
                <DatePickerField
                    value={localTo}
                    onChange={handleToChange}
                    placeholder="End date"
                />
            </Col>
            <Col md={2}>
                <Form.Label className="small fw-semibold text-muted mb-1">
                    Period
                </Form.Label>
                <Form.Select
                    className="tw:h-[2.9rem]"
                    size="sm"
                    value={filters.period ?? ''}
                    onChange={e =>
                        onChange({
                            ...filters,
                            period: e.target.value || undefined,
                        })
                    }
                >
                    <option value="">All time</option>
                    <option value="week">This week</option>
                    <option value="month">This month</option>
                    <option value="quarter">This quarter</option>
                    <option value="year">This year</option>
                </Form.Select>
            </Col>
            <Col md={2}>
                {(localFrom || localTo || filters.period) && (
                    <button
                        type="button"
                        className="btn btn-outline-secondary w-100"
                        onClick={handleClearDates}
                    >
                        Clear Filters
                    </button>
                )}
            </Col>
        </Row>
    );
}

/* Reusable stat card used across all report pages */
interface StatCardProps {
    label: string;
    value: ReactNode;
    color?: string;
    colClass?: string;
}

export function StatCard({
    label,
    value,
    color = 'secondary',
    colClass = 'col-md-3 col-sm-6',
}: StatCardProps) {
    return (
        <div className={colClass}>
            <div
                className={`card h-100 border-0 shadow-sm border-start border-4 border-${color}`}
            >
                <div className="card-body py-3 px-3">
                    <div
                        className="text-muted text-uppercase fw-semibold mb-2"
                        style={{ fontSize: 10, letterSpacing: '0.5px' }}
                    >
                        {label}
                    </div>
                    <div className={`fs-5 fw-bold text-${color}`}>{value}</div>
                </div>
            </div>
        </div>
    );
}

interface ReportPageLayoutProps {
    title: string;
    subtitle?: string;
    filters?: ReportFilters;
    onFiltersChange?: (filters: ReportFilters) => void;
    onExport?: () => void;
    isExporting?: boolean;
    isWaiting?: boolean;
    isLoading: boolean;
    isError: boolean;
    children: ReactNode;
}

export default function ReportPageLayout({
    title,
    subtitle,
    filters,
    onFiltersChange,
    onExport,
    isExporting = false,
    isWaiting = false,
    isLoading,
    isError,
    children,
}: ReportPageLayoutProps) {
    const { confirm } = useConfirm();

    const handleExportClick = async () => {
        if (!onExport) return;
        const ok = await confirm({
            title: 'Queue export?',
            message:
                'A PDF will be generated in the background. You will be notified when it is ready to download.',
            confirmText: 'Queue Export',
            confirmVariant: 'primary',
        });
        if (ok) onExport();
    };

    return (
        <div className="pb-4">
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h4 className="mb-1 fw-bold">{title}</h4>
                    {subtitle && (
                        <p className="text-muted mb-0 small">{subtitle}</p>
                    )}
                </div>
                {onExport && (
                    <PermisssionGuard
                        permission={PERMISSIONS.REPORTS.EXPORT_PDF}
                    >
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => void handleExportClick()}
                            disabled={isExporting || isLoading}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {isExporting
                                ? isWaiting
                                    ? 'Waiting for export…'
                                    : 'Downloading…'
                                : 'Export PDF'}
                        </Button>
                    </PermisssionGuard>
                )}
            </div>

            {filters && onFiltersChange && (
                <FilterBox title="Filter Report" defaultOpen={true}>
                    <DateRangeFilter
                        filters={filters}
                        onChange={onFiltersChange}
                    />
                </FilterBox>
            )}

            {isLoading ? (
                <ReportSkeleton />
            ) : isError ? (
                <Alert variant="danger">
                    Failed to load report data. Please try again.
                </Alert>
            ) : (
                children
            )}
        </div>
    );
}
