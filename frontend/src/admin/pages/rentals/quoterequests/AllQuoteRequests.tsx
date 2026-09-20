import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectActiveBranchId } from '@/store/slices/activeBranchSlice';
import { useNavigate, Link } from 'react-router-dom';
import {
    Alert,
    Badge,
    Button,
    Dropdown,
    Form,
    InputGroup,
    Nav,
} from 'react-bootstrap';
import type {
    QuoteRequest,
    QuoteRequestStatus,
    QuoteRequestFilters,
} from '@/shared/types/rental.types';
import {
    useQuoteRequests,
    useDeleteQuoteRequest,
    useMarkContacted,
} from '@/shared/hooks/queries/useQuotes';
import { useBulkDelete } from '@/shared/hooks/queries/useBulkDelete';
import { QUOTE_KEYS } from '@/shared/hooks/queries/useQuotes';
import { useTitle } from '@/shared/hooks';
import { ROUTES } from '@/shared/routes';
import { formatDate } from '@/shared/libs/utils';
import DataTable, { type Column } from '@adminComponents/DataTable';
import GenerateQuoteModal from './GenerateQuoteModal';
import SendQuoteModal from './SendQuoteModal';

/* Status config */
const STATUS_CONFIG: Record<
    QuoteRequestStatus,
    { label: string; color: string }
> = {
    pending: { label: 'Pending', color: 'secondary' },
    contacted: { label: 'Contacted', color: 'info' },
    quoted: { label: 'Quoted', color: 'primary' },
    sent: { label: 'Sent', color: 'warning' },
    pending_review: { label: 'Needs Review', color: 'danger' },
    converted: { label: 'Converted', color: 'success' },
    cancelled: { label: 'Cancelled', color: 'light' },
};

const STATUS_TABS: Array<{ value: QuoteRequestStatus | 'all'; label: string }> =
    [
        { value: 'all', label: 'All' },
        { value: 'pending', label: 'Pending' },
        { value: 'contacted', label: 'Contacted' },
        { value: 'quoted', label: 'Quoted' },
        { value: 'sent', label: 'Sent' },
        { value: 'pending_review', label: 'Needs Review' },
        { value: 'converted', label: 'Converted' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

/* Component */
export default function AllQuoteRequests() {
    useTitle('Quote Requests');

    const navigate = useNavigate();
    const activeBranchId = useSelector(selectActiveBranchId);

    const [activeTab, setActiveTab] = useState<QuoteRequestStatus | 'all'>(
        'all'
    );
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [deleteTarget, setDeleteTarget] = useState<QuoteRequest | null>(null);
    const [generateTarget, setGenerateTarget] = useState<QuoteRequest | null>(
        null
    );
    const [sendTarget, setSendTarget] = useState<QuoteRequest | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const filters: QuoteRequestFilters = {
        page,
        per_page: 20,
        ...(activeTab !== 'all' && { 'filter[status]': activeTab }),
        ...(search && { 'filter[search]': search }),
        ...(activeBranchId ? { 'filter[branch_id]': activeBranchId } : {}),
    };

    const { data, isLoading, isError } = useQuoteRequests(filters);
    const deleteQuote = useDeleteQuoteRequest();
    const markContacted = useMarkContacted();

    const { bulkDelete, isBulkDeleting } = useBulkDelete({
        deleteFn: (id: string) => deleteQuote.mutateAsync(id),
        invalidateKeys: [QUOTE_KEYS.lists()],
        entityName: 'quote request',
        onSuccess: () => setSelectedIds([]),
    });

    const quotes = data?.data ?? [];
    const meta = data?.meta ?? null;

    const handleTabChange = useCallback((tab: QuoteRequestStatus | 'all') => {
        setActiveTab(tab);
        setPage(1);
        setSelectedIds([]);
    }, []);

    const handleSearch = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setSearch(e.target.value);
            setPage(1);
        },
        []
    );

    const handleSelectAll = useCallback(() => {
        setSelectedIds(prev =>
            prev.length === quotes.length ? [] : quotes.map(q => q.id)
        );
    }, [quotes]);

    const handleSelectOne = useCallback((id: string | number) => {
        setSelectedIds(prev =>
            prev.includes(String(id))
                ? prev.filter(x => x !== String(id))
                : [...prev, String(id)]
        );
    }, []);

    /* Columns */
    const columns: Column<QuoteRequest>[] = [
        {
            key: 'reference',
            label: 'Reference',
            render: row => (
                <Link
                    to={ROUTES.DASHBOARD.RENTALS.QUOTE_VIEW(row.id)}
                    className="fw-semibold text-primary text-decoration-none d-inline-flex align-items-center gap-1"
                >
                    {row.reference}
                    <i
                        className="feather feather-external-link"
                        style={{ fontSize: '0.75rem', opacity: 0.6 }}
                    />
                </Link>
            ),
        },
        {
            key: 'customer',
            label: 'Customer',
            render: row => (
                <div>
                    <div className="fw-semibold">{row.name}</div>
                    <small className="text-muted">{row.email}</small>
                </div>
            ),
        },
        {
            key: 'vehicle',
            label: 'Vehicle',
            render: row =>
                row.vehicle ? (
                    <div>
                        <div className="fw-semibold">{row.vehicle.name}</div>
                        <small className="text-muted">
                            {row.vehicle.license_plate}
                        </small>
                    </div>
                ) : (
                    <span className="text-muted fst-italic">Not assigned</span>
                ),
        },
        {
            key: 'dates',
            label: 'Dates',
            render: row => (
                <div>
                    {row.pickup_date ? (
                        <>
                            <div>
                                <small className="text-muted">From:</small>{' '}
                                {formatDate(row.pickup_date)}
                            </div>
                            {row.return_date && (
                                <div>
                                    <small className="text-muted">To:</small>{' '}
                                    {formatDate(row.return_date)}
                                </div>
                            )}
                        </>
                    ) : (
                        <span className="text-muted fst-italic">No dates</span>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: row => {
                const cfg = STATUS_CONFIG[row.status];
                return (
                    <Badge
                        bg={cfg.color}
                        text={cfg.color === 'light' ? 'dark' : undefined}
                    >
                        {cfg.label}
                    </Badge>
                );
            },
        },
        {
            key: 'received',
            label: 'Received',
            render: row => (
                <small className="text-muted">
                    {formatDate(row.created_at)}
                </small>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'text-end',
            render: row => {
                const isSent = row.status === 'sent';
                const isConverted = row.status === 'converted';
                const canGenerate = ['pending', 'contacted'].includes(
                    row.status
                );
                const canSend = row.status === 'quoted' || isSent;
                const canConvert = ['quoted', 'sent'].includes(row.status);
                const canContact = row.status === 'pending';

                return (
                    <Dropdown align="end">
                        <Dropdown.Toggle
                            variant=""
                            className="btn-link i-false p-0"
                        >
                            <svg width="20px" height="20px" viewBox="0 0 24 24">
                                <g
                                    stroke="none"
                                    strokeWidth="1"
                                    fill="none"
                                    fillRule="evenodd"
                                >
                                    <rect x="0" y="0" width="24" height="24" />
                                    <circle
                                        fill="#000000"
                                        cx="5"
                                        cy="12"
                                        r="2"
                                    />
                                    <circle
                                        fill="#000000"
                                        cx="12"
                                        cy="12"
                                        r="2"
                                    />
                                    <circle
                                        fill="#000000"
                                        cx="19"
                                        cy="12"
                                        r="2"
                                    />
                                </g>
                            </svg>
                        </Dropdown.Toggle>
                        <Dropdown.Menu
                            popperConfig={{ strategy: 'fixed' }}
                            renderOnMount
                        >
                            <Dropdown.Item
                                onClick={() =>
                                    navigate(
                                        ROUTES.DASHBOARD.RENTALS.QUOTE_VIEW(
                                            row.id
                                        )
                                    )
                                }
                            >
                                View Details
                            </Dropdown.Item>

                            {canContact && (
                                <Dropdown.Item
                                    onClick={() => markContacted.mutate(row.id)}
                                    disabled={markContacted.isPending}
                                >
                                    Mark Contacted
                                </Dropdown.Item>
                            )}

                            {canGenerate && (
                                <Dropdown.Item
                                    onClick={() => setGenerateTarget(row)}
                                >
                                    Generate Quote
                                </Dropdown.Item>
                            )}

                            {canSend && (
                                <Dropdown.Item
                                    onClick={() => setSendTarget(row)}
                                >
                                    {isSent ? 'Resend Quote' : 'Send Quote'}
                                </Dropdown.Item>
                            )}

                            {canConvert && (
                                <Dropdown.Item
                                    onClick={() =>
                                        navigate(
                                            ROUTES.DASHBOARD.RENTALS
                                                .NEW_BOOKING,
                                            { state: { fromQuote: row } }
                                        )
                                    }
                                >
                                    Book Now
                                </Dropdown.Item>
                            )}

                            {isConverted && row.converted_rental && (
                                <Dropdown.Item
                                    onClick={() =>
                                        navigate(
                                            ROUTES.DASHBOARD.RENTALS.VIEW(
                                                row.converted_rental!.id
                                            )
                                        )
                                    }
                                >
                                    View Rental
                                </Dropdown.Item>
                            )}

                            <Dropdown.Divider />
                            <Dropdown.Item
                                className="text-danger"
                                onClick={() => setDeleteTarget(row)}
                            >
                                Delete
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                );
            },
        },
    ];

    /* Render */
    return (
        <>
            {/* Workflow guide */}
            <Alert
                variant="info"
                className="mb-3 py-2 small border-0"
                style={{ background: 'rgba(13,110,253,0.07)' }}
            >
                <div className="d-flex align-items-start gap-2">
                    <i className="feather feather-info text-primary mt-1 flex-shrink-0" />
                    <div>
                        <strong>Quote Request Workflow:</strong>{' '}
                        <span className="text-muted">
                            <strong>1. Pending</strong> - new request arrives
                            &rarr; <strong>2. Contacted</strong> - mark when you
                            reach out &rarr; <strong>3. Generate Quote</strong>{' '}
                            - add pricing details &rarr;{' '}
                            <strong>4. Send Quote</strong> - emails confirmation
                            link to customer &rarr; <strong>5. Book Now</strong>{' '}
                            - convert to a rental once customer confirms.
                        </span>
                    </div>
                </div>
            </Alert>

            {/* Status tabs */}
            <Nav variant="tabs" className="mb-3" activeKey={activeTab}>
                {STATUS_TABS.map(tab => (
                    <Nav.Item key={tab.value}>
                        <Nav.Link
                            eventKey={tab.value}
                            onClick={() => handleTabChange(tab.value)}
                        >
                            {tab.label}
                        </Nav.Link>
                    </Nav.Item>
                ))}
            </Nav>

            <DataTable
                title="Quote Requests"
                data={quotes}
                columns={columns}
                meta={meta}
                isLoading={isLoading}
                isError={isError}
                selectedIds={selectedIds}
                onSelectAll={handleSelectAll}
                onSelectOne={handleSelectOne}
                onBulkDelete={() => bulkDelete(selectedIds)}
                isBulkDeleting={isBulkDeleting}
                deleteTarget={deleteTarget}
                deleteTargetName={deleteTarget?.reference}
                onDeleteRequest={setDeleteTarget}
                onDeleteConfirm={() => {
                    if (deleteTarget) {
                        deleteQuote.mutate(deleteTarget.id, {
                            onSuccess: () => setDeleteTarget(null),
                        });
                    }
                }}
                onDeleteCancel={() => setDeleteTarget(null)}
                isDeleting={deleteQuote.isPending}
                onPageChange={p => setPage(p)}
                emptyTitle="No quote requests"
                emptyMessage="Quote requests from the website will appear here."
                headerActions={
                    <InputGroup size="sm" style={{ width: 240 }}>
                        <Form.Control
                            placeholder="Search by name or email…"
                            value={search}
                            onChange={handleSearch}
                        />
                        {search && (
                            <Button
                                variant="outline-secondary"
                                onClick={() => setSearch('')}
                            >
                                ×
                            </Button>
                        )}
                    </InputGroup>
                }
            />

            {/* Generate Quote Modal */}
            {generateTarget && (
                <GenerateQuoteModal
                    show={!!generateTarget}
                    quote={generateTarget}
                    onHide={() => setGenerateTarget(null)}
                />
            )}

            {/* Send Quote Modal */}
            {sendTarget && (
                <SendQuoteModal
                    show={!!sendTarget}
                    quote={sendTarget}
                    onHide={() => setSendTarget(null)}
                />
            )}
        </>
    );
}
