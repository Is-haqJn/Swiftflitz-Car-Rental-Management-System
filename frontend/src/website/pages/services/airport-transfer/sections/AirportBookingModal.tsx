import {
    type PublicArea,
    type PublicPackageItem,
    type PublicTerminal,
    publicAirportService,
} from '@/services/publicAirportService';
import { couponService } from '@/services/couponService';
import { getErrorMessage } from '@/shared/libs/utils';
import type { DiscountCoupon } from '@/shared/types/coupon.types';
import { useEffect, useRef, useState } from 'react';
import ReactDatePicker from 'react-datepicker';
import { format, parse, isValid } from 'date-fns';
import TimePickerField from '@/shared/components/TimePickerField';
import 'react-datepicker/dist/react-datepicker.css';
import '@/website/styles/sfBookingCalendar.css';

type Step = 1 | 2 | 3;
type Direction = 'pickup' | 'dropoff';

interface Props {
    pkg: PublicPackageItem;
    airportId: string;
    onClose: () => void;
}

/** Returns today's date as YYYY-MM-DD */
function todayDate(): string {
    return new Date().toISOString().slice(0, 10);
}

/** Returns the current time rounded up to next 5-min as HH:MM */
function nextRoundedTime(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10);
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(Math.ceil(now.getMinutes() / 5) * 5).padStart(2, '0');
    return `${h}:${m === '60' ? '00' : m}`;
}

/** Combines date + time strings into an ISO datetime string */
function combineDateTime(date: string, time: string): string {
    return `${date}T${time}:00`;
}

export const AirportBookingModal = ({ pkg, airportId, onClose }: Props) => {
    const [step, setStep] = useState<Step>(1);
    const [direction, setDirection] = useState<Direction | null>(null);

    // Date/time split
    const [bookingDate, setBookingDate] = useState(todayDate());
    const [bookingTime, setBookingTime] = useState(nextRoundedTime());

    const [terminalId, setTerminalId] = useState('');
    const [areaId, setAreaId] = useState('');
    const [specificAddress, setSpecificAddress] = useState('');
    const [passengerCount, setPassengerCount] = useState(1);

    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [notes, setNotes] = useState('');

    const [terminals, setTerminals] = useState<PublicTerminal[]>([]);
    const [areas, setAreas] = useState<PublicArea[]>([]);
    const [isLoadingLocations, setIsLoadingLocations] = useState(true);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<DiscountCoupon | null>(
        null
    );
    const [couponError, setCouponError] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);

    const bodyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        Promise.all([
            publicAirportService.terminals(airportId),
            publicAirportService.areas(airportId),
        ]).then(([t, a]) => {
            setTerminals(t);
            setAreas(a);
            if (t.length === 1) setTerminalId(t[0].id);
            setIsLoadingLocations(false);
        });
    }, [airportId]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    useEffect(() => {
        bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    const selectedArea = areas.find(a => a.id === areaId) ?? null;

    const currencySymbol = pkg.currency_symbol ?? pkg.currency ?? 'GHS';

    const packageRate = parseFloat(pkg.base_price ?? '0');
    const areaCharge = selectedArea?.has_charge
        ? parseFloat(selectedArea.charge_amount)
        : 0;
    const subtotal = packageRate + areaCharge;
    const vatRate = pkg.vat_rate ?? 0;

    const couponDiscount = appliedCoupon
        ? appliedCoupon.type === 'percentage'
            ? (appliedCoupon.value / 100) * subtotal
            : Math.min(appliedCoupon.value, subtotal)
        : 0;
    const discountedSubtotal = subtotal - couponDiscount;
    const vatAmount =
        Math.round(((discountedSubtotal * vatRate) / 100) * 100) / 100;
    const estimatedTotal =
        Math.round((discountedSubtotal + vatAmount) * 100) / 100;

    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) return;
        setCouponLoading(true);
        setCouponError('');
        try {
            const res = await couponService.validateCode(
                couponInput.trim().toUpperCase(),
                undefined,
                'airport'
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

    const canContinueStep2 =
        bookingDate &&
        bookingTime &&
        terminalId &&
        areaId &&
        passengerCount >= 1 &&
        !isLoadingLocations;

    const canSubmit =
        customerName.trim() && customerEmail.trim() && customerPhone.trim();

    const handleDirectionClick = (d: Direction) => {
        setDirection(d);
        setStep(2);
    };

    const handleBookNow = async () => {
        if (!direction || !terminalId || !areaId) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const result = await publicAirportService.book({
                package_assignment_id: pkg.id,
                direction: direction!,
                terminal_location_id: terminalId,
                area_location_id: areaId,
                scheduled_at: combineDateTime(bookingDate, bookingTime),
                passenger_count: passengerCount,
                customer_full_name: customerName.trim(),
                customer_email: customerEmail.trim(),
                customer_phone: customerPhone.trim(),
                specific_address: specificAddress.trim() || undefined,
                notes: notes.trim() || undefined,
                coupon_code: appliedCoupon?.code,
            });
            const params = new URLSearchParams({
                amount: String(estimatedTotal),
                booking_ref: result.booking_reference,
                name: customerName.trim(),
                email: customerEmail.trim(),
                phone: customerPhone.trim(),
            });
            window.location.href = `/payment/airport_booking/${result.id}?${params.toString()}`;
        } catch (err: unknown) {
            setError(
                getErrorMessage(err, 'Something went wrong. Please try again.')
            );
            setIsSubmitting(false);
        }
    };

    const stepNum = step;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.65)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: '#fff',
                    borderRadius: '14px',
                    width: '100%',
                    maxWidth: step === 3 ? '760px' : '580px',
                    maxHeight: '92vh',
                    overflowY: 'auto',
                    boxShadow: '0 28px 80px rgba(0,0,0,0.3)',
                    transition: 'max-width 0.25s ease',
                    position: 'relative',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '1.25rem 1.5rem',
                        borderBottom: '1px solid #efefef',
                        position: 'sticky',
                        top: 0,
                        background: '#fff',
                        zIndex: 10,
                        borderRadius: '14px 14px 0 0',
                    }}
                >
                    {step !== 1 && (
                        <button
                            type="button"
                            onClick={() =>
                                setStep(s => (s === 3 ? 2 : s === 2 ? 1 : s))
                            }
                            style={{
                                background: '#f5f5f5',
                                border: 'none',
                                borderRadius: '50%',
                                width: 34,
                                height: 34,
                                cursor: 'pointer',
                                color: '#444',
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                            aria-label="Go back"
                        >
                            ←
                        </button>
                    )}
                    <div style={{ flex: 1 }}>
                        <div
                            className="site-text-dark"
                            style={{
                                fontWeight: 700,
                                fontSize: '1.05rem',
                                lineHeight: 1.2,
                            }}
                        >
                            Book Airport Transfer
                        </div>
                        <div
                            style={{
                                fontSize: '0.82rem',
                                color: '#999',
                                marginTop: '3px',
                            }}
                        >
                            {pkg.name} &nbsp;·&nbsp; Step {stepNum} of 3
                        </div>
                    </div>

                    {/* Step dots */}
                    <div
                        style={{
                            display: 'flex',
                            gap: '6px',
                            alignItems: 'center',
                        }}
                    >
                        {[1, 2, 3].map(n => (
                            <span
                                key={n}
                                style={{
                                    width: n === stepNum ? 20 : 8,
                                    height: 8,
                                    borderRadius: 4,
                                    background:
                                        n <= stepNum
                                            ? 'var(--color-primary, #c0392b)'
                                            : '#e0e0e0',
                                    display: 'inline-block',
                                    transition: 'background 0.2s, width 0.2s',
                                }}
                            />
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: '#f5f5f5',
                            border: 'none',
                            borderRadius: '50%',
                            width: 34,
                            height: 34,
                            cursor: 'pointer',
                            color: '#666',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div
                    ref={bodyRef}
                    style={{
                        padding: '1.75rem 1.5rem',
                    }}
                >
                    {step === 1 && (
                        <StepDirection
                            pkg={pkg}
                            onSelect={handleDirectionClick}
                        />
                    )}
                    {step === 2 && (
                        <StepDetails
                            terminals={terminals}
                            areas={areas}
                            isLoading={isLoadingLocations}
                            bookingDate={bookingDate}
                            bookingTime={bookingTime}
                            terminalId={terminalId}
                            areaId={areaId}
                            specificAddress={specificAddress}
                            passengerCount={passengerCount}
                            currencySymbol={currencySymbol}
                            onDateChange={setBookingDate}
                            onTimeChange={setBookingTime}
                            onTerminalChange={setTerminalId}
                            onAreaChange={setAreaId}
                            onSpecificAddressChange={setSpecificAddress}
                            onPassengerChange={setPassengerCount}
                        />
                    )}
                    {step === 3 && (
                        <StepConfirm
                            pkg={pkg}
                            selectedArea={selectedArea}
                            packageRate={packageRate}
                            areaCharge={areaCharge}
                            vatRate={vatRate}
                            vatAmount={vatAmount}
                            couponDiscount={couponDiscount}
                            estimatedTotal={estimatedTotal}
                            appliedCoupon={appliedCoupon}
                            couponInput={couponInput}
                            couponError={couponError}
                            couponLoading={couponLoading}
                            customerName={customerName}
                            customerEmail={customerEmail}
                            customerPhone={customerPhone}
                            notes={notes}
                            error={error}
                            currencySymbol={currencySymbol}
                            onNameChange={setCustomerName}
                            onEmailChange={setCustomerEmail}
                            onPhoneChange={setCustomerPhone}
                            onNotesChange={setNotes}
                            onCouponInputChange={setCouponInput}
                            onCouponErrorChange={setCouponError}
                            onApplyCoupon={handleApplyCoupon}
                            onRemoveCoupon={handleRemoveCoupon}
                        />
                    )}
                </div>

                {/* Footer */}
                {(step === 2 || step === 3) && (
                    <div
                        style={{
                            padding: '1rem 1.5rem',
                            borderTop: '1px solid #efefef',
                            position: 'sticky',
                            bottom: 0,
                            background: '#fff',
                            zIndex: 10,
                            borderRadius: '0 0 14px 14px',
                        }}
                    >
                        {step === 2 && (
                            <button
                                type="button"
                                className="site-button"
                                style={{
                                    width: '100%',
                                    fontSize: '1rem',
                                    padding: '0.75rem',
                                }}
                                disabled={!canContinueStep2}
                                onClick={() => setStep(3)}
                            >
                                Continue →
                            </button>
                        )}
                        {step === 3 && (
                            <button
                                type="button"
                                className="site-button"
                                style={{
                                    width: '100%',
                                    fontSize: '1rem',
                                    padding: '0.75rem',
                                }}
                                disabled={!canSubmit || isSubmitting}
                                onClick={handleBookNow}
                            >
                                {isSubmitting ? 'Processing...' : 'Book & Pay'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

/* Step 1: Direction */

const StepDirection = ({
    pkg,
    onSelect,
}: {
    pkg: PublicPackageItem;
    onSelect: (d: Direction) => void;
}) => (
    <div>
        <p
            style={{
                fontSize: '1rem',
                color: '#555',
                marginBottom: '1.75rem',
                textAlign: 'center',
                lineHeight: 1.5,
            }}
        >
            How would you like to travel with{' '}
            <strong style={{ color: '#222' }}>{pkg.name}</strong>?
        </p>
        <div
            style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
            }}
        >
            <DirectionCard
                icon="🛬"
                label="Airport Pickup"
                subtitle="We collect you from the airport"
                disabled={!pkg.is_available_for_pickup}
                onClick={() => onSelect('pickup')}
            />
            <DirectionCard
                icon="🛫"
                label="Airport Drop-off"
                subtitle="We take you to the airport"
                disabled={!pkg.is_available_for_dropoff}
                onClick={() => onSelect('dropoff')}
            />
        </div>
    </div>
);

const DirectionCard = ({
    icon,
    label,
    subtitle,
    disabled,
    onClick,
}: {
    icon: string;
    label: string;
    subtitle: string;
    disabled: boolean;
    onClick: () => void;
}) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{
            flex: 1,
            minHeight: 180,
            border: '2px solid #e8e8e8',
            borderRadius: '12px',
            background: disabled ? '#fafafa' : '#fff',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.4 : 1,
            padding: '1.75rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            transition:
                'border-color 0.15s, box-shadow 0.15s, background 0.15s',
        }}
        onMouseEnter={e => {
            if (!disabled) {
                const el = e.currentTarget;
                el.style.borderColor = 'var(--color-primary, #c0392b)';
                el.style.boxShadow = '0 6px 20px rgba(192,57,43,0.12)';
                el.style.background = '#fff8f8';
            }
        }}
        onMouseLeave={e => {
            const el = e.currentTarget;
            el.style.borderColor = '#e8e8e8';
            el.style.boxShadow = 'none';
            el.style.background = '#fff';
        }}
    >
        <span style={{ fontSize: '2.8rem', lineHeight: 1 }}>{icon}</span>
        <span
            className="site-text-dark"
            style={{ fontWeight: 700, fontSize: '1rem' }}
        >
            {label}
        </span>
        <span
            style={{
                fontSize: '0.85rem',
                color: '#888',
                textAlign: 'center',
                lineHeight: 1.4,
            }}
        >
            {subtitle}
        </span>
    </button>
);

/* Step 2: Journey Details */

const StepDetails = ({
    terminals,
    areas,
    isLoading,
    bookingDate,
    bookingTime,
    terminalId,
    areaId,
    specificAddress,
    passengerCount,
    currencySymbol,
    onDateChange,
    onTimeChange,
    onTerminalChange,
    onAreaChange,
    onSpecificAddressChange,
    onPassengerChange,
}: {
    terminals: PublicTerminal[];
    areas: PublicArea[];
    isLoading: boolean;
    bookingDate: string;
    bookingTime: string;
    terminalId: string;
    areaId: string;
    specificAddress: string;
    passengerCount: number;
    currencySymbol: string;
    onDateChange: (v: string) => void;
    onTimeChange: (v: string) => void;
    onTerminalChange: (v: string) => void;
    onAreaChange: (v: string) => void;
    onSpecificAddressChange: (v: string) => void;
    onPassengerChange: (v: number) => void;
}) => {
    const parseBookingDate = (str: string): Date | null => {
        if (!str) return null;
        const d = parse(str, 'yyyy-MM-dd', new Date());
        return isValid(d) ? d : null;
    };

    return (
        <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
            {/* Date & Time */}
            <div>
                <FieldLabel required>Date & Time</FieldLabel>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.75rem',
                    }}
                >
                    {/* Date */}
                    <div>
                        <div
                            style={{
                                fontSize: '0.78rem',
                                color: '#888',
                                fontWeight: 600,
                                marginBottom: '0.3rem',
                            }}
                        >
                            Date
                        </div>
                        <ReactDatePicker
                            selected={parseBookingDate(bookingDate)}
                            onChange={(date: Date | null) =>
                                onDateChange(
                                    date ? format(date, 'yyyy-MM-dd') : ''
                                )
                            }
                            dateFormat="dd MMM yyyy"
                            minDate={new Date()}
                            placeholderText="Select date"
                            className="form-control sf-datepicker-input"
                            calendarClassName="sf-booking-calendar"
                            popperPlacement="bottom-start"
                        />
                    </div>

                    {/* Time */}
                    <div>
                        <div
                            style={{
                                fontSize: '0.78rem',
                                color: '#888',
                                fontWeight: 600,
                                marginBottom: '0.3rem',
                            }}
                        >
                            Time
                        </div>
                        <TimePickerField
                            value={bookingTime}
                            onChange={onTimeChange}
                            placeholder="Select time"
                        />
                    </div>
                </div>
            </div>

            {/* Terminal */}
            <div>
                <FieldLabel required>Terminal</FieldLabel>
                {isLoading ? (
                    <SkeletonInput />
                ) : terminals.length === 0 ? (
                    <p style={{ color: '#999', fontSize: '0.9rem' }}>
                        No terminals available for this airport.
                    </p>
                ) : (
                    <select
                        className="form-control"
                        value={terminalId}
                        onChange={e => onTerminalChange(e.target.value)}
                    >
                        <option value="">- Select terminal -</option>
                        {terminals.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.name}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* Area / Location */}
            <div>
                <FieldLabel required>Your Location</FieldLabel>
                <p
                    style={{
                        fontSize: '0.85rem',
                        color: '#999',
                        marginBottom: '0.5rem',
                        lineHeight: 1.4,
                    }}
                >
                    Select the area you'll be picked up from or dropped off at.
                </p>
                {isLoading ? (
                    <SkeletonInput />
                ) : areas.length === 0 ? (
                    <p style={{ color: '#999', fontSize: '0.9rem' }}>
                        No locations available for this airport.
                    </p>
                ) : (
                    <select
                        className="form-control"
                        value={areaId}
                        onChange={e => onAreaChange(e.target.value)}
                    >
                        <option value="">- Select location -</option>
                        {areas.map(a => (
                            <option key={a.id} value={a.id}>
                                {a.name}
                                {a.has_charge
                                    ? ` (+${currencySymbol} ${parseFloat(a.charge_amount).toFixed(2)})`
                                    : ''}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* Specific address - shown once an area is selected */}
            {areaId && (
                <div>
                    <FieldLabel>Specific Address</FieldLabel>
                    <p
                        style={{
                            fontSize: '0.85rem',
                            color: '#999',
                            marginBottom: '0.5rem',
                            lineHeight: 1.4,
                        }}
                    >
                        Optional - add your exact address or a landmark within{' '}
                        {areas.find(a => a.id === areaId)?.name ??
                            'the selected area'}
                        .
                    </p>
                    <textarea
                        className="form-control"
                        placeholder="e.g. House 12, East Legon Hills, near the Shell station"
                        rows={2}
                        value={specificAddress}
                        onChange={e => onSpecificAddressChange(e.target.value)}
                        style={{
                            fontSize: '0.95rem',
                            resize: 'vertical',
                            padding: '0.6rem 0.85rem',
                        }}
                    />
                </div>
            )}

            {/* Passenger count */}
            <div>
                <FieldLabel required>Number of Passengers</FieldLabel>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.1rem',
                    }}
                >
                    <CounterBtn
                        label="−"
                        onClick={() =>
                            onPassengerChange(Math.max(1, passengerCount - 1))
                        }
                        disabled={passengerCount <= 1}
                    />
                    <span
                        style={{
                            fontWeight: 700,
                            fontSize: '1.4rem',
                            minWidth: 28,
                            textAlign: 'center',
                            color: '#222',
                        }}
                    >
                        {passengerCount}
                    </span>
                    <CounterBtn
                        label="+"
                        onClick={() =>
                            onPassengerChange(Math.min(4, passengerCount + 1))
                        }
                        disabled={passengerCount >= 4}
                    />
                    <span style={{ fontSize: '0.88rem', color: '#bbb' }}>
                        max 4
                    </span>
                </div>
            </div>
        </div>
    );
};

/* Step 3: Confirm & Pay */

const StepConfirm = ({
    pkg,
    selectedArea,
    packageRate,
    areaCharge,
    vatRate,
    vatAmount,
    couponDiscount,
    estimatedTotal,
    appliedCoupon,
    couponInput,
    couponError,
    couponLoading,
    customerName,
    customerEmail,
    customerPhone,
    notes,
    error,
    currencySymbol,
    onNameChange,
    onEmailChange,
    onPhoneChange,
    onNotesChange,
    onCouponInputChange,
    onCouponErrorChange,
    onApplyCoupon,
    onRemoveCoupon,
}: {
    pkg: PublicPackageItem;
    selectedArea: PublicArea | null;
    packageRate: number;
    areaCharge: number;
    vatRate: number;
    vatAmount: number;
    couponDiscount: number;
    estimatedTotal: number;
    appliedCoupon: DiscountCoupon | null;
    couponInput: string;
    couponError: string;
    couponLoading: boolean;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    notes: string;
    error: string | null;
    currencySymbol: string;
    onNameChange: (v: string) => void;
    onEmailChange: (v: string) => void;
    onPhoneChange: (v: string) => void;
    onNotesChange: (v: string) => void;
    onCouponInputChange: (v: string) => void;
    onCouponErrorChange: (v: string) => void;
    onApplyCoupon: () => void;
    onRemoveCoupon: () => void;
}) => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1fr) 280px',
            gap: '1.5rem',
            alignItems: 'start',
        }}
        className="booking-confirm-grid"
    >
        {/* Left: Customer details */}
        <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}
        >
            <FormField label="Full Name" required>
                <input
                    type="text"
                    className="form-control"
                    placeholder="John Doe"
                    value={customerName}
                    onChange={e => onNameChange(e.target.value)}
                    style={{ fontSize: '0.95rem', padding: '0.6rem 0.85rem' }}
                />
            </FormField>
            <FormField label="Email Address" required>
                <input
                    type="email"
                    className="form-control"
                    placeholder="john@example.com"
                    value={customerEmail}
                    onChange={e => onEmailChange(e.target.value)}
                    style={{ fontSize: '0.95rem', padding: '0.6rem 0.85rem' }}
                />
            </FormField>
            <FormField label="Phone Number" required>
                <input
                    type="tel"
                    className="form-control"
                    placeholder="+233 ..."
                    value={customerPhone}
                    onChange={e => onPhoneChange(e.target.value)}
                    style={{ fontSize: '0.95rem', padding: '0.6rem 0.85rem' }}
                />
            </FormField>
            <FormField label="Notes (optional)">
                <textarea
                    className="form-control"
                    placeholder="Any additional info for your driver..."
                    rows={3}
                    value={notes}
                    onChange={e => onNotesChange(e.target.value)}
                    style={{
                        fontSize: '0.95rem',
                        resize: 'vertical',
                        padding: '0.6rem 0.85rem',
                    }}
                />
            </FormField>

            {error && (
                <div
                    style={{
                        background: '#fff5f5',
                        border: '1px solid #fecaca',
                        borderRadius: 8,
                        padding: '0.75rem 1rem',
                        color: '#c0392b',
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                    }}
                >
                    {error}
                </div>
            )}
        </div>

        {/* Right: Pricing summary */}
        <div
            style={{
                background: '#f9f9f9',
                borderRadius: '12px',
                padding: '1.25rem',
                border: '1px solid #ebebeb',
            }}
        >
            <p
                style={{
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    color: '#999',
                    marginBottom: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                }}
            >
                Booking Summary
            </p>

            <div
                style={{
                    fontWeight: 700,
                    fontSize: '0.97rem',
                    color: '#111',
                    marginBottom: '1rem',
                    lineHeight: 1.3,
                }}
            >
                {pkg.name}
            </div>

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.55rem',
                }}
            >
                <PriceLine
                    label="Package Rate"
                    amount={packageRate}
                    currencySymbol={currencySymbol}
                />
                {areaCharge > 0 && (
                    <PriceLine
                        label={`${selectedArea!.name} surcharge`}
                        amount={areaCharge}
                        currencySymbol={currencySymbol}
                    />
                )}
                {couponDiscount > 0 && (
                    <PriceLine
                        label={`Coupon (${appliedCoupon!.code})`}
                        amount={-couponDiscount}
                        currencySymbol={currencySymbol}
                        highlight
                    />
                )}
                {vatAmount > 0 && (
                    <PriceLine
                        label={`VAT (${vatRate}%)`}
                        amount={vatAmount}
                        currencySymbol={currencySymbol}
                    />
                )}
            </div>

            {/* Coupon input */}
            <div style={{ margin: '0.75rem 0' }}>
                {appliedCoupon ? (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#f0fdf4',
                            border: '1px solid #86efac',
                            borderRadius: 8,
                            padding: '8px 12px',
                            fontSize: 13,
                        }}
                    >
                        <span style={{ color: '#15803d', fontWeight: 600 }}>
                            ✓{' '}
                            <span style={{ letterSpacing: '0.5px' }}>
                                {appliedCoupon.code}
                            </span>{' '}
                            applied
                        </span>
                        <button
                            type="button"
                            onClick={onRemoveCoupon}
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
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Coupon code"
                                value={couponInput}
                                onChange={e => {
                                    onCouponInputChange(
                                        e.target.value.toUpperCase()
                                    );
                                    onCouponErrorChange('');
                                }}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') void onApplyCoupon();
                                }}
                                style={{ flex: 1, fontSize: 13 }}
                            />
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => void onApplyCoupon()}
                                disabled={!couponInput.trim() || couponLoading}
                                style={{ whiteSpace: 'nowrap', fontSize: 13 }}
                            >
                                {couponLoading ? '...' : 'Apply'}
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
                    borderTop: '1px solid #e0e0e0',
                    margin: '0.85rem 0',
                }}
            />

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: '#111',
                }}
            >
                <span>Total</span>
                <span>
                    {currencySymbol} {estimatedTotal.toFixed(2)}
                </span>
            </div>
        </div>

        <style>{`
            @media (max-width: 620px) {
                .booking-confirm-grid {
                    grid-template-columns: 1fr !important;
                }
            }
        `}</style>
    </div>
);

/* Shared sub-components */

const FieldLabel = ({
    required,
    children,
}: {
    required?: boolean;
    children: React.ReactNode;
}) => (
    <label
        style={{
            display: 'block',
            fontWeight: 700,
            fontSize: '0.92rem',
            marginBottom: '0.45rem',
            color: '#333',
        }}
    >
        {children}{' '}
        {required && (
            <span style={{ color: 'var(--color-primary, #c0392b)' }}>*</span>
        )}
    </label>
);

const FormField = ({
    label,
    required,
    children,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) => (
    <div>
        <FieldLabel required={required}>{label}</FieldLabel>
        {children}
    </div>
);

const PriceLine = ({
    label,
    amount,
    currencySymbol,
    highlight,
}: {
    label: string;
    amount: number;
    currencySymbol: string;
    highlight?: boolean;
}) => (
    <div
        style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.9rem',
            color: highlight ? '#15803d' : '#555',
            fontWeight: highlight ? 600 : undefined,
        }}
    >
        <span>{label}</span>
        <span>
            {currencySymbol} {amount.toFixed(2)}
        </span>
    </div>
);

const CounterBtn = ({
    label,
    onClick,
    disabled,
}: {
    label: string;
    onClick: () => void;
    disabled: boolean;
}) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            border: '2px solid',
            borderColor: disabled ? '#eee' : '#ddd',
            background: disabled ? '#fafafa' : '#fff',
            fontSize: '1.3rem',
            cursor: disabled ? 'not-allowed' : 'pointer',
            color: disabled ? '#ccc' : '#444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'border-color 0.15s',
        }}
    >
        {label}
    </button>
);

const SkeletonInput = () => (
    <div className="placeholder-glow">
        <span
            className="placeholder col-12"
            style={{ height: 42, borderRadius: 8, display: 'block' }}
        />
    </div>
);
