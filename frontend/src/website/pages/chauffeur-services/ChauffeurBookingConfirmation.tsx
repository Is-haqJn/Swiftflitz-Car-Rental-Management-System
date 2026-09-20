import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTitle } from '@/shared/hooks';
import { MdCheckCircle } from 'react-icons/md';
import { publicChauffeurService } from '@/services/publicChauffeurService';
import { couponService } from '@/services/couponService';
import type { DiscountCoupon } from '@/shared/types/coupon.types';
import { useFormatCurrency } from '@/shared/hooks/queries/useSettings';
import { formatWithSymbol } from '@/shared/libs/currency';
import { usePublicChauffeurSettings } from '@/shared/hooks/queries/useChauffeurSettings';
import type { FleetVehicle } from '@/shared/types/fleetVehicle.types';
import { BannerSection } from './sections/BannerSection';
import { getErrorMessage } from '@/shared/libs/utils';

/* Types */
interface ChauffeurLocation {
    id: string;
    name: string;
    charge: number | null;
}

interface ChauffeurBookingForm {
    pickup_date: string;
    pickup_time: string;
    pickup_location_id: string;
    exact_address: string;
}

interface ConfirmState {
    vehicle: FleetVehicle;
    form: ChauffeurBookingForm;
    selectedLocation: ChauffeurLocation | null;
    basePrice: number | null;
    locationCharge: number;
}

type CustomerMode = 'new' | 'returning';
type ReturningLookupState = 'idle' | 'checking' | 'found' | 'not_found';
type BookingOutcome = 'idle' | 'submitting' | 'confirmed' | 'error';

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

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ marginBottom: 12 }}>
            <div
                style={{
                    fontSize: 11,
                    color: '#999',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: 2,
                }}
            >
                {label}
            </div>
            <div style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>
                {value}
            </div>
        </div>
    );
}

function SectionLabel({ label }: { label: string }) {
    return (
        <div
            style={{
                fontSize: 11,
                color: '#888',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 700,
                margin: '16px 0 10px',
            }}
        >
            {label}
        </div>
    );
}

function PriceLine({
    label,
    amount,
    bold,
    highlight,
    currencySymbol,
}: {
    label: string;
    amount: number;
    bold?: boolean;
    highlight?: boolean;
    currencySymbol?: string;
}) {
    const fmt = useFormatCurrency();
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
                fontWeight: bold ? 700 : 400,
                fontSize: bold ? 15 : 13,
                color: highlight ? '#126DFF' : '#333',
            }}
        >
            <span>{label}</span>
            <span>
                {currencySymbol
                    ? formatWithSymbol(amount, currencySymbol)
                    : fmt(amount)}
            </span>
        </div>
    );
}

/* Component */
export default function ChauffeurBookingConfirmation() {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as ConfirmState | null;
    const title = useTitle(
        state?.vehicle
            ? `Confirm Booking - ${state.vehicle.make} ${state.vehicle.model} ${state.vehicle.year}`
            : 'Confirm Booking'
    );

    /* Customer mode */
    const [customerMode, setCustomerMode] = useState<CustomerMode>('new');
    const [returningLookupState, setReturningLookupState] =
        useState<ReturningLookupState>('idle');
    const [returningEmail, setReturningEmail] = useState('');
    const [isChecking, setIsChecking] = useState(false);

    /* Customer form fields */
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    /* Submission */
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [bookingOutcome, setBookingOutcome] =
        useState<BookingOutcome>('idle');
    const [bookingReference] = useState('');
    const [bookingError, setBookingError] = useState('');

    /* Coupon */
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<DiscountCoupon | null>(
        null
    );
    const [couponError, setCouponError] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);

    const { data: publicSettings } = usePublicChauffeurSettings();

    if (!state) {
        navigate('/chauffeur-services', { replace: true });
        return null;
    }

    const { vehicle, form, selectedLocation, basePrice, locationCharge } =
        state;
    const vehicleName = `${vehicle.make} ${vehicle.model} ${vehicle.year}`;
    const chauffeurAssignment = vehicle.service_assignments?.find(
        a => a.service_type === 'chauffeur'
    );
    const primaryPhoto = vehicle.photos?.[0];
    const subtotal = (basePrice ?? 0) + locationCharge;
    const vatRate = publicSettings?.data?.vat_rate ?? 0;

    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) return;
        setCouponLoading(true);
        setCouponError('');
        try {
            const res = await couponService.validateCode(
                couponInput.trim().toUpperCase(),
                undefined,
                'chauffeur'
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
            ? (appliedCoupon.value / 100) * subtotal
            : Math.min(appliedCoupon.value, subtotal)
        : 0;

    const discountedSubtotal = subtotal - couponDiscount;
    const vatAmount =
        Math.round(((discountedSubtotal * vatRate) / 100) * 100) / 100;
    const displayTotal =
        Math.round((discountedSubtotal + vatAmount) * 100) / 100;

    /* Returning customer lookup */
    const handleCheckReturning = async () => {
        if (!returningEmail.trim()) return;
        setIsChecking(true);
        setReturningLookupState('idle');
        try {
            const res = await publicChauffeurService.checkCustomer(
                returningEmail.trim()
            );
            if (res.data.exists) {
                setName(res.data.full_name ?? '');
                setEmail(returningEmail.trim());
                setPhone(res.data.phone ?? '');
                setReturningLookupState('found');
            } else {
                setReturningLookupState('not_found');
            }
        } catch {
            setReturningLookupState('not_found');
        } finally {
            setIsChecking(false);
        }
    };

    const handleSwitchToNew = () => {
        setCustomerMode('new');
        setReturningLookupState('idle');
        setReturningEmail('');
    };

    const handleSwitchToReturning = () => {
        setCustomerMode('returning');
        setReturningLookupState('idle');
        setReturningEmail('');
    };

    /* Book Now */
    const handleBookNow = async () => {
        setBookingOutcome('submitting');
        setBookingError('');
        try {
            const res = await publicChauffeurService.book({
                vehicle_id: vehicle.id,
                pickup_location_id: form.pickup_location_id || undefined,
                pickup_time: `${form.pickup_date}T${form.pickup_time}:00`,
                customer_full_name: name.trim(),
                customer_email: email.trim() || undefined,
                customer_phone: phone.trim(),
                expected_destination: form.exact_address || undefined,
                coupon_code: appliedCoupon?.code,
            });
            const params = new URLSearchParams({
                amount: String(displayTotal),
                booking_ref: res.data.booking_reference,
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
            });
            navigate(
                `/payment/chauffeur_booking/${res.data.booking_id}?${params.toString()}`
            );
        } catch (err: unknown) {
            setBookingOutcome('error');
            setBookingError(
                getErrorMessage(err, 'Something went wrong. Please try again.')
            );
        }
    };

    const bookNowDisabled =
        !agreedToTerms ||
        bookingOutcome === 'submitting' ||
        !name.trim() ||
        !phone.trim();

    /* Render */
    return (
        <>
            {title}
            <BannerSection />

            <div className="section-content p-t60 p-b120">
                <div className="container">
                    <div className="row">
                        {/* LEFT: Booking Summary */}
                        <div className="col-lg-7 mb-4">
                            <div
                                style={{
                                    background: '#fff',
                                    borderRadius: 12,
                                    border: '1px solid #e8e8e8',
                                    padding: 24,
                                }}
                            >
                                {/* Vehicle Header */}
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: 16,
                                        alignItems: 'flex-start',
                                        marginBottom: 20,
                                    }}
                                >
                                    {primaryPhoto && (
                                        <img
                                            src={primaryPhoto.urls.thumb}
                                            alt={vehicleName}
                                            style={{
                                                width: 80,
                                                height: 60,
                                                objectFit: 'cover',
                                                borderRadius: 8,
                                                flexShrink: 0,
                                            }}
                                        />
                                    )}
                                    <div>
                                        <div
                                            style={{
                                                fontWeight: 700,
                                                fontSize: 17,
                                                color: '#1a1a2e',
                                                lineHeight: 1.3,
                                            }}
                                        >
                                            {vehicleName}
                                        </div>
                                        {chauffeurAssignment?.category && (
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    color: '#888',
                                                    marginTop: 3,
                                                }}
                                            >
                                                {
                                                    chauffeurAssignment.category
                                                        .name
                                                }
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <hr
                                    style={{
                                        margin: '0 0 16px',
                                        borderColor: '#f0f0f0',
                                    }}
                                />

                                {/* Booking Details */}
                                <SectionLabel label="Booking Details" />
                                <DetailRow
                                    label="Pickup Date"
                                    value={fmtDate(form.pickup_date)}
                                />
                                <DetailRow
                                    label="Pickup Time"
                                    value={fmtTime(form.pickup_time)}
                                />
                                {selectedLocation && (
                                    <DetailRow
                                        label="Pickup Location"
                                        value={selectedLocation.name}
                                    />
                                )}
                                {form.exact_address && (
                                    <DetailRow
                                        label="Exact Address"
                                        value={form.exact_address}
                                    />
                                )}

                                {/* Price Breakdown */}
                                {basePrice !== null && (
                                    <>
                                        <hr
                                            style={{
                                                margin: '16px 0',
                                                borderColor: '#f0f0f0',
                                            }}
                                        />
                                        <SectionLabel label="Price Breakdown" />
                                        <PriceLine
                                            label="Base Price"
                                            amount={basePrice}
                                            currencySymbol={
                                                state?.vehicle?.branch
                                                    ?.currency_symbol ??
                                                undefined
                                            }
                                        />
                                        {locationCharge > 0 && (
                                            <PriceLine
                                                label={`Location Charge${selectedLocation ? ` - ${selectedLocation.name}` : ''}`}
                                                amount={locationCharge}
                                                currencySymbol={
                                                    state?.vehicle?.branch
                                                        ?.currency_symbol ??
                                                    undefined
                                                }
                                            />
                                        )}
                                        {couponDiscount > 0 && (
                                            <PriceLine
                                                label={`Coupon (${appliedCoupon!.code})`}
                                                amount={-couponDiscount}
                                                highlight
                                                currencySymbol={
                                                    state?.vehicle?.branch
                                                        ?.currency_symbol ??
                                                    undefined
                                                }
                                            />
                                        )}
                                        {vatAmount > 0 && (
                                            <PriceLine
                                                label={`VAT (${vatRate}%)`}
                                                amount={vatAmount}
                                                currencySymbol={
                                                    state?.vehicle?.branch
                                                        ?.currency_symbol ??
                                                    undefined
                                                }
                                            />
                                        )}

                                        {/* Coupon input */}
                                        <div style={{ margin: '10px 0' }}>
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
                                                            {appliedCoupon.code}
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

                                        <hr
                                            style={{
                                                margin: '10px 0',
                                                borderColor: '#f0f0f0',
                                            }}
                                        />
                                        <PriceLine
                                            label="Total"
                                            amount={displayTotal}
                                            bold
                                            highlight
                                            currencySymbol={
                                                state?.vehicle?.branch
                                                    ?.currency_symbol ??
                                                undefined
                                            }
                                        />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Customer Details */}
                        <div className="col-lg-5">
                            {/* Confirmed State */}
                            {bookingOutcome === 'confirmed' ? (
                                <div
                                    style={{
                                        background: '#fff',
                                        borderRadius: 12,
                                        border: '1px solid #e8e8e8',
                                        padding: 28,
                                        textAlign: 'center',
                                    }}
                                >
                                    <MdCheckCircle
                                        size={52}
                                        color="#22c55e"
                                        style={{ marginBottom: 12 }}
                                    />
                                    <h4
                                        style={{
                                            fontWeight: 700,
                                            marginBottom: 6,
                                        }}
                                    >
                                        Booking Received!
                                    </h4>
                                    <p
                                        style={{
                                            color: '#555',
                                            fontSize: 14,
                                            marginBottom: 16,
                                        }}
                                    >
                                        Our team will be in touch to confirm
                                        your chauffeur booking.
                                    </p>
                                    <div
                                        style={{
                                            background: '#f0f7ff',
                                            border: '1px solid #bfdbfe',
                                            borderRadius: 8,
                                            padding: '10px 16px',
                                            marginBottom: 20,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 11,
                                                color: '#3b82f6',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.06em',
                                                marginBottom: 4,
                                            }}
                                        >
                                            Booking Reference
                                        </div>
                                        <div
                                            style={{
                                                fontWeight: 800,
                                                fontSize: 20,
                                                color: '#1d4ed8',
                                                letterSpacing: '0.05em',
                                            }}
                                        >
                                            {bookingReference}
                                        </div>
                                    </div>
                                    <a
                                        href="/chauffeur-services"
                                        className="site-button dark-bg d-inline-block"
                                        style={{ fontSize: 13 }}
                                    >
                                        Back to Chauffeur Services
                                    </a>
                                </div>
                            ) : (
                                <div
                                    style={{
                                        background: '#fff',
                                        borderRadius: 12,
                                        border: '1px solid #e8e8e8',
                                        padding: 24,
                                    }}
                                >
                                    {/* Mode toggle */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: 16,
                                        }}
                                    >
                                        <h5
                                            style={{
                                                fontWeight: 700,
                                                margin: 0,
                                                fontSize: 16,
                                            }}
                                        >
                                            Your Details
                                        </h5>
                                        <button
                                            type="button"
                                            onClick={
                                                customerMode === 'new'
                                                    ? handleSwitchToReturning
                                                    : handleSwitchToNew
                                            }
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#126DFF',
                                                fontSize: 12,
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                padding: 0,
                                                textDecoration: 'underline',
                                            }}
                                        >
                                            {customerMode === 'new'
                                                ? 'Returning customer?'
                                                : 'New customer?'}
                                        </button>
                                    </div>

                                    {/* Returning customer lookup */}
                                    {customerMode === 'returning' && (
                                        <div style={{ marginBottom: 16 }}>
                                            <label
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    color: '#555',
                                                    marginBottom: 6,
                                                    display: 'block',
                                                }}
                                            >
                                                Your Email
                                            </label>
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
                                                        if (e.key === 'Enter')
                                                            void handleCheckReturning();
                                                    }}
                                                    style={{ flex: 1 }}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-primary"
                                                    onClick={() =>
                                                        void handleCheckReturning()
                                                    }
                                                    disabled={
                                                        !returningEmail.trim() ||
                                                        isChecking
                                                    }
                                                    style={{
                                                        whiteSpace: 'nowrap',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {isChecking
                                                        ? 'Checking…'
                                                        : 'Check'}
                                                </button>
                                            </div>

                                            {returningLookupState ===
                                                'found' && (
                                                <div
                                                    style={{
                                                        background: '#f0fdf4',
                                                        border: '1px solid #86efac',
                                                        borderRadius: 8,
                                                        padding: '8px 12px',
                                                        fontSize: 13,
                                                        color: '#166534',
                                                        marginTop: 10,
                                                    }}
                                                >
                                                    Welcome back,{' '}
                                                    <strong>{name}</strong>!
                                                    Your details have been
                                                    pre-filled below.
                                                </div>
                                            )}

                                            {returningLookupState ===
                                                'not_found' && (
                                                <div
                                                    style={{
                                                        background: '#fffbeb',
                                                        border: '1px solid #fde68a',
                                                        borderRadius: 8,
                                                        padding: '8px 12px',
                                                        fontSize: 13,
                                                        color: '#78350f',
                                                        marginTop: 10,
                                                    }}
                                                >
                                                    No record found - please
                                                    fill in your details below.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Form fields */}
                                    <div className="form-group mb-3">
                                        <label
                                            className="form-label"
                                            style={{
                                                fontSize: 12,
                                                fontWeight: 600,
                                                color: '#555',
                                            }}
                                        >
                                            Full Name{' '}
                                            <span style={{ color: '#e53e3e' }}>
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Enter your full name"
                                            value={name}
                                            onChange={e =>
                                                setName(e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="form-group mb-3">
                                        <label
                                            className="form-label"
                                            style={{
                                                fontSize: 12,
                                                fontWeight: 600,
                                                color: '#555',
                                            }}
                                        >
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            placeholder="your@email.com"
                                            value={email}
                                            onChange={e =>
                                                setEmail(e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="form-group mb-3">
                                        <label
                                            className="form-label"
                                            style={{
                                                fontSize: 12,
                                                fontWeight: 600,
                                                color: '#555',
                                            }}
                                        >
                                            Phone Number{' '}
                                            <span style={{ color: '#e53e3e' }}>
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            placeholder="e.g. +233 XX XXX XXXX"
                                            value={phone}
                                            onChange={e =>
                                                setPhone(e.target.value)
                                            }
                                        />
                                    </div>

                                    {/* Terms */}
                                    <div className="form-group mb-4">
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: 10,
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                id="chauffeur-terms"
                                                checked={agreedToTerms}
                                                onChange={e =>
                                                    setAgreedToTerms(
                                                        e.target.checked
                                                    )
                                                }
                                                style={{
                                                    marginTop: 3,
                                                    flexShrink: 0,
                                                    cursor: 'pointer',
                                                }}
                                            />
                                            <label
                                                htmlFor="chauffeur-terms"
                                                style={{
                                                    fontSize: 12,
                                                    color: '#555',
                                                    cursor: 'pointer',
                                                    lineHeight: 1.5,
                                                }}
                                            >
                                                I have read and agree to the{' '}
                                                <a
                                                    href="/terms"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ color: '#126DFF' }}
                                                >
                                                    Terms &amp; Conditions
                                                </a>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Error */}
                                    {bookingOutcome === 'error' && (
                                        <div
                                            style={{
                                                background: '#fee2e2',
                                                border: '1px solid #fca5a5',
                                                borderRadius: 8,
                                                padding: '10px 14px',
                                                fontSize: 13,
                                                color: '#991b1b',
                                                marginBottom: 14,
                                            }}
                                        >
                                            {bookingError}
                                        </div>
                                    )}

                                    {/* Book Now */}
                                    <button
                                        type="button"
                                        className="site-button btn-block"
                                        disabled={bookNowDisabled}
                                        onClick={() => void handleBookNow()}
                                        style={{
                                            opacity: bookNowDisabled ? 0.5 : 1,
                                            width: '100%',
                                        }}
                                    >
                                        {bookingOutcome === 'submitting'
                                            ? 'Processing…'
                                            : 'Book Now'}
                                    </button>

                                    <div
                                        style={{
                                            textAlign: 'center',
                                            marginTop: 12,
                                        }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    `/chauffeur-services/${vehicle.id}`
                                                )
                                            }
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#888',
                                                fontSize: 12,
                                                cursor: 'pointer',
                                                textDecoration: 'underline',
                                            }}
                                        >
                                            ← Back to vehicle
                                        </button>
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
