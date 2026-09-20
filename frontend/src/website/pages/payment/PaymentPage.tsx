import { useState, useEffect, useCallback } from 'react';
import {
    useParams,
    useSearchParams,
    useNavigate,
    useLocation,
    Link,
} from 'react-router-dom';
import { useEchoPublic } from '@laravel/echo-react';
import { useQuery } from '@tanstack/react-query';
import { useTitle } from '@/shared/hooks';
import { usePayment } from '@/shared/hooks/usePayment';
import { paymentService } from '@/services/paymentService';
import type {
    InitiatePaymentPayload,
    TransactableType,
} from '@/shared/types/payment.types';

const DEFAULT_LOGOS: Record<string, string> = {
    paystack:
        'http://profitbooks.net/wp-content/uploads/2020/01/paystack-logo.jpg',
    stripe: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg',
    hubtel: 'https://hubtel.com/_nuxt/hubtel-primary-logo.DE_lS_hk.svg',
};

const BOOKING_LABELS: Record<string, string> = {
    rental: 'Vehicle Rental',
    airport_booking: 'Airport Transfer',
    chauffeur_booking: 'Chauffeur Service',
};

const DAMAGE_BOOKING_LABEL = 'Damage / Repair Cost';
const DEPOSIT_BOOKING_LABEL = 'Security Deposit';

const BOOKING_PAID_MESSAGES: Record<string, string> = {
    rental: 'Payment for this rental has already been made.',
    airport_booking: 'Payment for this airport transfer has already been made.',
    chauffeur_booking:
        'Payment for this chauffeur booking has already been made.',
};

const DAMAGE_PAID_MESSAGE =
    'Payment for this damage / repair charge has already been settled.';
const DEPOSIT_PAID_MESSAGE =
    'The security deposit for this booking has already been collected.';

const BOOKING_ICONS: Record<string, string> = {
    rental: 'fas fa-car',
    airport_booking: 'fas fa-plane',
    chauffeur_booking: 'fas fa-user-tie',
};

type PageState =
    | 'idle'
    | 'loading'
    | 'redirecting'
    | 'success'
    | 'failed'
    | 'pending_confirmation';

/* ---------- shared shell ---------- */
function PageShell({
    gradient,
    children,
}: {
    gradient: string;
    children: React.ReactNode;
}) {
    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: gradient,
                padding: '24px 16px',
            }}
        >
            {children}
        </div>
    );
}

/* ---------- status card ---------- */
function StatusCard({
    icon,
    iconBg,
    title,
    children,
}: {
    icon: string;
    iconBg: string;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div
            style={{
                background: '#fff',
                borderRadius: 20,
                boxShadow: '0 20px 60px rgba(0,0,0,0.10)',
                padding: '40px 32px',
                maxWidth: 440,
                width: '100%',
                textAlign: 'center',
            }}
        >
            <div
                style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                }}
            >
                <i
                    className={`${icon} text-white`}
                    style={{ fontSize: '1.6rem' }}
                />
            </div>
            <h4
                style={{
                    fontWeight: 700,
                    marginBottom: 8,
                    letterSpacing: '-0.02em',
                }}
            >
                {title}
            </h4>
            {children}
        </div>
    );
}

/* ---------- ref badge ---------- */
function RefBadge({
    reference,
    color = '#166534',
    bg = '#f0fdf4',
    border = '#86efac',
}: {
    reference: string;
    color?: string;
    bg?: string;
    border?: string;
}) {
    return (
        <div
            style={{
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: 10,
                padding: '10px 16px',
                marginBottom: 16,
            }}
        >
            <div
                style={{
                    fontSize: 10,
                    color,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 4,
                }}
            >
                Payment Reference
            </div>
            <div
                style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color,
                    letterSpacing: '0.04em',
                    wordBreak: 'break-all',
                }}
            >
                {reference}
            </div>
        </div>
    );
}

export default function PaymentPage() {
    const title = useTitle('Secure Payment');
    const { transactableType, transactableId } = useParams<{
        transactableType: string;
        transactableId: string;
    }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();

    const { pay, redirect, config, isLoading: configLoading } = usePayment();

    const [pageState, setPageState] = useState<PageState>('idle');
    const [reference, setReference] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [form, setForm] = useState({
        name: searchParams.get('name') ?? '',
        email: searchParams.get('email') ?? '',
        phone: searchParams.get('phone') ?? '',
    });

    const bookingRef = searchParams.get('booking_ref') ?? '';
    const purpose = searchParams.get('purpose') ?? undefined;

    const isCallback =
        Boolean(searchParams.get('reference') ?? searchParams.get('trxref')) ||
        searchParams.get('status') === 'success' ||
        searchParams.get('status') === 'cancelled';

    const { data: payableData, isLoading: amountLoading } = useQuery({
        queryKey: ['payable-amount', transactableType, transactableId, purpose],
        queryFn: () =>
            paymentService.getPayableAmount(
                transactableType!,
                transactableId!,
                purpose
            ),
        enabled: Boolean(
            transactableType &&
                transactableId &&
                (!isCallback || pageState === 'success')
        ),
        staleTime: 60_000,
    });

    const amount = payableData?.data?.amount ?? 0;
    const currency =
        payableData?.data?.currency ?? config?.payment_currency ?? 'GHS';
    const customerProfileComplete =
        payableData?.data?.customer_profile_complete ?? true;
    const profileCompleteToken =
        payableData?.data?.profile_complete_token ?? null;
    const alreadyPaid = payableData?.data?.already_paid ?? false;

    useEffect(() => {
        const ref = searchParams.get('reference') ?? searchParams.get('trxref');
        const explicitStatus = searchParams.get('status');

        const goCancelled = (r?: string | null) => {
            const qs = new URLSearchParams();
            if (r) {
                qs.set('reference', r);
            }
            if (transactableType) {
                qs.set('type', transactableType);
            }
            if (transactableId) {
                qs.set('id', transactableId);
            }
            if (purpose) {
                qs.set('purpose', purpose);
            }
            const name = searchParams.get('name');
            const email = searchParams.get('email');
            const phone = searchParams.get('phone');
            const bookingRefParam = searchParams.get('booking_ref');
            if (name) {
                qs.set('name', name);
            }
            if (email) {
                qs.set('email', email);
            }
            if (phone) {
                qs.set('phone', phone);
            }
            if (bookingRefParam) {
                qs.set('booking_ref', bookingRefParam);
            }
            navigate(`/payment/cancelled?${qs.toString()}`, { replace: true });
        };

        if (explicitStatus === 'cancelled' || explicitStatus === 'failed') {
            goCancelled(ref);
            return;
        }

        if (ref) {
            setReference(ref);
            setPageState('loading');

            paymentService
                .verify(ref)
                .then(res => {
                    const status = res.data?.status;
                    if (status === 'paid') {
                        setPageState('success');
                    } else if (status === 'failed') {
                        goCancelled(ref);
                    } else {
                        /*
                         * verify returned pending - payment may still be processing.
                         * Paystack abandoned maps to 'failed' in the adapter, so 'pending'
                         * here is always a genuine processing state. Show pending_confirmation
                         * for all providers so the user is not prematurely shown cancelled.
                         */
                        setPageState('pending_confirmation');
                    }
                })
                .catch(() => {
                    setPageState('pending_confirmation');
                });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEchoPublic<{ status: string; reference: string }>(
        reference ? `payment.${reference}` : '',
        '.PaymentStatusUpdated',
        useCallback((data: { status: string; reference: string }) => {
            if (data.status === 'paid') {
                setPageState('success');
            } else if (data.status === 'failed') {
                setPageState('failed');
                setErrorMessage(
                    'Payment could not be confirmed. Please contact support.'
                );
            }
        }, []),
        [reference]
    );

    /* DB-only status poll - resolves silently when webhook or job confirms payment */
    useEffect(() => {
        if (pageState !== 'pending_confirmation' || !reference) {
            return;
        }

        const intervalId = setInterval(() => {
            paymentService
                .getStatus(reference)
                .then(res => {
                    const status = res.data?.status;
                    if (status === 'paid') {
                        clearInterval(intervalId);
                        setPageState('success');
                    } else if (status === 'failed') {
                        clearInterval(intervalId);
                        setPageState('failed');
                        setErrorMessage(
                            'Payment could not be confirmed. Please contact support.'
                        );
                    }
                    /* pending / under_review: keep polling, never timeout to failed */
                })
                .catch(() => { /* network error: keep polling silently */ });
        }, 15000);

        return () => clearInterval(intervalId);
    }, [pageState, reference]);

    const handlePay = async () => {
        if (!config) {
            return;
        }

        if (!config.enable_online_payments) {
            const parts: string[] = [
                'Online payments are currently disabled.',
                'Kindly contact support to complete your booking',
            ];
            const contactBits: string[] = [];
            if (config.support_email) {
                contactBits.push(config.support_email);
            }
            if (config.support_phone) {
                contactBits.push(config.support_phone);
            }
            if (contactBits.length > 0) {
                parts[1] = `Kindly contact support at ${contactBits.join(' or ')} to complete your booking`;
            }
            const refSuffix = bookingRef
                ? ` Booking reference: ${bookingRef}.`
                : '';
            setErrorMessage(`${parts[0]} ${parts[1]}.${refSuffix}`);
            setPageState('failed');
            return;
        }

        if (!form.name || !form.email || !form.phone) {
            setErrorMessage('Please fill in all required fields.');
            return;
        }

        setPageState('loading');
        setErrorMessage('');

        try {
            const callbackBase = `${window.location.origin}/payment/${transactableType}/${transactableId}`;
            const callbackParams = new URLSearchParams({
                name: form.name,
                email: form.email,
                phone: form.phone,
                ...(bookingRef ? { booking_ref: bookingRef } : {}),
                ...(purpose ? { purpose } : {}),
            });
            const callbackUrl = `${callbackBase}?${callbackParams.toString()}`;

            const payload: InitiatePaymentPayload = {
                amount,
                currency,
                payer_email: form.email,
                payer_phone: form.phone,
                payer_name: form.name,
                transactable_type: transactableType as TransactableType,
                transactable_id: transactableId!,
                return_url: callbackUrl,
                callback_url: callbackUrl,
                ...(purpose ? { metadata: { purpose } } : {}),
            };

            const result = await pay(payload);
            setReference(result.reference);
            setPageState('redirecting');

            setTimeout(() => {
                redirect(result.authorization_url);
            }, 1200);
        } catch {
            setPageState('failed');
            setErrorMessage(
                'An error occurred while initiating the payment. Please try again.'
            );
        }
    };

    const provider = config?.payment_provider ?? 'paystack';
    const logoUrl =
        ((config as unknown as Record<string, unknown>)?.[
            `${provider}_logo_url`
        ] as string | null | undefined) ?? DEFAULT_LOGOS[provider];

    const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
    const bookingLabel =
        purpose === 'damage'
            ? DAMAGE_BOOKING_LABEL
            : purpose === 'deposit'
              ? DEPOSIT_BOOKING_LABEL
              : (BOOKING_LABELS[transactableType ?? ''] ?? 'Booking');
    const bookingIcon =
        purpose === 'damage'
            ? 'fas fa-tools'
            : purpose === 'deposit'
              ? 'fas fa-shield-alt'
              : (BOOKING_ICONS[transactableType ?? ''] ?? 'fas fa-receipt');

    /* ---- Loading ---- */
    if (configLoading || (amountLoading && !isCallback)) {
        return (
            <PageShell gradient="linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)">
                {title}
                <div style={{ textAlign: 'center' }}>
                    <div
                        className="spinner-border"
                        style={{ color: '#6366f1', width: 36, height: 36 }}
                        role="status"
                    />
                    <p
                        style={{
                            color: '#6b7280',
                            fontSize: 14,
                            marginTop: 12,
                        }}
                    >
                        Loading payment details...
                    </p>
                </div>
            </PageShell>
        );
    }

    /* ---- Online payments disabled (first land, no callback in progress) ---- */
    if (
        config &&
        !config.enable_online_payments &&
        pageState === 'idle' &&
        !isCallback
    ) {
        const email = config.support_email;
        const phone = config.support_phone;
        return (
            <PageShell gradient="linear-gradient(135deg, #fff7ed 0%, #fefce8 100%)">
                {title}
                <StatusCard
                    icon="fas fa-ban"
                    iconBg="linear-gradient(135deg, #f59e0b, #d97706)"
                    title="Online Payments Disabled"
                >
                    <p
                        style={{
                            color: '#6b7280',
                            fontSize: 14,
                            marginBottom: 16,
                            lineHeight: 1.5,
                        }}
                    >
                        Your booking has been received, but online payments are
                        temporarily disabled. Kindly contact support with your
                        booking reference below to complete payment and confirm
                        your reservation.
                    </p>
                    {bookingRef && (
                        <div
                            style={{
                                background: '#fef3c7',
                                border: '1px dashed #f59e0b',
                                borderRadius: 10,
                                padding: '12px 16px',
                                marginBottom: 16,
                                textAlign: 'center',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 11,
                                    color: '#92400e',
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    fontWeight: 600,
                                    marginBottom: 2,
                                }}
                            >
                                Booking Reference
                            </div>
                            <div
                                style={{
                                    fontFamily: 'monospace',
                                    fontSize: 15,
                                    color: '#78350f',
                                    fontWeight: 700,
                                    letterSpacing: 0.5,
                                }}
                            >
                                {bookingRef}
                            </div>
                        </div>
                    )}
                    {(email || phone) && (
                        <div
                            style={{
                                background: '#fffbeb',
                                border: '1px solid #fde68a',
                                borderRadius: 10,
                                padding: '14px 16px',
                                textAlign: 'left',
                                marginBottom: 20,
                            }}
                        >
                            {email && (
                                <div style={{ marginBottom: phone ? 8 : 0 }}>
                                    <i
                                        className="fas fa-envelope me-2"
                                        style={{ color: '#b45309' }}
                                    />
                                    <a
                                        href={`mailto:${email}`}
                                        style={{
                                            color: '#92400e',
                                            fontWeight: 600,
                                            textDecoration: 'none',
                                            fontSize: 14,
                                        }}
                                    >
                                        {email}
                                    </a>
                                </div>
                            )}
                            {phone && (
                                <div>
                                    <i
                                        className="fas fa-phone me-2"
                                        style={{ color: '#b45309' }}
                                    />
                                    <a
                                        href={`tel:${phone}`}
                                        style={{
                                            color: '#92400e',
                                            fontWeight: 600,
                                            textDecoration: 'none',
                                            fontSize: 14,
                                        }}
                                    >
                                        {phone}
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                    <Link
                        to="/"
                        style={{
                            display: 'block',
                            background: '#f1f5f9',
                            color: '#374151',
                            borderRadius: 10,
                            padding: '13px 0',
                            fontWeight: 600,
                            fontSize: 14,
                            textDecoration: 'none',
                        }}
                    >
                        Return to Home
                    </Link>
                </StatusCard>
            </PageShell>
        );
    }

    /* ---- Already Paid (back button / re-entry) ---- */
    if (alreadyPaid && pageState === 'idle' && !isCallback) {
        const isCouponCovered = amount === 0 && purpose !== 'damage';
        const paidTitle = isCouponCovered
            ? 'Booking Confirmed'
            : 'Already Paid';
        const paidMessage = isCouponCovered
            ? 'Your booking is fully covered by your coupon discount. No payment is required.'
            : purpose === 'damage'
              ? DAMAGE_PAID_MESSAGE
              : purpose === 'deposit'
                ? DEPOSIT_PAID_MESSAGE
                : (BOOKING_PAID_MESSAGES[transactableType ?? ''] ??
                  'Payment for this booking has already been made.');
        return (
            <PageShell gradient="linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)">
                {title}
                <StatusCard
                    icon="fas fa-check-circle"
                    iconBg="linear-gradient(135deg, #22c55e, #16a34a)"
                    title={paidTitle}
                >
                    <p
                        style={{
                            color: '#6b7280',
                            fontSize: 14,
                            marginBottom: 20,
                            lineHeight: 1.5,
                        }}
                    >
                        {paidMessage}
                        {isCouponCovered
                            ? ''
                            : ' No further payment is required.'}
                    </p>
                    {bookingRef && <RefBadge reference={bookingRef} />}
                    <Link
                        to="/"
                        style={{
                            display: 'block',
                            background:
                                'linear-gradient(135deg, #22c55e, #16a34a)',
                            color: '#fff',
                            borderRadius: 10,
                            padding: '13px 0',
                            fontWeight: 600,
                            fontSize: 14,
                            textDecoration: 'none',
                        }}
                    >
                        Return to Home
                    </Link>
                </StatusCard>
            </PageShell>
        );
    }

    /* ---- Success ---- */
    if (pageState === 'success') {
        return (
            <PageShell gradient="linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)">
                {title}
                <StatusCard
                    icon="fas fa-check"
                    iconBg="linear-gradient(135deg, #22c55e, #16a34a)"
                    title="Payment Confirmed!"
                >
                    <p
                        style={{
                            color: '#6b7280',
                            fontSize: 14,
                            marginBottom: 20,
                        }}
                    >
                        {purpose === 'damage'
                            ? 'Your damage / repair cost payment has been received and settled.'
                            : `Your ${bookingLabel.toLowerCase()} payment${bookingRef ? ` for booking ${bookingRef}` : ''} has been successfully confirmed.`}
                    </p>

                    {reference && <RefBadge reference={reference} />}

                    {form.email && (
                        <div
                            style={{
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: 10,
                                padding: '14px 16px',
                                textAlign: 'left',
                                marginBottom: 20,
                            }}
                        >
                            <p
                                style={{
                                    fontSize: 13,
                                    color: '#1e40af',
                                    fontWeight: 600,
                                    marginBottom: 6,
                                }}
                            >
                                <i className="fas fa-envelope me-2" />
                                Confirmation sent to{' '}
                                <strong>{form.email}</strong>
                            </p>
                            <p
                                style={{
                                    fontSize: 12,
                                    color: '#1d4ed8',
                                    marginBottom: 0,
                                    lineHeight: 1.6,
                                }}
                            >
                                {purpose === 'deposit'
                                    ? 'Your security deposit payment confirmation has been sent to your inbox. Check your spam folder if you don\'t see it shortly.'
                                    : purpose === 'damage'
                                      ? 'Your payment receipt has been sent to your inbox. Check your spam folder if you don\'t see it shortly.'
                                      : 'Your receipt and booking details have been sent to your inbox. Check your spam folder if you don\'t see it shortly.'}
                            </p>
                        </div>
                    )}

                    {transactableType === 'rental' &&
                        purpose !== 'damage' &&
                        purpose !== 'deposit' &&
                        !customerProfileComplete && (
                            <>
                                <div
                                    style={{
                                        background: '#fffbeb',
                                        border: '1px solid #fbbf24',
                                        borderRadius: 10,
                                        padding: '14px 16px',
                                        textAlign: 'left',
                                        marginBottom: 12,
                                    }}
                                >
                                    <p
                                        style={{
                                            fontSize: 12,
                                            color: '#92400e',
                                            fontWeight: 700,
                                            marginBottom: 6,
                                        }}
                                    >
                                        <i className="fas fa-exclamation-triangle me-2" />
                                        Action Required - Booking Pending
                                    </p>
                                    <p
                                        style={{
                                            fontSize: 12,
                                            color: '#78350f',
                                            marginBottom: 0,
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        Your payment has been received, but your
                                        booking will not be confirmed until you
                                        complete your profile and submit your
                                        documents for verification.
                                    </p>
                                </div>
                                {profileCompleteToken && (
                                    <>
                                        <a
                                            href={`/complete-profile/${profileCompleteToken}`}
                                            style={{
                                                display: 'block',
                                                background:
                                                    'linear-gradient(135deg, #d97706, #b45309)',
                                                color: '#fff',
                                                borderRadius: 10,
                                                padding: '13px 0',
                                                fontWeight: 600,
                                                fontSize: 14,
                                                textDecoration: 'none',
                                                textAlign: 'center',
                                                marginBottom: 8,
                                            }}
                                        >
                                            Complete Your Profile Now
                                        </a>
                                        <p
                                            style={{
                                                fontSize: 11,
                                                color: '#9ca3af',
                                                textAlign: 'center',
                                                marginBottom: 16,
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            Don&apos;t have your documents
                                            handy? You can complete your profile
                                            later using the link sent to your
                                            email.
                                        </p>
                                    </>
                                )}
                            </>
                        )}

                    {transactableType === 'rental' &&
                        purpose !== 'damage' &&
                        purpose !== 'deposit' &&
                        customerProfileComplete && (
                            <div
                                style={{
                                    background: '#fffbeb',
                                    border: '1px solid #fbbf24',
                                    borderRadius: 10,
                                    padding: '14px 16px',
                                    textAlign: 'left',
                                    marginBottom: 16,
                                }}
                            >
                                <p
                                    style={{
                                        fontSize: 12,
                                        color: '#92400e',
                                        fontWeight: 700,
                                        marginBottom: 4,
                                    }}
                                >
                                    <i className="fas fa-exclamation-triangle me-2" />
                                    Important
                                </p>
                                <p
                                    style={{
                                        fontSize: 12,
                                        color: '#78350f',
                                        marginBottom: 0,
                                        lineHeight: 1.6,
                                    }}
                                >
                                    Please bring your valid driver&apos;s
                                    license and required ID documents on pickup
                                    day. Ensure your licence has not expired.
                                </p>
                            </div>
                        )}

                    <Link
                        to="/"
                        style={{
                            display: 'block',
                            background:
                                'linear-gradient(135deg, #22c55e, #16a34a)',
                            color: '#fff',
                            borderRadius: 10,
                            padding: '13px 0',
                            fontWeight: 600,
                            fontSize: 14,
                            textDecoration: 'none',
                            transition: 'opacity 0.2s',
                        }}
                    >
                        Return to Home
                    </Link>
                </StatusCard>
            </PageShell>
        );
    }

    /* ---- Failed / Cancelled ---- */
    if (pageState === 'failed') {
        return (
            <PageShell gradient="linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%)">
                {title}
                <StatusCard
                    icon="fas fa-times"
                    iconBg="linear-gradient(135deg, #ef4444, #dc2626)"
                    title="Payment Failed"
                >
                    <p
                        style={{
                            color: '#6b7280',
                            fontSize: 14,
                            marginBottom: 24,
                        }}
                    >
                        {errorMessage ||
                            'Something went wrong. Please try again.'}
                    </p>
                    <button
                        type="button"
                        style={{
                            display: 'block',
                            width: '100%',
                            background:
                                'linear-gradient(135deg, #ef4444, #dc2626)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 10,
                            padding: '13px 0',
                            fontWeight: 600,
                            fontSize: 14,
                            cursor: 'pointer',
                            marginBottom: 10,
                        }}
                        onClick={() => {
                            setErrorMessage('');
                            setReference(null);
                            setPageState('idle');
                            const retryParams = new URLSearchParams();
                            if (form.name) {
                                retryParams.set('name', form.name);
                            }
                            if (form.email) {
                                retryParams.set('email', form.email);
                            }
                            if (form.phone) {
                                retryParams.set('phone', form.phone);
                            }
                            if (bookingRef) {
                                retryParams.set('booking_ref', bookingRef);
                            }
                            if (purpose) {
                                retryParams.set('purpose', purpose);
                            }
                            const qs = retryParams.toString();
                            navigate(
                                `${location.pathname}${qs ? `?${qs}` : ''}`,
                                { replace: true }
                            );
                        }}
                    >
                        Try Again
                    </button>
                    <Link
                        to="/"
                        style={{
                            display: 'block',
                            background: '#f1f5f9',
                            color: '#374151',
                            borderRadius: 10,
                            padding: '13px 0',
                            fontWeight: 600,
                            fontSize: 14,
                            textDecoration: 'none',
                        }}
                    >
                        Return to Home
                    </Link>
                </StatusCard>
            </PageShell>
        );
    }

    /* ---- Redirecting ---- */
    if (pageState === 'redirecting') {
        return (
            <PageShell gradient="linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)">
                {title}
                <StatusCard
                    icon="fas fa-arrow-right"
                    iconBg="linear-gradient(135deg, #6366f1, #4f46e5)"
                    title={`Redirecting to ${providerName}...`}
                >
                    {logoUrl && (
                        <img
                            src={logoUrl}
                            alt={providerName}
                            style={{
                                height: 28,
                                display: 'block',
                                margin: '0 auto 16px',
                                objectFit: 'contain',
                            }}
                        />
                    )}
                    <div
                        className="spinner-border"
                        style={{
                            color: '#6366f1',
                            width: 28,
                            height: 28,
                            display: 'block',
                            margin: '0 auto 12px',
                        }}
                        role="status"
                    />
                    <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>
                        Please do not close this window.
                    </p>
                </StatusCard>
            </PageShell>
        );
    }

    /* ---- Verifying ---- */
    if (pageState === 'loading') {
        return (
            <PageShell gradient="linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)">
                {title}
                <StatusCard
                    icon="fas fa-search"
                    iconBg="linear-gradient(135deg, #6366f1, #4f46e5)"
                    title="Verifying Payment..."
                >
                    <div
                        className="spinner-border"
                        style={{
                            color: '#6366f1',
                            width: 28,
                            height: 28,
                            marginBottom: 12,
                        }}
                        role="status"
                    />
                    <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>
                        Please wait while we confirm your transaction.
                    </p>
                </StatusCard>
            </PageShell>
        );
    }

    /* ---- Booking Received (payment submitted, awaiting webhook/job confirmation) ---- */
    if (pageState === 'pending_confirmation') {
        return (
            <PageShell gradient="linear-gradient(135deg, #eef2ff 0%, #f0f4ff 100%)">
                {title}
                <StatusCard
                    icon="fas fa-paper-plane"
                    iconBg="linear-gradient(135deg, #6366f1, #4f46e5)"
                    title="Booking Received!"
                >
                    <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                        Your payment has been submitted and is being processed. You&apos;ll
                        receive a confirmation email with your receipt once your payment is
                        verified.
                    </p>

                    {reference && (
                        <RefBadge
                            reference={reference}
                            color="#3730a3"
                            bg="#eef2ff"
                            border="#c7d2fe"
                        />
                    )}

                    {form.email && (
                        <div style={{
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: 10,
                            padding: '14px 16px',
                            textAlign: 'left',
                            marginBottom: 20,
                        }}>
                            <p style={{ fontSize: 13, color: '#1e40af', fontWeight: 600, marginBottom: 4 }}>
                                <i className="fas fa-envelope me-2" />
                                Confirmation will be sent to <strong>{form.email}</strong>
                            </p>
                            <p style={{ fontSize: 12, color: '#1d4ed8', marginBottom: 0, lineHeight: 1.6 }}>
                                Check your inbox (and spam folder) after a few minutes.
                            </p>
                        </div>
                    )}

                    <Link
                        to={bookingRef ? `/track/${bookingRef}` : '/track'}
                        style={{
                            display: 'block',
                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                            color: '#fff',
                            borderRadius: 10,
                            padding: '13px 0',
                            fontWeight: 600,
                            fontSize: 14,
                            textDecoration: 'none',
                            marginBottom: 10,
                        }}
                    >
                        <i className="fas fa-search-location me-2" />
                        Track Your Rental
                    </Link>

                    <Link
                        to="/"
                        style={{
                            display: 'block',
                            background: '#f1f5f9',
                            color: '#374151',
                            borderRadius: 10,
                            padding: '13px 0',
                            fontWeight: 600,
                            fontSize: 14,
                            textDecoration: 'none',
                            marginBottom: 16,
                        }}
                    >
                        Return to Home
                    </Link>

                    <p style={{ color: '#9ca3af', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                        The system checks automatically. Contact support with your reference
                        number if you don&apos;t receive a confirmation within 30 minutes.
                    </p>
                </StatusCard>
            </PageShell>
        );
    }

    /* ---- Main Payment Form ---- */
    return (
        <div
            style={{
                minHeight: '100vh',
                background:
                    'linear-gradient(160deg, #f8faff 0%, #eef2ff 60%, #f0fdf4 100%)',
                paddingTop: 100,
                paddingBottom: 60,
            }}
        >
            {title}

            {/* Header */}
            <div
                style={{
                    textAlign: 'center',
                    marginBottom: 40,
                    padding: '0 16px',
                }}
            >
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        color: '#fff',
                        borderRadius: 20,
                        padding: '5px 14px',
                        fontSize: 12,
                        fontWeight: 600,
                        marginBottom: 16,
                        letterSpacing: '0.04em',
                    }}
                >
                    <i className="fas fa-shield-alt" />
                    Secure Checkout
                </div>
                <h2
                    style={{
                        fontWeight: 800,
                        fontSize: 'clamp(22px, 4vw, 30px)',
                        letterSpacing: '-0.03em',
                        marginBottom: 8,
                        color: '#111827',
                    }}
                >
                    Complete Your Payment
                </h2>
                <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
                    Protected by 256-bit SSL encryption
                </p>
            </div>

            <div
                style={{
                    maxWidth: 860,
                    margin: '0 auto',
                    padding: '0 16px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 20,
                }}
            >
                {/* Left - Order Summary */}
                <div
                    style={{
                        background: '#fff',
                        borderRadius: 18,
                        boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
                        padding: '28px 24px',
                    }}
                >
                    <p
                        style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#9ca3af',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            marginBottom: 20,
                        }}
                    >
                        Order Summary
                    </p>

                    {/* Service icon + label */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            marginBottom: 24,
                        }}
                    >
                        <div
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 12,
                                background:
                                    'linear-gradient(135deg, #6366f1, #4f46e5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <i className={`${bookingIcon} text-white`} />
                        </div>
                        <div>
                            <div
                                style={{
                                    fontWeight: 600,
                                    fontSize: 15,
                                    color: '#111827',
                                }}
                            >
                                {bookingLabel}
                            </div>
                            {bookingRef && (
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: '#9ca3af',
                                        marginTop: 2,
                                    }}
                                >
                                    Ref: {bookingRef}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pricing breakdown */}
                    <div
                        style={{
                            background: '#f8faff',
                            border: '1px solid #e0e7ff',
                            borderRadius: 12,
                            padding: '14px 16px',
                            marginBottom: 20,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: 8,
                            }}
                        >
                            <span style={{ fontSize: 13, color: '#6b7280' }}>
                                Subtotal
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 500 }}>
                                {currency} {amount.toFixed(2)}
                            </span>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: 10,
                            }}
                        >
                            <span style={{ fontSize: 13, color: '#6b7280' }}>
                                Fees
                            </span>
                            <span
                                style={{
                                    fontSize: 13,
                                    color: '#22c55e',
                                    fontWeight: 500,
                                }}
                            >
                                Included
                            </span>
                        </div>
                        <div
                            style={{
                                borderTop: '1px solid #e0e7ff',
                                paddingTop: 10,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <span style={{ fontWeight: 700, fontSize: 14 }}>
                                Total
                            </span>
                            <span
                                style={{
                                    fontWeight: 800,
                                    fontSize: 18,
                                    color: '#4f46e5',
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                {currency} {amount.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Provider trust */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: 10,
                            padding: '12px 14px',
                        }}
                    >
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={providerName}
                                style={{
                                    height: 18,
                                    objectFit: 'contain',
                                    flexShrink: 0,
                                }}
                            />
                        ) : (
                            <i
                                className="fas fa-shield-alt"
                                style={{ color: '#16a34a' }}
                            />
                        )}
                        <p
                            style={{
                                fontSize: 12,
                                color: '#166534',
                                margin: 0,
                                lineHeight: 1.4,
                            }}
                        >
                            Powered by <strong>{providerName}</strong>. Payment
                            details are encrypted and never stored.
                        </p>
                    </div>
                </div>

                {/* Right - Payer Details */}
                <div
                    style={{
                        background: '#fff',
                        borderRadius: 18,
                        boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
                        padding: '28px 24px',
                    }}
                >
                    <p
                        style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#9ca3af',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            marginBottom: 20,
                        }}
                    >
                        Your Details
                    </p>

                    {errorMessage && (
                        <div
                            style={{
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: 10,
                                padding: '10px 14px',
                                marginBottom: 16,
                                fontSize: 13,
                                color: '#991b1b',
                            }}
                        >
                            <i className="fas fa-exclamation-circle me-2" />
                            {errorMessage}
                        </div>
                    )}

                    {[
                        {
                            key: 'name',
                            label: 'Full Name',
                            type: 'text',
                            placeholder: 'John Doe',
                        },
                        {
                            key: 'email',
                            label: 'Email Address',
                            type: 'email',
                            placeholder: 'you@example.com',
                        },
                        {
                            key: 'phone',
                            label: 'Phone Number',
                            type: 'tel',
                            placeholder: '0200000000',
                        },
                    ].map(field => (
                        <div
                            key={field.key}
                            style={{
                                marginBottom: field.key === 'phone' ? 24 : 14,
                            }}
                        >
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: '#6b7280',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    marginBottom: 6,
                                }}
                            >
                                {field.label}{' '}
                                <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type={field.type}
                                className="form-control"
                                placeholder={field.placeholder}
                                value={form[field.key as keyof typeof form]}
                                onChange={e =>
                                    setForm(f => ({
                                        ...f,
                                        [field.key]: e.target.value,
                                    }))
                                }
                                style={{
                                    borderRadius: 10,
                                    padding: '11px 14px',
                                    fontSize: 14,
                                }}
                            />
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={() => void handlePay()}
                        disabled={!amount}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            width: '100%',
                            background: !amount
                                ? '#e5e7eb'
                                : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                            color: !amount ? '#9ca3af' : '#fff',
                            border: 'none',
                            borderRadius: 10,
                            padding: '14px',
                            fontWeight: 700,
                            fontSize: 15,
                            cursor: !amount ? 'not-allowed' : 'pointer',
                            transition: 'opacity 0.2s',
                        }}
                    >
                        <i className="fas fa-lock" style={{ fontSize: 13 }} />
                        Pay {currency} {amount.toFixed(2)} via {providerName}
                    </button>

                    <p
                        style={{
                            textAlign: 'center',
                            fontSize: 11,
                            color: '#9ca3af',
                            marginTop: 12,
                            marginBottom: 0,
                        }}
                    >
                        <i className="fas fa-lock me-1" />
                        256-bit SSL - your data is safe
                    </p>
                </div>
            </div>
        </div>
    );
}
