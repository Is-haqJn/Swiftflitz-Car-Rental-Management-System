import {
    useState,
    useEffect,
    useRef,
    useCallback,
    type ReactNode,
} from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTitle } from '@/shared/hooks';
import type {
    PublicAddon,
    PublicAutoCharge,
    PublicVehicleDetail,
} from '@/services/publicQuoteService';
import { publicQuoteService } from '@/services/publicQuoteService';
import { couponService } from '@/services/couponService';
import type { DiscountCoupon } from '@/shared/types/coupon.types';
import { BannerSection } from './BannerSection';
import { useFormatCurrency } from '@/shared/hooks/queries/useSettings';
import { formatWithSymbol } from '@/shared/libs/currency';
import {
    FaCar,
    FaCalendarDays,
    FaClock,
    FaLocationDot,
    FaFlagCheckered,
    FaCheck,
    FaEnvelope,
    FaCircleCheck,
} from 'react-icons/fa6';

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

interface Pricing {
    baseCost: number;
    addonTotal: number;
    autoChargeTotal: number;
    pickupCharge: number;
    dropoffCharge: number;
    subtotal: number;
    vatEnabled: boolean;
    vatRate: number;
    vatAmount: number;
    total: number;
    discountAmount?: number;
}

interface ConfirmState {
    vehicle: PublicVehicleDetail;
    form: BookingForm;
    days: number;
    selectedAddons: PublicAddon[];
    autoCharges: PublicAutoCharge[];
    selectedLocation: PickupLocationOption | null;
    selectedDropoffLocation: DropoffLocationOption | null;
    canShowPrice: boolean;
    securityDepositAmount: number;
    pricing: Pricing;
    date_of_birth?: string;
}

type CustomerMode = 'new' | 'returning';
type ReturningState =
    | 'email_input'
    | 'sending'
    | 'waiting'
    | 'verified'
    | 'not_found';
type BookingOutcome =
    | 'idle'
    | 'submitting'
    | 'confirmed'
    | 'profile_email_sent'
    | 'error';

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

function chargeLineLabel(
    charge: PublicAddon | PublicAutoCharge,
    days: number
): string {
    if (charge.charge_type === 'per_day')
        return `${charge.amount} x ${days} days`;
    if (charge.charge_type === 'percentage') return `${charge.amount}%`;
    return 'flat';
}

function chargeLineAmount(
    charge: PublicAddon | PublicAutoCharge,
    days: number,
    baseCost: number
): number {
    if (charge.charge_type === 'per_day') return charge.amount * days;
    if (charge.charge_type === 'percentage')
        return (charge.amount / 100) * baseCost;
    return charge.amount;
}

export const BookingConfirmation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as ConfirmState | null;
    const globalFormatCurrency = useFormatCurrency();
    const vehicleCurrencySymbol = state?.vehicle?.currency_symbol ?? null;
    const vehicleCurrencyCode = state?.vehicle?.currency ?? null;

    const formatAmount = useCallback(
        (amount: number) => {
            if (vehicleCurrencySymbol)
                return formatWithSymbol(amount, vehicleCurrencySymbol);
            if (vehicleCurrencyCode) return globalFormatCurrency(amount);
            return globalFormatCurrency(amount);
        },
        [vehicleCurrencySymbol, vehicleCurrencyCode, globalFormatCurrency]
    );

    const title = useTitle(
        state?.vehicle
            ? `Confirm Booking - ${state.vehicle.name}`
            : 'Confirm Booking'
    );

    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [customerMode, setCustomerMode] = useState<CustomerMode>('new');
    const [returningState, setReturningState] =
        useState<ReturningState>('email_input');
    const [returningEmail, setReturningEmail] = useState('');
    const [sessionId, setSessionId] = useState('');
    const [maskedEmail, setMaskedEmail] = useState('');
    const [verifiedName, setVerifiedName] = useState('');
    const [verificationError, setVerificationError] = useState('');
    const [isSending, setIsSending] = useState(false);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [emailExistsWarning, setEmailExistsWarning] = useState(false);
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [bookingOutcome, setBookingOutcome] =
        useState<BookingOutcome>('idle');
    const [rentalReference] = useState('');
    const [bookingError, setBookingError] = useState('');
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<DiscountCoupon | null>(
        null
    );
    const [couponError, setCouponError] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [bookingConfirmedRef, setBookingConfirmedRef] = useState<
        string | null
    >(null);

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
                /* silently ignore */
            }
        }, 3500);
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [returningState, sessionId]);

    useEffect(() => {
        if (returningState === 'verified' && pollingRef.current)
            clearInterval(pollingRef.current);
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
        autoCharges,
        selectedLocation,
        selectedDropoffLocation,
        canShowPrice,
        securityDepositAmount,
        pricing,
    } = state;
    const primaryImage =
        vehicle.images.find(i => i.is_primary) ?? vehicle.images[0];

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

    const handleNewEmailBlur = async () => {
        if (!newEmail.trim()) return;
        setIsCheckingEmail(true);
        try {
            const res = await publicQuoteService.checkEmail(newEmail.trim());
            setEmailExistsWarning(res.data.exists);
        } catch {
            /* ignore */
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

    const handleBookNewCustomer = async () => {
        if (!state) return;
        setBookingOutcome('submitting');
        setBookingError('');
        try {
            const res = await publicQuoteService.bookNewCustomer({
                name: newName.trim(),
                email: newEmail.trim(),
                phone: newPhone.trim(),
                vehicle_id: state.vehicle.id,
                pickup_date: state.form.pickup_date,
                return_date: state.form.return_date,
                pickup_time: state.form.pickup_time,
                return_time: state.form.return_time,
                pickup_location_id: state.form.pickup_location_id || undefined,
                dropoff_location_id:
                    state.form.dropoff_location_id || undefined,
                addon_ids: state.selectedAddons.map(a => a.id),
                coupon_code: appliedCoupon?.code,
                date_of_birth: state.date_of_birth || undefined,
            });
            if (displayTotal <= 0) {
                setBookingConfirmedRef(res.data.rental_reference);
                return;
            }
            const params = new URLSearchParams({
                amount: String(displayTotal),
                booking_ref: res.data.rental_reference,
                name: newName.trim(),
                email: newEmail.trim(),
                phone: newPhone.trim(),
            });
            navigate(
                `/payment/rental/${res.data.rental_id}?${params.toString()}`
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
            setBookingOutcome('error');
            setBookingError(
                fieldErrors ??
                    errData?.message ??
                    'Something went wrong. Please try again.'
            );
        }
    };

    const handleBookNow = async () => {
        if (!state || !sessionId) return;
        setBookingOutcome('submitting');
        setBookingError('');
        try {
            const res = await publicQuoteService.bookDirect({
                session_id: sessionId,
                vehicle_id: state.vehicle.id,
                pickup_date: state.form.pickup_date,
                return_date: state.form.return_date,
                pickup_time: state.form.pickup_time,
                return_time: state.form.return_time,
                pickup_location_id: state.form.pickup_location_id || undefined,
                dropoff_location_id:
                    state.form.dropoff_location_id || undefined,
                addon_ids: state.selectedAddons.map(a => a.id),
                coupon_code: appliedCoupon?.code,
                date_of_birth: state.date_of_birth || undefined,
            });
            if (displayTotal <= 0) {
                setBookingConfirmedRef(res.data.rental_reference);
                return;
            }
            const params = new URLSearchParams({
                amount: String(displayTotal),
                booking_ref: res.data.rental_reference,
                name: verifiedName,
                email: returningEmail,
            });
            navigate(
                `/payment/rental/${res.data.rental_id}?${params.toString()}`
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
            setBookingOutcome('error');
            setBookingError(
                fieldErrors ??
                    errData?.message ??
                    'Something went wrong. Please try again.'
            );
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) return;
        setCouponLoading(true);
        setCouponError('');
        try {
            const res = await couponService.validateCode(
                couponInput.trim().toUpperCase(),
                undefined,
                'rental'
            );
            setAppliedCoupon(res.data);
            setCouponInput('');
        } catch {
            setCouponError('Invalid or expired coupon code.');
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponError('');
    };

    const couponDiscount = appliedCoupon
        ? appliedCoupon.type === 'percentage'
            ? (appliedCoupon.value / 100) * pricing.subtotal
            : Math.min(appliedCoupon.value, pricing.subtotal)
        : 0;

    const cappedCouponDiscount = Math.min(couponDiscount, pricing.total);
    const displayTotal = Math.max(0, pricing.total - couponDiscount);

    const bookNowDisabled =
        !agreedToTerms ||
        bookingOutcome === 'submitting' ||
        (customerMode === 'returning' && returningState !== 'verified') ||
        (customerMode === 'new' &&
            (!newName.trim() || !newEmail.trim() || !newPhone.trim())) ||
        emailExistsWarning ||
        isCheckingEmail;

    /* Zero-cost booking confirmed (100% discount - no payment required) */
    if (bookingConfirmedRef) {
        return (
            <>
                {title}
                <BannerSection title="Booking Confirmed" />
                <div
                    className="section-content"
                    style={{
                        minHeight: '70vh',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '60px 0',
                        background:
                            'linear-gradient(135deg, #f0fdf4 0%, #f8faff 100%)',
                    }}
                >
                    <div className="container">
                        <div className="row justify-content-center">
                            <div className="col-lg-5 col-md-7 col-sm-10">
                                <div
                                    className="text-center"
                                    style={{
                                        padding: '48px 36px',
                                        background: '#fff',
                                        borderRadius: 20,
                                        boxShadow:
                                            '0 8px 40px rgba(18,109,255,0.10)',
                                        border: '1px solid #e7f0ff',
                                    }}
                                >
                                    {/* Icon */}
                                    <div
                                        style={{
                                            width: 80,
                                            height: 80,
                                            background:
                                                'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 24px',
                                            fontSize: 34,
                                            color: '#16a34a',
                                            boxShadow:
                                                '0 4px 16px rgba(22,163,74,0.18)',
                                        }}
                                    >
                                        <FaCircleCheck />
                                    </div>

                                    {/* Heading */}
                                    <h3
                                        style={{
                                            fontWeight: 800,
                                            marginBottom: 6,
                                            color: '#0f172a',
                                            letterSpacing: '-0.3px',
                                        }}
                                    >
                                        Booking Confirmed!
                                    </h3>
                                    <p
                                        style={{
                                            color: '#64748b',
                                            fontSize: 15,
                                            marginBottom: 24,
                                        }}
                                    >
                                        Your reservation has been placed
                                        successfully.
                                    </p>

                                    {/* Reference pill */}
                                    <div
                                        style={{
                                            display: 'inline-block',
                                            background: '#f0f7ff',
                                            border: '1.5px solid #bfdbfe',
                                            borderRadius: 10,
                                            padding: '10px 24px',
                                            marginBottom: 24,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 11,
                                                color: '#6b83a6',
                                                fontWeight: 600,
                                                letterSpacing: '0.8px',
                                                textTransform: 'uppercase',
                                                marginBottom: 2,
                                            }}
                                        >
                                            Booking Reference
                                        </div>
                                        <div
                                            style={{
                                                fontWeight: 800,
                                                fontSize: 20,
                                                color: '#126DFF',
                                                letterSpacing: '1px',
                                            }}
                                        >
                                            {bookingConfirmedRef}
                                        </div>
                                    </div>

                                    {/* Discount note */}
                                    <div
                                        style={{
                                            background: '#f0fdf4',
                                            border: '1px solid #86efac',
                                            borderRadius: 10,
                                            padding: '12px 16px',
                                            marginBottom: 28,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <FaCircleCheck
                                            style={{
                                                color: '#16a34a',
                                                fontSize: 14,
                                                flexShrink: 0,
                                            }}
                                        />
                                        <span
                                            style={{
                                                color: '#15803d',
                                                fontSize: 13,
                                                fontWeight: 500,
                                            }}
                                        >
                                            No payment required - fully covered
                                            by your discount
                                        </span>
                                    </div>

                                    {/* CTA */}
                                    <Link
                                        to="/listings"
                                        className="btn btn-primary"
                                        style={{
                                            borderRadius: 10,
                                            padding: '10px 28px',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Browse More Vehicles
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    /* Success states */
    if (
        bookingOutcome === 'confirmed' ||
        bookingOutcome === 'profile_email_sent'
    ) {
        return (
            <>
                {title}
                <BannerSection title="Booking Received" />
                <div className="section-content p-t60 p-b120">
                    <div className="container">
                        <div className="row justify-content-center">
                            <div className="col-lg-5 col-md-8">
                                <div
                                    className="text-center"
                                    style={{
                                        padding: '40px 24px',
                                        background: '#fff',
                                        borderRadius: 16,
                                        border: '1px solid #e9ecef',
                                        boxShadow:
                                            '0 4px 24px rgba(0,0,0,0.07)',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 72,
                                            height: 72,
                                            background:
                                                bookingOutcome === 'confirmed'
                                                    ? '#dcfce7'
                                                    : '#dbeafe',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 20px',
                                            fontSize: 30,
                                            color:
                                                bookingOutcome === 'confirmed'
                                                    ? '#16a34a'
                                                    : '#1d4ed8',
                                        }}
                                    >
                                        {bookingOutcome === 'confirmed' ? (
                                            <FaCheck />
                                        ) : (
                                            <FaEnvelope />
                                        )}
                                    </div>
                                    <h4
                                        style={{
                                            fontWeight: 700,
                                            color: '#18191d',
                                            marginBottom: 8,
                                        }}
                                    >
                                        {bookingOutcome === 'confirmed'
                                            ? 'Booking Confirmed!'
                                            : 'Booking Received!'}
                                    </h4>
                                    {verifiedName && (
                                        <p
                                            style={{
                                                color: '#555',
                                                fontSize: 14,
                                                marginBottom: 16,
                                            }}
                                        >
                                            Welcome back,{' '}
                                            <strong>{verifiedName}</strong>.
                                        </p>
                                    )}
                                    {rentalReference && (
                                        <div
                                            style={{
                                                background: '#f0fdf4',
                                                border: '1px solid #86efac',
                                                borderRadius: 10,
                                                padding: '14px 18px',
                                                marginBottom: 20,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 11,
                                                    color: '#166534',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.6px',
                                                    marginBottom: 4,
                                                }}
                                            >
                                                Booking Reference
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 20,
                                                    fontWeight: 800,
                                                    color: '#15803d',
                                                    letterSpacing: '2px',
                                                }}
                                            >
                                                {rentalReference}
                                            </div>
                                        </div>
                                    )}
                                    {bookingOutcome ===
                                        'profile_email_sent' && (
                                        <div
                                            style={{
                                                background: '#eff6ff',
                                                border: '1px solid #bfdbfe',
                                                borderRadius: 10,
                                                padding: '12px 16px',
                                                marginBottom: 20,
                                                textAlign: 'left',
                                            }}
                                        >
                                            <p
                                                style={{
                                                    fontSize: 13,
                                                    color: '#1e40af',
                                                    fontWeight: 600,
                                                    marginBottom: 4,
                                                }}
                                            >
                                                Complete your profile
                                            </p>
                                            <p
                                                style={{
                                                    fontSize: 12,
                                                    color: '#1e3a8a',
                                                    marginBottom: 0,
                                                    lineHeight: 1.6,
                                                }}
                                            >
                                                A link has been sent to{' '}
                                                <strong>{newEmail}</strong> to
                                                complete your ID and license
                                                details. Please do this within 7
                                                days.
                                            </p>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        className="site-button-secondry"
                                        style={{ width: '100%' }}
                                        onClick={() => navigate('/listings')}
                                    >
                                        Back to Listings
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            {title}
            <BannerSection title="Confirm Your Booking" />

            <div className="section-content p-t60 p-b120">
                <div className="container">
                    <div className="row g-4">
                        {/* LEFT: Booking Summary */}
                        <div className="col-lg-7">
                            {/* Vehicle card */}
                            <div
                                style={{
                                    background: '#fff',
                                    borderRadius: 14,
                                    border: '1px solid #e9ecef',
                                    overflow: 'hidden',
                                    marginBottom: 20,
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 16,
                                        padding: '18px 22px',
                                        background:
                                            'linear-gradient(135deg, #f8f9fa 0%, #fff 100%)',
                                        borderBottom: '1px solid #f0f0f0',
                                    }}
                                >
                                    {primaryImage ? (
                                        <img
                                            src={primaryImage.thumb}
                                            alt={vehicle.name}
                                            style={{
                                                width: 88,
                                                height: 58,
                                                objectFit: 'cover',
                                                borderRadius: 8,
                                                flexShrink: 0,
                                                border: '1px solid #e9ecef',
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                width: 88,
                                                height: 58,
                                                background: '#e9ecef',
                                                borderRadius: 8,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                fontSize: 28,
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
                                                fontSize: 18,
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
                                    {canShowPrice && (
                                        <div
                                            style={{
                                                textAlign: 'right',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    color: '#aaa',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                }}
                                            >
                                                Total
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 18,
                                                    fontWeight: 800,
                                                    color: '#126DFF',
                                                }}
                                            >
                                                {formatAmount(displayTotal)}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Trip details grid */}
                                <div style={{ padding: '18px 22px' }}>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: '#aaa',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.8px',
                                            marginBottom: 14,
                                        }}
                                    >
                                        Trip Details
                                    </div>
                                    <div className="row g-3">
                                        <div className="col-sm-6">
                                            <TripItem
                                                icon={<FaCalendarDays />}
                                                label="Pickup"
                                                value={`${fmtDate(form.pickup_date)}`}
                                                sub={`at ${fmtTime(form.pickup_time)}`}
                                            />
                                        </div>
                                        <div className="col-sm-6">
                                            <TripItem
                                                icon={<FaCalendarDays />}
                                                label="Return"
                                                value={`${fmtDate(form.return_date)}`}
                                                sub={`at ${fmtTime(form.return_time)}`}
                                            />
                                        </div>
                                        <div className="col-sm-6">
                                            <TripItem
                                                icon={<FaClock />}
                                                label="Duration"
                                                value={`${days} ${days === 1 ? 'day' : 'days'}`}
                                            />
                                        </div>
                                        {selectedLocation && (
                                            <div className="col-sm-6">
                                                <TripItem
                                                    icon={<FaLocationDot />}
                                                    label="Pickup Location"
                                                    value={
                                                        selectedLocation.name
                                                    }
                                                />
                                            </div>
                                        )}
                                        {selectedDropoffLocation && (
                                            <div className="col-sm-6">
                                                <TripItem
                                                    icon={<FaFlagCheckered />}
                                                    label="Drop-off"
                                                    value={
                                                        selectedDropoffLocation.name
                                                    }
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Price breakdown */}
                            {canShowPrice && (
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
                                            padding: '14px 22px',
                                            borderBottom: '1px solid #f0f0f0',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
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
                                            Price Breakdown
                                        </span>
                                    </div>
                                    <div style={{ padding: '16px 22px' }}>
                                        <LineItem
                                            label={`Base cost (${days} ${days === 1 ? 'day' : 'days'} x ${formatAmount(vehicle.daily_rate)})`}
                                            amount={pricing.baseCost}
                                            currencySymbol={
                                                vehicleCurrencySymbol ??
                                                undefined
                                            }
                                        />

                                        {(autoCharges ?? []).length > 0 && (
                                            <>
                                                <div
                                                    style={{
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        color: '#bbb',
                                                        textTransform:
                                                            'uppercase',
                                                        letterSpacing: '0.6px',
                                                        margin: '10px 0 4px',
                                                    }}
                                                >
                                                    Included Charges
                                                </div>
                                                {autoCharges.map(c => (
                                                    <LineItem
                                                        key={c.id}
                                                        label={`${c.name} (${chargeLineLabel(c, days)})`}
                                                        amount={chargeLineAmount(
                                                            c,
                                                            days,
                                                            pricing.baseCost
                                                        )}
                                                        indent
                                                        currencySymbol={
                                                            vehicleCurrencySymbol ??
                                                            undefined
                                                        }
                                                    />
                                                ))}
                                            </>
                                        )}

                                        {selectedAddons.length > 0 && (
                                            <>
                                                <div
                                                    style={{
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        color: '#bbb',
                                                        textTransform:
                                                            'uppercase',
                                                        letterSpacing: '0.6px',
                                                        margin: '10px 0 4px',
                                                    }}
                                                >
                                                    Add-ons
                                                </div>
                                                {selectedAddons.map(a => (
                                                    <LineItem
                                                        key={a.id}
                                                        label={`${a.name} (${chargeLineLabel(a, days)})`}
                                                        amount={chargeLineAmount(
                                                            a,
                                                            days,
                                                            pricing.baseCost
                                                        )}
                                                        indent
                                                        currencySymbol={
                                                            vehicleCurrencySymbol ??
                                                            undefined
                                                        }
                                                    />
                                                ))}
                                            </>
                                        )}

                                        {pricing.pickupCharge > 0 && (
                                            <LineItem
                                                label="Pickup location charge"
                                                amount={pricing.pickupCharge}
                                                currencySymbol={
                                                    vehicleCurrencySymbol ??
                                                    undefined
                                                }
                                            />
                                        )}
                                        {pricing.dropoffCharge > 0 && (
                                            <LineItem
                                                label="Drop-off location charge"
                                                amount={pricing.dropoffCharge}
                                                currencySymbol={
                                                    vehicleCurrencySymbol ??
                                                    undefined
                                                }
                                            />
                                        )}
                                        {(pricing.discountAmount ?? 0) > 0 && (
                                            <LineItem
                                                label="Discount"
                                                amount={
                                                    -(
                                                        pricing.discountAmount ??
                                                        0
                                                    )
                                                }
                                                highlight="discount"
                                                currencySymbol={
                                                    vehicleCurrencySymbol ??
                                                    undefined
                                                }
                                            />
                                        )}
                                        {cappedCouponDiscount > 0 && (
                                            <LineItem
                                                label={`${appliedCoupon!.code.toUpperCase()} - ${appliedCoupon!.name} (${appliedCoupon!.type === 'percentage' ? `${appliedCoupon!.value}% off` : `${vehicleCurrencySymbol ?? '₵'}${appliedCoupon!.value} off`})`}
                                                amount={-cappedCouponDiscount}
                                                highlight="discount"
                                                currencySymbol={
                                                    vehicleCurrencySymbol ??
                                                    undefined
                                                }
                                            />
                                        )}
                                        {pricing.vatEnabled && (
                                            <LineItem
                                                label={`VAT (${pricing.vatRate}%)`}
                                                amount={pricing.vatAmount}
                                                currencySymbol={
                                                    vehicleCurrencySymbol ??
                                                    undefined
                                                }
                                            />
                                        )}

                                        {/* Coupon input */}
                                        <div
                                            style={{
                                                borderTop: '1px dashed #e9ecef',
                                                marginTop: 12,
                                                paddingTop: 12,
                                            }}
                                        >
                                            {appliedCoupon ? (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent:
                                                            'space-between',
                                                        background: '#f0fdf4',
                                                        border: '1px solid #86efac',
                                                        borderRadius: 8,
                                                        padding: '8px 12px',
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            color: '#15803d',
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        ✓{' '}
                                                        <span
                                                            style={{
                                                                letterSpacing:
                                                                    '0.5px',
                                                            }}
                                                        >
                                                            {appliedCoupon.code.toUpperCase()}{' '}
                                                            -{' '}
                                                            {appliedCoupon.name}
                                                        </span>{' '}
                                                        applied
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            handleRemoveCoupon
                                                        }
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            fontSize: 16,
                                                            color: '#16a34a',
                                                            lineHeight: 1,
                                                            padding: '0 2px',
                                                        }}
                                                        title="Remove coupon"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            gap: 8,
                                                        }}
                                                    >
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm"
                                                            placeholder="Coupon code"
                                                            value={couponInput}
                                                            onChange={e => {
                                                                setCouponInput(
                                                                    e.target.value.toUpperCase()
                                                                );
                                                                setCouponError(
                                                                    ''
                                                                );
                                                            }}
                                                            onKeyDown={e => {
                                                                if (
                                                                    e.key ===
                                                                    'Enter'
                                                                )
                                                                    void handleApplyCoupon();
                                                            }}
                                                            style={{
                                                                flex: 1,
                                                                fontSize: 13,
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-secondary"
                                                            onClick={() =>
                                                                void handleApplyCoupon()
                                                            }
                                                            disabled={
                                                                !couponInput.trim() ||
                                                                couponLoading
                                                            }
                                                            style={{
                                                                whiteSpace:
                                                                    'nowrap',
                                                                fontSize: 13,
                                                            }}
                                                        >
                                                            {couponLoading
                                                                ? '...'
                                                                : 'Apply'}
                                                        </button>
                                                    </div>
                                                    {couponError && (
                                                        <div
                                                            style={{
                                                                fontSize: 12,
                                                                color: '#dc2626',
                                                                marginTop: 4,
                                                            }}
                                                        >
                                                            {couponError}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        <div
                                            style={{
                                                borderTop: '2px solid #e9ecef',
                                                marginTop: 12,
                                                paddingTop: 12,
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontWeight: 700,
                                                    fontSize: 14,
                                                    color: '#18191d',
                                                }}
                                            >
                                                Rental Total
                                            </span>
                                            <span
                                                style={{
                                                    fontWeight: 800,
                                                    fontSize: 16,
                                                    color: '#126DFF',
                                                }}
                                            >
                                                {formatAmount(displayTotal)}
                                            </span>
                                        </div>

                                        {securityDepositAmount > 0 && (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent:
                                                        'space-between',
                                                    alignItems: 'center',
                                                    padding: '8px 0',
                                                    fontSize: 13,
                                                    color: '#555',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                    }}
                                                >
                                                    Security Deposit
                                                    <span
                                                        style={{
                                                            background:
                                                                '#fef9c3',
                                                            color: '#854d0e',
                                                            fontSize: 10,
                                                            fontWeight: 700,
                                                            borderRadius: 4,
                                                            padding: '2px 6px',
                                                            textTransform:
                                                                'uppercase',
                                                            letterSpacing:
                                                                '0.4px',
                                                        }}
                                                    >
                                                        Refundable
                                                    </span>
                                                </span>
                                                <span>
                                                    {formatAmount(
                                                        securityDepositAmount
                                                    )}
                                                </span>
                                            </div>
                                        )}

                                        {securityDepositAmount > 0 && (
                                            <div
                                                style={{
                                                    marginTop: 8,
                                                    padding: '10px 12px',
                                                    background: '#fef2f2',
                                                    border: '1px solid #fecaca',
                                                    borderRadius: 6,
                                                    fontSize: 12,
                                                    color: '#b91c1c',
                                                    lineHeight: 1.5,
                                                }}
                                            >
                                                Security deposit of{' '}
                                                <strong>
                                                    {formatAmount(
                                                        securityDepositAmount
                                                    )}
                                                </strong>{' '}
                                                will be collected at pickup.
                                            </div>
                                        )}

                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Customer Details */}
                        <div className="col-lg-5">
                            <div
                                style={{
                                    background: '#fff',
                                    borderRadius: 14,
                                    border: '1px solid #e9ecef',
                                    padding: '26px',
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                                    position: 'sticky',
                                    top: 24,
                                }}
                            >
                                {/* Tab switcher */}
                                <div
                                    style={{
                                        display: 'flex',
                                        background: '#f3f4f6',
                                        borderRadius: 10,
                                        padding: 3,
                                        marginBottom: 22,
                                    }}
                                >
                                    {(['new', 'returning'] as const).map(
                                        mode => (
                                            <button
                                                key={mode}
                                                type="button"
                                                onClick={() =>
                                                    mode === 'new'
                                                        ? handleSwitchToNew()
                                                        : setCustomerMode(
                                                              'returning'
                                                          )
                                                }
                                                style={{
                                                    flex: 1,
                                                    border: 'none',
                                                    borderRadius: 8,
                                                    padding: '8px 12px',
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s',
                                                    background:
                                                        customerMode === mode
                                                            ? '#fff'
                                                            : 'transparent',
                                                    color:
                                                        customerMode === mode
                                                            ? '#18191d'
                                                            : '#888',
                                                    boxShadow:
                                                        customerMode === mode
                                                            ? '0 1px 4px rgba(0,0,0,0.1)'
                                                            : 'none',
                                                }}
                                            >
                                                {mode === 'new'
                                                    ? 'New Customer'
                                                    : 'Returning Customer'}
                                            </button>
                                        )
                                    )}
                                </div>

                                {/* Returning customer panel */}
                                {customerMode === 'returning' && (
                                    <div style={{ marginBottom: 20 }}>
                                        {returningState === 'email_input' ||
                                        returningState === 'not_found' ? (
                                            <>
                                                {returningState ===
                                                    'not_found' && (
                                                    <div
                                                        style={{
                                                            background:
                                                                '#fffbeb',
                                                            border: '1px solid #fde68a',
                                                            borderRadius: 8,
                                                            padding:
                                                                '10px 14px',
                                                            fontSize: 13,
                                                            color: '#78350f',
                                                            marginBottom: 12,
                                                        }}
                                                    >
                                                        No account found.
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setNewEmail(
                                                                    returningEmail
                                                                );
                                                                handleSwitchToNew();
                                                            }}
                                                            style={{
                                                                background:
                                                                    'none',
                                                                border: '1px solid #d97706',
                                                                borderRadius: 4,
                                                                padding:
                                                                    '2px 8px',
                                                                fontSize: 12,
                                                                fontWeight: 600,
                                                                color: '#92400e',
                                                                cursor: 'pointer',
                                                                marginLeft: 8,
                                                            }}
                                                        >
                                                            Continue as new
                                                        </button>
                                                    </div>
                                                )}
                                                {verificationError && (
                                                    <div
                                                        style={{
                                                            background:
                                                                '#fee2e2',
                                                            border: '1px solid #fca5a5',
                                                            borderRadius: 8,
                                                            padding:
                                                                '10px 14px',
                                                            fontSize: 13,
                                                            color: '#991b1b',
                                                            marginBottom: 12,
                                                        }}
                                                    >
                                                        {verificationError}
                                                    </div>
                                                )}
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        gap: 8,
                                                    }}
                                                >
                                                    <input
                                                        type="email"
                                                        className="form-control"
                                                        placeholder="your@email.com"
                                                        value={returningEmail}
                                                        onChange={e =>
                                                            setReturningEmail(
                                                                e.target.value
                                                            )
                                                        }
                                                        onKeyDown={e => {
                                                            if (
                                                                e.key ===
                                                                'Enter'
                                                            )
                                                                void handleSendVerification();
                                                        }}
                                                        style={{ flex: 1 }}
                                                        autoFocus
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary"
                                                        onClick={() =>
                                                            void handleSendVerification()
                                                        }
                                                        disabled={
                                                            !returningEmail.trim() ||
                                                            isSending
                                                        }
                                                        style={{
                                                            whiteSpace:
                                                                'nowrap',
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {isSending
                                                            ? '...'
                                                            : 'Send'}
                                                    </button>
                                                </div>
                                                <p
                                                    style={{
                                                        fontSize: 12,
                                                        color: '#aaa',
                                                        marginTop: 6,
                                                        marginBottom: 0,
                                                    }}
                                                >
                                                    We'll send a verification
                                                    link to confirm your
                                                    identity.
                                                </p>
                                            </>
                                        ) : returningState === 'waiting' ? (
                                            <div
                                                style={{
                                                    textAlign: 'center',
                                                    padding: '12px 0',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: 13,
                                                        color: '#555',
                                                        marginBottom: 6,
                                                    }}
                                                >
                                                    Verification link sent to
                                                </div>
                                                <div
                                                    style={{
                                                        fontWeight: 700,
                                                        fontSize: 14,
                                                        color: '#18191d',
                                                        marginBottom: 12,
                                                    }}
                                                >
                                                    {maskedEmail}
                                                </div>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent:
                                                            'center',
                                                        gap: 8,
                                                        color: '#888',
                                                        fontSize: 13,
                                                        marginBottom: 14,
                                                    }}
                                                >
                                                    <div
                                                        className="spinner-border spinner-border-sm text-secondary"
                                                        role="status"
                                                        style={{
                                                            width: 14,
                                                            height: 14,
                                                            borderWidth: 2,
                                                        }}
                                                    >
                                                        <span className="visually-hidden">
                                                            Waiting...
                                                        </span>
                                                    </div>
                                                    Waiting for verification...
                                                </div>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        gap: 8,
                                                        justifyContent:
                                                            'center',
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-secondary"
                                                        onClick={handleResend}
                                                    >
                                                        Resend
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-link text-secondary p-0"
                                                        style={{
                                                            textDecoration:
                                                                'none',
                                                        }}
                                                        onClick={
                                                            handleSwitchToNew
                                                        }
                                                    >
                                                        New customer instead
                                                    </button>
                                                </div>
                                            </div>
                                        ) : returningState === 'verified' ? (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 12,
                                                    padding: '10px 14px',
                                                    background: '#f0fdf4',
                                                    border: '1px solid #86efac',
                                                    borderRadius: 10,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: 36,
                                                        height: 36,
                                                        background: '#dcfce7',
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent:
                                                            'center',
                                                        flexShrink: 0,
                                                        fontSize: 16,
                                                        color: '#16a34a',
                                                    }}
                                                >
                                                    <FaCheck />
                                                </div>
                                                <div>
                                                    <div
                                                        style={{
                                                            fontWeight: 700,
                                                            fontSize: 14,
                                                            color: '#18191d',
                                                        }}
                                                    >
                                                        Welcome back
                                                        {verifiedName
                                                            ? `, ${verifiedName}`
                                                            : ''}
                                                        !
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 12,
                                                            color: '#16a34a',
                                                        }}
                                                    >
                                                        Identity verified
                                                    </div>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                )}

                                {/* New customer form */}
                                {customerMode !== 'returning' && (
                                    <>
                                        <div className="form-group mb-3">
                                            <label
                                                className="form-label"
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Full Name{' '}
                                                <span
                                                    style={{ color: '#dc3545' }}
                                                >
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Enter your full name"
                                                value={newName}
                                                onChange={e =>
                                                    setNewName(e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="form-group mb-3">
                                            <label
                                                className="form-label"
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Email Address{' '}
                                                <span
                                                    style={{ color: '#dc3545' }}
                                                >
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="email"
                                                className={`form-control${emailExistsWarning ? ' is-invalid' : ''}`}
                                                placeholder="Enter your email"
                                                value={newEmail}
                                                onChange={e => {
                                                    setNewEmail(e.target.value);
                                                    setEmailExistsWarning(
                                                        false
                                                    );
                                                }}
                                                onBlur={() =>
                                                    void handleNewEmailBlur()
                                                }
                                            />
                                            {isCheckingEmail && (
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        color: '#888',
                                                        marginTop: 4,
                                                    }}
                                                >
                                                    Checking...
                                                </div>
                                            )}
                                            {emailExistsWarning && (
                                                <div
                                                    style={{
                                                        background: '#fffbeb',
                                                        border: '1px solid #fde68a',
                                                        borderRadius: 6,
                                                        padding: '8px 12px',
                                                        marginTop: 6,
                                                        fontSize: 12,
                                                        color: '#78350f',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent:
                                                            'space-between',
                                                        gap: 8,
                                                    }}
                                                >
                                                    <span>
                                                        This email is already
                                                        registered.
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            handleSwitchToReturningWithEmail
                                                        }
                                                        style={{
                                                            background: 'none',
                                                            border: '1px solid #d97706',
                                                            borderRadius: 4,
                                                            padding: '2px 8px',
                                                            fontSize: 11,
                                                            fontWeight: 600,
                                                            color: '#92400e',
                                                            cursor: 'pointer',
                                                            whiteSpace:
                                                                'nowrap',
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        Verify instead
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="form-group mb-4">
                                            <label
                                                className="form-label"
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Phone Number{' '}
                                                <span
                                                    style={{ color: '#dc3545' }}
                                                >
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                placeholder="Enter your phone number"
                                                value={newPhone}
                                                onChange={e =>
                                                    setNewPhone(e.target.value)
                                                }
                                            />
                                        </div>
                                    </>
                                )}

                                {/* T&C */}
                                <label
                                    className="d-flex align-items-start gap-2 mb-4"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={agreedToTerms}
                                        onChange={e =>
                                            setAgreedToTerms(e.target.checked)
                                        }
                                        style={{
                                            marginTop: 3,
                                            flexShrink: 0,
                                            width: 16,
                                            height: 16,
                                        }}
                                    />
                                    <span
                                        style={{ fontSize: 13, color: '#555' }}
                                    >
                                        I agree to the{' '}
                                        <Link
                                            to="/terms"
                                            target="_blank"
                                            style={{
                                                color: '#126DFF',
                                                fontWeight: 600,
                                            }}
                                        >
                                            Terms & Conditions
                                        </Link>
                                    </span>
                                </label>

                                {/* CTA */}
                                <button
                                    type="button"
                                    className="site-button dark-bg"
                                    style={{
                                        width: '100%',
                                        opacity: bookNowDisabled ? 0.5 : 1,
                                        cursor: bookNowDisabled
                                            ? 'not-allowed'
                                            : 'pointer',
                                        borderRadius: 10,
                                        padding: '13px 24px',
                                        fontSize: 15,
                                        fontWeight: 700,
                                    }}
                                    disabled={bookNowDisabled}
                                    onClick={() => {
                                        customerMode === 'new'
                                            ? void handleBookNewCustomer()
                                            : void handleBookNow();
                                    }}
                                >
                                    {bookingOutcome === 'submitting' ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                                style={{
                                                    width: 14,
                                                    height: 14,
                                                    borderWidth: 2,
                                                }}
                                            />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            Book Now
                                            {canShowPrice && (
                                                <span
                                                    style={{
                                                        marginLeft: 8,
                                                        opacity: 0.85,
                                                        fontWeight: 400,
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    -{' '}
                                                    {formatAmount(
                                                        displayTotal
                                                    )}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </button>

                                {bookingOutcome === 'error' && bookingError && (
                                    <div
                                        style={{
                                            background: '#fee2e2',
                                            border: '1px solid #fca5a5',
                                            borderRadius: 8,
                                            padding: '10px 14px',
                                            fontSize: 13,
                                            color: '#991b1b',
                                            marginTop: 12,
                                        }}
                                    >
                                        {bookingError}
                                    </div>
                                )}

                                <button
                                    type="button"
                                    className="site-button-secondry"
                                    style={{
                                        width: '100%',
                                        marginTop: 10,
                                        borderRadius: 10,
                                    }}
                                    onClick={() =>
                                        navigate(`/listings/${vehicle.id}`)
                                    }
                                >
                                    Back to Vehicle
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

/* Sub-components */
function TripItem({
    icon,
    label,
    value,
    sub,
}: {
    icon: ReactNode;
    label: string;
    value: string;
    sub?: string;
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 16, lineHeight: 1, marginTop: 2 }}>
                {icon}
            </span>
            <div>
                <div
                    style={{
                        fontSize: 10,
                        color: '#aaa',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        fontWeight: 600,
                    }}
                >
                    {label}
                </div>
                <div
                    style={{ fontWeight: 700, fontSize: 13, color: '#18191d' }}
                >
                    {value}
                </div>
                {sub && (
                    <div style={{ fontSize: 12, color: '#888' }}>{sub}</div>
                )}
            </div>
        </div>
    );
}

function LineItem({
    label,
    amount,
    indent = false,
    highlight,
    currencySymbol,
}: {
    label: string;
    amount: number;
    indent?: boolean;
    highlight?: string;
    currencySymbol?: string;
}) {
    const fmt = useFormatCurrency();
    const isDiscount = highlight === 'discount';
    return (
        <div
            className="d-flex justify-content-between align-items-center"
            style={{
                padding: '4px 0',
                fontSize: 13,
                color: isDiscount ? '#16a34a' : '#555',
                paddingLeft: indent ? 12 : 0,
            }}
        >
            <span>{label}</span>
            <span style={{ fontWeight: isDiscount ? 700 : 400 }}>
                {currencySymbol
                    ? formatWithSymbol(amount, currencySymbol)
                    : fmt(amount)}
            </span>
        </div>
    );
}
