import { useState } from 'react';
import { Alert, Badge, Button, Col, Form, Row } from 'react-bootstrap';
import { DetailPageSkeleton } from '@adminComponents/skeletons/DetailPageSkeleton';
import { useNavigate, useParams } from 'react-router-dom';
import {
    useTransaction,
    useResolveTransaction,
} from '@/shared/hooks/queries/useTransactions';
import type {
    TransactionStatus,
    TransactionType,
} from '@/shared/types/transaction.types';
import {
    TRANSACTABLE_TYPE_LABELS,
    formatChannelLabel,
    getChannelVariant,
} from '@/shared/types/transaction.types';
import { usePermission, useTitle } from '@/shared/hooks';
import {
    useFormatCurrency,
    useGeneralSettings,
    usePaymentSettings,
} from '@/shared/hooks/queries/useSettings';
import { formatWithSymbol } from '@/shared/libs/currency';
import { useAppSelector } from '@/store';
import { selectActiveBranchId } from '@/store/slices/activeBranchSlice';
import { ROUTES } from '@/shared/routes';
import { PERMISSIONS } from '@/shared/config/permissions';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import {
    MdArrowBack,
    MdPrint,
    MdOpenInNew,
    MdReceipt,
    MdPerson,
    MdLinkOff,
    MdLocalOffer,
} from 'react-icons/md';

/* Badge variant maps */

const STATUS_VARIANT: Record<TransactionStatus, string> = {
    paid: 'success',
    pending: 'warning',
    failed: 'danger',
    under_review: 'warning',
    refunded: 'info',
};

const TYPE_VARIANT: Record<TransactionType, string> = {
    payment: 'primary',
    refund: 'info',
    cancellation_fee: 'danger',
    overdue_charge: 'warning',
    security_deposit: 'secondary',
    deposit_refund: 'info',
    deposit_waived: 'light',
    manual_payment: 'dark',
    initial_payment: 'primary',
    part_payment: 'info',
    full_payment: 'success',
    discount: 'success',
    damage_charge: 'danger',
    repair_cost: 'warning',
    resolve_debt: 'success',
    cancellation_refund: 'info',
};

const PROVIDER_COLOR: Record<string, string> = {
    paystack: '#00c3f7',
    stripe: '#635bff',
    hubtel: '#e8234a',
    momo: '#fbbf24',
    manual: '#64748b',
    cash: '#22c55e',
    bank_transfer: '#3b82f6',
};

function ProviderBadge({
    provider,
    logoUrl,
}: {
    provider: string;
    logoUrl?: string | null;
}) {
    const key = provider.toLowerCase().replace(/\s+/g, '_');
    const color = PROVIDER_COLOR[key] ?? '#6366f1';
    const label = toTitleCase(provider);

    return (
        <span className="d-inline-flex align-items-center gap-2">
            <span
                className="d-inline-flex align-items-center justify-content-center rounded-2"
                style={{
                    width: 28,
                    height: 28,
                    background: color,
                    overflow: 'hidden',
                    flexShrink: 0,
                }}
            >
                {logoUrl ? (
                    <img
                        src={logoUrl}
                        alt={label}
                        style={{ width: 22, height: 22, objectFit: 'contain' }}
                        onError={e => {
                            (
                                e.currentTarget as HTMLImageElement
                            ).style.display = 'none';
                        }}
                    />
                ) : (
                    <span
                        style={{
                            color: '#fff',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                        }}
                    >
                        {label.charAt(0).toUpperCase()}
                    </span>
                )}
            </span>
            <span>{label}</span>
        </span>
    );
}

/* Helpers */

function toTitleCase(str: string): string {
    return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function bookingRoute(type: string, id: string): string | null {
    if (type === 'rental') return ROUTES.DASHBOARD.RENTALS.VIEW(id);
    if (type === 'airport_booking')
        return ROUTES.DASHBOARD.AIRPORT_TRANSFER.BOOKINGS.VIEW(id);
    if (type === 'chauffeur_booking')
        return ROUTES.DASHBOARD.CHAUFFEUR_RENTAL.BOOKINGS.VIEW(id);
    return null;
}

/* Sub-components */

function InfoRow({
    label,
    value,
    mono = false,
}: {
    label: string;
    value: React.ReactNode;
    mono?: boolean;
}) {
    return (
        <div
            className="d-flex align-items-start py-2 gap-3"
            style={{ borderBottom: '1px solid #f0f2f5' }}
        >
            <span
                className="text-muted flex-shrink-0"
                style={{ fontSize: '0.78rem', minWidth: 148, paddingTop: 2 }}
            >
                {label}
            </span>
            <span
                className={`fw-semibold flex-grow-1 text-end ${mono ? 'font-monospace' : ''}`}
                style={{ fontSize: '0.84rem', wordBreak: 'break-all' }}
            >
                {value ?? <span className="text-muted fw-normal">-</span>}
            </span>
        </div>
    );
}

function Section({
    icon,
    title,
    children,
    printId,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    printId?: string;
}) {
    return (
        <div
            id={printId}
            className="rounded-3 border-0 shadow-sm mb-4 overflow-hidden"
            style={{ background: '#fff' }}
        >
            <div
                className="d-flex align-items-center gap-2 px-4 py-3"
                style={{
                    background: '#f8f9fb',
                    borderBottom: '1px solid #eef0f3',
                }}
            >
                <span style={{ color: '#6366f1', fontSize: '1rem' }}>
                    {icon}
                </span>
                <span
                    className="fw-semibold"
                    style={{ fontSize: '0.87rem', color: '#1e293b' }}
                >
                    {title}
                </span>
            </div>
            <div className="px-4 py-2">{children}</div>
        </div>
    );
}

/* Amount badge */
function AmountDisplay({
    amount,
    status,
    formatCurrency,
}: {
    amount: number;
    status: TransactionStatus;
    formatCurrency: (n: number) => string;
}) {
    const color =
        status === 'paid'
            ? '#16a34a'
            : status === 'failed'
              ? '#dc2626'
              : '#d97706';
    const bg =
        status === 'paid'
            ? 'rgba(22,163,74,0.07)'
            : status === 'failed'
              ? 'rgba(220,38,38,0.07)'
              : 'rgba(217,119,6,0.07)';

    return (
        <div
            className="rounded-3 d-inline-flex align-items-baseline gap-1 px-3 py-2"
            style={{ background: bg, border: `1px solid ${color}22` }}
        >
            <span
                style={{
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    color,
                    lineHeight: 1,
                }}
            >
                {formatCurrency(amount)}
            </span>
        </div>
    );
}

/* Main */

export default function TransactionDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const formatCurrency = useFormatCurrency();
    const { hasPermission } = usePermission();
    const [resolveNotes, setResolveNotes] = useState('');
    const [pendingAction, setPendingAction] = useState<
        'approve' | 'reject' | null
    >(null);
    const resolveTransaction = useResolveTransaction(id ?? '');
    const { data: response, isLoading, isError } = useTransaction(id ?? '');
    const { data: paymentSettingsResponse } = usePaymentSettings();
    const paymentSettings = paymentSettingsResponse?.data;
    const { data: generalSettingsResponse } = useGeneralSettings();
    const generalSettings = generalSettingsResponse?.data;
    const activeBranchId = useAppSelector(selectActiveBranchId);
    const globalSymbol = generalSettings?.currency_symbol ?? 'GHS';

    const transaction = response?.data;

    const showConverted =
        !!transaction?.exchange_rate &&
        transaction.exchange_rate !== 1 &&
        (!activeBranchId || activeBranchId !== transaction.branch_id);
    const fmtTx = (n: number): string => {
        if (
            showConverted &&
            transaction?.exchange_rate &&
            transaction.currency_symbol
        ) {
            return `${formatWithSymbol(n, transaction.currency_symbol)} / ${formatWithSymbol(n * transaction.exchange_rate, globalSymbol)}`;
        }
        return transaction?.currency_symbol
            ? formatWithSymbol(n, transaction.currency_symbol)
            : formatCurrency(n);
    };
    useTitle(
        transaction ? `Transaction ${transaction.reference}` : 'Transaction'
    );

    const handlePrint = () => {
        if (!transaction) return;

        const companyName =
            generalSettings?.site_name ?? 'Swiftflitz Car Rental';
        const companyAddress = generalSettings?.site_address ?? '';
        const companyEmail = generalSettings?.site_email ?? '';
        const companyPhone = generalSettings?.site_phone ?? '';
        const companyLogo = generalSettings?.site_image_url ?? '';

        const fmtDate = (val: string | null | undefined) => {
            if (!val) return '-';
            return new Date(val).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        };

        const sc =
            transaction.status === 'paid'
                ? '#16a34a'
                : transaction.status === 'failed'
                  ? '#dc2626'
                  : '#d97706';
        const scBg =
            transaction.status === 'paid'
                ? '#f0fdf4'
                : transaction.status === 'failed'
                  ? '#fef2f2'
                  : '#fffbeb';
        const scBorder =
            transaction.status === 'paid'
                ? '#bbf7d0'
                : transaction.status === 'failed'
                  ? '#fecaca'
                  : '#fde68a';
        const bookingTypeLabel = transaction.transactable
            ? (TRANSACTABLE_TYPE_LABELS[transaction.transactable.type] ??
              transaction.transactable.type)
            : null;

        const row = (label: string, value: string, mono = false) =>
            `<tr><td style="padding:8px 12px;color:#64748b;font-size:12px;width:42%;border-bottom:1px solid #f1f5f9">${label}</td><td style="padding:8px 12px;font-weight:600;font-size:12px;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9;${mono ? 'font-family:monospace' : ''}">${value}</td></tr>`;

        const sectionTitle = (t: string) =>
            `<div style="font-size:10px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;color:#94a3b8;padding:0 0 6px;margin:20px 0 0;border-bottom:1px solid #e2e8f0">${t}</div>`;

        const win = window.open('', '_blank', 'width=800,height=960');
        if (!win) return;

        win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Receipt ${transaction.reference}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{font-family:-apple-system,'Segoe UI',Arial,sans-serif;background:#fff;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{max-width:680px;margin:0 auto;padding:44px 52px 56px}
@media print{.page{padding:28px 36px 40px}}
</style>
</head>
<body>
<div class="page">

  <!-- Accent bar -->
  <div style="height:5px;background:linear-gradient(90deg,${sc},${sc}88);border-radius:3px;margin-bottom:36px"></div>

  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px">
    <div>
      ${
          companyLogo
              ? `<img src="${companyLogo}" alt="${companyName}" style="max-height:48px;max-width:160px;object-fit:contain;display:block;margin-bottom:8px" onerror="this.style.display='none'">`
              : `<div style="font-size:19px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;margin-bottom:6px">${companyName}</div>`
      }
      <div style="font-size:11px;color:#94a3b8;line-height:1.8">
        ${companyAddress ? `<span>${companyAddress}</span><br>` : ''}
        ${companyPhone ? `<span>${companyPhone}</span>${companyEmail ? ' &nbsp;·&nbsp; ' : ''}` : ''}${companyEmail ? `<span>${companyEmail}</span>` : ''}
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-size:24px;font-weight:900;letter-spacing:0.08em;color:#0f172a">RECEIPT</div>
      <div style="font-family:monospace;font-size:12px;color:#64748b;margin-top:5px">${transaction.reference}</div>
      <div style="font-size:11px;color:#94a3b8;margin-top:2px">${fmtDate(transaction.paid_at ?? transaction.created_at)}</div>
      <div style="display:inline-block;margin-top:8px;padding:3px 12px;border-radius:20px;background:${scBg};border:1px solid ${scBorder};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${sc}">${transaction.status_label}</div>
    </div>
  </div>

  <!-- Amount hero -->
  <div style="background:${scBg};border:1px solid ${scBorder};border-radius:12px;padding:24px 28px;margin-bottom:32px;display:flex;align-items:center;justify-content:space-between">
    <div>
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.07em;color:${sc};font-weight:700;margin-bottom:4px">Amount ${transaction.status === 'paid' ? 'Paid' : 'Due'}</div>
      <div style="font-size:34px;font-weight:900;color:${sc};letter-spacing:-0.02em;line-height:1">${transaction.currency_symbol ?? transaction.currency} ${Number(transaction.amount).toFixed(2)}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:11px;color:#94a3b8;margin-bottom:4px">${transaction.type_label}</div>
      <div style="font-size:12px;font-weight:600;color:#475569">${transaction.provider.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}${transaction.channel ? ' · ' + formatChannelLabel(transaction.channel) : ''}</div>
    </div>
  </div>

  <!-- Details grid -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px">

    <!-- Left: Transaction + Payer -->
    <div>
      ${sectionTitle('Transaction Details')}
      <table style="width:100%;border-collapse:collapse;margin-top:4px">
        ${row('Reference', transaction.reference, true)}
        ${transaction.provider_reference ? row('Provider Ref', transaction.provider_reference, true) : ''}
        ${transaction.paid_at ? row('Paid At', fmtDate(transaction.paid_at)) : ''}
        ${row('Recorded', fmtDate(transaction.created_at))}
        ${transaction.channel ? row('Channel', formatChannelLabel(transaction.channel)) : ''}
        ${transaction.payment_phone ? row('Payment Phone', transaction.payment_phone, true) : ''}
        ${transaction.processed_by ? row('Processed By', transaction.processed_by.name) : ''}
        ${transaction.description ? row('Notes', transaction.description) : ''}
      </table>
    </div>

    <!-- Right: Customer + Booking -->
    <div>
      ${sectionTitle('Customer / Payer')}
      <table style="width:100%;border-collapse:collapse;margin-top:4px">
        ${row('Name', transaction.payer.name)}
        ${transaction.payer.email ? row('Email', transaction.payer.email) : ''}
        ${transaction.payer.phone ? row('Phone', transaction.payer.phone, true) : ''}
      </table>

      ${
          bookingTypeLabel
              ? `
      ${sectionTitle('Linked Booking')}
      <table style="width:100%;border-collapse:collapse;margin-top:4px">
        ${row('Booking Type', bookingTypeLabel)}
        ${row('Reference', transaction.transactable?.reference ?? '-', true)}
        ${transaction.branch ? row('Branch', transaction.branch.name) : ''}
      </table>`
              : ''
      }

      ${
          transaction.discount_amount != null
              ? `
      ${sectionTitle('Discount')}
      <table style="width:100%;border-collapse:collapse;margin-top:4px">
        ${row('Discount', '- ' + (transaction.currency_symbol ?? transaction.currency) + ' ' + Number(transaction.discount_amount).toFixed(2))}
        ${transaction.discount_reason ? row('Reason', transaction.discount_reason) : ''}
      </table>`
              : ''
      }
    </div>

  </div>

  <!-- Footer -->
  <div style="margin-top:44px;padding-top:18px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center">
    <div style="font-size:10.5px;color:#94a3b8;line-height:1.7">
      Thank you for choosing <strong style="color:#64748b">${companyName}</strong>.<br>
      This is an official payment receipt.
    </div>
    ${companyEmail ? `<div style="font-size:10.5px;color:#94a3b8;text-align:right">${companyEmail}</div>` : ''}
  </div>

</div>
<script>window.onload=()=>{window.print();}</script>
</body>
</html>`);
        win.document.close();
    };

    if (isLoading) {
        return <DetailPageSkeleton cards={2} />;
    }

    if (isError || !transaction) {
        return (
            <div className="container-fluid py-4 px-4">
                <div className="alert alert-danger">
                    Transaction not found or failed to load.
                </div>
            </div>
        );
    }

    const providerLogoUrl = paymentSettings?.[
        `${transaction.provider.toLowerCase()}_logo_url` as keyof typeof paymentSettings
    ] as string | null | undefined;

    const bookingLink = transaction.transactable
        ? bookingRoute(
              transaction.transactable.type,
              transaction.transactable.id
          )
        : null;

    const hasDiscount =
        transaction.discount_amount != null ||
        transaction.coupon != null ||
        transaction.discount_rule != null;

    return (
        <PermisssionGuard permission={PERMISSIONS.TRANSACTIONS.VIEW_ALL}>
            <div
                className="container-fluid py-4 px-4"
                style={{ maxWidth: 920 }}
            >
                {/* Toolbar */}
                <div className="d-flex align-items-center justify-content-between mb-4">
                    <Button
                        variant="link"
                        className="text-muted p-0 d-flex align-items-center gap-1"
                        style={{ fontSize: '0.84rem', textDecoration: 'none' }}
                        onClick={() =>
                            navigate(ROUTES.DASHBOARD.FINANCE.TRANSACTIONS.ROOT)
                        }
                    >
                        <MdArrowBack size={16} />
                        Back to Transactions
                    </Button>

                    <Button
                        variant="outline-secondary"
                        size="sm"
                        className="d-flex align-items-center gap-2"
                        style={{ fontSize: '0.8rem' }}
                        onClick={handlePrint}
                    >
                        <MdPrint size={15} />
                        Print Receipt
                    </Button>
                </div>

                {/* Under Review - resolve panel */}
                {transaction.status === 'under_review' &&
                    hasPermission(PERMISSIONS.TRANSACTIONS.RESOLVE) && (
                        <Alert
                            variant="warning"
                            className="mb-4 d-flex flex-column gap-3"
                        >
                            <div>
                                <strong>Manual Review Required</strong>
                                <p className="mb-0 mt-1" style={{ fontSize: '0.87rem' }}>
                                    This payment requires manual review. Approve
                                    if the amount is confirmed correct, or reject
                                    if the payment is invalid.
                                </p>
                            </div>

                            {pendingAction ? (
                                <div className="d-flex flex-column gap-2">
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        placeholder={`Optional notes for ${pendingAction === 'approve' ? 'approval' : 'rejection'}...`}
                                        value={resolveNotes}
                                        onChange={e =>
                                            setResolveNotes(e.target.value)
                                        }
                                        style={{ fontSize: '0.85rem' }}
                                    />
                                    <div className="d-flex gap-2">
                                        <Button
                                            variant={
                                                pendingAction === 'approve'
                                                    ? 'success'
                                                    : 'danger'
                                            }
                                            size="sm"
                                            disabled={resolveTransaction.isPending}
                                            onClick={() => {
                                                resolveTransaction.mutate(
                                                    {
                                                        action: pendingAction,
                                                        notes:
                                                            resolveNotes.trim() ||
                                                            undefined,
                                                    },
                                                    {
                                                        onSuccess: () => {
                                                            setPendingAction(
                                                                null
                                                            );
                                                            setResolveNotes('');
                                                        },
                                                    }
                                                );
                                            }}
                                        >
                                            {resolveTransaction.isPending
                                                ? 'Processing...'
                                                : `Confirm ${pendingAction === 'approve' ? 'Approval' : 'Rejection'}`}
                                        </Button>
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            disabled={resolveTransaction.isPending}
                                            onClick={() => {
                                                setPendingAction(null);
                                                setResolveNotes('');
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="d-flex gap-2">
                                    <Button
                                        variant="success"
                                        size="sm"
                                        onClick={() =>
                                            setPendingAction('approve')
                                        }
                                    >
                                        Approve Payment
                                    </Button>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() =>
                                            setPendingAction('reject')
                                        }
                                    >
                                        Reject Payment
                                    </Button>
                                </div>
                            )}
                        </Alert>
                    )}

                {/* Printable content */}
                <div>
                    {/* Header card */}
                    <div
                        className="rounded-3 shadow-sm mb-4 p-4"
                        style={{
                            background:
                                'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                            color: '#fff',
                        }}
                    >
                        <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
                            <div>
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <MdReceipt
                                        size={20}
                                        style={{ opacity: 0.7 }}
                                    />
                                    <span
                                        className="font-monospace"
                                        style={{
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            letterSpacing: '0.03em',
                                        }}
                                    >
                                        {transaction.reference}
                                    </span>
                                </div>
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <Badge
                                        bg={
                                            TYPE_VARIANT[transaction.type] ??
                                            'secondary'
                                        }
                                    >
                                        {transaction.type_label}
                                    </Badge>
                                    <Badge
                                        bg={
                                            STATUS_VARIANT[
                                                transaction.status
                                            ] ?? 'secondary'
                                        }
                                    >
                                        {transaction.status_label}
                                    </Badge>
                                    {transaction.channel && (
                                        <Badge
                                            bg={getChannelVariant(
                                                transaction.channel
                                            )}
                                        >
                                            {formatChannelLabel(
                                                transaction.channel
                                            )}
                                        </Badge>
                                    )}
                                </div>
                                <div
                                    className="mt-2"
                                    style={{
                                        fontSize: '0.78rem',
                                        opacity: 0.6,
                                    }}
                                >
                                    {new Date(
                                        transaction.created_at
                                    ).toLocaleString('en-GB', {
                                        weekday: 'long',
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </div>
                            </div>

                            <AmountDisplay
                                amount={transaction.amount}
                                status={transaction.status}
                                formatCurrency={fmtTx}
                            />
                        </div>
                    </div>

                    <Row className="g-4">
                        <Col xs={12} md={7}>
                            {/* Payment Details */}
                            <Section
                                icon={<MdReceipt />}
                                title="Payment Details"
                            >
                                <InfoRow
                                    label="Reference"
                                    value={transaction.reference}
                                    mono
                                />
                                {transaction.provider_reference && (
                                    <InfoRow
                                        label="Provider Reference"
                                        value={transaction.provider_reference}
                                        mono
                                    />
                                )}
                                <InfoRow
                                    label="Provider"
                                    value={
                                        <ProviderBadge
                                            provider={transaction.provider}
                                            logoUrl={providerLogoUrl}
                                        />
                                    }
                                />
                                <InfoRow
                                    label="Channel"
                                    value={
                                        transaction.channel ? (
                                            <Badge
                                                bg={getChannelVariant(
                                                    transaction.channel
                                                )}
                                                style={{ fontSize: '0.72rem' }}
                                            >
                                                {formatChannelLabel(
                                                    transaction.channel
                                                )}
                                            </Badge>
                                        ) : null
                                    }
                                />
                                {transaction.gateway_amount != null &&
                                    transaction.gateway_amount !==
                                        transaction.amount && (
                                        <InfoRow
                                            label="Actual Amount Paid"
                                            value={`${transaction.gateway_currency ?? 'GHS'} ${Number(transaction.gateway_amount).toFixed(2)}`}
                                            mono
                                        />
                                    )}
                                <InfoRow
                                    label="Payment Phone"
                                    value={transaction.payment_phone}
                                    mono
                                />
                                {(transaction.card_display ||
                                    transaction.card_bin) && (
                                    <InfoRow
                                        label="Card"
                                        value={
                                            transaction.card_display ??
                                            `${transaction.card_bin}***${transaction.card_last4}`
                                        }
                                        mono
                                    />
                                )}
                                <InfoRow
                                    label="Currency"
                                    value={transaction.currency}
                                />
                                <InfoRow
                                    label="Amount"
                                    value={
                                        <span
                                            style={{
                                                fontWeight: 700,
                                                fontSize: '0.95rem',
                                            }}
                                        >
                                            {fmtTx(transaction.amount)}
                                        </span>
                                    }
                                />
                                {transaction.gateway_charges != null &&
                                    transaction.gateway_charges > 0 && (
                                        <InfoRow
                                            label="Gateway Charges"
                                            value={
                                                <span
                                                    style={{
                                                        color: '#6b7280',
                                                        fontSize: '0.9rem',
                                                    }}
                                                >
                                                    {`${transaction.gateway_currency ?? 'GHS'} ${Number(transaction.gateway_charges).toFixed(2)}`}
                                                </span>
                                            }
                                        />
                                    )}
                                {transaction.customer_amount != null && (
                                    <InfoRow
                                        label="Amount Paid by Customer"
                                        value={
                                            <span
                                                style={{
                                                    fontWeight: 600,
                                                    fontSize: '0.93rem',
                                                }}
                                            >
                                                {`${transaction.gateway_currency ?? 'GHS'} ${Number(transaction.customer_amount).toFixed(2)}`}
                                            </span>
                                        }
                                    />
                                )}
                                <InfoRow
                                    label="Status"
                                    value={
                                        <Badge
                                            bg={
                                                STATUS_VARIANT[
                                                    transaction.status
                                                ] ?? 'secondary'
                                            }
                                            style={{ fontSize: '0.72rem' }}
                                        >
                                            {transaction.status_label}
                                        </Badge>
                                    }
                                />
                                <InfoRow
                                    label="Paid At"
                                    value={
                                        transaction.paid_at
                                            ? new Date(
                                                  transaction.paid_at
                                              ).toLocaleString('en-GB', {
                                                  day: '2-digit',
                                                  month: 'short',
                                                  year: 'numeric',
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                              })
                                            : null
                                    }
                                />
                                <InfoRow
                                    label="Recorded At"
                                    value={new Date(
                                        transaction.created_at
                                    ).toLocaleString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                />
                                {transaction.description && (
                                    <InfoRow
                                        label="Notes"
                                        value={transaction.description}
                                    />
                                )}
                                {transaction.processed_by && (
                                    <InfoRow
                                        label="Processed By"
                                        value={transaction.processed_by.name}
                                    />
                                )}
                            </Section>

                            {/* Payer */}
                            <Section
                                icon={<MdPerson />}
                                title="Customer / Payer"
                            >
                                <InfoRow
                                    label="Name"
                                    value={transaction.payer.name}
                                />
                                <InfoRow
                                    label="Email"
                                    value={transaction.payer.email}
                                />
                                <InfoRow
                                    label="Phone"
                                    value={transaction.payer.phone}
                                    mono
                                />
                                {transaction.payment_phone &&
                                    transaction.payment_phone !==
                                        transaction.payer.phone && (
                                        <InfoRow
                                            label="Payment Phone"
                                            value={transaction.payment_phone}
                                            mono
                                        />
                                    )}
                            </Section>

                            {/* Discount */}
                            {hasDiscount && (
                                <Section
                                    icon={<MdLocalOffer />}
                                    title="Discount Details"
                                >
                                    {transaction.discount_amount != null && (
                                        <InfoRow
                                            label="Discount Amount"
                                            value={formatCurrency(
                                                transaction.discount_amount
                                            )}
                                        />
                                    )}
                                    {transaction.discount_reason && (
                                        <InfoRow
                                            label="Reason"
                                            value={transaction.discount_reason}
                                        />
                                    )}
                                    {transaction.coupon && (
                                        <InfoRow
                                            label="Coupon"
                                            value={
                                                transaction.coupon.code
                                                    ? `${transaction.coupon.code}${transaction.coupon.name ? ` - ${transaction.coupon.name}` : ''}`
                                                    : transaction.coupon.name
                                            }
                                        />
                                    )}
                                    {transaction.discount_rule && (
                                        <InfoRow
                                            label="Discount Rule"
                                            value={
                                                transaction.discount_rule.name
                                            }
                                        />
                                    )}
                                </Section>
                            )}
                        </Col>

                        <Col xs={12} md={5}>
                            {/* Associated Booking */}
                            {transaction.transactable ? (
                                <Section
                                    icon={<MdOpenInNew />}
                                    title="Associated Booking"
                                >
                                    <InfoRow
                                        label="Booking Type"
                                        value={
                                            TRANSACTABLE_TYPE_LABELS[
                                                transaction.transactable.type
                                            ]
                                        }
                                    />
                                    <InfoRow
                                        label="Reference"
                                        value={
                                            transaction.transactable.reference
                                        }
                                        mono
                                    />
                                    {transaction.branch && (
                                        <InfoRow
                                            label="Branch"
                                            value={transaction.branch.name}
                                        />
                                    )}
                                    {bookingLink && (
                                        <div className="mt-3 no-print">
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                className="d-flex align-items-center gap-2"
                                                onClick={() =>
                                                    navigate(bookingLink)
                                                }
                                                style={{ fontSize: '0.8rem' }}
                                            >
                                                <MdOpenInNew size={14} />
                                                View Booking
                                            </Button>
                                        </div>
                                    )}
                                </Section>
                            ) : (
                                <Section
                                    icon={<MdLinkOff />}
                                    title="Associated Booking"
                                >
                                    <p
                                        className="text-muted py-2 mb-0"
                                        style={{ fontSize: '0.83rem' }}
                                    >
                                        No booking linked to this transaction.
                                    </p>
                                </Section>
                            )}

                            {/* Quick summary card */}
                            <div
                                className="rounded-3 p-4 shadow-sm"
                                style={{
                                    background:
                                        'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                    border: '1px solid #e2e8f0',
                                }}
                            >
                                <p
                                    className="text-muted mb-3"
                                    style={{
                                        fontSize: '0.75rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.06em',
                                        fontWeight: 600,
                                    }}
                                >
                                    Summary
                                </p>
                                <div className="d-flex flex-column gap-2">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span
                                            className="text-muted"
                                            style={{ fontSize: '0.82rem' }}
                                        >
                                            Provider
                                        </span>
                                        <ProviderBadge
                                            provider={transaction.provider}
                                            logoUrl={providerLogoUrl}
                                        />
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span
                                            className="text-muted"
                                            style={{ fontSize: '0.82rem' }}
                                        >
                                            Type
                                        </span>
                                        <Badge
                                            bg={
                                                TYPE_VARIANT[
                                                    transaction.type
                                                ] ?? 'secondary'
                                            }
                                            style={{ fontSize: '0.7rem' }}
                                        >
                                            {transaction.type_label}
                                        </Badge>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span
                                            className="text-muted"
                                            style={{ fontSize: '0.82rem' }}
                                        >
                                            Amount
                                        </span>
                                        <span
                                            className="fw-bold"
                                            style={{
                                                fontSize: '1rem',
                                                color:
                                                    transaction.status ===
                                                    'paid'
                                                        ? '#16a34a'
                                                        : '#1e293b',
                                            }}
                                        >
                                            {fmtTx(transaction.amount)}
                                        </span>
                                    </div>
                                    {transaction.discount_amount != null && (
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span
                                                className="text-muted"
                                                style={{ fontSize: '0.82rem' }}
                                            >
                                                Discount
                                            </span>
                                            <span
                                                className="fw-semibold text-success"
                                                style={{ fontSize: '0.88rem' }}
                                            >
                                                -
                                                {fmtTx(
                                                    transaction.discount_amount
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span
                                            className="text-muted"
                                            style={{ fontSize: '0.82rem' }}
                                        >
                                            Status
                                        </span>
                                        <Badge
                                            bg={
                                                STATUS_VARIANT[
                                                    transaction.status
                                                ] ?? 'secondary'
                                            }
                                            style={{ fontSize: '0.7rem' }}
                                        >
                                            {transaction.status_label}
                                        </Badge>
                                    </div>
                                    {transaction.channel && (
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span
                                                className="text-muted"
                                                style={{ fontSize: '0.82rem' }}
                                            >
                                                Channel
                                            </span>
                                            <span
                                                className="fw-semibold"
                                                style={{ fontSize: '0.82rem' }}
                                            >
                                                {formatChannelLabel(
                                                    transaction.channel
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>
                {/* end printRef */}
            </div>
        </PermisssionGuard>
    );
}
