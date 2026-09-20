import { useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Row, Col, Card, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useTitle } from '@/shared/hooks';
import {
    useQuoteRequest,
    useMarkContacted,
    useDeleteQuoteRequest,
} from '@/shared/hooks/queries/useQuotes';
import { useGeneralSettings } from '@/shared/hooks/queries/useSettings';
import { useActiveBranches } from '@/shared/hooks/queries/useBranches';
import { formatWithSymbol } from '@/shared/libs/currency';
import { quoteRequestService } from '@/services/rentalService';
import { ROUTES } from '@/shared/routes';
import { formatDate, formatDateTime } from '@/shared/libs/utils';
import type { QuoteRequestStatus } from '@/shared/types/rental.types';
import darkLogoPng from '@adminAssets/swiftflitz-dark.png';
import ConflictReviewCard from './ConflictReviewCard';
import GenerateQuoteModal from './GenerateQuoteModal';
import SendQuoteModal from './SendQuoteModal';

/* Helpers */
function quoteExpiryDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

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

/* Document styles */
const docStyle: React.CSSProperties = {
    background: '#fff',
    padding: '40px 48px',
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: '0.875rem',
    color: '#212529',
};

const sectionLabel: React.CSSProperties = {
    fontSize: '0.65rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#6c757d',
    marginBottom: 6,
};

/* Component */
export default function QuoteSummary() {
    const { quoteId } = useParams<{ quoteId: string }>();
    const navigate = useNavigate();

    const { data, isLoading, isError } = useQuoteRequest(quoteId!);
    const markContacted = useMarkContacted();
    const deleteQuote = useDeleteQuoteRequest();
    const { data: generalSettings } = useGeneralSettings();
    const globalSymbol = generalSettings?.data?.currency_symbol ?? '₵';
    const { data: branchesData } = useActiveBranches();

    const [showGenerate, setShowGenerate] = useState(false);
    const [showSend, setShowSend] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const printRef = useRef<HTMLDivElement>(null);

    const quote = data?.data;

    useTitle(quote ? `Quote ${quote.reference}` : 'Quote Details');

    const quoteBranch = (branchesData?.data ?? []).find(
        (b: { id: string }) => b.id === quote?.branch_id
    );
    const quoteCurrencySymbol = quoteBranch?.currency_symbol ?? globalSymbol;
    const fmt = (n: number) => formatWithSymbol(n, quoteCurrencySymbol);

    /* Actions */
    const handleDownloadPdf = async () => {
        if (!printRef.current || !quote) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(printRef.current, {
                scale: 2,
                useCORS: false,
                logging: false,
            });
            const contentWidthMm = 190;
            const contentHeightMm =
                contentWidthMm * (canvas.height / canvas.width);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [210, contentHeightMm + 20],
            });
            pdf.addImage(
                canvas.toDataURL('image/jpeg', 0.98),
                'JPEG',
                10,
                10,
                contentWidthMm,
                contentHeightMm
            );
            pdf.save(`quote-${quote.reference}.pdf`);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleEmailPreview = async () => {
        if (!quote || isPreviewLoading) return;
        setIsPreviewLoading(true);
        try {
            const result = await quoteRequestService.emailPreview(quote.id);
            const blob = new Blob([result.data.html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const win = window.open(url, '_blank');
            if (win) setTimeout(() => URL.revokeObjectURL(url), 10000);
        } catch {
            // silent
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const handleCopyLink = () => {
        if (!quote?.quote_token) return;
        const url = `${window.location.origin}/confirm-quote/${quote.quote_token}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleDelete = () => {
        if (!quote) return;
        if (!confirm(`Delete quote ${quote.reference}? This cannot be undone.`))
            return;
        deleteQuote.mutate(quote.id, {
            onSuccess: () => navigate(ROUTES.DASHBOARD.RENTALS.QUOTES),
        });
    };

    /* States */
    if (isLoading) {
        return <SettingsFormSkeleton cards={2} />;
    }

    if (isError || !quote) {
        return (
            <Alert variant="danger">
                Failed to load quote details.{' '}
                <Link to={ROUTES.DASHBOARD.RENTALS.QUOTES}>Back to quotes</Link>
            </Alert>
        );
    }

    const statusCfg = STATUS_CONFIG[quote.status];
    const canGenerate = ['pending', 'contacted'].includes(quote.status);
    const canSend = ['quoted', 'sent'].includes(quote.status);
    const canConvert = ['quoted', 'sent'].includes(quote.status);
    const canContact = quote.status === 'pending';

    const confirmUrl = quote.quote_token
        ? `${window.location.origin}/confirm-quote/${quote.quote_token}`
        : '';

    const pricing = quote.pricing ?? null;
    const rentalDays = pricing?.rental_days ?? quote.rental_days;

    /* Render */
    return (
        <>
            {/* Breadcrumb */}
            <div className="d-flex align-items-center gap-2 mb-3 small text-muted">
                <Link
                    to={ROUTES.DASHBOARD.RENTALS.QUOTES}
                    className="text-muted text-decoration-none"
                >
                    <i className="feather feather-file-text me-1" />
                    Quote Requests
                </Link>
                <i
                    className="feather feather-chevron-right"
                    style={{ fontSize: '0.75rem' }}
                />
                <span className="text-dark fw-semibold">{quote.reference}</span>
            </div>

            <Row className="g-3 align-items-start">
                {/* Left: Actions & Meta */}
                <Col lg={4}>
                    <div style={{ position: 'sticky', top: '1rem' }}>
                        {/* Status + actions card */}
                        <Card
                            className="mb-3 border-0 shadow-sm"
                            style={{
                                borderRadius: '0.75rem',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Colored accent strip */}
                            <div
                                style={{
                                    height: 4,
                                    background:
                                        statusCfg.color === 'light'
                                            ? '#dee2e6'
                                            : `var(--bs-${statusCfg.color})`,
                                }}
                            />
                            <Card.Body className="p-3">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <span
                                        className="text-muted small fw-semibold text-uppercase"
                                        style={{ letterSpacing: '0.06em' }}
                                    >
                                        Status
                                    </span>
                                    <Badge
                                        bg={statusCfg.color}
                                        text={
                                            statusCfg.color === 'light'
                                                ? 'dark'
                                                : undefined
                                        }
                                        className="px-2 py-1"
                                    >
                                        {statusCfg.label}
                                    </Badge>
                                </div>

                                <div className="d-grid gap-2">
                                    {canContact && (
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            disabled={markContacted.isPending}
                                            onClick={() =>
                                                markContacted.mutate(quote.id)
                                            }
                                        >
                                            {markContacted.isPending ? (
                                                <>
                                                    <Spinner
                                                        size="sm"
                                                        className="me-1"
                                                    />
                                                    Marking…
                                                </>
                                            ) : (
                                                <>
                                                    <i className="feather feather-phone me-1" />
                                                    Mark Contacted
                                                </>
                                            )}
                                        </Button>
                                    )}

                                    {canGenerate && (
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() =>
                                                setShowGenerate(true)
                                            }
                                        >
                                            <i className="feather feather-sliders me-1" />
                                            Generate Quote
                                        </Button>
                                    )}

                                    {canSend && (
                                        <Button
                                            variant="outline-info"
                                            size="sm"
                                            onClick={() => setShowSend(true)}
                                        >
                                            <i className="feather feather-send me-1" />
                                            {quote.status === 'sent'
                                                ? 'Resend Quote'
                                                : 'Send Quote'}
                                        </Button>
                                    )}

                                    {canConvert && (
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() =>
                                                navigate(
                                                    ROUTES.DASHBOARD.RENTALS
                                                        .NEW_BOOKING,
                                                    {
                                                        state: {
                                                            fromQuote: quote,
                                                        },
                                                    }
                                                )
                                            }
                                        >
                                            <i className="feather feather-check-circle me-1" />
                                            Book Now
                                        </Button>
                                    )}

                                    {quote.quote_token && (
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            disabled={isPreviewLoading}
                                            onClick={handleEmailPreview}
                                        >
                                            {isPreviewLoading ? (
                                                <>
                                                    <Spinner
                                                        size="sm"
                                                        className="me-1"
                                                    />
                                                    Loading…
                                                </>
                                            ) : (
                                                <>
                                                    <i className="feather feather-mail me-1" />
                                                    Preview Email
                                                </>
                                            )}
                                        </Button>
                                    )}

                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={handleDownloadPdf}
                                        disabled={isDownloading}
                                    >
                                        {isDownloading ? (
                                            <>
                                                <Spinner
                                                    size="sm"
                                                    className="me-1"
                                                />
                                                Generating…
                                            </>
                                        ) : (
                                            <>
                                                <i className="feather feather-download me-1" />
                                                Download PDF
                                            </>
                                        )}
                                    </Button>

                                    <hr className="my-1" />

                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={handleDelete}
                                        disabled={deleteQuote.isPending}
                                    >
                                        <i className="feather feather-trash-2 me-1" />
                                        Delete Quote
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Confirmation link */}
                        {quote.quote_token &&
                            !['converted', 'cancelled'].includes(
                                quote.status
                            ) && (
                                <Card
                                    className="mb-3 border-0 shadow-sm"
                                    style={{ borderRadius: '0.75rem' }}
                                >
                                    <Card.Body className="p-3">
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <i className="feather feather-link text-primary" />
                                            <span className="fw-semibold small">
                                                Confirmation Link
                                            </span>
                                            {quote.status === 'sent' ? (
                                                <Badge
                                                    bg="success"
                                                    className="ms-auto px-2 py-1"
                                                    style={{
                                                        fontSize: '0.65rem',
                                                    }}
                                                >
                                                    Sent
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    bg="warning"
                                                    text="dark"
                                                    className="ms-auto px-2 py-1"
                                                    style={{
                                                        fontSize: '0.65rem',
                                                    }}
                                                >
                                                    Not sent
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="input-group input-group-sm mb-2">
                                            <input
                                                type="text"
                                                className="form-control form-control-sm text-muted"
                                                value={confirmUrl}
                                                readOnly
                                                style={{
                                                    fontSize: '0.72rem',
                                                    background: '#f8f9fa',
                                                }}
                                            />
                                            <Button
                                                variant={
                                                    copied
                                                        ? 'success'
                                                        : 'outline-secondary'
                                                }
                                                size="sm"
                                                onClick={handleCopyLink}
                                                style={{ minWidth: 60 }}
                                            >
                                                {copied ? (
                                                    <>
                                                        <i className="feather feather-check me-1" />
                                                        Copied
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="feather feather-copy me-1" />
                                                        Copy
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                        {quote.token_expires_at && (
                                            <div
                                                className="text-muted"
                                                style={{ fontSize: '0.72rem' }}
                                            >
                                                <i className="feather feather-clock me-1" />
                                                Expires{' '}
                                                {formatDate(
                                                    quote.token_expires_at
                                                )}
                                            </div>
                                        )}
                                        {quote.status !== 'sent' && (
                                            <div
                                                className="text-warning mt-2"
                                                style={{ fontSize: '0.72rem' }}
                                            >
                                                <i className="feather feather-alert-circle me-1" />
                                                Use "Send Quote" to email this
                                                link to the customer.
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            )}

                        {/* Customer info */}
                        <Card
                            className="mb-3 border-0 shadow-sm"
                            style={{ borderRadius: '0.75rem' }}
                        >
                            <Card.Body className="p-3">
                                <div className="d-flex align-items-center gap-2 mb-3">
                                    <i className="feather feather-user text-primary" />
                                    <span className="fw-semibold small">
                                        Customer
                                    </span>
                                    {quote.customer_id && (
                                        <Link
                                            to={ROUTES.DASHBOARD.CUSTOMERS.VIEW(
                                                quote.customer_id
                                            )}
                                            className="ms-auto text-primary text-decoration-none d-inline-flex align-items-center gap-1"
                                            title="View customer profile"
                                            style={{ fontSize: '0.75rem' }}
                                        >
                                            <i className="feather feather-external-link" />
                                        </Link>
                                    )}
                                </div>
                                <div className="d-flex align-items-center gap-3">
                                    {/* Avatar initials */}
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 text-white fw-bold"
                                        style={{
                                            width: 40,
                                            height: 40,
                                            fontSize: '0.9rem',
                                            background:
                                                'linear-gradient(135deg,#0d6efd,#6610f2)',
                                        }}
                                    >
                                        {quote.name
                                            ?.split(' ')
                                            .map((p: string) => p[0])
                                            .slice(0, 2)
                                            .join('')
                                            .toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        {quote.customer_id ? (
                                            <Link
                                                to={ROUTES.DASHBOARD.CUSTOMERS.VIEW(
                                                    quote.customer_id
                                                )}
                                                className="fw-semibold text-truncate d-block text-decoration-none text-reset"
                                            >
                                                {quote.name}
                                            </Link>
                                        ) : (
                                            <div className="fw-semibold text-truncate">
                                                {quote.name}
                                            </div>
                                        )}
                                        <div className="text-muted small text-truncate">
                                            {quote.email}
                                        </div>
                                        {quote.phone && (
                                            <div className="text-muted small">
                                                {quote.phone}
                                            </div>
                                        )}
                                        {quote.customer_id && (
                                            <Link
                                                to={ROUTES.DASHBOARD.CUSTOMERS.VIEW(
                                                    quote.customer_id
                                                )}
                                                className="small mt-1 d-inline-flex align-items-center gap-1 text-primary text-decoration-none"
                                            >
                                                <i
                                                    className="feather feather-user-check"
                                                    style={{
                                                        fontSize: '0.7rem',
                                                    }}
                                                />
                                                View Customer Profile
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Timeline */}
                        <Card
                            className="border-0 shadow-sm"
                            style={{ borderRadius: '0.75rem' }}
                        >
                            <Card.Body className="p-3">
                                <div className="d-flex align-items-center gap-2 mb-3">
                                    <i className="feather feather-activity text-primary" />
                                    <span className="fw-semibold small">
                                        Timeline
                                    </span>
                                </div>
                                <div
                                    style={{
                                        borderLeft: '2px solid #e9ecef',
                                        paddingLeft: '1rem',
                                        marginLeft: '0.25rem',
                                    }}
                                >
                                    <TimelineRow
                                        label="Submitted"
                                        value={formatDateTime(quote.created_at)}
                                    />
                                    {quote.contacted_at && (
                                        <TimelineRow
                                            label="Contacted"
                                            value={formatDateTime(
                                                quote.contacted_at
                                            )}
                                        />
                                    )}
                                    {quote.quoted_at && (
                                        <TimelineRow
                                            label="Quoted"
                                            value={formatDateTime(
                                                quote.quoted_at
                                            )}
                                        />
                                    )}
                                    {quote.sent_at && (
                                        <TimelineRow
                                            label="Sent"
                                            value={formatDateTime(
                                                quote.sent_at
                                            )}
                                        />
                                    )}
                                    {quote.confirmed_at && (
                                        <TimelineRow
                                            label="Confirmed"
                                            value={formatDateTime(
                                                quote.confirmed_at
                                            )}
                                            active
                                        />
                                    )}
                                    {quote.token_expires_at && (
                                        <TimelineRow
                                            label="Link expires"
                                            value={formatDateTime(
                                                quote.token_expires_at
                                            )}
                                            muted
                                        />
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                </Col>

                {/* Right: Quotation Document */}
                <Col lg={8}>
                    {/* Conflict review card (pending_review quotes) */}
                    {quote.status === 'pending_review' && (
                        <ConflictReviewCard quote={quote} />
                    )}

                    {/* Converted rental notice */}
                    {quote.converted_rental && (
                        <Alert
                            variant="success"
                            className="mb-3 border-0 shadow-sm d-flex align-items-center gap-2"
                            style={{ borderRadius: '0.75rem' }}
                        >
                            <i className="feather feather-check-circle flex-shrink-0" />
                            <span>
                                This quote was converted to{' '}
                                <Link
                                    to={ROUTES.DASHBOARD.RENTALS.VIEW(
                                        quote.converted_rental.id
                                    )}
                                    className="fw-semibold"
                                >
                                    Rental {quote.converted_rental.reference}
                                </Link>
                            </span>
                        </Alert>
                    )}

                    {/* Quotation document */}
                    <Card
                        className="border-0 shadow-sm"
                        style={{ borderRadius: '0.75rem', overflow: 'hidden' }}
                    >
                        <Card.Body className="p-0">
                            <div ref={printRef} style={docStyle}>
                                {/* Document header */}
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: 24,
                                    }}
                                >
                                    <div>
                                        <img
                                            src={darkLogoPng}
                                            alt="Swiftflitz"
                                            style={{
                                                height: 36,
                                                objectFit: 'contain',
                                            }}
                                        />
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div
                                            style={{
                                                fontWeight: 900,
                                                fontSize: '1.6rem',
                                                letterSpacing: 4,
                                                color: '#0d6efd',
                                            }}
                                        >
                                            QUOTATION
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '0.8rem',
                                                color: '#6c757d',
                                                marginTop: 6,
                                                lineHeight: 1.8,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    color: '#212529',
                                                    fontWeight: 700,
                                                }}
                                            >
                                                # {quote.reference}
                                            </span>
                                            <br />
                                            Date: {formatDate(quote.created_at)}
                                            <br />
                                            Valid until:{' '}
                                            <span
                                                style={{
                                                    color: '#dc3545',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {quote.token_expires_at
                                                    ? formatDate(
                                                          quote.token_expires_at
                                                      )
                                                    : quoteExpiryDate()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <hr
                                    style={{
                                        borderColor: '#dee2e6',
                                        margin: '0 0 24px',
                                    }}
                                />

                                {/* Info grid: Customer / Vehicle / Period */}
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr 1fr',
                                        gap: 20,
                                        marginBottom: 24,
                                    }}
                                >
                                    {/* Quoted To */}
                                    <div>
                                        <div style={sectionLabel}>
                                            Quoted To
                                        </div>
                                        <div style={{ fontWeight: 700 }}>
                                            {quote.name}
                                        </div>
                                        {quote.email && (
                                            <div
                                                style={{
                                                    fontSize: '0.8rem',
                                                    color: '#495057',
                                                    marginTop: 2,
                                                }}
                                            >
                                                {quote.email}
                                            </div>
                                        )}
                                        {quote.phone && (
                                            <div
                                                style={{
                                                    fontSize: '0.8rem',
                                                    color: '#495057',
                                                }}
                                            >
                                                {quote.phone}
                                            </div>
                                        )}
                                    </div>

                                    {/* Vehicle */}
                                    <div>
                                        <div style={sectionLabel}>Vehicle</div>
                                        {quote.vehicle ? (
                                            <>
                                                <div
                                                    style={{ fontWeight: 700 }}
                                                >
                                                    {quote.vehicle.name}
                                                </div>
                                                {quote.vehicle
                                                    .license_plate && (
                                                    <div
                                                        style={{
                                                            fontSize: '0.8rem',
                                                            color: '#495057',
                                                            marginTop: 2,
                                                        }}
                                                    >
                                                        {
                                                            quote.vehicle
                                                                .license_plate
                                                        }
                                                    </div>
                                                )}
                                                {quote.vehicle.category
                                                    ?.name && (
                                                    <div
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            color: '#6c757d',
                                                        }}
                                                    >
                                                        {
                                                            quote.vehicle
                                                                .category.name
                                                        }
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div
                                                style={{
                                                    fontSize: '0.8rem',
                                                    color: '#adb5bd',
                                                }}
                                            >
                                                {quote.vehicle_preference ??
                                                    '-'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Rental Period */}
                                    <div>
                                        <div style={sectionLabel}>
                                            Rental Period
                                        </div>
                                        {quote.pickup_date ? (
                                            <>
                                                <div
                                                    style={{ fontWeight: 700 }}
                                                >
                                                    {formatDate(
                                                        quote.pickup_date
                                                    )}
                                                </div>
                                                {quote.return_date && (
                                                    <div
                                                        style={{
                                                            fontSize: '0.8rem',
                                                            color: '#495057',
                                                            marginTop: 2,
                                                        }}
                                                    >
                                                        to{' '}
                                                        {formatDate(
                                                            quote.return_date
                                                        )}
                                                    </div>
                                                )}
                                                {rentalDays != null && (
                                                    <div
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            color: '#6c757d',
                                                        }}
                                                    >
                                                        {rentalDays} day
                                                        {rentalDays !== 1
                                                            ? 's'
                                                            : ''}
                                                    </div>
                                                )}
                                            </>
                                        ) : quote.rental_days ? (
                                            <div
                                                style={{
                                                    fontSize: '0.8rem',
                                                    color: '#495057',
                                                }}
                                            >
                                                ~{quote.rental_days} day
                                                {quote.rental_days !== 1
                                                    ? 's'
                                                    : ''}
                                            </div>
                                        ) : (
                                            <div
                                                style={{
                                                    fontSize: '0.8rem',
                                                    color: '#adb5bd',
                                                }}
                                            >
                                                -
                                            </div>
                                        )}
                                        {quote.pickup_location && (
                                            <div
                                                style={{
                                                    fontSize: '0.75rem',
                                                    color: '#6c757d',
                                                    marginTop: 2,
                                                }}
                                            >
                                                Pickup:{' '}
                                                {quote.pickup_location.name}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Pricing breakdown */}
                                {pricing ? (
                                    <div style={{ marginBottom: 24 }}>
                                        <div style={sectionLabel}>
                                            Pricing Breakdown
                                        </div>
                                        <table
                                            style={{
                                                width: '100%',
                                                borderCollapse: 'collapse',
                                            }}
                                        >
                                            <tbody>
                                                {/* Line items: base, addons, location charges */}
                                                {(pricing.breakdown ?? [])
                                                    .filter(
                                                        (item: {
                                                            type: string;
                                                        }) =>
                                                            [
                                                                'base',
                                                                'addon',
                                                                'location',
                                                            ].includes(
                                                                item.type
                                                            )
                                                    )
                                                    .map(
                                                        (
                                                            item: {
                                                                label: string;
                                                                amount: number;
                                                            },
                                                            i: number
                                                        ) => (
                                                            <tr
                                                                key={i}
                                                                style={{
                                                                    borderBottom:
                                                                        '1px solid #f1f3f5',
                                                                }}
                                                            >
                                                                <td
                                                                    style={{
                                                                        padding:
                                                                            '7px 0',
                                                                        color: '#495057',
                                                                        fontSize:
                                                                            '0.85rem',
                                                                    }}
                                                                >
                                                                    {item.label}
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        padding:
                                                                            '7px 0',
                                                                        textAlign:
                                                                            'right',
                                                                        fontSize:
                                                                            '0.85rem',
                                                                    }}
                                                                >
                                                                    {fmt(
                                                                        item.amount
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        )
                                                    )}

                                                {/* Subtotal */}
                                                <tr
                                                    style={{
                                                        borderTop:
                                                            '1px solid #dee2e6',
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            padding:
                                                                '8px 0 4px',
                                                            fontWeight: 600,
                                                            fontSize: '0.85rem',
                                                        }}
                                                    >
                                                        Subtotal
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding:
                                                                '8px 0 4px',
                                                            textAlign: 'right',
                                                            fontWeight: 600,
                                                            fontSize: '0.85rem',
                                                        }}
                                                    >
                                                        {fmt(pricing.subtotal)}
                                                    </td>
                                                </tr>

                                                {/* Discount */}
                                                {pricing.total_discount_amount >
                                                    0 && (
                                                    <>
                                                        <tr>
                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '4px 0',
                                                                    color: '#198754',
                                                                    fontSize:
                                                                        '0.85rem',
                                                                }}
                                                            >
                                                                Discount
                                                            </td>
                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '4px 0',
                                                                    textAlign:
                                                                        'right',
                                                                    color: '#198754',
                                                                    fontSize:
                                                                        '0.85rem',
                                                                }}
                                                            >
                                                                −
                                                                {fmt(
                                                                    pricing.total_discount_amount
                                                                )}
                                                            </td>
                                                        </tr>
                                                        <tr
                                                            style={{
                                                                borderTop:
                                                                    '1px solid #f1f3f5',
                                                            }}
                                                        >
                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '4px 0',
                                                                    fontWeight: 600,
                                                                    fontSize:
                                                                        '0.85rem',
                                                                }}
                                                            >
                                                                After Discount
                                                            </td>
                                                            <td
                                                                style={{
                                                                    padding:
                                                                        '4px 0',
                                                                    textAlign:
                                                                        'right',
                                                                    fontWeight: 600,
                                                                    fontSize:
                                                                        '0.85rem',
                                                                }}
                                                            >
                                                                {fmt(
                                                                    pricing.discounted_subtotal
                                                                )}
                                                            </td>
                                                        </tr>
                                                    </>
                                                )}

                                                {/* VAT */}
                                                {pricing.tax_amount > 0 && (
                                                    <tr>
                                                        <td
                                                            style={{
                                                                padding:
                                                                    '4px 0',
                                                                color: '#495057',
                                                                fontSize:
                                                                    '0.85rem',
                                                            }}
                                                        >
                                                            VAT
                                                        </td>
                                                        <td
                                                            style={{
                                                                padding:
                                                                    '4px 0',
                                                                textAlign:
                                                                    'right',
                                                                fontSize:
                                                                    '0.85rem',
                                                            }}
                                                        >
                                                            {fmt(
                                                                pricing.tax_amount
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                            <tfoot>
                                                <tr
                                                    style={{
                                                        borderTop:
                                                            '2px solid #dee2e6',
                                                    }}
                                                >
                                                    <th
                                                        style={{
                                                            padding:
                                                                '10px 0 4px',
                                                            fontSize: '0.95rem',
                                                        }}
                                                    >
                                                        Total
                                                    </th>
                                                    <th
                                                        style={{
                                                            padding:
                                                                '10px 0 4px',
                                                            textAlign: 'right',
                                                            fontSize: '0.95rem',
                                                        }}
                                                    >
                                                        {fmt(
                                                            pricing.total_cost
                                                        )}
                                                    </th>
                                                </tr>
                                                {pricing.security_deposit_amount >
                                                    0 && (
                                                    <tr>
                                                        <td
                                                            style={{
                                                                padding:
                                                                    '4px 0',
                                                                color: '#6c757d',
                                                                fontSize:
                                                                    '0.8rem',
                                                            }}
                                                        >
                                                            Security Deposit{' '}
                                                            <span
                                                                style={{
                                                                    fontSize:
                                                                        '0.72rem',
                                                                }}
                                                            >
                                                                (refundable)
                                                            </span>
                                                        </td>
                                                        <td
                                                            style={{
                                                                padding:
                                                                    '4px 0',
                                                                textAlign:
                                                                    'right',
                                                                color: '#6c757d',
                                                                fontSize:
                                                                    '0.8rem',
                                                            }}
                                                        >
                                                            {fmt(
                                                                pricing.security_deposit_amount
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tfoot>
                                        </table>
                                    </div>
                                ) : !quote.vehicle_id ? (
                                    <Alert
                                        variant="warning"
                                        className="mb-4 py-2 small"
                                    >
                                        Pricing will be calculated once a
                                        vehicle is assigned.
                                    </Alert>
                                ) : null}

                                {/* Customer message */}
                                {quote.message && (
                                    <div style={{ marginBottom: 20 }}>
                                        <div style={sectionLabel}>
                                            Customer Message
                                        </div>
                                        <p
                                            style={{
                                                fontSize: '0.85rem',
                                                color: '#6c757d',
                                                margin: 0,
                                            }}
                                        >
                                            {quote.message}
                                        </p>
                                    </div>
                                )}

                                {/* Admin notes */}
                                {quote.admin_notes && (
                                    <div
                                        style={{
                                            marginBottom: 20,
                                            padding: '10px 14px',
                                            borderLeft: '3px solid #ffc107',
                                            background: 'rgba(255,193,7,0.08)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                ...sectionLabel,
                                                marginBottom: 4,
                                            }}
                                        >
                                            Admin Notes
                                        </div>
                                        <p
                                            style={{
                                                fontSize: '0.85rem',
                                                margin: 0,
                                            }}
                                        >
                                            {quote.admin_notes}
                                        </p>
                                    </div>
                                )}

                                {/* Footer */}
                                <div
                                    style={{
                                        marginTop: 28,
                                        paddingTop: 16,
                                        borderTop: '1px solid #dee2e6',
                                        textAlign: 'center',
                                        fontSize: '0.78rem',
                                        color: '#adb5bd',
                                    }}
                                >
                                    This is a quotation, not a confirmed
                                    booking. Prices are subject to change.
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Modals */}
            {showGenerate && (
                <GenerateQuoteModal
                    show={showGenerate}
                    quote={quote}
                    onHide={() => setShowGenerate(false)}
                />
            )}
            {showSend && (
                <SendQuoteModal
                    show={showSend}
                    quote={quote}
                    onHide={() => setShowSend(false)}
                />
            )}
        </>
    );
}

/* Helper */
function TimelineRow({
    label,
    value,
    muted = false,
    active = false,
}: {
    label: string;
    value: string;
    muted?: boolean;
    active?: boolean;
}) {
    return (
        <div
            className="d-flex justify-content-between align-items-start mb-2 position-relative"
            style={{ fontSize: '0.8rem' }}
        >
            {/* Dot */}
            <span
                className="position-absolute"
                style={{
                    left: '-1.35rem',
                    top: '0.2rem',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: active
                        ? '#198754'
                        : muted
                          ? '#ced4da'
                          : '#0d6efd',
                    border: '2px solid #fff',
                    boxShadow:
                        '0 0 0 1px ' +
                        (active ? '#198754' : muted ? '#ced4da' : '#0d6efd'),
                }}
            />
            <span
                className={
                    muted
                        ? 'text-muted'
                        : active
                          ? 'fw-semibold text-success'
                          : ''
                }
            >
                {label}
            </span>
            <span className="text-muted ms-2 text-end">{value}</span>
        </div>
    );
}
