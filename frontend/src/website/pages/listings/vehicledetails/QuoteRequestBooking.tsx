// QuoteRequestBooking.tsx
// Public flow for vehicles with hidden pricing.
// Customer selects dates + addons on VehicleDetail → navigates here to submit a quote request.
// Mirrors the email-check UX of BookingConfirmation (returning vs new customer).

import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTitle } from '@/shared/hooks';
import {
    FaCar,
    FaCalendarDays,
    FaClock,
    FaLocationDot,
    FaFlagCheckered,
    FaPlane,
    FaCheck,
} from 'react-icons/fa6';
import {
    publicQuoteService,
    type PublicAddon,
    type PublicAutoCharge,
    type PublicVehicleDetail,
} from '@/services/publicQuoteService';
import { BannerSection } from './BannerSection';
import { getErrorMessage } from '@/shared/libs/utils';

/* Types */
interface PickupLocationOption {
    id: string;
    name: string;
    pickup_charge: number | null;
    is_airport?: boolean;
}

interface DropoffLocationOption {
    id: string;
    name: string;
    dropoff_charge: number | null;
    is_airport?: boolean;
}

interface BookingForm {
    pickup_date: string;
    return_date: string;
    pickup_time: string;
    return_time: string;
    pickup_location_id: string;
    dropoff_location_id: string;
    selected_addon_ids: string[];
}

interface QuoteState {
    vehicle: PublicVehicleDetail;
    form: BookingForm;
    days: number;
    selectedAddons: PublicAddon[];
    autoCharges: PublicAutoCharge[];
    selectedLocation: PickupLocationOption | null;
    selectedDropoffLocation: DropoffLocationOption | null;
    canShowPrice: boolean;
    securityDepositAmount: number;
}

type CustomerMode = 'new' | 'returning';
type ReturningState =
    | 'email_input'
    | 'sending'
    | 'waiting'
    | 'verified'
    | 'not_found';
type SubmitOutcome = 'idle' | 'submitting' | 'submitted' | 'error';

/* Helpers */
function fmtDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function fmtTime(timeStr: string): string {
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/* Component */
export const QuoteRequestBooking = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as QuoteState | null;

    /* Customer identity state */
    const [customerMode, setCustomerMode] = useState<CustomerMode>('new');
    const [returningState, setReturningState] =
        useState<ReturningState>('email_input');
    const [returningEmail, setReturningEmail] = useState('');
    const [sessionId, setSessionId] = useState('');
    const [maskedEmail, setMaskedEmail] = useState('');
    const [verifiedName, setVerifiedName] = useState('');
    const [verifiedEmail, setVerifiedEmail] = useState('');
    const [verifiedPhone] = useState('');
    const [verificationError, setVerificationError] = useState('');
    const [isSending, setIsSending] = useState(false);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    /* New customer form state */
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [emailExistsWarning, setEmailExistsWarning] = useState(false);
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);

    /* Submission state */
    const [submitOutcome, setSubmitOutcome] = useState<SubmitOutcome>('idle');
    const [submitError, setSubmitError] = useState('');

    const titleStr =
        submitOutcome === 'submitted'
            ? 'Quote Requested'
            : state?.vehicle
              ? `Request Quote - ${state.vehicle.name}`
              : 'Request Quote';
    const title = useTitle(titleStr);

    /* Polling for returning customer */
    useEffect(() => {
        if (returningState !== 'waiting' || !sessionId) return;

        pollingRef.current = setInterval(async () => {
            try {
                const res = await publicQuoteService.verifyStatus(sessionId);
                if (res.data?.verified) {
                    setVerifiedName(res.data.customer_name ?? '');
                    setReturningState('verified');
                }
            } catch {
                // Silently ignore polling errors
            }
        }, 3500);

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [returningState, sessionId]);

    useEffect(() => {
        if (returningState === 'verified' && pollingRef.current) {
            clearInterval(pollingRef.current);
        }
    }, [returningState]);

    if (!state) {
        navigate('/listings', { replace: true });
        return null;
    }

    const {
        vehicle,
        form,
        days,
        selectedAddons,
        selectedLocation,
        selectedDropoffLocation,
    } = state;

    const primaryImage =
        vehicle.images.find(i => i.is_primary) ?? vehicle.images[0];

    /* Returning customer handlers */
    const handleSendVerification = async () => {
        if (!returningEmail.trim()) return;
        setIsSending(true);
        setVerificationError('');
        try {
            const res = await publicQuoteService.requestVerification(
                returningEmail.trim()
            );
            setSessionId(res.data.session_id);
            setMaskedEmail(res.data.masked_email);
            setVerifiedEmail(returningEmail.trim());
            setReturningState('waiting');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })
                ?.response?.data?.message;
            if (msg?.includes('No account found')) {
                setReturningState('not_found');
            } else {
                setVerificationError(
                    msg ?? 'Something went wrong. Please try again.'
                );
            }
        } finally {
            setIsSending(false);
        }
    };

    const handleResend = () => {
        setReturningState('email_input');
        setSessionId('');
        setMaskedEmail('');
    };

    const handleSwitchToNew = () => {
        setCustomerMode('new');
        setReturningState('email_input');
        setReturningEmail('');
        setSessionId('');
        setMaskedEmail('');
        setVerifiedName('');
        setVerificationError('');
        if (pollingRef.current) clearInterval(pollingRef.current);
    };

    /* New customer email check */
    const handleNewEmailBlur = async () => {
        if (!newEmail.trim()) return;
        setIsCheckingEmail(true);
        try {
            const res = await publicQuoteService.checkEmail(newEmail.trim());
            setEmailExistsWarning(res.data.exists);
        } catch {
            // Ignore silently
        } finally {
            setIsCheckingEmail(false);
        }
    };

    const handleSwitchToReturningWithEmail = () => {
        setReturningEmail(newEmail.trim());
        setEmailExistsWarning(false);
        setCustomerMode('returning');
        setReturningState('email_input');
    };

    /* Submit quote request */
    const handleSubmit = async () => {
        setSubmitOutcome('submitting');
        setSubmitError('');

        // Safety net: re-check email for new customers in case autofill bypassed the blur check
        if (customerMode === 'new') {
            setIsCheckingEmail(true);
            try {
                const res = await publicQuoteService.checkEmail(
                    newEmail.trim()
                );
                if (res.data.exists) {
                    setEmailExistsWarning(true);
                    setSubmitOutcome('idle');
                    return;
                }
            } catch {
                // Don't block submit on network failure - backend will handle duplicates
            } finally {
                setIsCheckingEmail(false);
            }
        }

        try {
            const name =
                customerMode === 'returning'
                    ? verifiedName || returningEmail
                    : newName.trim();
            const email =
                customerMode === 'returning'
                    ? verifiedEmail || returningEmail.trim()
                    : newEmail.trim();
            const phone =
                customerMode === 'returning'
                    ? verifiedPhone || ''
                    : newPhone.trim();

            await publicQuoteService.submitRequest({
                name,
                email,
                phone,
                vehicle_id: vehicle.id,
                pickup_date: form.pickup_date,
                return_date: form.return_date,
                pickup_time: form.pickup_time,
                return_time: form.return_time,
                pickup_location_id: form.pickup_location_id || undefined,
                dropoff_location_id: form.dropoff_location_id || undefined,
                addon_ids: form.selected_addon_ids.length
                    ? form.selected_addon_ids
                    : undefined,
                session_id:
                    customerMode === 'returning' && sessionId
                        ? sessionId
                        : undefined,
            });
            setSubmitOutcome('submitted');
        } catch (err: unknown) {
            setSubmitError(
                getErrorMessage(err, 'Something went wrong. Please try again.')
            );
            setSubmitOutcome('error');
        }
    };

    /* Submit disabled logic */
    const isSubmitting = submitOutcome === 'submitting';
    const canSubmit =
        !isSubmitting &&
        (customerMode === 'new'
            ? newName.trim() &&
              newEmail.trim() &&
              newPhone.trim() &&
              !emailExistsWarning &&
              !isCheckingEmail
            : returningState === 'verified');

    /* Success state */
    if (submitOutcome === 'submitted') {
        return (
            <>
                {title}
                <BannerSection title="Quote Requested" />
                <div className="section-content p-t60 p-b120">
                    <div className="container">
                        <div className="row justify-content-center">
                            <div className="col-lg-6 text-center py-5">
                                <div
                                    className="d-flex align-items-center justify-content-center mb-4"
                                    style={{
                                        width: 72,
                                        height: 72,
                                        borderRadius: '50%',
                                        background: '#e6f9ed',
                                        margin: '0 auto',
                                    }}
                                >
                                    <i
                                        className="feather feather-check-circle"
                                        style={{
                                            fontSize: 36,
                                            color: '#28a745',
                                        }}
                                    />
                                </div>
                                <h3 className="mb-3">
                                    Quote Request Submitted!
                                </h3>
                                <p className="text-muted mb-2">
                                    Thank you! We'll prepare a personalised
                                    quote for <strong>{vehicle.name}</strong>{' '}
                                    and send it to your email within 24 hours.
                                </p>
                                <p
                                    className="text-muted mb-4"
                                    style={{ fontSize: 13 }}
                                >
                                    The quote will include a confirmation link
                                    for you to review the pricing and confirm
                                    your booking.
                                </p>
                                <a
                                    href="/listings"
                                    className="site-button dark-bg me-2"
                                >
                                    Back to Listings
                                </a>
                                <a href="/" className="site-button">
                                    Home
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    /* Main layout */
    return (
        <>
            {title}
            <BannerSection
                title={`Request Quote - ${vehicle.name}`}
                backgroundImage={primaryImage?.url}
            />

            <div className="section-content p-t60 p-b120">
                <div className="container">
                    <div className="row g-4">
                        {/* LEFT: Vehicle + Booking Summary */}
                        <div className="col-lg-5">
                            {/* Vehicle card */}
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
                                    {primaryImage ? (
                                        <img
                                            src={primaryImage.url}
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
                                        {vehicle.category && (
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
                                                        textTransform:
                                                            'uppercase',
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
                                                    {fmtDate(form.pickup_date)}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 11,
                                                        color: '#888',
                                                    }}
                                                >
                                                    at{' '}
                                                    {fmtTime(form.pickup_time)}
                                                </div>
                                            </div>
                                        </div>
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
                                                        textTransform:
                                                            'uppercase',
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
                                                    {fmtDate(form.return_date)}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 11,
                                                        color: '#888',
                                                    }}
                                                >
                                                    at{' '}
                                                    {fmtTime(form.return_time)}
                                                </div>
                                            </div>
                                        </div>
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
                                                        textTransform:
                                                            'uppercase',
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
                                                    {days}{' '}
                                                    {days === 1
                                                        ? 'day'
                                                        : 'days'}
                                                </div>
                                            </div>
                                        </div>
                                        {selectedLocation && (
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
                                                            textTransform:
                                                                'uppercase',
                                                            letterSpacing:
                                                                '0.5px',
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
                                                        {selectedLocation.is_airport && (
                                                            <FaPlane className="me-1" />
                                                        )}
                                                        {selectedLocation.name}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {selectedDropoffLocation && (
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
                                                            textTransform:
                                                                'uppercase',
                                                            letterSpacing:
                                                                '0.5px',
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        <FaFlagCheckered className="me-1" />{' '}
                                                        Drop-off
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 12,
                                                            fontWeight: 700,
                                                            color: '#18191d',
                                                            marginTop: 2,
                                                        }}
                                                    >
                                                        {selectedDropoffLocation.is_airport && (
                                                            <FaPlane className="me-1" />
                                                        )}
                                                        {
                                                            selectedDropoffLocation.name
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Add-ons */}
                            {selectedAddons.length > 0 && (
                                <div
                                    style={{
                                        background: '#fff',
                                        borderRadius: 14,
                                        border: '1px solid #e9ecef',
                                        overflow: 'hidden',
                                        marginBottom: 16,
                                        boxShadow:
                                            '0 2px 12px rgba(0,0,0,0.05)',
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
                                            Add-ons Selected
                                        </span>
                                    </div>
                                    <div style={{ padding: '12px 20px' }}>
                                        {selectedAddons.map(addon => (
                                            <div
                                                key={addon.id}
                                                className="d-flex align-items-center gap-2 mb-1"
                                            >
                                                <span
                                                    style={{
                                                        color: '#28a745',
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    <FaCheck />
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: 13,
                                                        color: '#333',
                                                    }}
                                                >
                                                    {addon.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Price note */}
                            <div
                                style={{
                                    background: '#f0f7ff',
                                    borderRadius: 10,
                                    border: '1px solid #cfe2ff',
                                    padding: '10px 14px',
                                    fontSize: 12,
                                    color: '#0a58ca',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                            >
                                <i className="feather feather-info" />
                                Pricing will be included in your personalised
                                quote.
                            </div>
                        </div>

                        {/* RIGHT: Customer + Submit */}
                        <div className="col-lg-7">
                            <div
                                style={{
                                    background: '#fff',
                                    borderRadius: 14,
                                    border: '1px solid #e9ecef',
                                    overflow: 'hidden',
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
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
                                        Quote Request
                                    </div>
                                    <h4
                                        style={{
                                            fontWeight: 800,
                                            fontSize: 20,
                                            color: '#18191d',
                                            marginBottom: 4,
                                        }}
                                    >
                                        Request Your Quote
                                    </h4>
                                    <p
                                        className="text-muted mb-0"
                                        style={{ fontSize: 13 }}
                                    >
                                        Our team will prepare your quote and
                                        send it to your email within 24 hours.
                                    </p>
                                </div>
                                <div style={{ padding: '20px 24px' }}>
                                    {/* Error banner */}
                                    {submitOutcome === 'error' &&
                                        submitError && (
                                            <div className="alert alert-danger mb-3">
                                                {submitError}
                                            </div>
                                        )}

                                    {/* Returning / New toggle - pill segmented control */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            background: '#f1f3f5',
                                            borderRadius: 50,
                                            padding: 4,
                                            marginBottom: 24,
                                            gap: 0,
                                        }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (customerMode !== 'new')
                                                    handleSwitchToNew();
                                            }}
                                            style={{
                                                flex: 1,
                                                border: 'none',
                                                borderRadius: 50,
                                                padding: '9px 16px',
                                                fontSize: 13,
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                transition: 'all 0.18s',
                                                background:
                                                    customerMode === 'new'
                                                        ? '#fff'
                                                        : 'transparent',
                                                color:
                                                    customerMode === 'new'
                                                        ? '#18191d'
                                                        : '#6c757d',
                                                boxShadow:
                                                    customerMode === 'new'
                                                        ? '0 1px 4px rgba(0,0,0,0.12)'
                                                        : 'none',
                                            }}
                                        >
                                            New Customer
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (
                                                    customerMode !== 'returning'
                                                ) {
                                                    setCustomerMode(
                                                        'returning'
                                                    );
                                                    setReturningState(
                                                        'email_input'
                                                    );
                                                }
                                            }}
                                            style={{
                                                flex: 1,
                                                border: 'none',
                                                borderRadius: 50,
                                                padding: '9px 16px',
                                                fontSize: 13,
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                transition: 'all 0.18s',
                                                background:
                                                    customerMode === 'returning'
                                                        ? '#fff'
                                                        : 'transparent',
                                                color:
                                                    customerMode === 'returning'
                                                        ? '#18191d'
                                                        : '#6c757d',
                                                boxShadow:
                                                    customerMode === 'returning'
                                                        ? '0 1px 4px rgba(0,0,0,0.12)'
                                                        : 'none',
                                            }}
                                        >
                                            Returning Customer
                                        </button>
                                    </div>

                                    {/* NEW CUSTOMER FORM */}
                                    {customerMode === 'new' && (
                                        <div>
                                            {/* Email exists warning */}
                                            {emailExistsWarning && (
                                                <div className="alert alert-warning d-flex align-items-start gap-2 mb-3">
                                                    <i
                                                        className="feather feather-alert-triangle mt-1"
                                                        style={{
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                    <div>
                                                        <strong>
                                                            Email already
                                                            registered.
                                                        </strong>{' '}
                                                        Looks like you have an
                                                        account with us.
                                                        <button
                                                            type="button"
                                                            className="btn btn-link btn-sm p-0 ms-1"
                                                            onClick={
                                                                handleSwitchToReturningWithEmail
                                                            }
                                                        >
                                                            Verify your email
                                                            instead
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="row">
                                                <div className="col-md-12 mb-3">
                                                    <label
                                                        className="form-label"
                                                        style={{
                                                            fontSize: 13,
                                                            fontWeight: 600,
                                                            color: '#495057',
                                                            marginBottom: 4,
                                                        }}
                                                    >
                                                        Full Name{' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="John Mensah"
                                                        value={newName}
                                                        onChange={e =>
                                                            setNewName(
                                                                e.target.value
                                                            )
                                                        }
                                                        style={{
                                                            borderRadius: 8,
                                                        }}
                                                    />
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label
                                                        className="form-label"
                                                        style={{
                                                            fontSize: 13,
                                                            fontWeight: 600,
                                                            color: '#495057',
                                                            marginBottom: 4,
                                                        }}
                                                    >
                                                        Email Address{' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="email"
                                                        className={`form-control ${emailExistsWarning ? 'is-invalid' : ''}`}
                                                        placeholder="you@example.com"
                                                        value={newEmail}
                                                        onChange={e => {
                                                            setNewEmail(
                                                                e.target.value
                                                            );
                                                            setEmailExistsWarning(
                                                                false
                                                            );
                                                        }}
                                                        onBlur={
                                                            handleNewEmailBlur
                                                        }
                                                        style={{
                                                            borderRadius: 8,
                                                        }}
                                                    />
                                                    {isCheckingEmail && (
                                                        <div className="form-text text-muted">
                                                            Checking email…
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label
                                                        className="form-label"
                                                        style={{
                                                            fontSize: 13,
                                                            fontWeight: 600,
                                                            color: '#495057',
                                                            marginBottom: 4,
                                                        }}
                                                    >
                                                        Phone Number{' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        className="form-control"
                                                        placeholder="+233 20 000 0000"
                                                        value={newPhone}
                                                        onChange={e =>
                                                            setNewPhone(
                                                                e.target.value
                                                            )
                                                        }
                                                        style={{
                                                            borderRadius: 8,
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                className="site-button dark-bg"
                                                style={{
                                                    width: '100%',
                                                    marginTop: 4,
                                                    fontSize: 14,
                                                    fontWeight: 700,
                                                    padding: '13px 24px',
                                                    borderRadius: 10,
                                                    opacity: canSubmit
                                                        ? 1
                                                        : 0.6,
                                                    cursor: canSubmit
                                                        ? 'pointer'
                                                        : 'not-allowed',
                                                }}
                                                disabled={!canSubmit}
                                                onClick={handleSubmit}
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <span
                                                            className="spinner-border spinner-border-sm me-2"
                                                            role="status"
                                                        />
                                                        Submitting…
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="feather feather-send me-2" />
                                                        Submit Quote Request
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {/* RETURNING CUSTOMER */}
                                    {customerMode === 'returning' && (
                                        <div>
                                            {/* Email input */}
                                            {returningState ===
                                                'email_input' && (
                                                <div>
                                                    <p
                                                        className="text-muted mb-3"
                                                        style={{ fontSize: 13 }}
                                                    >
                                                        Enter your registered
                                                        email to verify your
                                                        identity. We'll send a
                                                        quick verification link.
                                                    </p>
                                                    {verificationError && (
                                                        <div className="alert alert-danger mb-3">
                                                            {verificationError}
                                                        </div>
                                                    )}
                                                    <label
                                                        className="form-label"
                                                        style={{
                                                            fontSize: 13,
                                                            fontWeight: 600,
                                                            color: '#495057',
                                                            marginBottom: 4,
                                                        }}
                                                    >
                                                        Email Address
                                                    </label>
                                                    <div className="d-flex gap-2 mb-3">
                                                        <input
                                                            type="email"
                                                            className="form-control"
                                                            placeholder="your@email.com"
                                                            value={
                                                                returningEmail
                                                            }
                                                            onChange={e =>
                                                                setReturningEmail(
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            onKeyDown={e =>
                                                                e.key ===
                                                                    'Enter' &&
                                                                handleSendVerification()
                                                            }
                                                            style={{
                                                                borderRadius: 8,
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="site-button dark-bg"
                                                            style={{
                                                                whiteSpace:
                                                                    'nowrap',
                                                                borderRadius: 8,
                                                                fontSize: 13,
                                                                fontWeight: 600,
                                                            }}
                                                            disabled={
                                                                !returningEmail.trim() ||
                                                                isSending
                                                            }
                                                            onClick={
                                                                handleSendVerification
                                                            }
                                                        >
                                                            {isSending ? (
                                                                <>
                                                                    <span className="spinner-border spinner-border-sm me-1" />
                                                                    Sending…
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <i className="feather feather-mail me-1" />
                                                                    Send Link
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="btn btn-link btn-sm p-0"
                                                        onClick={
                                                            handleSwitchToNew
                                                        }
                                                    >
                                                        ← Use new customer form
                                                        instead
                                                    </button>
                                                </div>
                                            )}

                                            {/* Waiting for email verification */}
                                            {returningState === 'waiting' && (
                                                <div className="text-center py-3">
                                                    <div
                                                        className="spinner-border text-primary mb-3"
                                                        style={{
                                                            width: 32,
                                                            height: 32,
                                                        }}
                                                    />
                                                    <p className="fw-semibold mb-1">
                                                        Check your email
                                                    </p>
                                                    <p
                                                        className="text-muted mb-3"
                                                        style={{ fontSize: 13 }}
                                                    >
                                                        A verification link was
                                                        sent to{' '}
                                                        <strong>
                                                            {maskedEmail}
                                                        </strong>
                                                        .<br />
                                                        Click the link in your
                                                        email, then return here.
                                                    </p>
                                                    <div className="d-flex justify-content-center gap-3">
                                                        <button
                                                            type="button"
                                                            className="btn btn-link btn-sm p-0"
                                                            onClick={
                                                                handleResend
                                                            }
                                                        >
                                                            Resend / Use
                                                            different email
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-link btn-sm p-0"
                                                            onClick={
                                                                handleSwitchToNew
                                                            }
                                                        >
                                                            New customer instead
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Not found */}
                                            {returningState === 'not_found' && (
                                                <div>
                                                    <div className="alert alert-info mb-3">
                                                        <strong>
                                                            No account found
                                                        </strong>{' '}
                                                        for{' '}
                                                        <strong>
                                                            {returningEmail}
                                                        </strong>
                                                        .
                                                    </div>
                                                    <div className="d-flex gap-2">
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-secondary btn-sm"
                                                            onClick={() =>
                                                                setReturningState(
                                                                    'email_input'
                                                                )
                                                            }
                                                        >
                                                            Try different email
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => {
                                                                setNewEmail(
                                                                    returningEmail
                                                                );
                                                                handleSwitchToNew();
                                                            }}
                                                        >
                                                            Continue as new
                                                            customer
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Verified */}
                                            {returningState === 'verified' && (
                                                <div>
                                                    <div
                                                        className="d-flex align-items-center gap-3 p-3 rounded mb-4"
                                                        style={{
                                                            background:
                                                                '#e6f9ed',
                                                        }}
                                                    >
                                                        <div
                                                            className="d-flex align-items-center justify-content-center"
                                                            style={{
                                                                width: 40,
                                                                height: 40,
                                                                borderRadius:
                                                                    '50%',
                                                                background:
                                                                    '#28a745',
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            <i
                                                                className="feather feather-check"
                                                                style={{
                                                                    color: '#fff',
                                                                    fontSize: 18,
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div
                                                                className="fw-semibold"
                                                                style={{
                                                                    fontSize: 14,
                                                                }}
                                                            >
                                                                Welcome back
                                                                {verifiedName
                                                                    ? `, ${verifiedName}`
                                                                    : ''}
                                                                !
                                                            </div>
                                                            <div
                                                                className="text-muted"
                                                                style={{
                                                                    fontSize: 12,
                                                                }}
                                                            >
                                                                Identity
                                                                verified - your
                                                                quote will be
                                                                linked to your
                                                                account.
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className="site-button dark-bg"
                                                        style={{
                                                            width: '100%',
                                                            fontSize: 14,
                                                            fontWeight: 700,
                                                            padding:
                                                                '13px 24px',
                                                            borderRadius: 10,
                                                            opacity: canSubmit
                                                                ? 1
                                                                : 0.6,
                                                            cursor: canSubmit
                                                                ? 'pointer'
                                                                : 'not-allowed',
                                                        }}
                                                        disabled={!canSubmit}
                                                        onClick={handleSubmit}
                                                    >
                                                        {isSubmitting ? (
                                                            <>
                                                                <span
                                                                    className="spinner-border spinner-border-sm me-2"
                                                                    role="status"
                                                                />
                                                                Submitting…
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="feather feather-send me-2" />
                                                                Submit Quote
                                                                Request
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {/* card body */}
                            </div>
                            {/* card */}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
