// Confirm Quote Page - customer lands here via the emailed confirmation link.
// Route: /confirm-quote/:token
//
// Two modes:
//  - Returning customer (quote.customer_id set): compact layout, "Book Now" button
//  - New customer (no customer_id): full profile form

import { useState, useEffect } from 'react';
import { FaCar, FaCalendarDays, FaClock, FaLocationDot } from 'react-icons/fa6';
import { useParams, useNavigate } from 'react-router-dom';
import { useTitle } from '@/shared/hooks';
import { BannerSection } from '@/website/pages/listings/vehicledetails/BannerSection';
import {
    publicQuoteService,
    type PublicQuoteConfirmPayload,
} from '@/services/publicQuoteService';
import type { QuoteRequest } from '@/shared/types/rental.types';
import { formatDate } from '@/shared/libs/utils';
import DatePickerField from '@adminComponents/DatePickerField';
import TimePickerField from '@/shared/components/TimePickerField';

/* Helpers */
function diffDays(a: string, b: string): number {
    const da = new Date(a + 'T00:00:00');
    const db = new Date(b + 'T00:00:00');
    return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

function fmt(n: number | string | null | undefined): string {
    if (n == null) return '-';
    return Number(n).toLocaleString('en-GH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

/* ID type options */
const ID_TYPES = [
    { value: 'ghana_card', label: 'Ghana Card (National ID)' },
    { value: 'passport', label: 'Passport' },
    { value: 'voter_id', label: "Voter's ID" },
    { value: 'drivers_license', label: "Driver's License" },
    { value: 'nhis', label: 'NHIS Card' },
    { value: 'other', label: 'Other' },
];

/* State types */
type PageState =
    | 'loading'
    | 'expired'
    | 'processed'
    | 'form'
    | 'success'
    | 'pending_review'
    | 'error';

interface FormState {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    customer_alt_phone: string;
    customer_address: string;
    customer_date_of_birth: string;
    license_number: string;
    license_expiry_date: string;
    id_type: string;
    id_number: string;
    pickup_time: string;
    return_time: string;
    dropoff_location_id: string;
    customer_notes: string;
}

/* Section header with icon */
function SectionHeader({ icon, title }: { icon: string; title: string }) {
    return (
        <div className="d-flex align-items-center gap-2 mb-4">
            <div
                className="d-flex align-items-center justify-content-center rounded-circle bg-dark"
                style={{ width: 36, height: 36, minWidth: 36 }}
            >
                <i
                    className={`feather feather-${icon} text-white`}
                    style={{ fontSize: 15 }}
                />
            </div>
            <h5 className="mb-0 fw-semibold" style={{ fontSize: 16 }}>
                {title}
            </h5>
        </div>
    );
}

/* Shared left-column: vehicle + dates + pricing breakdown */
function QuoteLeftPanel({ quote }: { quote: QuoteRequest }) {
    const vehicle = quote.vehicle;
    const pricing = quote.pricing;

    const rentalDays =
        quote.pickup_date && quote.return_date
            ? diffDays(quote.pickup_date, quote.return_date)
            : (quote.rental_days ?? null);

    return (
        <>
            {/* Vehicle card - sleek horizontal layout */}
            {vehicle && (
                <div
                    style={{
                        background: '#fff',
                        borderRadius: 14,
                        border: '1px solid #e9ecef',
                        overflow: 'hidden',
                        marginBottom: 16,
                        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: '16px 20px',
                            background:
                                'linear-gradient(135deg, #f8f9fa 0%, #fff 100%)',
                            borderBottom: '1px solid #f0f0f0',
                        }}
                    >
                        {vehicle.thumbnail ? (
                            <img
                                src={vehicle.thumbnail}
                                alt={vehicle.name}
                                style={{
                                    width: 80,
                                    height: 54,
                                    objectFit: 'cover',
                                    borderRadius: 8,
                                    flexShrink: 0,
                                    border: '1px solid #e9ecef',
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: 80,
                                    height: 54,
                                    background: '#e9ecef',
                                    borderRadius: 8,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    fontSize: 24,
                                    color: '#6c757d',
                                }}
                            >
                                <FaCar />
                            </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                                style={{
                                    fontSize: 10,
                                    color: '#aaa',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.8px',
                                    fontWeight: 600,
                                }}
                            >
                                Vehicle
                            </div>
                            <div
                                style={{
                                    fontWeight: 800,
                                    fontSize: 17,
                                    color: '#18191d',
                                    lineHeight: 1.2,
                                }}
                            >
                                {vehicle.name}
                            </div>
                            {vehicle.category?.name && (
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: '#888',
                                        marginTop: 2,
                                    }}
                                >
                                    {vehicle.category.name}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Trip details grid */}
                    <div style={{ padding: '16px 20px' }}>
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#aaa',
                                textTransform: 'uppercase',
                                letterSpacing: '0.8px',
                                marginBottom: 12,
                            }}
                        >
                            Trip Details
                        </div>
                        <div className="row g-2">
                            {quote.pickup_date && (
                                <div className="col-6">
                                    <div
                                        style={{
                                            background: '#f8f9fa',
                                            borderRadius: 8,
                                            padding: '8px 10px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 10,
                                                color: '#aaa',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                fontWeight: 600,
                                            }}
                                        >
                                            <FaCalendarDays className="me-1" />{' '}
                                            Pickup
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                fontWeight: 700,
                                                color: '#18191d',
                                                marginTop: 2,
                                            }}
                                        >
                                            {formatDate(quote.pickup_date)}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {quote.return_date && (
                                <div className="col-6">
                                    <div
                                        style={{
                                            background: '#f8f9fa',
                                            borderRadius: 8,
                                            padding: '8px 10px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 10,
                                                color: '#aaa',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                fontWeight: 600,
                                            }}
                                        >
                                            <FaCalendarDays className="me-1" />{' '}
                                            Return
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                fontWeight: 700,
                                                color: '#18191d',
                                                marginTop: 2,
                                            }}
                                        >
                                            {formatDate(quote.return_date)}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {rentalDays != null && (
                                <div className="col-6">
                                    <div
                                        style={{
                                            background: '#f8f9fa',
                                            borderRadius: 8,
                                            padding: '8px 10px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 10,
                                                color: '#aaa',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                fontWeight: 600,
                                            }}
                                        >
                                            <FaClock className="me-1" />{' '}
                                            Duration
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                fontWeight: 700,
                                                color: '#18191d',
                                                marginTop: 2,
                                            }}
                                        >
                                            {rentalDays} day
                                            {rentalDays !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {quote.pickup_location && (
                                <div className="col-6">
                                    <div
                                        style={{
                                            background: '#f8f9fa',
                                            borderRadius: 8,
                                            padding: '8px 10px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 10,
                                                color: '#aaa',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                fontWeight: 600,
                                            }}
                                        >
                                            <FaLocationDot className="me-1" />{' '}
                                            Pickup Location
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                fontWeight: 700,
                                                color: '#18191d',
                                                marginTop: 2,
                                            }}
                                        >
                                            {quote.pickup_location.name}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Pricing breakdown */}
            {pricing && (
                <div
                    style={{
                        background: '#fff',
                        borderRadius: 14,
                        border: '1px solid #e9ecef',
                        overflow: 'hidden',
                        marginBottom: 16,
                        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                    }}
                >
                    <div
                        style={{
                            padding: '12px 20px',
                            borderBottom: '1px solid #f0f0f0',
                        }}
                    >
                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#aaa',
                                textTransform: 'uppercase',
                                letterSpacing: '0.8px',
                            }}
                        >
                            Pricing
                        </span>
                    </div>
                    <div style={{ padding: '16px 20px' }}>
                        <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted small">
                                Base rental
                            </span>
                            <span className="small">
                                GH₵{fmt(pricing.base_cost)}
                            </span>
                        </div>

                        {pricing.additional_charges > 0 && (
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted small">
                                    Additional charges
                                </span>
                                <span className="small">
                                    GH₵{fmt(pricing.additional_charges)}
                                </span>
                            </div>
                        )}

                        {pricing.location_charge > 0 && (
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted small">
                                    Location charge
                                </span>
                                <span className="small">
                                    GH₵{fmt(pricing.location_charge)}
                                </span>
                            </div>
                        )}

                        <div className="d-flex justify-content-between border-top pt-2 mb-2">
                            <span className="text-muted small">Subtotal</span>
                            <span className="small fw-semibold">
                                GH₵{fmt(pricing.subtotal)}
                            </span>
                        </div>

                        {pricing.total_discount_amount > 0 && (
                            <>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted small">
                                        Discount
                                    </span>
                                    <span className="small text-success">
                                        -GH₵{fmt(pricing.total_discount_amount)}
                                    </span>
                                </div>
                                <div className="d-flex justify-content-between border-top pt-2 mb-2">
                                    <span className="text-muted small">
                                        After discount
                                    </span>
                                    <span className="small fw-semibold">
                                        GH₵{fmt(pricing.discounted_subtotal)}
                                    </span>
                                </div>
                            </>
                        )}

                        {pricing.tax_amount > 0 && (
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted small">VAT</span>
                                <span className="small">
                                    GH₵{fmt(pricing.tax_amount)}
                                </span>
                            </div>
                        )}

                        <div className="d-flex justify-content-between border-top pt-2 mt-1">
                            <span className="fw-semibold">Rental Total</span>
                            <span className="fw-semibold">
                                GH₵{fmt(pricing.total_cost)}
                            </span>
                        </div>

                        {pricing.security_deposit_amount > 0 ? (
                            <>
                                <div className="d-flex justify-content-between mt-2">
                                    <span className="text-muted small">
                                        Security Deposit{' '}
                                        <span
                                            className="text-muted"
                                            style={{ fontSize: '0.72em' }}
                                        >
                                            (refundable)
                                        </span>
                                    </span>
                                    <span className="small text-info">
                                        GH₵
                                        {fmt(pricing.security_deposit_amount)}
                                    </span>
                                </div>
                                <div className="d-flex justify-content-between border-top pt-2 mt-2">
                                    <span className="fw-bold">
                                        Total Amount Due
                                    </span>
                                    <span className="fw-bold text-primary">
                                        GH₵
                                        {fmt(
                                            pricing.total_cost +
                                                pricing.security_deposit_amount
                                        )}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="d-flex justify-content-between border-top pt-2 mt-1">
                                <span className="fw-bold">
                                    Total Amount Due
                                </span>
                                <span className="fw-bold text-primary">
                                    GH₵{fmt(pricing.total_cost)}
                                </span>
                            </div>
                        )}
                    </div>
                    {/* pricing body */}
                </div>
            )}

            {/* Expiry notice */}
            {quote.token_expires_at && (
                <div className="alert alert-warning small d-flex align-items-center gap-2 mb-0">
                    <i
                        className="feather feather-clock"
                        style={{ flexShrink: 0 }}
                    />
                    <span>
                        This link expires on{' '}
                        <strong>{formatDate(quote.token_expires_at)}</strong>.
                    </span>
                </div>
            )}
        </>
    );
}

/* Component */
export default function ConfirmQuotePage() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [pageState, setPageState] = useState<PageState>('loading');
    const [quote, setQuote] = useState<QuoteRequest | null>(null);
    const [rentalReference, setRentalReference] = useState<string>('');
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [documentsRequired, setDocumentsRequired] = useState(true);

    const titleStr =
        pageState === 'expired'
            ? 'Quote Expired'
            : pageState === 'processed'
              ? 'Quote Processed'
              : pageState === 'error'
                ? 'Error'
                : pageState === 'success'
                  ? 'Booking Confirmed'
                  : pageState === 'pending_review'
                    ? 'Booking Under Review'
                    : 'Confirm Your Booking';
    const title = useTitle(titleStr);
    const [cancelling, setCancelling] = useState(false);
    const [cancelConfirm, setCancelConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [altPhone, setAltPhone] = useState('');

    const [licenseFile, setLicenseFile] = useState<File | null>(null);
    const [idDocFile, setIdDocFile] = useState<File | null>(null);

    const [form, setForm] = useState<FormState>({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        customer_alt_phone: '',
        customer_address: '',
        customer_date_of_birth: '',
        license_number: '',
        license_expiry_date: '',
        id_type: 'ghana_card',
        id_number: '',
        pickup_time: '09:00',
        return_time: '09:00',
        dropoff_location_id: '',
        customer_notes: '',
    });

    /* Load rental settings */
    useEffect(() => {
        publicQuoteService
            .getRentalSettings()
            .then(res => {
                setDocumentsRequired(res.data.documents_required !== false);
            })
            .catch(() => {});
    }, []);

    /* Load quote */
    useEffect(() => {
        if (!token) {
            setPageState('error');
            return;
        }
        publicQuoteService
            .get(token)
            .then(res => {
                const q = res.data;
                setQuote(q);
                setForm(prev => ({
                    ...prev,
                    customer_name: q.name ?? '',
                    customer_email: q.email ?? '',
                    customer_phone: q.phone ?? '',
                }));
                setPageState('form');
            })
            .catch((err: unknown) => {
                const e = err as {
                    response?: {
                        status?: number;
                        data?: {
                            type?: string;
                            rental_id?: string;
                            rental_reference?: string;
                            amount?: number;
                            payer_name?: string;
                            payer_email?: string;
                            payer_phone?: string;
                        };
                    };
                };
                const status = e?.response?.status;
                const data = e?.response?.data;
                if (status === 410) {
                    setPageState('expired');
                } else if (status === 409) {
                    if (data?.type === 'payment_pending' && data?.rental_id) {
                        const params = new URLSearchParams({
                            amount: String(data.amount ?? 0),
                            booking_ref: data.rental_reference ?? '',
                            name: data.payer_name ?? '',
                            email: data.payer_email ?? '',
                            phone: data.payer_phone ?? '',
                        });
                        navigate(
                            `/payment/rental/${data.rental_id}?${params.toString()}`
                        );
                    } else {
                        setPageState('processed');
                    }
                } else {
                    setPageState('error');
                }
            });
    }, [token, navigate]);

    /* Form helpers */
    const setField = (field: keyof FormState, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    /* Returning customer: Book Now */
    const handleBookReturning = async () => {
        if (!token) return;
        setSubmitError(null);
        setSubmitting(true);
        try {
            const res = await publicQuoteService.bookReturning(
                token,
                altPhone.trim() || undefined
            );
            const params = new URLSearchParams({
                amount: String(
                    quote?.pricing?.total_cost ?? res.data?.amount ?? 0
                ),
                booking_ref: res.data?.rental_reference ?? '',
                name: res.data?.payer_name ?? quote?.name ?? '',
                email: res.data?.payer_email ?? quote?.email ?? '',
                phone: res.data?.payer_phone ?? quote?.phone ?? '',
            });
            navigate(
                `/payment/rental/${res.data?.rental_id}?${params.toString()}`
            );
        } catch (err: unknown) {
            const errData = (
                err as {
                    response?: {
                        data?: {
                            message?: string;
                            errors?: Record<string, string[]>;
                        };
                    };
                }
            )?.response?.data;
            const fieldErrors = errData?.errors
                ? Object.values(errData.errors).flat().join('\n')
                : null;
            setSubmitError(
                fieldErrors ??
                    errData?.message ??
                    'Something went wrong. Please try again.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    /* New customer: full form submit */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setSubmitError(null);
        setSubmitting(true);
        try {
            const payload: PublicQuoteConfirmPayload = {
                customer_name: form.customer_name,
                customer_email: form.customer_email,
                customer_phone: form.customer_phone,
                customer_alt_phone: form.customer_alt_phone || undefined,
                customer_address: form.customer_address || undefined,
                customer_date_of_birth:
                    form.customer_date_of_birth || undefined,
                license_number: form.license_number,
                license_expiry_date: form.license_expiry_date,
                id_type: form.id_type,
                id_number: form.id_number,
                pickup_time: form.pickup_time,
                return_time: form.return_time,
                dropoff_location_id: form.dropoff_location_id || undefined,
                customer_notes: form.customer_notes || undefined,
            };
            const res = await publicQuoteService.confirm(
                token,
                payload,
                licenseFile,
                idDocFile
            );
            if ('status' in res && res.status === 'pending_review') {
                setPageState('pending_review');
            } else {
                setRentalReference(res.data?.rental_reference ?? '');
                const params = new URLSearchParams({
                    amount: String(
                        quote?.pricing?.total_cost ?? res.data?.amount ?? 0
                    ),
                    booking_ref: res.data?.rental_reference ?? '',
                    name: form.customer_name,
                    email: form.customer_email,
                    phone: form.customer_phone,
                });
                navigate(
                    `/payment/rental/${res.data?.rental_id}?${params.toString()}`
                );
            }
        } catch (err: unknown) {
            const e = err as {
                response?: {
                    data?: {
                        message?: string;
                        errors?: Record<string, string[]>;
                    };
                };
            };
            const errData = e?.response?.data;
            const fieldErrors = errData?.errors
                ? Object.values(errData.errors).flat().join('\n')
                : null;
            setSubmitError(
                fieldErrors ??
                    errData?.message ??
                    'Something went wrong. Please try again.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    /* Cancel quote */
    const handleCancel = async () => {
        if (!token) return;
        setCancelling(true);
        try {
            await publicQuoteService.cancel(token);
            setPageState('processed');
        } catch {
            setPageState('processed');
        } finally {
            setCancelling(false);
            setCancelConfirm(false);
        }
    };

    /* Computed */
    const isReturning = !!quote?.customer_id;

    /* Terminal states */
    if (pageState === 'loading') {
        return (
            <div className="section-full p-t80 p-b50 bg-white">
                <div className="container">
                    <div className="row justify-content-center py-5">
                        <div className="col-auto text-center">
                            <div
                                className="spinner-border text-primary mb-3"
                                role="status"
                            >
                                <span className="visually-hidden">
                                    Loading...
                                </span>
                            </div>
                            <p className="text-muted">Loading your quote...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (pageState === 'expired') {
        return (
            <>
                {title}
                <div className="section-full p-t80 p-b50 bg-white">
                    <div className="container">
                        <div className="row justify-content-center py-5">
                            <div className="col-lg-5 text-center">
                                <div
                                    className="d-flex align-items-center justify-content-center rounded-circle bg-warning bg-opacity-10 mx-auto mb-4"
                                    style={{ width: 72, height: 72 }}
                                >
                                    <i
                                        className="feather feather-clock text-warning"
                                        style={{ fontSize: '2rem' }}
                                    />
                                </div>
                                <h3 className="mb-3 fw-bold">
                                    Quote Link Expired
                                </h3>
                                <p className="text-muted mb-4">
                                    This confirmation link has expired. Please
                                    contact us and we'll send you a fresh quote
                                    link.
                                </p>
                                <a href="/contact" className="site-button">
                                    Contact Us
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (pageState === 'processed') {
        return (
            <>
                {title}
                <div className="section-full p-t80 p-b50 bg-white">
                    <div className="container">
                        <div className="row justify-content-center py-5">
                            <div className="col-lg-5 text-center">
                                <div
                                    className="d-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 mx-auto mb-4"
                                    style={{ width: 72, height: 72 }}
                                >
                                    <i
                                        className="feather feather-check-circle text-success"
                                        style={{ fontSize: '2rem' }}
                                    />
                                </div>
                                <h3 className="mb-3 fw-bold">
                                    Quote Already Processed
                                </h3>
                                <p className="text-muted mb-4">
                                    This quote has already been confirmed or
                                    cancelled. If you believe this is an error,
                                    please get in touch with us.
                                </p>
                                <a href="/contact" className="site-button">
                                    Contact Us
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (pageState === 'error') {
        return (
            <>
                {title}
                <div className="section-full p-t80 p-b50 bg-white">
                    <div className="container">
                        <div className="row justify-content-center py-5">
                            <div className="col-lg-5 text-center">
                                <div
                                    className="d-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 mx-auto mb-4"
                                    style={{ width: 72, height: 72 }}
                                >
                                    <i
                                        className="feather feather-alert-circle text-danger"
                                        style={{ fontSize: '2rem' }}
                                    />
                                </div>
                                <h3 className="mb-3 fw-bold">
                                    Something Went Wrong
                                </h3>
                                <p className="text-muted mb-4">
                                    We couldn't load your quote. Please check
                                    the link in your email or contact us for
                                    assistance.
                                </p>
                                <a href="/contact" className="site-button">
                                    Contact Us
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (pageState === 'success') {
        return (
            <>
                {title}
                <div className="section-full p-t80 p-b50 bg-white">
                    <div className="container">
                        <div className="row justify-content-center py-5">
                            <div className="col-lg-5 text-center">
                                <div
                                    className="d-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 mx-auto mb-4"
                                    style={{ width: 72, height: 72 }}
                                >
                                    <i
                                        className="feather feather-check-circle text-success"
                                        style={{ fontSize: '2rem' }}
                                    />
                                </div>
                                <h3 className="mb-3 fw-bold">
                                    Booking Confirmed!
                                </h3>
                                {rentalReference && (
                                    <div className="alert alert-success mb-4">
                                        <p className="mb-1 small text-muted">
                                            Your booking reference:
                                        </p>
                                        <h4 className="mb-0 fw-bold">
                                            {rentalReference}
                                        </h4>
                                    </div>
                                )}
                                <p className="text-muted mb-4">
                                    Your booking has been confirmed. Our team
                                    will contact you shortly with pickup
                                    instructions and any next steps.
                                </p>
                                <a href="/" className="site-button">
                                    Back to Home
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (pageState === 'pending_review') {
        return (
            <>
                {title}
                <div className="section-full p-t80 p-b50 bg-white">
                    <div className="container">
                        <div className="row justify-content-center py-5">
                            <div className="col-lg-5 text-center">
                                <div
                                    className="d-flex align-items-center justify-content-center rounded-circle bg-warning bg-opacity-10 mx-auto mb-4"
                                    style={{ width: 72, height: 72 }}
                                >
                                    <i
                                        className="feather feather-clock text-warning"
                                        style={{ fontSize: '2rem' }}
                                    />
                                </div>
                                <h3 className="mb-3 fw-bold">
                                    Booking Under Review
                                </h3>
                                <div className="alert alert-warning mb-4 text-start">
                                    <p className="mb-0">
                                        Your booking details have been received,
                                        but our team needs to verify your
                                        identity before confirming the
                                        reservation. We will contact you at{' '}
                                        <strong>{quote?.email}</strong> shortly.
                                    </p>
                                </div>
                                <p className="text-muted mb-4">
                                    No action is needed from your side right
                                    now. Our team will reach out within one
                                    business day.
                                </p>
                                <a href="/" className="site-button">
                                    Back to Home
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    /* Main form */
    return (
        <>
            {title}

            <BannerSection title="Confirm Your Booking" />

            <div className="section-content p-t60 p-b120">
                <div className="container">
                    <div className="row g-4">
                        {/* Left: Quote summary */}
                        <div className="col-lg-4">
                            {quote && <QuoteLeftPanel quote={quote} />}
                        </div>

                        {/* Right: varies by customer mode */}
                        <div className="col-lg-8">
                            {/* RETURNING CUSTOMER */}
                            {isReturning && (
                                <div
                                    style={{
                                        background: '#fff',
                                        borderRadius: 14,
                                        border: '1px solid #e9ecef',
                                        overflow: 'hidden',
                                        boxShadow:
                                            '0 2px 12px rgba(0,0,0,0.05)',
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: '20px 24px 16px',
                                            borderBottom: '1px solid #f0f0f0',
                                            background:
                                                'linear-gradient(135deg, #f8f9fa 0%, #fff 100%)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 10,
                                                color: '#aaa',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.8px',
                                                fontWeight: 600,
                                                marginBottom: 4,
                                            }}
                                        >
                                            Booking Confirmation
                                        </div>
                                        <h4
                                            style={{
                                                fontWeight: 800,
                                                fontSize: 20,
                                                color: '#18191d',
                                                marginBottom: 4,
                                            }}
                                        >
                                            Confirm Your Booking
                                        </h4>
                                        <p
                                            className="text-muted mb-0"
                                            style={{ fontSize: 13 }}
                                        >
                                            We recognise your account. Review
                                            your details below and click Book
                                            Now to confirm.
                                        </p>
                                    </div>
                                    <div style={{ padding: '20px 24px' }}>
                                        {submitError && (
                                            <div className="alert alert-danger mb-3">
                                                {submitError}
                                            </div>
                                        )}

                                        {/* Customer details */}
                                        <div
                                            className="rounded-3 p-3 mb-4"
                                            style={{
                                                background: '#f7f8fa',
                                                border: '1px solid #e9ecef',
                                            }}
                                        >
                                            <div className="d-flex align-items-center gap-3">
                                                <div
                                                    className="d-flex align-items-center justify-content-center rounded-circle bg-dark"
                                                    style={{
                                                        width: 44,
                                                        height: 44,
                                                        minWidth: 44,
                                                    }}
                                                >
                                                    <i
                                                        className="feather feather-user text-white"
                                                        style={{ fontSize: 18 }}
                                                    />
                                                </div>
                                                <div>
                                                    <div
                                                        className="fw-semibold"
                                                        style={{ fontSize: 15 }}
                                                    >
                                                        {quote?.name}
                                                    </div>
                                                    <div className="text-muted small">
                                                        {quote?.email}
                                                    </div>
                                                    {quote?.phone && (
                                                        <div className="text-muted small">
                                                            {quote.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {(quote?.customer?.license_number ||
                                                quote?.customer?.id_type) && (
                                                <div className="mt-3 pt-3 border-top d-flex flex-wrap gap-3">
                                                    {quote.customer
                                                        .license_number && (
                                                        <div>
                                                            <span className="text-muted small d-block">
                                                                License
                                                            </span>
                                                            <span className="small fw-semibold">
                                                                {
                                                                    quote
                                                                        .customer
                                                                        .license_number
                                                                }
                                                            </span>
                                                            {quote.customer
                                                                .license_expiry_date && (
                                                                <span className="text-muted small">
                                                                    {' '}
                                                                    (exp.{' '}
                                                                    {formatDate(
                                                                        quote
                                                                            .customer
                                                                            .license_expiry_date
                                                                    )}
                                                                    )
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {quote.customer.id_type && (
                                                        <div>
                                                            <span className="text-muted small d-block">
                                                                ID (
                                                                {
                                                                    quote
                                                                        .customer
                                                                        .id_type
                                                                }
                                                                )
                                                            </span>
                                                            <span className="small fw-semibold">
                                                                {quote.customer
                                                                    .id_number ??
                                                                    '-'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Alt phone */}
                                        <div className="mb-4">
                                            <label
                                                className="form-label"
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    color: '#495057',
                                                    marginBottom: 4,
                                                }}
                                            >
                                                Additional Phone{' '}
                                                <span
                                                    className="text-muted"
                                                    style={{ fontWeight: 400 }}
                                                >
                                                    (optional)
                                                </span>
                                            </label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                placeholder="+233 20 000 0000"
                                                value={altPhone}
                                                onChange={e =>
                                                    setAltPhone(e.target.value)
                                                }
                                                style={{ borderRadius: 8 }}
                                            />
                                            <div className="form-text">
                                                Provide a backup number in case
                                                we can't reach you on your
                                                primary.
                                            </div>
                                        </div>

                                        {/* Book Now */}
                                        <button
                                            type="button"
                                            className="site-button dark-bg w-100"
                                            style={{
                                                fontSize: 15,
                                                fontWeight: 700,
                                                padding: '13px 24px',
                                                borderRadius: 10,
                                            }}
                                            disabled={submitting}
                                            onClick={handleBookReturning}
                                        >
                                            {submitting ? (
                                                <>
                                                    <span
                                                        className="spinner-border spinner-border-sm me-2"
                                                        role="status"
                                                    />
                                                    Confirming...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="feather feather-lock me-2" />
                                                    Book Now
                                                    {quote?.pricing != null && (
                                                        <span
                                                            className="ms-2"
                                                            style={{
                                                                opacity: 0.85,
                                                            }}
                                                        >
                                                            - GH₵
                                                            {fmt(
                                                                (quote.pricing
                                                                    .total_cost ??
                                                                    0) +
                                                                    (quote
                                                                        .pricing
                                                                        .security_deposit_amount ??
                                                                        0)
                                                            )}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </button>

                                        {/* Cancel link */}
                                        <div className="mt-3 text-center">
                                            {cancelConfirm ? (
                                                <span className="d-flex justify-content-center align-items-center gap-2 flex-wrap">
                                                    <span className="text-danger small">
                                                        Cancel this quote?
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-danger"
                                                        onClick={handleCancel}
                                                        disabled={cancelling}
                                                    >
                                                        {cancelling
                                                            ? 'Cancelling...'
                                                            : 'Yes, Cancel'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-light"
                                                        onClick={() =>
                                                            setCancelConfirm(
                                                                false
                                                            )
                                                        }
                                                    >
                                                        No, Keep
                                                    </button>
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="btn btn-link btn-sm text-muted p-0"
                                                    onClick={() =>
                                                        setCancelConfirm(true)
                                                    }
                                                >
                                                    Cancel this quote
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* NEW CUSTOMER: full profile form */}
                            {!isReturning && (
                                <div
                                    style={{
                                        background: '#fff',
                                        borderRadius: 14,
                                        border: '1px solid #e9ecef',
                                        overflow: 'hidden',
                                        boxShadow:
                                            '0 2px 12px rgba(0,0,0,0.05)',
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: '20px 24px 16px',
                                            borderBottom: '1px solid #f0f0f0',
                                            background:
                                                'linear-gradient(135deg, #f8f9fa 0%, #fff 100%)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 10,
                                                color: '#aaa',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.8px',
                                                fontWeight: 600,
                                                marginBottom: 4,
                                            }}
                                        >
                                            New Customer
                                        </div>
                                        <h4
                                            style={{
                                                fontWeight: 800,
                                                fontSize: 20,
                                                color: '#18191d',
                                                marginBottom: 4,
                                            }}
                                        >
                                            Complete Your Details
                                        </h4>
                                        <p
                                            className="text-muted mb-0"
                                            style={{ fontSize: 13 }}
                                        >
                                            Fill in your details below to
                                            confirm this booking.
                                        </p>
                                    </div>
                                    <div style={{ padding: '20px 24px' }}>
                                        {submitError && (
                                            <div
                                                className="alert alert-danger d-flex align-items-center gap-2"
                                                role="alert"
                                            >
                                                <i className="feather feather-alert-circle" />
                                                {submitError}
                                            </div>
                                        )}

                                        <form onSubmit={handleSubmit}>
                                            {/* Personal Details */}
                                            <SectionHeader
                                                icon="user"
                                                title="Your Details"
                                            />
                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-semibold">
                                                        Full Name{' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control bg-light"
                                                        value={
                                                            form.customer_name
                                                        }
                                                        readOnly
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-semibold">
                                                        Email Address{' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="email"
                                                        className="form-control bg-light"
                                                        value={
                                                            form.customer_email
                                                        }
                                                        readOnly
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-semibold">
                                                        Phone Number{' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        className="form-control bg-light"
                                                        value={
                                                            form.customer_phone
                                                        }
                                                        readOnly
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-semibold">
                                                        Alternative Phone{' '}
                                                        <span className="text-muted fw-normal">
                                                            (optional)
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        className="form-control"
                                                        placeholder="+233 20 000 0000"
                                                        value={
                                                            form.customer_alt_phone
                                                        }
                                                        onChange={e =>
                                                            setField(
                                                                'customer_alt_phone',
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="col-md-8">
                                                    <label className="form-label small fw-semibold">
                                                        Address{' '}
                                                        <span className="text-muted fw-normal">
                                                            (optional)
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Residential or business address"
                                                        value={
                                                            form.customer_address
                                                        }
                                                        onChange={e =>
                                                            setField(
                                                                'customer_address',
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label small fw-semibold">
                                                        Date of Birth{' '}
                                                        <span className="text-muted fw-normal">
                                                            (optional)
                                                        </span>
                                                    </label>
                                                    <DatePickerField
                                                        value={
                                                            form.customer_date_of_birth
                                                        }
                                                        onChange={v =>
                                                            setField(
                                                                'customer_date_of_birth',
                                                                v
                                                            )
                                                        }
                                                        maxDate={new Date()}
                                                        placeholder="Select date"
                                                    />
                                                </div>
                                            </div>

                                            <hr className="my-4" />

                                            {/* Driver's License */}
                                            <SectionHeader
                                                icon="credit-card"
                                                title="Driver's License"
                                            />
                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-semibold">
                                                        License Number{' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="e.g. DL-12345678"
                                                        value={
                                                            form.license_number
                                                        }
                                                        onChange={e =>
                                                            setField(
                                                                'license_number',
                                                                e.target.value
                                                            )
                                                        }
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-semibold">
                                                        License Expiry Date{' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </label>
                                                    <DatePickerField
                                                        value={
                                                            form.license_expiry_date
                                                        }
                                                        onChange={v =>
                                                            setField(
                                                                'license_expiry_date',
                                                                v
                                                            )
                                                        }
                                                        minDate={new Date()}
                                                        placeholder="Select expiry date"
                                                    />
                                                </div>
                                                <div className="col-md-12">
                                                    <label className="form-label small fw-semibold">
                                                        Upload License Photo{' '}
                                                        {documentsRequired ? (
                                                            <span className="text-danger">
                                                                *
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted fw-normal">
                                                                (optional)
                                                            </span>
                                                        )}{' '}
                                                        <span className="text-muted fw-normal">
                                                            (JPG/PNG/PDF, max
                                                            5MB)
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="file"
                                                        className="form-control"
                                                        accept=".jpg,.jpeg,.png,.pdf"
                                                        required={
                                                            documentsRequired
                                                        }
                                                        onChange={e =>
                                                            setLicenseFile(
                                                                e.target
                                                                    .files?.[0] ??
                                                                    null
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            <hr className="my-4" />

                                            {/* Identification */}
                                            <SectionHeader
                                                icon="shield"
                                                title="Identification"
                                            />
                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-semibold">
                                                        ID Type{' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </label>
                                                    <select
                                                        className="form-select"
                                                        value={form.id_type}
                                                        onChange={e =>
                                                            setField(
                                                                'id_type',
                                                                e.target.value
                                                            )
                                                        }
                                                        required
                                                    >
                                                        {ID_TYPES.map(t => (
                                                            <option
                                                                key={t.value}
                                                                value={t.value}
                                                            >
                                                                {t.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-semibold">
                                                        ID Number{' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Enter your ID number"
                                                        value={form.id_number}
                                                        onChange={e =>
                                                            setField(
                                                                'id_number',
                                                                e.target.value
                                                            )
                                                        }
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-12">
                                                    <label className="form-label small fw-semibold">
                                                        Upload ID Document{' '}
                                                        {documentsRequired ? (
                                                            <span className="text-danger">
                                                                *
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted fw-normal">
                                                                (optional)
                                                            </span>
                                                        )}{' '}
                                                        <span className="text-muted fw-normal">
                                                            (JPG/PNG/PDF, max
                                                            5MB)
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="file"
                                                        className="form-control"
                                                        accept=".jpg,.jpeg,.png,.pdf"
                                                        required={
                                                            documentsRequired
                                                        }
                                                        onChange={e =>
                                                            setIdDocFile(
                                                                e.target
                                                                    .files?.[0] ??
                                                                    null
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            <hr className="my-4" />

                                            {/* Preferred Times */}
                                            <SectionHeader
                                                icon="clock"
                                                title="Preferred Times"
                                            />
                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-semibold">
                                                        Pickup Time{' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </label>
                                                    <TimePickerField
                                                        value={form.pickup_time}
                                                        onChange={v =>
                                                            setField(
                                                                'pickup_time',
                                                                v
                                                            )
                                                        }
                                                        placeholder="Select pickup time"
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-semibold">
                                                        Return Time{' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </label>
                                                    <TimePickerField
                                                        value={form.return_time}
                                                        onChange={v =>
                                                            setField(
                                                                'return_time',
                                                                v
                                                            )
                                                        }
                                                        placeholder="Select return time"
                                                    />
                                                </div>
                                            </div>

                                            {/* Notes */}
                                            <div className="mt-3 mb-4">
                                                <label className="form-label small fw-semibold">
                                                    Additional Notes{' '}
                                                    <span className="text-muted fw-normal">
                                                        (optional)
                                                    </span>
                                                </label>
                                                <textarea
                                                    className="form-control"
                                                    rows={3}
                                                    placeholder="Any special instructions or requests..."
                                                    value={form.customer_notes}
                                                    onChange={e =>
                                                        setField(
                                                            'customer_notes',
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>

                                            <hr className="my-4" />

                                            {/* Actions */}
                                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                                {cancelConfirm ? (
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="text-danger small">
                                                            Cancel this quote?
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-danger"
                                                            onClick={
                                                                handleCancel
                                                            }
                                                            disabled={
                                                                cancelling
                                                            }
                                                        >
                                                            {cancelling
                                                                ? 'Cancelling...'
                                                                : 'Yes, Cancel'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-light"
                                                            onClick={() =>
                                                                setCancelConfirm(
                                                                    false
                                                                )
                                                            }
                                                        >
                                                            No, Keep
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-secondary btn-sm"
                                                        onClick={() =>
                                                            setCancelConfirm(
                                                                true
                                                            )
                                                        }
                                                    >
                                                        <i className="feather feather-x me-1" />
                                                        Cancel Quote
                                                    </button>
                                                )}

                                                <button
                                                    type="submit"
                                                    className="site-button dark-bg"
                                                    disabled={submitting}
                                                    style={{
                                                        minWidth: 180,
                                                        fontSize: 14,
                                                        fontWeight: 700,
                                                        padding: '13px 28px',
                                                        borderRadius: 10,
                                                    }}
                                                >
                                                    {submitting ? (
                                                        <>
                                                            <span
                                                                className="spinner-border spinner-border-sm me-2"
                                                                role="status"
                                                            />
                                                            Confirming...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="feather feather-lock me-2" />
                                                            Confirm Booking
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
