// InvoiceReceipt.tsx - Phase 1: INVOICE (booking) + RECEIPT (paid in full)
import React, { useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Spinner, Alert } from 'react-bootstrap';
import { DetailPageSkeleton } from '@adminComponents/skeletons/DetailPageSkeleton';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useRental, useSendInvoice } from '@/shared/hooks/queries/useRentals';
import {
    useGeneralSettings,
    useEarlyReturnSettings,
} from '@/shared/hooks/queries/useSettings';
import { useConfirm } from '@/shared/hooks/useConfirm';
import { formatWithSymbol } from '@/shared/libs/currency';
import { formatCurrency } from '@/shared/libs/utils';
import { ROUTES } from '@/shared/routes';
import { FaEnvelope } from 'react-icons/fa6';

// Fetch a URL and convert it to a base64 data URI.
// This lets html2canvas draw the image without CORS restrictions.
async function urlToDataUri(url: string): Promise<string | null> {
    try {
        const r = await fetch(url);
        if (!r.ok) return null;
        const blob = await r.blob();
        return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

/* Helpers */
function fmtDate(val: string | null | undefined): string {
    if (!val) return '-';
    const d = val.length === 10 ? new Date(val + 'T00:00:00') : new Date(val);
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

/* Shared styles */
const tdBase: React.CSSProperties = {
    padding: '9px 0',
    fontSize: '0.875rem',
    verticalAlign: 'top',
};

const sectionLabel: React.CSSProperties = {
    fontSize: '0.68rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.09em',
    color: '#6c757d',
    marginBottom: 6,
};

/* Component */
export default function InvoiceReceipt() {
    const { id } = useParams<{ id: string }>();
    const documentRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const { data: rentalResponse, isLoading, isError } = useRental(id!);
    const { data: settingsResponse } = useGeneralSettings();
    const { data: earlyReturnSettingsRes } = useEarlyReturnSettings();
    const { mutate: sendInvoice, isPending: isSending } = useSendInvoice();
    const { confirm } = useConfirm();
    const refundPolicyEnabled =
        earlyReturnSettingsRes?.data?.early_return_refund_enabled ?? true;
    const rental = rentalResponse?.data ?? null;
    const settings = settingsResponse?.data ?? null;

    if (isLoading) {
        return <DetailPageSkeleton cards={2} />;
    }

    if (isError || !rental) {
        return <Alert variant="danger">Rental not found.</Alert>;
    }

    /* Document type */
    const amountDue = Math.max(0, Number(rental.amount_due ?? 0));
    const isPaid = rental.payment_status === 'paid' && amountDue === 0;
    const isCancelled = rental.status === 'cancelled';
    const isEarlyReturn = rental.is_early_return;

    const cancellationAmountOwed = Number(rental.cancellation_amount_owed ?? 0);
    const cancellationDebtPaid = Number(rental.cancellation_debt_paid ?? 0);
    const refundAmount = Number(rental.refund_amount ?? 0);
    const cancellationRefundAmount = isCancelled ? refundAmount : 0;
    const isCancellationDebt =
        isCancelled &&
        cancellationAmountOwed > 0 &&
        !rental.cancellation_debt_waived;
    const isCancellationDebtSettled =
        isCancelled && cancellationDebtPaid > 0 && !isCancellationDebt;
    const isCancellationRefundSettled =
        isCancelled &&
        cancellationRefundAmount > 0 &&
        rental.refund_status === 'approved';
    const isCancellationRefundPending =
        isCancelled &&
        cancellationRefundAmount > 0 &&
        rental.refund_status === 'pending';

    // Early return doc states (non-cancelled)
    const isEarlyReturnRefundPending =
        !isCancelled &&
        isEarlyReturn &&
        refundAmount > 0 &&
        rental.refund_status === 'pending';
    const isEarlyReturnRefundSettled =
        !isCancelled &&
        isEarlyReturn &&
        refundAmount > 0 &&
        rental.refund_status === 'approved';
    const isEarlyReturnAmountDue =
        !isCancelled && isEarlyReturn && amountDue > 0;

    let docTitle: string;
    let docColor: string;
    if (isCancelled) {
        if (isCancellationDebt) {
            docTitle = 'CANCELLATION INVOICE';
            docColor = '#dc3545';
        } else if (isCancellationDebtSettled) {
            docTitle = 'CANCELLATION RECEIPT';
            docColor = '#198754';
        } else if (isCancellationRefundSettled) {
            docTitle = 'REFUND RECEIPT';
            docColor = '#198754';
        } else if (isCancellationRefundPending) {
            docTitle = 'CREDIT NOTE';
            docColor = '#fd7e14';
        } else {
            docTitle = 'CANCELLATION NOTICE';
            docColor = '#6c757d';
        }
    } else if (isEarlyReturnRefundPending) {
        docTitle = 'CREDIT NOTE';
        docColor = '#fd7e14';
    } else if (isEarlyReturnRefundSettled) {
        docTitle = 'REFUND RECEIPT';
        docColor = '#198754';
    } else if (isEarlyReturnAmountDue) {
        docTitle = 'INVOICE';
        docColor = '#0074ff';
    } else {
        docTitle = isPaid ? 'RECEIPT' : 'INVOICE';
        docColor = isPaid ? '#198754' : '#0074ff';
    }
    const isReceipt =
        isPaid ||
        isCancellationDebtSettled ||
        isCancellationRefundSettled ||
        isEarlyReturnRefundSettled;

    /* Per-rental currency formatter */
    const fmtR = (n: number) =>
        rental.currency_symbol
            ? formatWithSymbol(n, rental.currency_symbol)
            : formatCurrency(n);

    /* Charge breakdown */
    const charges = Array.isArray(rental.applied_charges_breakdown)
        ? rental.applied_charges_breakdown
        : [];
    // Split breakdown into typed groups - base/tax/location/discount/deposit each have dedicated rows
    const addonLines = charges.filter(c => c.type === 'addon');
    const locationLines = charges.filter(c => c.type === 'location');

    // Use the stored base line (original days only) when rental has been extended
    const breakdownBaseLine = charges.find(c => c.type === 'base');
    const baseDisplayAmount = breakdownBaseLine
        ? Number(breakdownBaseLine.amount)
        : rental.base_cost;
    const originalRentalDays = rental.extension_days
        ? rental.rental_days - rental.extension_days
        : null;
    const effectiveDailyRate =
        breakdownBaseLine && (originalRentalDays ?? rental.rental_days) > 0
            ? Number(breakdownBaseLine.amount) /
              (originalRentalDays ?? rental.rental_days)
            : rental.daily_rate;

    const totalDiscount = Number(rental.total_discount_amount ?? 0);
    const vatAmount = Number(rental.vat_amount ?? 0);
    const overdueFee = Number(rental.overdue_fee ?? 0);
    const latePickupFee = Number(rental.late_pickup_fee ?? 0);
    const earlyReturnRefund = Number(rental.early_return_refund ?? 0);
    const earlyReturnCharge = Number(rental.early_return_charge ?? 0);
    const securityDeposit = Number(rental.security_deposit_amount ?? 0);
    const depositPaid = Number(rental.deposit_paid ?? 0);
    const depositApplied = Number(rental.deposit_applied_to_balance ?? 0);
    const amountPaid = Number(rental.amount_paid ?? 0);
    const grandTotal =
        rental.total_cost +
        overdueFee +
        latePickupFee +
        earlyReturnCharge -
        earlyReturnRefund;
    const isDepositPending =
        securityDeposit > 0 &&
        rental.security_deposit_status === 'pending' &&
        !rental.skip_security_deposit &&
        !rental.deposit_waived;

    /* Rental period */
    const effectivePickupDateStr = rental.actual_pickup_date
        ? rental.actual_pickup_date.slice(0, 10)
        : (rental.pickup_date ?? null);

    // For early returns use actual return date and actual days
    const effectiveReturnDateStr =
        isEarlyReturn && rental.actual_return_date
            ? rental.actual_return_date.slice(0, 10)
            : (rental.return_date ?? null);

    const rentalDays =
        isEarlyReturn && rental.actual_rental_days != null
            ? rental.actual_rental_days
            : effectivePickupDateStr && effectiveReturnDateStr
              ? Math.max(
                    1,
                    Math.round(
                        (new Date(
                            effectiveReturnDateStr + 'T00:00:00'
                        ).getTime() -
                            new Date(
                                effectivePickupDateStr + 'T00:00:00'
                            ).getTime()) /
                            86_400_000
                    )
                )
              : (rental.rental_days ?? null);

    /* Company info */
    const companyName = settings?.site_name ?? 'Swiftflitz Car Rental';
    const companyAddress = settings?.site_address ?? null;
    const companyEmail = settings?.site_email ?? null;
    const companyPhone = settings?.site_phone ?? null;
    const companyLogo = settings?.site_image_url ?? null;

    /* PDF download */
    const handleDownload = async () => {
        if (!documentRef.current || isDownloading) return;
        setIsDownloading(true);
        try {
            const el = documentRef.current;

            // The logo is cross-origin (backend.swiftflitz.test vs swiftflitz.test),
            // so we can't fetch site_image_url directly. Instead we fetch through
            // the API proxy (/api/v1/settings/logo) which has CORS enabled for all
            // origins. We swap the img src to the resulting data URI before
            // html2canvas runs, then restore it after capture.
            const logoImg =
                el.querySelector<HTMLImageElement>('[data-logo="1"]');
            let originalSrc: string | null = null;
            if (logoImg && companyLogo) {
                const proxyUrl = `${import.meta.env.VITE_API_BASE_URL}/settings/logo`;
                const dataUri = await urlToDataUri(proxyUrl);
                if (dataUri) {
                    originalSrc = logoImg.src;
                    logoImg.src = dataUri;
                    await new Promise<void>(resolve => {
                        if (logoImg.complete) {
                            resolve();
                            return;
                        }
                        logoImg.onload = () => resolve();
                        logoImg.onerror = () => resolve();
                    });
                }
            }

            // useCORS: false - avoids adding crossOrigin="anonymous" which
            // triggers CORS pre-flights on same-origin storage images.
            const canvas = await html2canvas(el, {
                scale: 2,
                useCORS: false,
                logging: false,
            });

            if (logoImg && originalSrc !== null) logoImg.src = originalSrc;

            const marginMm = 10,
                pageWidthMm = 210,
                contentWidthMm = 190;
            const contentHeightMm =
                contentWidthMm * (canvas.height / canvas.width);
            /* jsPDF swaps [w, h] to [h, w] when h < w (portrait enforcement).
               Ensure page height is always >= width so no swap occurs. */
            const pageHeightMm = Math.max(contentHeightMm + marginMm * 2, pageWidthMm + 1);
            const pdf = new jsPDF({
                unit: 'mm',
                format: [pageWidthMm, pageHeightMm],
            });
            pdf.addImage(
                canvas.toDataURL('image/jpeg', 0.98),
                'JPEG',
                marginMm,
                marginMm,
                contentWidthMm,
                contentHeightMm
            );
            pdf.save(`${docTitle.toLowerCase()}-${rental.reference}.pdf`);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="pb-4">
            {/* Page header (outside printable area) */}
            <div className="page-titles mb-4 d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div>
                    <h4 className="mb-0">
                        {isCancelled
                            ? isCancellationDebt
                                ? 'Cancellation Invoice'
                                : isCancellationDebtSettled
                                  ? 'Cancellation Receipt'
                                  : isCancellationRefundSettled
                                    ? 'Refund Receipt'
                                    : isCancellationRefundPending
                                      ? 'Credit Note'
                                      : 'Cancellation Notice'
                            : isEarlyReturnRefundPending
                              ? 'Credit Note'
                              : isEarlyReturnRefundSettled
                                ? 'Refund Receipt'
                                : isReceipt
                                  ? 'Receipt'
                                  : 'Invoice'}{' '}
                        - {rental.reference}
                    </h4>
                    <small className="text-muted">
                        {isCancelled
                            ? isCancellationDebt
                                ? 'Amount owed after cancellation'
                                : isCancellationDebtSettled
                                  ? 'Cancellation payment received'
                                  : isCancellationRefundSettled
                                    ? 'Refund issued'
                                    : isCancellationRefundPending
                                      ? 'Refund pending'
                                      : 'Cancelled - no charges'
                            : isEarlyReturnRefundPending
                              ? 'Early return - refund pending'
                              : isEarlyReturnRefundSettled
                                ? 'Early return - refund issued'
                                : isEarlyReturnAmountDue
                                  ? 'Early return - balance due'
                                  : isPaid
                                    ? 'Paid in full'
                                    : 'Payment pending'}
                    </small>
                </div>
                <div className="d-flex gap-2 align-items-center">
                    <Link
                        to={ROUTES.DASHBOARD.RENTALS.VIEW(rental.id)}
                        className="btn btn-light btn-sm"
                    >
                        ← Back to Rental
                    </Link>
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        disabled={isSending || !rental.customer?.email}
                        title={
                            !rental.customer?.email
                                ? 'Customer has no email address'
                                : 'Send invoice/receipt by email'
                        }
                        onClick={async () => {
                            const docType =
                                rental.payment_status === 'paid'
                                    ? 'Receipt'
                                    : 'Invoice';
                            const confirmed = await confirm({
                                title: `Send ${docType} to Customer`,
                                message: `Send ${docType.toLowerCase()} for rental ${rental.reference} to ${rental.customer?.email}?`,
                                confirmText: 'Send',
                                confirmVariant: 'primary',
                            });
                            if (confirmed) {
                                sendInvoice({ id: rental.id });
                            }
                        }}
                    >
                        {isSending ? (
                            <>
                                <Spinner
                                    animation="border"
                                    size="sm"
                                    className="me-1"
                                />
                                Sending...
                            </>
                        ) : (
                            <>
                                <FaEnvelope className="me-1" /> Send to Customer
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleDownload}
                        disabled={isDownloading}
                    >
                        {isDownloading ? (
                            <>
                                <Spinner
                                    animation="border"
                                    size="sm"
                                    className="me-1"
                                />
                                Generating PDF…
                            </>
                        ) : (
                            '↓ Download PDF'
                        )}
                    </button>
                </div>
            </div>

            {/* Document (captured for PDF) */}
            <div
                ref={documentRef}
                style={{
                    maxWidth: 820,
                    margin: '0 auto',
                    background: '#fff',
                    padding: '44px 52px',
                    position: 'relative',
                    borderRadius: 4,
                    boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                }}
            >
                {/* Watermark */}
                {(isPaid ||
                    isCancellationDebtSettled ||
                    isCancellationRefundSettled ||
                    isEarlyReturnRefundSettled ||
                    isEarlyReturnRefundPending ||
                    isCancelled) && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 90,
                            right: 52,
                            transform: 'rotate(-22deg)',
                            border: `5px solid ${docColor}`,
                            borderRadius: 6,
                            padding: '5px 20px',
                            color: docColor,
                            fontWeight: 900,
                            fontSize: '2.2rem',
                            opacity: 0.12,
                            letterSpacing: 8,
                            pointerEvents: 'none',
                            userSelect: 'none',
                        }}
                    >
                        {isCancellationRefundSettled ||
                        isEarlyReturnRefundSettled
                            ? 'REFUNDED'
                            : isCancellationDebt
                              ? 'OVERDUE'
                              : isCancellationDebtSettled
                                ? 'PAID'
                                : isCancellationRefundPending ||
                                    isEarlyReturnRefundPending
                                  ? 'PENDING'
                                  : isCancelled
                                    ? 'CANCELLED'
                                    : 'PAID'}
                    </div>
                )}

                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 28,
                    }}
                >
                    {/* Company */}
                    <div>
                        {companyLogo ? (
                            <img
                                data-logo="1"
                                src={companyLogo}
                                alt={companyName}
                                style={{
                                    height: 38,
                                    width: 'auto',
                                    display: 'block',
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    fontSize: '1.1rem',
                                    fontWeight: 800,
                                    color: '#212529',
                                }}
                            >
                                {companyName}
                            </div>
                        )}
                        <div
                            style={{
                                fontSize: '0.75rem',
                                color: '#6c757d',
                                marginTop: 10,
                                lineHeight: 1.7,
                            }}
                        >
                            {companyAddress && (
                                <>
                                    {companyAddress}
                                    <br />
                                </>
                            )}
                            {companyEmail && (
                                <>
                                    {companyEmail}
                                    <br />
                                </>
                            )}
                            {companyPhone && <>{companyPhone}</>}
                        </div>
                    </div>

                    {/* Document title + meta */}
                    <div style={{ textAlign: 'right' }}>
                        <div
                            style={{
                                fontWeight: 900,
                                fontSize: '1.8rem',
                                letterSpacing: 4,
                                color: docColor,
                            }}
                        >
                            {docTitle}
                        </div>
                        <div
                            style={{
                                fontSize: '0.8rem',
                                color: '#6c757d',
                                marginTop: 8,
                                lineHeight: 1.9,
                            }}
                        >
                            <span style={{ color: '#212529', fontWeight: 700 }}>
                                # {rental.reference}
                            </span>
                            <br />
                            Date: {fmtDate(rental.created_at)}
                            <br />
                            {isCancelled ? (
                                <>Cancelled: {fmtDate(rental.cancelled_at)}</>
                            ) : isEarlyReturnRefundSettled ? (
                                <>Refunded: {fmtDate(rental.updated_at)}</>
                            ) : isEarlyReturnRefundPending ? (
                                <>
                                    Returned:{' '}
                                    {fmtDate(rental.actual_return_date)}
                                </>
                            ) : isReceipt ? (
                                <>Paid: {fmtDate(rental.updated_at)}</>
                            ) : (
                                <>Due by: {fmtDate(rental.return_date)}</>
                            )}
                        </div>
                    </div>
                </div>

                <hr style={{ borderColor: '#dee2e6', margin: '0 0 28px' }} />

                {/* Billed To / Vehicle / Period */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: 24,
                        marginBottom: 24,
                    }}
                >
                    {/* Customer */}
                    <div>
                        <div style={sectionLabel}>Billed To</div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                            {rental.customer?.name ?? '-'}
                        </div>
                        {rental.customer?.phone && (
                            <div
                                style={{
                                    fontSize: '0.8rem',
                                    color: '#495057',
                                    marginTop: 3,
                                }}
                            >
                                {rental.customer.phone}
                            </div>
                        )}
                        {rental.customer?.email && (
                            <div
                                style={{
                                    fontSize: '0.75rem',
                                    color: '#6c757d',
                                }}
                            >
                                {rental.customer.email}
                            </div>
                        )}
                    </div>

                    {/* Vehicle */}
                    <div>
                        <div style={sectionLabel}>Vehicle</div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                            {rental.vehicle?.name ?? '-'}
                        </div>
                        {rental.vehicle?.license_plate && (
                            <div
                                style={{
                                    fontSize: '0.8rem',
                                    color: '#495057',
                                    marginTop: 3,
                                }}
                            >
                                {rental.vehicle.license_plate}
                            </div>
                        )}
                        {rental.vehicle?.category && (
                            <div
                                style={{
                                    fontSize: '0.75rem',
                                    color: '#6c757d',
                                }}
                            >
                                {
                                    (
                                        rental.vehicle.category as {
                                            name: string;
                                        }
                                    ).name
                                }
                            </div>
                        )}
                    </div>

                    {/* Rental period */}
                    <div>
                        <div style={sectionLabel}>Rental Period</div>
                        <div
                            style={{
                                fontSize: '0.8rem',
                                lineHeight: 1.9,
                                color: '#212529',
                            }}
                        >
                            <span style={{ color: '#6c757d' }}>Pickup:</span>{' '}
                            <strong>
                                {fmtDate(
                                    rental.actual_pickup_date ??
                                        rental.pickup_date
                                )}{' '}
                                · {rental.pickup_time}
                            </strong>
                            {rental.actual_pickup_date &&
                                rental.actual_pickup_date.slice(0, 10) !==
                                    rental.pickup_date && (
                                    <span
                                        style={{
                                            fontSize: '0.72rem',
                                            color: '#6c757d',
                                            marginLeft: 6,
                                        }}
                                    >
                                        (Booked: {fmtDate(rental.pickup_date)})
                                    </span>
                                )}
                            <br />
                            {isEarlyReturn ? (
                                <>
                                    <span style={{ color: '#6c757d' }}>
                                        Scheduled Return:
                                    </span>{' '}
                                    <strong>
                                        {fmtDate(rental.return_date)}
                                    </strong>
                                    <br />
                                    <span style={{ color: '#6c757d' }}>
                                        Actual Return:
                                    </span>{' '}
                                    <strong style={{ color: '#fd7e14' }}>
                                        {fmtDate(rental.actual_return_date)} ·{' '}
                                        {rental.return_time}
                                    </strong>
                                    <span
                                        style={{
                                            marginLeft: 6,
                                            fontSize: '0.72rem',
                                            color: '#fd7e14',
                                            fontWeight: 600,
                                        }}
                                    >
                                        (early)
                                    </span>
                                </>
                            ) : (
                                <>
                                    {rental.original_return_date && (
                                        <>
                                            <span style={{ color: '#6c757d' }}>
                                                Originally Due:
                                            </span>{' '}
                                            <strong>
                                                {fmtDate(
                                                    rental.original_return_date
                                                )}
                                            </strong>
                                            <br />
                                        </>
                                    )}
                                    <span style={{ color: '#6c757d' }}>
                                        {rental.original_return_date
                                            ? 'Extended To:'
                                            : 'Return:'}
                                    </span>{' '}
                                    <strong>
                                        {fmtDate(rental.return_date)} ·{' '}
                                        {rental.return_time}
                                    </strong>
                                    {rental.extension_days ? (
                                        <span
                                            style={{
                                                marginLeft: 6,
                                                fontSize: '0.72rem',
                                                color: '#0074ff',
                                                fontWeight: 600,
                                            }}
                                        >
                                            (+{rental.extension_days} day
                                            {rental.extension_days !== 1
                                                ? 's'
                                                : ''}{' '}
                                            extended)
                                        </span>
                                    ) : null}
                                </>
                            )}
                            {rentalDays !== null && (
                                <>
                                    <br />
                                    <span style={{ color: '#6c757d' }}>
                                        Duration:
                                    </span>{' '}
                                    <strong>
                                        {rentalDays} day
                                        {rentalDays !== 1 ? 's' : ''}
                                        {isEarlyReturn &&
                                            rental.rental_days &&
                                            rental.rental_days !==
                                                rentalDays && (
                                                <span
                                                    style={{
                                                        marginLeft: 6,
                                                        fontSize: '0.72rem',
                                                        color: '#6c757d',
                                                        fontWeight: 400,
                                                    }}
                                                >
                                                    (of {rental.rental_days}d
                                                    booked)
                                                </span>
                                            )}
                                    </strong>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Locations */}
                {(rental.pickup_location || rental.dropoff_location) && (
                    <div
                        style={{
                            fontSize: '0.8rem',
                            color: '#495057',
                            marginBottom: 24,
                            display: 'flex',
                            gap: 32,
                            flexWrap: 'wrap',
                        }}
                    >
                        {rental.pickup_location && (
                            <span>
                                <span style={{ color: '#6c757d' }}>
                                    Pickup location:
                                </span>{' '}
                                <strong>{rental.pickup_location}</strong>
                            </span>
                        )}
                        {rental.dropoff_location && (
                            <span>
                                <span style={{ color: '#6c757d' }}>
                                    Drop-off:
                                </span>{' '}
                                <strong>{rental.dropoff_location}</strong>
                            </span>
                        )}
                    </div>
                )}

                {/* Line Items */}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr
                            style={{
                                borderBottom: '2px solid #212529',
                                borderTop: '1px solid #dee2e6',
                            }}
                        >
                            <th
                                style={{
                                    ...tdBase,
                                    fontWeight: 700,
                                    fontSize: '0.72rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.09em',
                                    color: '#6c757d',
                                    textAlign: 'left',
                                }}
                            >
                                Description
                            </th>
                            <th
                                style={{
                                    ...tdBase,
                                    fontWeight: 700,
                                    fontSize: '0.72rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.09em',
                                    color: '#6c757d',
                                    textAlign: 'right',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                Amount
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {isCancelled ? (
                            /* Cancellation line items */
                            <>
                                {/* Days used cost (after-pickup cancellations) */}
                                {Number(rental.days_used_cost ?? 0) > 0 && (
                                    <tr
                                        style={{
                                            borderBottom: '1px solid #f2f2f2',
                                        }}
                                    >
                                        <td style={tdBase}>
                                            Vehicle rental (days used)
                                        </td>
                                        <td
                                            style={{
                                                ...tdBase,
                                                textAlign: 'right',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {fmtR(
                                                Number(rental.days_used_cost)
                                            )}
                                        </td>
                                    </tr>
                                )}

                                {/* Addon charges */}
                                {addonLines.map((charge, idx) => (
                                    <tr
                                        key={idx}
                                        style={{
                                            borderBottom: '1px solid #f2f2f2',
                                        }}
                                    >
                                        <td
                                            style={{
                                                ...tdBase,
                                                color: '#495057',
                                            }}
                                        >
                                            {charge.label}
                                        </td>
                                        <td
                                            style={{
                                                ...tdBase,
                                                textAlign: 'right',
                                                whiteSpace: 'nowrap',
                                                color: '#495057',
                                            }}
                                        >
                                            {fmtR(charge.amount)}
                                        </td>
                                    </tr>
                                ))}

                                {/* Cancellation fee */}
                                {Number(rental.cancellation_fee ?? 0) > 0 && (
                                    <tr
                                        style={{
                                            borderBottom: '1px solid #f2f2f2',
                                        }}
                                    >
                                        <td
                                            style={{
                                                ...tdBase,
                                                color: '#dc3545',
                                            }}
                                        >
                                            Cancellation fee
                                        </td>
                                        <td
                                            style={{
                                                ...tdBase,
                                                textAlign: 'right',
                                                whiteSpace: 'nowrap',
                                                color: '#dc3545',
                                            }}
                                        >
                                            {fmtR(
                                                Number(rental.cancellation_fee)
                                            )}
                                        </td>
                                    </tr>
                                )}

                                {/* Amount incurred total */}
                                {(() => {
                                    const incurred =
                                        Number(rental.days_used_cost ?? 0) +
                                        Number(rental.extras_cost ?? 0) +
                                        Number(rental.cancellation_fee ?? 0);
                                    return (
                                        <>
                                            <tr>
                                                <td
                                                    colSpan={2}
                                                    style={{ padding: 0 }}
                                                >
                                                    <hr
                                                        style={{
                                                            margin: '4px 0',
                                                            borderColor:
                                                                '#212529',
                                                        }}
                                                    />
                                                </td>
                                            </tr>
                                            <tr
                                                style={{
                                                    borderBottom:
                                                        '2px solid #dee2e6',
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        ...tdBase,
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    Amount Incurred
                                                </td>
                                                <td
                                                    style={{
                                                        ...tdBase,
                                                        textAlign: 'right',
                                                        fontWeight: 700,
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {fmtR(incurred)}
                                                </td>
                                            </tr>
                                        </>
                                    );
                                })()}

                                {/* Payment summary separator */}
                                <tr>
                                    <td colSpan={2} style={{ padding: 0 }}>
                                        <hr
                                            style={{
                                                margin: '4px 0',
                                                borderColor: '#dee2e6',
                                            }}
                                        />
                                    </td>
                                </tr>

                                {/* Original amount paid */}
                                <tr
                                    style={{
                                        borderBottom: '1px solid #f2f2f2',
                                    }}
                                >
                                    <td style={{ ...tdBase, color: '#495057' }}>
                                        Original amount paid
                                    </td>
                                    <td
                                        style={{
                                            ...tdBase,
                                            textAlign: 'right',
                                            whiteSpace: 'nowrap',
                                            color: '#495057',
                                        }}
                                    >
                                        {fmtR(amountPaid)}
                                    </td>
                                </tr>

                                {/* Deposit deducted */}
                                {Number(
                                    rental.cancellation_deposit_deduction ?? 0
                                ) > 0 && (
                                    <tr
                                        style={{
                                            borderBottom: '1px solid #f2f2f2',
                                        }}
                                    >
                                        <td
                                            style={{
                                                ...tdBase,
                                                color: '#6c757d',
                                            }}
                                        >
                                            Deposit deducted
                                        </td>
                                        <td
                                            style={{
                                                ...tdBase,
                                                textAlign: 'right',
                                                whiteSpace: 'nowrap',
                                                color: '#6c757d',
                                            }}
                                        >
                                            −
                                            {fmtR(
                                                Number(
                                                    rental.cancellation_deposit_deduction
                                                )
                                            )}
                                        </td>
                                    </tr>
                                )}

                                {/* Refund amount (credit note / refund receipt) */}
                                {cancellationRefundAmount > 0 && (
                                    <tr>
                                        <td
                                            style={{
                                                ...tdBase,
                                                fontWeight: 700,
                                                color: '#198754',
                                            }}
                                        >
                                            {isCancellationRefundSettled
                                                ? 'Refund issued'
                                                : 'Refund amount'}
                                        </td>
                                        <td
                                            style={{
                                                ...tdBase,
                                                textAlign: 'right',
                                                fontWeight: 700,
                                                whiteSpace: 'nowrap',
                                                color: '#198754',
                                            }}
                                        >
                                            {fmtR(cancellationRefundAmount)}
                                        </td>
                                    </tr>
                                )}

                                {/* Amount owed (cancellation invoice - debt still outstanding) */}
                                {cancellationAmountOwed > 0 &&
                                    !rental.cancellation_debt_waived && (
                                        <tr>
                                            <td
                                                style={{
                                                    ...tdBase,
                                                    fontWeight: 700,
                                                    color: '#dc3545',
                                                }}
                                            >
                                                Amount owed
                                            </td>
                                            <td
                                                style={{
                                                    ...tdBase,
                                                    textAlign: 'right',
                                                    fontWeight: 700,
                                                    whiteSpace: 'nowrap',
                                                    color: '#dc3545',
                                                }}
                                            >
                                                {fmtR(cancellationAmountOwed)}
                                            </td>
                                        </tr>
                                    )}

                                {/* Payment received (cancellation receipt - debt was collected) */}
                                {isCancellationDebtSettled && (
                                    <>
                                        <tr
                                            style={{
                                                borderBottom:
                                                    '1px solid #f2f2f2',
                                            }}
                                        >
                                            <td
                                                style={{
                                                    ...tdBase,
                                                    color: '#dc3545',
                                                }}
                                            >
                                                Balance owed at cancellation
                                            </td>
                                            <td
                                                style={{
                                                    ...tdBase,
                                                    textAlign: 'right',
                                                    whiteSpace: 'nowrap',
                                                    color: '#dc3545',
                                                }}
                                            >
                                                {fmtR(cancellationDebtPaid)}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td
                                                style={{
                                                    ...tdBase,
                                                    fontWeight: 700,
                                                    color: '#198754',
                                                }}
                                            >
                                                Payment received
                                            </td>
                                            <td
                                                style={{
                                                    ...tdBase,
                                                    textAlign: 'right',
                                                    fontWeight: 700,
                                                    whiteSpace: 'nowrap',
                                                    color: '#198754',
                                                }}
                                            >
                                                {fmtR(cancellationDebtPaid)}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td
                                                style={{
                                                    ...tdBase,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                Balance due
                                            </td>
                                            <td
                                                style={{
                                                    ...tdBase,
                                                    textAlign: 'right',
                                                    fontWeight: 700,
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {fmtR(0)}
                                            </td>
                                        </tr>
                                    </>
                                )}
                            </>
                        ) : (
                            /* Normal rental line items */
                            (() => {
                                const hasPostTotalFees =
                                    overdueFee > 0 || latePickupFee > 0;

                                /* Early return path */
                                if (isEarlyReturn) {
                                    const actualDays =
                                        rental.actual_rental_days ??
                                        rental.rental_days;
                                    const bookedDays = rental.rental_days;
                                    const dayRatio =
                                        bookedDays > 0
                                            ? actualDays / bookedDays
                                            : 1;

                                    const baseForActualDays =
                                        Math.round(
                                            actualDays * rental.daily_rate * 100
                                        ) / 100;

                                    // Per-day addons prorated to actual days; flat addons unchanged
                                    const displayAddonLines = addonLines.map(
                                        addon => {
                                            if (addon.is_per_day) {
                                                const unitRate = Number(
                                                    addon.unit_rate ?? 0
                                                );
                                                const qty = Number(
                                                    addon.quantity ?? 1
                                                );
                                                return {
                                                    ...addon,
                                                    amount:
                                                        Math.round(
                                                            unitRate *
                                                                qty *
                                                                actualDays *
                                                                100
                                                        ) / 100,
                                                };
                                            }
                                            return addon;
                                        }
                                    );

                                    const subtotalForActualDays =
                                        Math.round(
                                            (baseForActualDays +
                                                displayAddonLines.reduce(
                                                    (s, a) =>
                                                        s + Number(a.amount),
                                                    0
                                                ) +
                                                locationLines.reduce(
                                                    (s, l) =>
                                                        s + Number(l.amount),
                                                    0
                                                )) *
                                                100
                                        ) / 100;

                                    const displayDiscount =
                                        Math.round(
                                            totalDiscount * dayRatio * 100
                                        ) / 100;
                                    const displayVat =
                                        Math.round(vatAmount * dayRatio * 100) /
                                        100;

                                    // Use server-computed days_used_cost as authoritative total anchor
                                    const daysUsedCostAnchor =
                                        rental.days_used_cost != null
                                            ? Number(rental.days_used_cost)
                                            : subtotalForActualDays -
                                              displayDiscount +
                                              displayVat;
                                    const earlyReturnTotal =
                                        Math.round(
                                            (daysUsedCostAnchor +
                                                earlyReturnCharge) *
                                                100
                                        ) / 100;
                                    const grandTotalWithFees =
                                        Math.round(
                                            (earlyReturnTotal +
                                                overdueFee +
                                                latePickupFee) *
                                                100
                                        ) / 100;

                                    /*
                                     * Prefer the server-computed refund_amount (which includes
                                     * late_pickup_fee and other post-total fees in effectiveCost).
                                     * Fall back to frontend calc only when not yet set.
                                     */
                                    const earlyReturnBalance =
                                        refundAmount > 0.005
                                            ? refundAmount
                                            : Math.round(
                                                  (amountPaid -
                                                      grandTotalWithFees) *
                                                      100
                                              ) / 100;
                                    const hasBalance =
                                        earlyReturnBalance > 0.005;

                                    return (
                                        <>
                                            {/* Base cost */}
                                            <tr
                                                style={{
                                                    borderBottom:
                                                        '1px solid #f2f2f2',
                                                }}
                                            >
                                                <td style={tdBase}>
                                                    Vehicle rental
                                                    <span
                                                        style={{
                                                            marginLeft: 8,
                                                            fontSize: '0.78rem',
                                                            color: '#6c757d',
                                                        }}
                                                    >
                                                        ({actualDays} day
                                                        {actualDays !== 1
                                                            ? 's'
                                                            : ''}{' '}
                                                        ×{' '}
                                                        {fmtR(
                                                            rental.daily_rate
                                                        )}
                                                        {bookedDays !==
                                                            actualDays && (
                                                            <span
                                                                style={{
                                                                    color: '#fd7e14',
                                                                }}
                                                            >
                                                                {' '}
                                                                - {bookedDays}d
                                                                booked
                                                            </span>
                                                        )}
                                                        )
                                                    </span>
                                                </td>
                                                <td
                                                    style={{
                                                        ...tdBase,
                                                        textAlign: 'right',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {fmtR(baseForActualDays)}
                                                </td>
                                            </tr>

                                            {/* Addon charges - per-day prorated, flat unchanged */}
                                            {displayAddonLines.map(
                                                (charge, idx) => (
                                                    <tr
                                                        key={idx}
                                                        style={{
                                                            borderBottom:
                                                                '1px solid #f2f2f2',
                                                        }}
                                                    >
                                                        <td
                                                            style={{
                                                                ...tdBase,
                                                                color: '#495057',
                                                            }}
                                                        >
                                                            {charge.label}
                                                            {charge.is_per_day && (
                                                                <span
                                                                    style={{
                                                                        marginLeft: 6,
                                                                        fontSize:
                                                                            '0.75rem',
                                                                        color: '#6c757d',
                                                                    }}
                                                                >
                                                                    (
                                                                    {actualDays}
                                                                    d)
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td
                                                            style={{
                                                                ...tdBase,
                                                                textAlign:
                                                                    'right',
                                                                whiteSpace:
                                                                    'nowrap',
                                                                color: '#495057',
                                                            }}
                                                        >
                                                            {fmtR(
                                                                charge.amount
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            )}

                                            {/* Location charges */}
                                            {locationLines.map((loc, idx) => (
                                                <tr
                                                    key={idx}
                                                    style={{
                                                        borderBottom:
                                                            '1px solid #f2f2f2',
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            color: '#495057',
                                                        }}
                                                    >
                                                        {loc.label}
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            textAlign: 'right',
                                                            whiteSpace:
                                                                'nowrap',
                                                        }}
                                                    >
                                                        {fmtR(loc.amount)}
                                                    </td>
                                                </tr>
                                            ))}

                                            {/* Subtotal */}
                                            <tr>
                                                <td
                                                    colSpan={2}
                                                    style={{ padding: 0 }}
                                                >
                                                    <hr
                                                        style={{
                                                            margin: '4px 0',
                                                            borderColor:
                                                                '#dee2e6',
                                                        }}
                                                    />
                                                </td>
                                            </tr>
                                            <tr
                                                style={{
                                                    borderBottom:
                                                        '1px solid #f2f2f2',
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        ...tdBase,
                                                        color: '#6c757d',
                                                    }}
                                                >
                                                    Subtotal
                                                </td>
                                                <td
                                                    style={{
                                                        ...tdBase,
                                                        textAlign: 'right',
                                                        whiteSpace: 'nowrap',
                                                        color: '#6c757d',
                                                    }}
                                                >
                                                    {fmtR(
                                                        subtotalForActualDays
                                                    )}
                                                </td>
                                            </tr>

                                            {/* Discount (prorated) */}
                                            {displayDiscount > 0 && (
                                                <tr
                                                    style={{
                                                        borderBottom:
                                                            '1px solid #f2f2f2',
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            color: '#198754',
                                                        }}
                                                    >
                                                        Discount
                                                        {rental.coupon_applied
                                                            ?.code && (
                                                            <span
                                                                style={{
                                                                    marginLeft: 8,
                                                                    fontSize:
                                                                        '0.75rem',
                                                                    color: '#6c757d',
                                                                }}
                                                            >
                                                                (
                                                                {
                                                                    rental
                                                                        .coupon_applied
                                                                        .code
                                                                }
                                                                )
                                                            </span>
                                                        )}
                                                        {rental.manual_discount_reason && (
                                                            <span
                                                                style={{
                                                                    marginLeft: 8,
                                                                    fontSize:
                                                                        '0.75rem',
                                                                    color: '#6c757d',
                                                                }}
                                                            >
                                                                (
                                                                {
                                                                    rental.manual_discount_reason
                                                                }
                                                                )
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            textAlign: 'right',
                                                            whiteSpace:
                                                                'nowrap',
                                                            color: '#198754',
                                                        }}
                                                    >
                                                        −{fmtR(displayDiscount)}
                                                    </td>
                                                </tr>
                                            )}

                                            {/* VAT (prorated) */}
                                            {displayVat > 0 && (
                                                <tr
                                                    style={{
                                                        borderBottom:
                                                            '1px solid #f2f2f2',
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            color: '#495057',
                                                        }}
                                                    >
                                                        VAT
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            textAlign: 'right',
                                                            whiteSpace:
                                                                'nowrap',
                                                        }}
                                                    >
                                                        {fmtR(displayVat)}
                                                    </td>
                                                </tr>
                                            )}

                                            {/* Early return charge (penalty) */}
                                            {earlyReturnCharge > 0 && (
                                                <tr
                                                    style={{
                                                        borderBottom:
                                                            '1px solid #f2f2f2',
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            color: '#dc3545',
                                                        }}
                                                    >
                                                        Early return charge
                                                        {rental.early_return_charge_waived && (
                                                            <span
                                                                style={{
                                                                    marginLeft: 8,
                                                                    fontSize:
                                                                        '0.75rem',
                                                                    color: '#6c757d',
                                                                }}
                                                            >
                                                                (waived)
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            textAlign: 'right',
                                                            whiteSpace:
                                                                'nowrap',
                                                            color: '#dc3545',
                                                        }}
                                                    >
                                                        {fmtR(
                                                            earlyReturnCharge
                                                        )}
                                                    </td>
                                                </tr>
                                            )}

                                            {/* Total */}
                                            <tr>
                                                <td
                                                    colSpan={2}
                                                    style={{ padding: 0 }}
                                                >
                                                    <hr
                                                        style={{
                                                            margin: '4px 0',
                                                            borderColor:
                                                                '#212529',
                                                        }}
                                                    />
                                                </td>
                                            </tr>
                                            <tr
                                                style={{
                                                    borderBottom:
                                                        hasPostTotalFees
                                                            ? '1px solid #dee2e6'
                                                            : '2px solid #dee2e6',
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        ...tdBase,
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    Total
                                                </td>
                                                <td
                                                    style={{
                                                        ...tdBase,
                                                        textAlign: 'right',
                                                        fontWeight: 700,
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {fmtR(earlyReturnTotal)}
                                                </td>
                                            </tr>

                                            {/* Post-total fees (uncommon for early returns) */}
                                            {overdueFee > 0 && (
                                                <tr
                                                    style={{
                                                        borderBottom:
                                                            '1px solid #f2f2f2',
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            color: '#dc3545',
                                                        }}
                                                    >
                                                        {rental.overdue_breakdown
                                                            ? rental
                                                                  .overdue_breakdown
                                                                  .type ===
                                                              'hourly'
                                                                ? `Overdue (${rental.overdue_breakdown.units} hr${rental.overdue_breakdown.units !== 1 ? 's' : ''} × ${rental.overdue_breakdown.rate.toFixed(2)}/hr)`
                                                                : `Overdue (${rental.overdue_breakdown.units} day${rental.overdue_breakdown.units !== 1 ? 's' : ''} × ${rental.overdue_breakdown.rate.toFixed(2)}/d)`
                                                            : 'Overdue fee'}
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            textAlign: 'right',
                                                            whiteSpace:
                                                                'nowrap',
                                                            color: '#dc3545',
                                                        }}
                                                    >
                                                        {fmtR(overdueFee)}
                                                    </td>
                                                </tr>
                                            )}
                                            {latePickupFee > 0 && (
                                                <tr
                                                    style={{
                                                        borderBottom:
                                                            '1px solid #f2f2f2',
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            color: '#dc3545',
                                                        }}
                                                    >
                                                        Late pickup fee
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            textAlign: 'right',
                                                            whiteSpace:
                                                                'nowrap',
                                                            color: '#dc3545',
                                                        }}
                                                    >
                                                        {fmtR(latePickupFee)}
                                                    </td>
                                                </tr>
                                            )}
                                            {hasPostTotalFees && (
                                                <>
                                                    <tr>
                                                        <td
                                                            colSpan={2}
                                                            style={{
                                                                padding: 0,
                                                            }}
                                                        >
                                                            <hr
                                                                style={{
                                                                    margin: '4px 0',
                                                                    borderColor:
                                                                        '#212529',
                                                                }}
                                                            />
                                                        </td>
                                                    </tr>
                                                    <tr
                                                        style={{
                                                            borderBottom:
                                                                '2px solid #dee2e6',
                                                        }}
                                                    >
                                                        <td
                                                            style={{
                                                                ...tdBase,
                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            Grand Total
                                                        </td>
                                                        <td
                                                            style={{
                                                                ...tdBase,
                                                                textAlign:
                                                                    'right',
                                                                fontWeight: 700,
                                                                whiteSpace:
                                                                    'nowrap',
                                                            }}
                                                        >
                                                            {fmtR(
                                                                grandTotalWithFees
                                                            )}
                                                        </td>
                                                    </tr>
                                                </>
                                            )}

                                            {/* Separator before payment summary */}
                                            <tr>
                                                <td
                                                    colSpan={2}
                                                    style={{ padding: 0 }}
                                                >
                                                    <hr
                                                        style={{
                                                            margin: '4px 0',
                                                            borderColor:
                                                                '#dee2e6',
                                                        }}
                                                    />
                                                </td>
                                            </tr>

                                            {/* Security deposit - informational */}
                                            {securityDeposit > 0 &&
                                                depositApplied <= 0 &&
                                                !isDepositPending && (
                                                    <tr
                                                        style={{
                                                            borderBottom:
                                                                '1px solid #f2f2f2',
                                                        }}
                                                    >
                                                        <td
                                                            style={{
                                                                ...tdBase,
                                                                color: '#6c757d',
                                                            }}
                                                        >
                                                            Security deposit
                                                            {depositPaid > 0 &&
                                                                depositPaid <
                                                                    securityDeposit && (
                                                                    <span
                                                                        style={{
                                                                            marginLeft: 8,
                                                                            fontSize:
                                                                                '0.75rem',
                                                                            color: '#6c757d',
                                                                        }}
                                                                    >
                                                                        (
                                                                        {fmtR(
                                                                            depositPaid
                                                                        )}{' '}
                                                                        collected)
                                                                    </span>
                                                                )}
                                                        </td>
                                                        <td
                                                            style={{
                                                                ...tdBase,
                                                                textAlign:
                                                                    'right',
                                                                whiteSpace:
                                                                    'nowrap',
                                                                color: '#6c757d',
                                                            }}
                                                        >
                                                            {fmtR(
                                                                securityDeposit
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            {depositApplied > 0 && (
                                                <tr
                                                    style={{
                                                        borderBottom:
                                                            '1px solid #f2f2f2',
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            color: '#6c757d',
                                                        }}
                                                    >
                                                        Security deposit applied
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            textAlign: 'right',
                                                            whiteSpace:
                                                                'nowrap',
                                                            color: '#6c757d',
                                                        }}
                                                    >
                                                        −{fmtR(depositApplied)}
                                                    </td>
                                                </tr>
                                            )}

                                            {/* Amount paid */}
                                            {amountPaid > 0 && (
                                                <tr
                                                    style={{
                                                        borderBottom:
                                                            '1px solid #f2f2f2',
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            color: '#495057',
                                                        }}
                                                    >
                                                        Amount paid
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            textAlign: 'right',
                                                            whiteSpace:
                                                                'nowrap',
                                                            color: '#495057',
                                                        }}
                                                    >
                                                        {fmtR(amountPaid)}
                                                    </td>
                                                </tr>
                                            )}

                                            {/* Early return balance: forfeited or refunded */}
                                            {hasBalance &&
                                                !refundPolicyEnabled && (
                                                    <tr>
                                                        <td
                                                            style={{
                                                                ...tdBase,
                                                                fontWeight: 700,
                                                                color: '#fd7e14',
                                                            }}
                                                        >
                                                            Forfeited
                                                            (non-refundable)
                                                        </td>
                                                        <td
                                                            style={{
                                                                ...tdBase,
                                                                textAlign:
                                                                    'right',
                                                                fontWeight: 700,
                                                                whiteSpace:
                                                                    'nowrap',
                                                                color: '#fd7e14',
                                                            }}
                                                        >
                                                            {fmtR(
                                                                earlyReturnBalance
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            {hasBalance &&
                                                refundPolicyEnabled && (
                                                    <tr>
                                                        <td
                                                            style={{
                                                                ...tdBase,
                                                                fontWeight: 700,
                                                                color:
                                                                    rental.refund_status ===
                                                                    'approved'
                                                                        ? '#198754'
                                                                        : '#fd7e14',
                                                            }}
                                                        >
                                                            {rental.refund_status ===
                                                            'approved'
                                                                ? 'Refund issued'
                                                                : 'Refund to customer'}
                                                        </td>
                                                        <td
                                                            style={{
                                                                ...tdBase,
                                                                textAlign:
                                                                    'right',
                                                                fontWeight: 700,
                                                                whiteSpace:
                                                                    'nowrap',
                                                                color:
                                                                    rental.refund_status ===
                                                                    'approved'
                                                                        ? '#198754'
                                                                        : '#fd7e14',
                                                            }}
                                                        >
                                                            {fmtR(
                                                                earlyReturnBalance
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}

                                            {/* Amount due (underpaid - only when there is no positive balance to forfeit/refund) */}
                                            {!hasBalance && amountDue > 0 && (
                                                <tr>
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            fontWeight: 700,
                                                            color: '#dc3545',
                                                        }}
                                                    >
                                                        Amount due
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            textAlign: 'right',
                                                            fontWeight: 700,
                                                            whiteSpace:
                                                                'nowrap',
                                                            color: '#dc3545',
                                                        }}
                                                    >
                                                        {fmtR(amountDue)}
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                }

                                /* Normal (non-early-return) rental path */
                                const daysUsed =
                                    originalRentalDays ??
                                    rentalDays ??
                                    rental.rental_days;

                                return (
                                    <>
                                        {/* Base cost row */}
                                        <tr
                                            style={{
                                                borderBottom:
                                                    '1px solid #f2f2f2',
                                            }}
                                        >
                                            <td style={tdBase}>
                                                Vehicle rental
                                                {effectiveDailyRate ? (
                                                    <span
                                                        style={{
                                                            marginLeft: 8,
                                                            fontSize: '0.78rem',
                                                            color: '#6c757d',
                                                        }}
                                                    >
                                                        ({daysUsed} day
                                                        {daysUsed !== 1
                                                            ? 's'
                                                            : ''}{' '}
                                                        ×{' '}
                                                        {fmtR(
                                                            effectiveDailyRate
                                                        )}
                                                        )
                                                    </span>
                                                ) : null}
                                            </td>
                                            <td
                                                style={{
                                                    ...tdBase,
                                                    textAlign: 'right',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {fmtR(baseDisplayAmount)}
                                            </td>
                                        </tr>

                                        {/* Addon charges */}
                                        {addonLines.map((charge, idx) => (
                                            <tr
                                                key={idx}
                                                style={{
                                                    borderBottom:
                                                        '1px solid #f2f2f2',
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        ...tdBase,
                                                        color: '#495057',
                                                    }}
                                                >
                                                    {charge.label}
                                                </td>
                                                <td
                                                    style={{
                                                        ...tdBase,
                                                        textAlign: 'right',
                                                        whiteSpace: 'nowrap',
                                                        color: '#495057',
                                                    }}
                                                >
                                                    {fmtR(charge.amount)}
                                                </td>
                                            </tr>
                                        ))}

                                        {/* Location charges */}
                                        {locationLines.map((loc, idx) => (
                                            <tr
                                                key={idx}
                                                style={{
                                                    borderBottom:
                                                        '1px solid #f2f2f2',
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        ...tdBase,
                                                        color: '#495057',
                                                    }}
                                                >
                                                    {loc.label}
                                                </td>
                                                <td
                                                    style={{
                                                        ...tdBase,
                                                        textAlign: 'right',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {fmtR(loc.amount)}
                                                </td>
                                            </tr>
                                        ))}

                                        {/* Subtotal */}
                                        {(addonLines.length > 0 ||
                                            locationLines.length > 0 ||
                                            totalDiscount > 0) && (
                                            <>
                                                <tr>
                                                    <td
                                                        colSpan={2}
                                                        style={{ padding: 0 }}
                                                    >
                                                        <hr
                                                            style={{
                                                                margin: '4px 0',
                                                                borderColor:
                                                                    '#dee2e6',
                                                            }}
                                                        />
                                                    </td>
                                                </tr>
                                                <tr
                                                    style={{
                                                        borderBottom:
                                                            '1px solid #f2f2f2',
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            color: '#6c757d',
                                                        }}
                                                    >
                                                        Subtotal
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            textAlign: 'right',
                                                            whiteSpace:
                                                                'nowrap',
                                                            color: '#6c757d',
                                                        }}
                                                    >
                                                        {fmtR(
                                                            Number(
                                                                rental.subtotal ??
                                                                    0
                                                            )
                                                        )}
                                                    </td>
                                                </tr>
                                            </>
                                        )}

                                        {/* Separator before discount/VAT */}
                                        {(totalDiscount > 0 ||
                                            vatAmount > 0) && (
                                            <tr>
                                                <td
                                                    colSpan={2}
                                                    style={{ padding: 0 }}
                                                >
                                                    <hr
                                                        style={{
                                                            margin: '4px 0',
                                                            borderColor:
                                                                '#dee2e6',
                                                        }}
                                                    />
                                                </td>
                                            </tr>
                                        )}

                                        {/* Discount */}
                                        {totalDiscount > 0 && (
                                            <tr
                                                style={{
                                                    borderBottom:
                                                        '1px solid #f2f2f2',
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        ...tdBase,
                                                        color: '#198754',
                                                    }}
                                                >
                                                    Discount
                                                    {rental.coupon_applied
                                                        ?.code && (
                                                        <span
                                                            style={{
                                                                marginLeft: 8,
                                                                fontSize:
                                                                    '0.75rem',
                                                                color: '#6c757d',
                                                            }}
                                                        >
                                                            (
                                                            {
                                                                rental
                                                                    .coupon_applied
                                                                    .code
                                                            }
                                                            )
                                                        </span>
                                                    )}
                                                    {rental.manual_discount_reason && (
                                                        <span
                                                            style={{
                                                                marginLeft: 8,
                                                                fontSize:
                                                                    '0.75rem',
                                                                color: '#6c757d',
                                                            }}
                                                        >
                                                            (
                                                            {
                                                                rental.manual_discount_reason
                                                            }
                                                            )
                                                        </span>
                                                    )}
                                                </td>
                                                <td
                                                    style={{
                                                        ...tdBase,
                                                        textAlign: 'right',
                                                        whiteSpace: 'nowrap',
                                                        color: '#198754',
                                                    }}
                                                >
                                                    −{fmtR(totalDiscount)}
                                                </td>
                                            </tr>
                                        )}

                                        {/* VAT */}
                                        {vatAmount > 0 && (
                                            <tr
                                                style={{
                                                    borderBottom:
                                                        '1px solid #f2f2f2',
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        ...tdBase,
                                                        color: '#495057',
                                                    }}
                                                >
                                                    VAT
                                                </td>
                                                <td
                                                    style={{
                                                        ...tdBase,
                                                        textAlign: 'right',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {fmtR(vatAmount)}
                                                </td>
                                            </tr>
                                        )}

                                        {/* Rental Total */}
                                        <tr>
                                            <td
                                                colSpan={2}
                                                style={{ padding: 0 }}
                                            >
                                                <hr
                                                    style={{
                                                        margin: '4px 0',
                                                        borderColor: '#212529',
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                        <tr
                                            style={{
                                                borderBottom: hasPostTotalFees
                                                    ? '1px solid #dee2e6'
                                                    : '2px solid #dee2e6',
                                            }}
                                        >
                                            <td
                                                style={{
                                                    ...tdBase,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                Rental Total
                                            </td>
                                            <td
                                                style={{
                                                    ...tdBase,
                                                    textAlign: 'right',
                                                    fontWeight: 700,
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {fmtR(rental.total_cost)}
                                            </td>
                                        </tr>

                                        {/* Overdue / late pickup fees */}
                                        {overdueFee > 0 && (
                                            <tr
                                                style={{
                                                    borderBottom:
                                                        '1px solid #f2f2f2',
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        ...tdBase,
                                                        color: '#dc3545',
                                                    }}
                                                >
                                                    {rental.overdue_breakdown
                                                        ? rental
                                                              .overdue_breakdown
                                                              .type === 'hourly'
                                                            ? `Overdue (${rental.overdue_breakdown.units} hr${rental.overdue_breakdown.units !== 1 ? 's' : ''} × ${rental.overdue_breakdown.rate.toFixed(2)}/hr)`
                                                            : `Overdue (${rental.overdue_breakdown.units} day${rental.overdue_breakdown.units !== 1 ? 's' : ''} × ${rental.overdue_breakdown.rate.toFixed(2)}/d)`
                                                        : 'Overdue fee'}
                                                </td>
                                                <td
                                                    style={{
                                                        ...tdBase,
                                                        textAlign: 'right',
                                                        whiteSpace: 'nowrap',
                                                        color: '#dc3545',
                                                    }}
                                                >
                                                    {fmtR(overdueFee)}
                                                </td>
                                            </tr>
                                        )}
                                        {latePickupFee > 0 && (
                                            <tr
                                                style={{
                                                    borderBottom:
                                                        '1px solid #f2f2f2',
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        ...tdBase,
                                                        color: '#dc3545',
                                                    }}
                                                >
                                                    Late pickup fee
                                                </td>
                                                <td
                                                    style={{
                                                        ...tdBase,
                                                        textAlign: 'right',
                                                        whiteSpace: 'nowrap',
                                                        color: '#dc3545',
                                                    }}
                                                >
                                                    {fmtR(latePickupFee)}
                                                </td>
                                            </tr>
                                        )}

                                        {/* Grand Total (only when post-total fees exist) */}
                                        {hasPostTotalFees && (
                                            <>
                                                <tr>
                                                    <td
                                                        colSpan={2}
                                                        style={{ padding: 0 }}
                                                    >
                                                        <hr
                                                            style={{
                                                                margin: '4px 0',
                                                                borderColor:
                                                                    '#212529',
                                                            }}
                                                        />
                                                    </td>
                                                </tr>
                                                <tr
                                                    style={{
                                                        borderBottom:
                                                            '2px solid #dee2e6',
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        Grand Total
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            textAlign: 'right',
                                                            fontWeight: 700,
                                                            whiteSpace:
                                                                'nowrap',
                                                        }}
                                                    >
                                                        {fmtR(grandTotal)}
                                                    </td>
                                                </tr>
                                            </>
                                        )}

                                        {/* Separator before payment summary */}
                                        <tr>
                                            <td
                                                colSpan={2}
                                                style={{ padding: 0 }}
                                            >
                                                <hr
                                                    style={{
                                                        margin: '4px 0',
                                                        borderColor: '#dee2e6',
                                                    }}
                                                />
                                            </td>
                                        </tr>

                                        {/* Security deposit - informational only when already held/refunded */}
                                        {securityDeposit > 0 &&
                                            depositApplied <= 0 &&
                                            !isDepositPending && (
                                                <tr
                                                    style={{
                                                        borderBottom:
                                                            '1px solid #f2f2f2',
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            color: '#6c757d',
                                                        }}
                                                    >
                                                        Security deposit
                                                        {depositPaid > 0 &&
                                                            depositPaid <
                                                                securityDeposit && (
                                                                <span
                                                                    style={{
                                                                        marginLeft: 8,
                                                                        fontSize:
                                                                            '0.75rem',
                                                                        color: '#6c757d',
                                                                    }}
                                                                >
                                                                    (
                                                                    {fmtR(
                                                                        depositPaid
                                                                    )}{' '}
                                                                    collected)
                                                                </span>
                                                            )}
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            textAlign: 'right',
                                                            whiteSpace:
                                                                'nowrap',
                                                            color: '#6c757d',
                                                        }}
                                                    >
                                                        {fmtR(securityDeposit)}
                                                    </td>
                                                </tr>
                                            )}

                                        {/* Deposit applied to balance */}
                                        {depositApplied > 0 && (
                                            <tr
                                                style={{
                                                    borderBottom:
                                                        '1px solid #f2f2f2',
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        ...tdBase,
                                                        color: '#6c757d',
                                                    }}
                                                >
                                                    Security deposit applied
                                                </td>
                                                <td
                                                    style={{
                                                        ...tdBase,
                                                        textAlign: 'right',
                                                        whiteSpace: 'nowrap',
                                                        color: '#6c757d',
                                                    }}
                                                >
                                                    −{fmtR(depositApplied)}
                                                </td>
                                            </tr>
                                        )}

                                        {/* Amount paid */}
                                        <tr
                                            style={{
                                                borderBottom:
                                                    '1px solid #f2f2f2',
                                            }}
                                        >
                                            <td
                                                style={{
                                                    ...tdBase,
                                                    color: '#495057',
                                                }}
                                            >
                                                Amount paid
                                            </td>
                                            <td
                                                style={{
                                                    ...tdBase,
                                                    textAlign: 'right',
                                                    whiteSpace: 'nowrap',
                                                    color: '#495057',
                                                }}
                                            >
                                                {fmtR(amountPaid)}
                                            </td>
                                        </tr>

                                        {/* Amount due */}
                                        {amountDue > 0 && (
                                            <tr
                                                style={{
                                                    borderBottom:
                                                        isDepositPending
                                                            ? '1px solid #f2f2f2'
                                                            : undefined,
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        ...tdBase,
                                                        fontWeight: 700,
                                                        color: '#dc3545',
                                                    }}
                                                >
                                                    Amount due
                                                </td>
                                                <td
                                                    style={{
                                                        ...tdBase,
                                                        textAlign: 'right',
                                                        fontWeight: 700,
                                                        whiteSpace: 'nowrap',
                                                        color: '#dc3545',
                                                    }}
                                                >
                                                    {fmtR(amountDue)}
                                                </td>
                                            </tr>
                                        )}

                                        {/* Pending security deposit + total payable */}
                                        {isDepositPending && amountDue > 0 && (
                                            <>
                                                <tr
                                                    style={{
                                                        borderBottom:
                                                            '1px solid #f2f2f2',
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            color: '#fd7e14',
                                                        }}
                                                    >
                                                        + Security deposit
                                                        <span
                                                            style={{
                                                                marginLeft: 8,
                                                                fontSize:
                                                                    '0.75rem',
                                                                color: '#fd7e14',
                                                            }}
                                                        >
                                                            (pending)
                                                        </span>
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            textAlign: 'right',
                                                            whiteSpace:
                                                                'nowrap',
                                                            color: '#fd7e14',
                                                        }}
                                                    >
                                                        {fmtR(securityDeposit)}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            fontWeight: 700,
                                                            color: '#0074ff',
                                                        }}
                                                    >
                                                        Total payable
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            textAlign: 'right',
                                                            fontWeight: 700,
                                                            whiteSpace:
                                                                'nowrap',
                                                            color: '#0074ff',
                                                        }}
                                                    >
                                                        {fmtR(
                                                            amountDue +
                                                                securityDeposit
                                                        )}
                                                    </td>
                                                </tr>
                                            </>
                                        )}
                                    </>
                                );
                            })()
                        )}
                    </tbody>
                </table>

                {/* Notes */}
                {(rental.customer_notes || rental.admin_notes) && (
                    <div
                        style={{
                            marginTop: 24,
                            paddingTop: 16,
                            borderTop: '1px dashed #dee2e6',
                            fontSize: '0.78rem',
                            color: '#495057',
                            lineHeight: 1.6,
                        }}
                    >
                        {rental.customer_notes && (
                            <div>
                                <span style={{ fontWeight: 700 }}>Notes: </span>
                                {rental.customer_notes}
                            </div>
                        )}
                    </div>
                )}

                {/* Early return no-refund policy notice */}
                {!refundPolicyEnabled && !isCancelled && !isEarlyReturn && (
                    <div
                        style={{
                            marginTop: 20,
                            padding: '8px 12px',
                            background: '#fff8f8',
                            border: '1px solid #f5c6cb',
                            borderRadius: 4,
                            fontSize: '0.75rem',
                            color: '#721c24',
                        }}
                    >
                        <strong>Early Return Policy:</strong> In the event of an
                        early return, unused rental days are non-refundable. An
                        early return charge may also apply.
                    </div>
                )}

                {/* Footer */}
                <div
                    style={{
                        marginTop: 36,
                        paddingTop: 16,
                        borderTop: '1px solid #dee2e6',
                        fontSize: '0.72rem',
                        color: '#adb5bd',
                        textAlign: 'center',
                    }}
                >
                    {companyName}
                    {companyEmail && ` · ${companyEmail}`}
                    {companyPhone && ` · ${companyPhone}`}
                    {' · '}Thank you for choosing us
                </div>
            </div>
        </div>
    );
}
