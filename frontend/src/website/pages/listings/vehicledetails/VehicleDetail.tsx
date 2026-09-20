import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTitle } from '@/shared/hooks';
import { FEATURE_ICON_MAP } from '@adminConstants/featureIcons';
import {
    MdCalendarToday,
    MdColorLens,
    MdDirectionsCar,
    MdEventSeat,
    MdLocalGasStation,
    MdSettings,
    MdSpeed,
} from 'react-icons/md';
import { FaCar, FaCheck, FaTriangleExclamation } from 'react-icons/fa6';
import type { ComponentType } from 'react';
import type { IconBaseProps } from 'react-icons';
import ReactDatePicker from 'react-datepicker';
import {
    format,
    startOfDay,
    endOfDay,
    subDays,
    subYears,
    differenceInYears,
    addDays as dateFnsAddDays,
} from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import '@/website/styles/sfBookingCalendar.css';
import {
    publicQuoteService,
    type PublicAddon,
    type PublicAutoCharge,
    type PublicVehicleDetail,
} from '@/services/publicQuoteService';
import { useFormatCurrency } from '@/shared/hooks/queries/useSettings';
import {
    formatPriceWithConversion,
    formatWithSymbol,
} from '@/shared/libs/currency';
import { BannerSection } from './BannerSection';
import MediaLightbox, {
    type LightboxSlide,
} from '@adminComponents/MediaLightbox';

/* Date helpers */
function toDateStr(d: Date): string {
    return d.toISOString().split('T')[0];
}

function getTodayStr(): string {
    return toDateStr(new Date());
}

function addDays(dateStr: string, n: number): string {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return toDateStr(d);
}

function diffDays(from: string, to: string): number {
    const a = new Date(from + 'T00:00:00');
    const b = new Date(to + 'T00:00:00');
    return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}

/* Hour select helpers */

function toHourValue(hour: number): string {
    return `${String(hour).padStart(2, '0')}:00`;
}

/* Labels */
const FUEL_LABEL: Record<string, string> = {
    petrol: 'Petrol',
    diesel: 'Diesel',
    electric: 'Electric',
    hybrid: 'Hybrid',
};

/* Component */
type SpecItem = {
    Icon: ComponentType<IconBaseProps>;
    label: string;
    value: string;
};

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
    date_of_birth: string;
}

export const VehicleDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const formatCurrency = useFormatCurrency();
    const [vehicle, setVehicle] = useState<PublicVehicleDetail | null>(null);
    const formatVehicleAmount = useCallback(
        (amount: number) => {
            if (vehicle?.currency_symbol)
                return formatWithSymbol(amount, vehicle.currency_symbol, true);
            if (vehicle?.global_currency_symbol)
                return formatWithSymbol(
                    amount,
                    vehicle.global_currency_symbol,
                    true
                );
            return formatCurrency(amount);
        },
        [
            vehicle?.currency_symbol,
            vehicle?.global_currency_symbol,
            formatCurrency,
        ]
    );
    const title = useTitle(
        vehicle ? `${vehicle.name} - Rent A Car` : 'Vehicle Details'
    );
    const [showPrice, setShowPrice] = useState(false);
    const [allowOnlineBooking, setAllowOnlineBooking] = useState(true);
    const [vatEnabled, setVatEnabled] = useState(false);
    const [vatRate, setVatRate] = useState(0);
    const [securityDepositAmount, setSecurityDepositAmount] = useState(0);
    const [locations, setLocations] = useState<PickupLocationOption[]>([]);
    const [dropoffLocations, setDropoffLocations] = useState<
        DropoffLocationOption[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [selectedImage, setSelectedImage] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [windowStart, setWindowStart] = useState(0);
    const [windowEnd, setWindowEnd] = useState(23);
    const [minRentalDays, setMinRentalDays] = useState(1);
    const [returnTimeThreshold, setReturnTimeThreshold] = useState<number | null>(null);
    const [returnManuallySet, setReturnManuallySet] = useState(false);
    const [dobError, setDobError] = useState('');
    const [pickupLocationError, setPickupLocationError] = useState('');
    const [dropoffLocationError, setDropoffLocationError] = useState('');

    const tomorrow = addDays(getTodayStr(), 1);
    const [form, setForm] = useState<BookingForm>({
        pickup_date: tomorrow,
        return_date: addDays(tomorrow, 1),
        pickup_time: '09:00',
        return_time: '09:00',
        pickup_location_id: '',
        dropoff_location_id: '',
        selected_addon_ids: [],
        date_of_birth: '',
    });

    useEffect(() => {
        publicQuoteService
            .getRentalSettings()
            .then(res => {
                const start = parseInt(
                    res.data.pickup_window_start.split(':')[0],
                    10
                );
                const end = parseInt(
                    res.data.pickup_window_end.split(':')[0],
                    10
                );
                setWindowStart(start);
                setWindowEnd(end);
                if (res.data.min_rental_days) {
                    setMinRentalDays(Number(res.data.min_rental_days));
                }
                setReturnTimeThreshold(res.data.return_time_threshold ?? null);
                // Clamp default times to the window
                setForm(prev => ({
                    ...prev,
                    pickup_time: toHourValue(
                        Math.min(
                            Math.max(
                                parseInt(prev.pickup_time.split(':')[0], 10),
                                start
                            ),
                            end
                        )
                    ),
                    return_time: toHourValue(
                        Math.min(
                            Math.max(
                                parseInt(prev.return_time.split(':')[0], 10),
                                start
                            ),
                            end
                        )
                    ),
                }));
            })
            .catch(() => {});
    }, []);

    /* Auto-set return date/time when pickup is fully set and return hasn't been manually changed */
    useEffect(() => {
        if (!form.pickup_date || !form.pickup_time) return;
        if (returnManuallySet) return;

        const autoReturnDate = format(
            dateFnsAddDays(
                new Date(form.pickup_date + 'T00:00:00'),
                minRentalDays
            ),
            'yyyy-MM-dd'
        );
        const pickupHour = parseInt(form.pickup_time.split(':')[0], 10);
        const autoReturnHour = returnTimeThreshold
            ? pickupHour - returnTimeThreshold
            : Math.min(pickupHour, windowEnd);

        setForm(prev => ({
            ...prev,
            return_date: autoReturnDate,
            return_time: toHourValue(autoReturnHour),
        }));
    }, [form.pickup_date, form.pickup_time]); // eslint-disable-line react-hooks/exhaustive-deps

    /* Enforce return time threshold constraint whenever pickup time or dates change */
    useEffect(() => {
        if (!returnTimeThreshold || !form.pickup_time || !form.return_date) return;
        if (form.pickup_date === form.return_date) return;

        const pickupHour = parseInt(form.pickup_time.split(':')[0], 10);
        const maxReturnHour = pickupHour - returnTimeThreshold;
        const currentReturnHour = parseInt(form.return_time.split(':')[0], 10);

        if (currentReturnHour > maxReturnHour) {
            setForm(prev => ({ ...prev, return_time: toHourValue(maxReturnHour) }));
        }
    }, [form.pickup_time, form.pickup_date, form.return_date, form.return_time]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!id) return;

        publicQuoteService
            .getVehicle(id)
            .then(vehicleRes => {
                const v = vehicleRes.data.vehicle;
                setVehicle(v);
                setShowPrice(vehicleRes.data.show_prices_on_website);
                setAllowOnlineBooking(
                    vehicleRes.data.allow_online_booking ?? true
                );
                setVatEnabled(vehicleRes.data.vat_enabled ?? false);
                setVatRate(vehicleRes.data.vat_rate ?? 0);
                setSecurityDepositAmount(
                    vehicleRes.data.security_deposit_amount ?? 0
                );

                const branchId = v.branch_id;
                return Promise.all([
                    publicQuoteService
                        .getPickupLocations(branchId)
                        .catch(() => ({ data: [] })),
                    publicQuoteService
                        .getDropoffLocations(branchId)
                        .catch(() => ({ data: [] })),
                ]);
            })
            .then(([locRes, dropoffRes]) => {
                setLocations(locRes.data ?? []);
                setDropoffLocations(dropoffRes.data ?? []);
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [id]);

    const setField = <K extends keyof BookingForm>(
        key: K,
        value: BookingForm[K]
    ) => {
        if (key === 'return_date' || key === 'return_time') {
            setReturnManuallySet(true);
        }
        if (key === 'pickup_date') {
            setReturnManuallySet(false);
        }
        setForm(prev => {
            const next = { ...prev, [key]: value };
            if (
                key === 'pickup_date' &&
                next.return_date <= (value as string)
            ) {
                next.return_date = addDays(value as string, 1);
            }
            return next;
        });
    };

    const toggleAddon = (addonId: string) => {
        setForm(prev => ({
            ...prev,
            selected_addon_ids: prev.selected_addon_ids.includes(addonId)
                ? prev.selected_addon_ids.filter(a => a !== addonId)
                : [...prev.selected_addon_ids, addonId],
        }));
    };

    const days =
        form.pickup_date && form.return_date
            ? diffDays(form.pickup_date, form.return_date)
            : 1;

    /* Blocked dates */
    // Intervals passed to excludeDateIntervals - greys out and blocks the full range.
    const bookedIntervals = useMemo(
        () =>
            (vehicle?.unavailable_dates ?? []).map(r => ({
                start: startOfDay(new Date(r.from + 'T00:00:00')),
                end: endOfDay(new Date(r.to + 'T00:00:00')),
            })),
        [vehicle]
    );

    // Set of "yyyy-MM-dd" strings - used by hasConflict
    const bookedDateSet = useMemo(() => {
        const set = new Set<string>();
        (vehicle?.unavailable_dates ?? []).forEach(r => {
            const cursor = new Date(r.from + 'T00:00:00');
            const end = new Date(r.to + 'T00:00:00');
            while (cursor <= end) {
                set.add(format(cursor, 'yyyy-MM-dd'));
                cursor.setDate(cursor.getDate() + 1);
            }
        });
        return set;
    }, [vehicle]);

    // When a pickup date is chosen, cap the return picker at the day before
    // the next booked interval - prevents spanning over an existing booking.
    const returnMaxDate = useMemo(() => {
        if (!form.pickup_date) return undefined;
        const pickup = new Date(form.pickup_date + 'T00:00:00');
        const next = bookedIntervals
            .filter(iv => iv.start > pickup)
            .sort((a, b) => a.start.getTime() - b.start.getTime())[0];
        return next ? subDays(next.start, 1) : undefined;
    }, [form.pickup_date, bookedIntervals]);

    const hasConflict = useMemo(() => {
        if (!form.pickup_date || !form.return_date) return false;
        const cursor = new Date(form.pickup_date + 'T00:00:00');
        const end = new Date(form.return_date + 'T00:00:00');
        while (cursor <= end) {
            if (bookedDateSet.has(format(cursor, 'yyyy-MM-dd'))) return true;
            cursor.setDate(cursor.getDate() + 1);
        }
        return false;
    }, [form.pickup_date, form.return_date, bookedDateSet]);

    const addonLabel = (addon: PublicAddon) => {
        if (addon.charge_type === 'per_day')
            return `${formatVehicleAmount(addon.amount)} / day`;
        if (addon.charge_type === 'percentage') return `${addon.amount}%`;
        return `${formatVehicleAmount(addon.amount)}`;
    };

    const calcChargeAmount = (
        charge: PublicAddon | PublicAutoCharge,
        baseCost: number
    ) => {
        if (charge.charge_type === 'per_day') return charge.amount * days;
        if (charge.charge_type === 'percentage')
            return (charge.amount / 100) * baseCost;
        return charge.amount;
    };

    const handleConfirm = async () => {
        if (!vehicle) return;

        if (!form.date_of_birth) {
            setDobError('Date of birth is required.');
            return;
        }
        const age = differenceInYears(new Date(), new Date(form.date_of_birth));
        if (age < 18) {
            setDobError('You must be 18 or older to rent a vehicle.');
            return;
        }
        setDobError('');

        if (locations.length > 0 && !form.pickup_location_id) {
            setPickupLocationError('Pickup location is required.');
            return;
        }
        setPickupLocationError('');

        if (dropoffLocations.length > 0 && !form.dropoff_location_id) {
            setDropoffLocationError('Drop-off location is required.');
            return;
        }
        setDropoffLocationError('');

        const canShowPrice = showPrice && vehicle.price_visible;
        const selectedAddons = vehicle.addons.filter(a =>
            form.selected_addon_ids.includes(a.id)
        );
        const autoCharges = vehicle.auto_charges ?? [];
        const selectedLocation =
            locations.find(l => l.id === form.pickup_location_id) ?? null;
        const selectedDropoffLocation =
            dropoffLocations.find(l => l.id === form.dropoff_location_id) ??
            null;

        const sharedState = {
            vehicle,
            form,
            days,
            selectedAddons,
            autoCharges,
            selectedLocation,
            selectedDropoffLocation,
            canShowPrice,
            securityDepositAmount,
            date_of_birth: form.date_of_birth,
        };

        if (!canShowPrice || !allowOnlineBooking) {
            navigate(`/listings/${id}/quote-request`, { state: sharedState });
            return;
        }

        /*
         * Fetch backend pricing so discount rules and auto-charges are identical
         * to what will be stored on the rental record.
         */
        let pricing: {
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
            discountAmount: number;
        };

        let resolvedDepositAmount = securityDepositAmount;

        try {
            const res = await publicQuoteService.getPricingPreview(vehicle.id, {
                pickup_date: form.pickup_date,
                return_date: form.return_date,
                addon_ids: selectedAddons.map(a => a.id),
                pickup_location_id: form.pickup_location_id || undefined,
                dropoff_location_id: form.dropoff_location_id || undefined,
                date_of_birth: form.date_of_birth || undefined,
            });

            const p = res.data;
            if (p.depositAmount != null) {
                resolvedDepositAmount = p.depositAmount;
                setSecurityDepositAmount(p.depositAmount);
            }
            pricing = {
                baseCost: p.base,
                addonTotal: p.addonTotal,
                autoChargeTotal: 0,
                pickupCharge:
                    p.locationBreakdown?.find(
                        (i: { type: string }) => i.type === 'pickup'
                    )?.amount ?? p.locationTotal,
                dropoffCharge:
                    p.locationBreakdown?.find(
                        (i: { type: string }) => i.type === 'dropoff'
                    )?.amount ?? 0,
                subtotal: p.subtotal,
                vatEnabled,
                vatRate,
                vatAmount: p.taxAmount,
                total: p.totalAmount,
                discountAmount: p.totalDiscountAmount,
            };
        } catch {
            /* Fallback to client-side calculation if API is unreachable */
            const baseCost = vehicle.daily_rate * days;
            const addonTotal = selectedAddons.reduce(
                (sum, a) => sum + calcChargeAmount(a, baseCost),
                0
            );
            const autoChargeTotal = autoCharges.reduce(
                (sum, a) => sum + calcChargeAmount(a, baseCost),
                0
            );
            const pickupCharge = Number(selectedLocation?.pickup_charge ?? 0);
            const dropoffCharge = Number(
                selectedDropoffLocation?.dropoff_charge ?? 0
            );
            const subtotal =
                baseCost +
                addonTotal +
                autoChargeTotal +
                pickupCharge +
                dropoffCharge;
            const vatAmount = vatEnabled
                ? Math.round(subtotal * vatRate) / 100
                : 0;
            pricing = {
                baseCost,
                addonTotal,
                autoChargeTotal,
                pickupCharge,
                dropoffCharge,
                subtotal,
                vatEnabled,
                vatRate,
                vatAmount,
                total: subtotal + vatAmount,
                discountAmount: 0,
            };
        }

        navigate(`/listings/${id}/confirm`, {
            state: {
                ...sharedState,
                securityDepositAmount: resolvedDepositAmount,
                pricing,
            },
        });
    };

    if (loading) {
        return (
            <>
                <BannerSection title="Loading..." />
                <div className="section-content p-t60 p-b120">
                    <div className="container">
                        <div className="text-center py-5">
                            <div
                                className="spinner-border text-primary"
                                role="status"
                            />
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (notFound || !vehicle) {
        return (
            <>
                <BannerSection title="Vehicle Not Found" />
                <div className="section-content p-t60 p-b120">
                    <div className="container">
                        <div className="text-center py-5">
                            <h4>This vehicle is not available.</h4>
                            <a
                                href="/listings"
                                className="site-button dark-bg mt-3 d-inline-block"
                            >
                                Back to Listings
                            </a>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const canShowPrice = showPrice && vehicle.price_visible;
    const isQuoteMode = !canShowPrice || !allowOnlineBooking;

    const globalCurrency = vehicle.global_currency ?? 'GHS';
    const branchCurrency = vehicle.currency ?? globalCurrency;
    const { primary: priceDisplay, secondary: convertedDisplay } =
        formatPriceWithConversion(
            vehicle.daily_rate,
            branchCurrency,
            vehicle.exchange_rate,
            globalCurrency,
            vehicle.show_converted_price ?? false,
            vehicle.currency_symbol,
            vehicle.global_currency_symbol,
            true
        );
    const primaryImage =
        vehicle.images.find(i => i.is_primary) ?? vehicle.images[0];
    const displayImage = vehicle.images[selectedImage] ?? primaryImage;

    const imageSlides: LightboxSlide[] = vehicle.images.map(img => ({
        type: 'image',
        src: img.url,
    }));

    const specs: SpecItem[] = [];
    if (vehicle.category)
        specs.push({
            Icon: MdDirectionsCar,
            label: 'Category',
            value: vehicle.category.name,
        });
    specs.push({
        Icon: MdEventSeat,
        label: 'Seats',
        value: `${vehicle.seats} Seats`,
    });
    if (vehicle.fuel_type)
        specs.push({
            Icon: MdLocalGasStation,
            label: 'Fuel Type',
            value: FUEL_LABEL[vehicle.fuel_type] ?? vehicle.fuel_type,
        });
    if (vehicle.transmission)
        specs.push({
            Icon: MdSettings,
            label: 'Transmission',
            value:
                vehicle.transmission === 'automatic' ? 'Automatic' : 'Manual',
        });
    if (vehicle.engine_size)
        specs.push({
            Icon: MdSpeed,
            label: 'Engine',
            value: vehicle.engine_size,
        });
    if (vehicle.color)
        specs.push({ Icon: MdColorLens, label: 'Color', value: vehicle.color });
    specs.push({
        Icon: MdCalendarToday,
        label: 'Year',
        value: String(vehicle.year),
    });

    return (
        <>
            {title}
            <BannerSection
                title={vehicle.name}
                backgroundImage={primaryImage?.url}
            />

            <div className="section-content p-t60 p-b120">
                <div className="container">
                    <div className="row">
                        {/* LEFT: Vehicle Info */}
                        <div className="col-xl-8 col-lg-12 col-md-12">
                            {/* Image Gallery */}
                            <div className="twm-car-gallery m-b30">
                                <div
                                    className="twm-car-gallery-main"
                                    style={{
                                        width: '100%',
                                        height: 400,
                                        background: '#f5f5f5',
                                        borderRadius: 8,
                                        overflow: 'hidden',
                                        cursor:
                                            vehicle.images.length > 0
                                                ? 'zoom-in'
                                                : 'default',
                                    }}
                                    onClick={() => {
                                        if (vehicle.images.length > 0) {
                                            setLightboxIndex(selectedImage);
                                            setLightboxOpen(true);
                                        }
                                    }}
                                >
                                    {displayImage ? (
                                        <img
                                            src={displayImage.url}
                                            alt={vehicle.name}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    ) : (
                                        <div
                                            className="d-flex align-items-center justify-content-center h-100 text-muted"
                                            style={{ fontSize: 64 }}
                                        >
                                            <FaCar />
                                        </div>
                                    )}
                                </div>

                                {vehicle.images.length > 1 && (
                                    <div
                                        className="d-flex gap-2 mt-2"
                                        style={{ overflowX: 'auto' }}
                                    >
                                        {vehicle.images.map((img, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedImage(idx)
                                                }
                                                style={{
                                                    flexShrink: 0,
                                                    width: 80,
                                                    height: 60,
                                                    padding: 0,
                                                    border: `3px solid ${idx === selectedImage ? '#f7a800' : '#dee2e6'}`,
                                                    borderRadius: 4,
                                                    overflow: 'hidden',
                                                    cursor: 'pointer',
                                                    background: 'none',
                                                }}
                                            >
                                                <img
                                                    src={img.thumb}
                                                    alt={`${vehicle.name} ${idx + 1}`}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            {vehicle.description && (
                                <div className="twm-car-full-detail m-b30">
                                    <h4 className="twm-title">Description</h4>
                                    <p className="text-muted">
                                        {vehicle.description}
                                    </p>
                                </div>
                            )}

                            {/* Features */}
                            {vehicle.features &&
                                vehicle.features.length > 0 && (
                                    <div className="m-b30">
                                        <h4 className="twm-title">Features</h4>
                                        {/* tried: display grid, gridTemplateColumns: 'auto auto auto', gap: '12px 20px' */}
                                        <ul
                                            className="d-flex flex-wrap gap-2"
                                            style={{
                                                listStyle: 'none',
                                                padding: 0,
                                                margin: 0,
                                            }}
                                        >
                                            {vehicle.features.map(feat => {
                                                const Icon =
                                                    FEATURE_ICON_MAP[feat];
                                                return (
                                                    <li
                                                        key={feat}
                                                        className="d-flex align-items-center gap-2"
                                                        style={{ fontSize: 13 }} // tried: fontSize: 15, fontWeight: 500, color: '#18191d'
                                                    >
                                                        <span
                                                            className="d-flex align-items-center justify-content-center"
                                                            style={{
                                                                width: 15,
                                                                height: 15,
                                                                borderRadius:
                                                                    '50%',
                                                                background:
                                                                    '#126DFF',
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            {Icon ? (
                                                                <Icon
                                                                    size={11}
                                                                    color="#fff"
                                                                />
                                                            ) : (
                                                                <span
                                                                    style={{
                                                                        fontSize: 10,
                                                                        color: '#fff',
                                                                        lineHeight: 1,
                                                                    }}
                                                                >
                                                                    <FaCheck />
                                                                </span>
                                                            )}
                                                        </span>
                                                        {feat}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}

                            {/* Specs */}
                            <div className="twm-car-specs m-b30">
                                <h4 className="twm-title">Specifications</h4>
                                <div className="row g-3">
                                    {specs.map(({ Icon, label, value }) => (
                                        <div
                                            key={label}
                                            className="col-6 col-md-4"
                                        >
                                            <div
                                                className="d-flex align-items-center gap-3"
                                                style={{
                                                    padding: '12px 16px',
                                                    background: '#f8f9fa',
                                                    borderRadius: 8,
                                                }}
                                            >
                                                <span
                                                    className="d-flex align-items-center justify-content-center"
                                                    style={{
                                                        width: 38,
                                                        height: 38,
                                                        borderRadius: '50%',
                                                        background: '#126DFF',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <Icon
                                                        size={18}
                                                        color="#fff"
                                                    />
                                                </span>
                                                <div>
                                                    <div
                                                        style={{
                                                            fontSize: 11,
                                                            color: '#999',
                                                            textTransform:
                                                                'uppercase',
                                                            letterSpacing:
                                                                '0.5px',
                                                            lineHeight: 1,
                                                            marginBottom: 3,
                                                        }}
                                                    >
                                                        {label}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontWeight: 600,
                                                            fontSize: 14,
                                                        }}
                                                    >
                                                        {value}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Inline Booking */}
                        <div className="col-xl-4 col-lg-12 col-md-12 sticky-sidebar">
                            <div className="twm-car-d-info m-b30">
                                {/* Price */}
                                <div className="twm-car-d-info-head">
                                    {canShowPrice && allowOnlineBooking ? (
                                        <>
                                            <h3 className="twm-title">
                                                Rental Price
                                            </h3>
                                            <div className="twm-price-section">
                                                <div className="v-price">
                                                    <span>{priceDisplay}</span>
                                                    {!convertedDisplay && (
                                                        <span className="v-duration">
                                                            / Day
                                                        </span>
                                                    )}
                                                    {convertedDisplay && (
                                                        <>
                                                            <small
                                                                className="text-muted d-block"
                                                                style={{
                                                                    fontSize:
                                                                        '0.6em',
                                                                }}
                                                            >
                                                                /{' '}
                                                                {
                                                                    convertedDisplay
                                                                }
                                                                <span className="v-duration">
                                                                    {' '}
                                                                    / Day
                                                                </span>
                                                            </small>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    ) : canShowPrice && !allowOnlineBooking ? (
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                width: '100%',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent:
                                                        'space-between',
                                                }}
                                            >
                                                <h3 className="twm-title mb-0">
                                                    Request Quote
                                                </h3>
                                                <div className="twm-price-section">
                                                    <div className="v-price">
                                                        <span>
                                                            {priceDisplay}
                                                        </span>
                                                        {convertedDisplay && (
                                                            <small
                                                                className="text-muted d-block"
                                                                style={{
                                                                    fontSize:
                                                                        '0.75em',
                                                                }}
                                                            >
                                                                /{' '}
                                                                {
                                                                    convertedDisplay
                                                                }
                                                            </small>
                                                        )}
                                                    </div>
                                                    <div className="v-duration">
                                                        / Day
                                                    </div>
                                                </div>
                                            </div>
                                            <div
                                                className="d-flex align-items-start gap-2 mt-3 p-2 rounded"
                                                style={{
                                                    background: '#fffbeb',
                                                    border: '1px solid #fde68a',
                                                    fontSize: 12,
                                                    color: '#92400e',
                                                    lineHeight: 1.5,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: 14,
                                                        flexShrink: 0,
                                                        marginTop: 1,
                                                    }}
                                                >
                                                    <FaTriangleExclamation />
                                                </span>
                                                <span>
                                                    Online payment is
                                                    unavailable at the moment.
                                                    Submit a quote request and
                                                    our team will be in touch.
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className="twm-title">
                                                Request Quote
                                            </h3>
                                            <p
                                                className="text-muted mb-0"
                                                style={{ fontSize: 13 }}
                                            >
                                                Contact us for pricing on this
                                                vehicle.
                                            </p>
                                        </>
                                    )}
                                </div>

                                {/* Booking Form */}
                                <div className="twm-bx-st1 twm-car-d-form mt-3">
                                    <h4 className="twm-title">
                                        Book This Vehicle
                                    </h4>

                                    {/* Pickup Date */}
                                    <div className="form-group mb-3">
                                        <label className="form-label">
                                            Pickup Date
                                        </label>
                                        <ReactDatePicker
                                            selected={
                                                form.pickup_date
                                                    ? new Date(
                                                          form.pickup_date +
                                                              'T00:00:00'
                                                      )
                                                    : null
                                            }
                                            onChange={(date: Date | null) => {
                                                if (date)
                                                    setField(
                                                        'pickup_date',
                                                        format(
                                                            date,
                                                            'yyyy-MM-dd'
                                                        )
                                                    );
                                            }}
                                            minDate={
                                                new Date(tomorrow + 'T00:00:00')
                                            }
                                            excludeDateIntervals={
                                                bookedIntervals
                                            }
                                            dateFormat="MMM d, yyyy"
                                            placeholderText="Select pickup date"
                                            className="form-control sf-datepicker-input"
                                            calendarClassName="sf-booking-calendar"
                                            showPopperArrow={false}
                                            popperPlacement="bottom-start"
                                            autoComplete="off"
                                        />
                                    </div>

                                    {/* Return Date + Days badge */}
                                    <div className="form-group mb-3">
                                        <label className="form-label d-flex justify-content-between">
                                            Return Date
                                            {form.pickup_date &&
                                                form.return_date && (
                                                    <span
                                                        className="badge"
                                                        style={{
                                                            background:
                                                                '#126DFF',
                                                            color: '#FFF',
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {days}{' '}
                                                        {days === 1
                                                            ? 'Day'
                                                            : 'Days'}
                                                    </span>
                                                )}
                                        </label>
                                        <ReactDatePicker
                                            selected={
                                                form.return_date
                                                    ? new Date(
                                                          form.return_date +
                                                              'T00:00:00'
                                                      )
                                                    : null
                                            }
                                            onChange={(date: Date | null) => {
                                                if (date)
                                                    setField(
                                                        'return_date',
                                                        format(
                                                            date,
                                                            'yyyy-MM-dd'
                                                        )
                                                    );
                                            }}
                                            minDate={
                                                new Date(
                                                    addDays(
                                                        form.pickup_date,
                                                        1
                                                    ) + 'T00:00:00'
                                                )
                                            }
                                            maxDate={returnMaxDate}
                                            excludeDateIntervals={
                                                bookedIntervals
                                            }
                                            dateFormat="MMM d, yyyy"
                                            placeholderText="Select return date"
                                            className="form-control sf-datepicker-input"
                                            calendarClassName="sf-booking-calendar"
                                            showPopperArrow={false}
                                            popperPlacement="bottom-start"
                                            autoComplete="off"
                                        />
                                    </div>

                                    {/* Conflict warning */}
                                    {hasConflict && (
                                        <div
                                            className="mb-3 p-2 rounded d-flex align-items-start gap-2"
                                            style={{
                                                background: '#fff8ec',
                                                border: '1px solid #f7a800',
                                                fontSize: 13,
                                                color: '#7a5200',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 15,
                                                    lineHeight: 1.4,
                                                }}
                                            >
                                                <FaTriangleExclamation />
                                            </span>
                                            <span>
                                                Selected dates overlap an
                                                existing booking. Please choose
                                                different dates.
                                            </span>
                                        </div>
                                    )}

                                    {/* Times */}
                                    <div className="row mb-3">
                                        <div className="col-6">
                                            <div className="form-group">
                                                <label className="form-label">
                                                    Pickup Time
                                                </label>
                                                <div
                                                    title={
                                                        !form.pickup_date
                                                            ? 'Select a date first'
                                                            : undefined
                                                    }
                                                    style={
                                                        !form.pickup_date
                                                            ? {
                                                                  opacity: 0.5,
                                                                  cursor: 'not-allowed',
                                                                  pointerEvents:
                                                                      'none',
                                                              }
                                                            : undefined
                                                    }
                                                >
                                                    <ReactDatePicker
                                                        selected={(() => {
                                                            const h = parseInt(
                                                                form.pickup_time.split(
                                                                    ':'
                                                                )[0],
                                                                10
                                                            );
                                                            const d =
                                                                new Date();
                                                            d.setHours(
                                                                h,
                                                                0,
                                                                0,
                                                                0
                                                            );
                                                            return d;
                                                        })()}
                                                        onChange={(
                                                            date: Date | null
                                                        ) => {
                                                            if (date)
                                                                setField(
                                                                    'pickup_time',
                                                                    toHourValue(
                                                                        date.getHours()
                                                                    )
                                                                );
                                                        }}
                                                        disabled={
                                                            !form.pickup_date
                                                        }
                                                        showTimeSelect
                                                        showTimeSelectOnly
                                                        timeIntervals={60}
                                                        timeFormat="h:mm aa"
                                                        dateFormat="h:mm aa"
                                                        minTime={(() => {
                                                            const d =
                                                                new Date();
                                                            d.setHours(
                                                                windowStart,
                                                                0,
                                                                0,
                                                                0
                                                            );
                                                            return d;
                                                        })()}
                                                        maxTime={(() => {
                                                            const d =
                                                                new Date();
                                                            d.setHours(
                                                                windowEnd,
                                                                0,
                                                                0,
                                                                0
                                                            );
                                                            return d;
                                                        })()}
                                                        className="form-control sf-datepicker-input"
                                                        calendarClassName="sf-booking-calendar"
                                                        showPopperArrow={false}
                                                        popperPlacement="bottom-start"
                                                        autoComplete="off"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="form-group">
                                                <label className="form-label">
                                                    Return Time
                                                </label>
                                                <div
                                                    title={
                                                        !form.return_date
                                                            ? 'Select a date first'
                                                            : undefined
                                                    }
                                                    style={
                                                        !form.return_date
                                                            ? {
                                                                  opacity: 0.5,
                                                                  cursor: 'not-allowed',
                                                                  pointerEvents:
                                                                      'none',
                                                              }
                                                            : undefined
                                                    }
                                                >
                                                    {(() => {
                                                        const isSameDay =
                                                            form.pickup_date ===
                                                            form.return_date;
                                                        const pickupHourNum =
                                                            parseInt(
                                                                form.pickup_time.split(
                                                                    ':'
                                                                )[0],
                                                                10
                                                            );
                                                        const maxReturnHour =
                                                            returnTimeThreshold &&
                                                            !isSameDay
                                                                ? pickupHourNum -
                                                                  returnTimeThreshold
                                                                : windowEnd;
                                                        const isLocked =
                                                            !!returnTimeThreshold &&
                                                            !isSameDay &&
                                                            maxReturnHour <=
                                                                windowStart;

                                                        if (isLocked) {
                                                            const h = maxReturnHour;
                                                            const ampm = h >= 12 ? 'PM' : 'AM';
                                                            const h12 = h % 12 === 0 ? 12 : h % 12;
                                                            const lockedLabel = `${h12}:00 ${ampm}`;
                                                            return (
                                                                <input
                                                                    type="text"
                                                                    className="form-control sf-datepicker-input"
                                                                    value={lockedLabel}
                                                                    readOnly
                                                                    disabled
                                                                />
                                                            );
                                                        }

                                                        const maxD = new Date();
                                                        maxD.setHours(
                                                            maxReturnHour,
                                                            0,
                                                            0,
                                                            0
                                                        );
                                                        const minD = new Date();
                                                        minD.setHours(
                                                            windowStart,
                                                            0,
                                                            0,
                                                            0
                                                        );
                                                        const selD = new Date();
                                                        selD.setHours(
                                                            parseInt(
                                                                form.return_time.split(
                                                                    ':'
                                                                )[0],
                                                                10
                                                            ),
                                                            0,
                                                            0,
                                                            0
                                                        );

                                                        return (
                                                            <ReactDatePicker
                                                                selected={selD}
                                                                onChange={(
                                                                    date: Date | null
                                                                ) => {
                                                                    if (date)
                                                                        setField(
                                                                            'return_time',
                                                                            toHourValue(
                                                                                date.getHours()
                                                                            )
                                                                        );
                                                                }}
                                                                disabled={
                                                                    !form.return_date
                                                                }
                                                                showTimeSelect
                                                                showTimeSelectOnly
                                                                timeIntervals={
                                                                    60
                                                                }
                                                                timeFormat="h:mm aa"
                                                                dateFormat="h:mm aa"
                                                                minTime={minD}
                                                                maxTime={maxD}
                                                                className="form-control sf-datepicker-input"
                                                                calendarClassName="sf-booking-calendar"
                                                                showPopperArrow={
                                                                    false
                                                                }
                                                                popperPlacement="bottom-start"
                                                                autoComplete="off"
                                                            />
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Date of Birth */}
                                    <div className="form-group mb-3">
                                        <label className="form-label">
                                            Date of Birth
                                        </label>
                                        <ReactDatePicker
                                            selected={
                                                form.date_of_birth
                                                    ? new Date(
                                                          form.date_of_birth
                                                      )
                                                    : null
                                            }
                                            onChange={(d: Date | null) =>
                                                setField(
                                                    'date_of_birth',
                                                    d
                                                        ? format(
                                                              d,
                                                              'yyyy-MM-dd'
                                                          )
                                                        : ''
                                                )
                                            }
                                            showYearDropdown
                                            dropdownMode="select"
                                            maxDate={subYears(new Date(), 18)}
                                            placeholderText="Date of birth (DD/MM/YYYY)"
                                            dateFormat="dd/MM/yyyy"
                                            className="form-control sf-datepicker-input"
                                            calendarClassName="sf-booking-calendar"
                                            showPopperArrow={false}
                                            autoComplete="off"
                                        />
                                        {dobError && (
                                            <div
                                                style={{
                                                    color: '#dc3545',
                                                    fontSize: 13,
                                                    marginTop: 4,
                                                }}
                                            >
                                                {dobError}
                                            </div>
                                        )}
                                    </div>

                                    {/* Pickup Location */}
                                    {locations.length > 0 && (
                                        <div className="form-group mb-3">
                                            <label className="form-label">
                                                Pickup Location
                                            </label>
                                            <select
                                                className="form-control"
                                                value={form.pickup_location_id}
                                                onChange={e => {
                                                    setField(
                                                        'pickup_location_id',
                                                        e.target.value
                                                    );
                                                    if (e.target.value) setPickupLocationError('');
                                                }}
                                            >
                                                <option value="">
                                                    Select a location
                                                </option>
                                                {locations.map(loc => (
                                                    <option
                                                        key={loc.id}
                                                        value={loc.id}
                                                    >
                                                        {loc.is_airport
                                                            ? '(Airport) '
                                                            : ''}
                                                        {loc.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {pickupLocationError && (
                                                <div
                                                    style={{
                                                        color: '#dc3545',
                                                        fontSize: 13,
                                                        marginTop: 4,
                                                    }}
                                                >
                                                    {pickupLocationError}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Drop-off Location */}
                                    {dropoffLocations.length > 0 && (
                                        <div className="form-group mb-3">
                                            <label className="form-label">
                                                Drop-off Location
                                            </label>
                                            <select
                                                className="form-control"
                                                value={form.dropoff_location_id}
                                                onChange={e => {
                                                    setField(
                                                        'dropoff_location_id',
                                                        e.target.value
                                                    );
                                                    if (e.target.value) setDropoffLocationError('');
                                                }}
                                            >
                                                <option value="">
                                                    Select a location
                                                </option>
                                                {dropoffLocations.map(loc => (
                                                    <option
                                                        key={loc.id}
                                                        value={loc.id}
                                                    >
                                                        {loc.is_airport
                                                            ? '(Airport) '
                                                            : ''}
                                                        {loc.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {dropoffLocationError && (
                                                <div
                                                    style={{
                                                        color: '#dc3545',
                                                        fontSize: 13,
                                                        marginTop: 4,
                                                    }}
                                                >
                                                    {dropoffLocationError}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Addons */}
                                    {vehicle.addons.length > 0 && (
                                        <div className="form-group mb-3">
                                            <label
                                                className="form-label"
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    color: '#888',
                                                }}
                                            >
                                                Optional Add-ons
                                            </label>
                                            <div className="d-flex flex-column gap-2">
                                                {vehicle.addons.map(addon => {
                                                    const isChecked =
                                                        form.selected_addon_ids.includes(
                                                            addon.id
                                                        );
                                                    return (
                                                        <label
                                                            key={addon.id}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems:
                                                                    'center',
                                                                justifyContent:
                                                                    'space-between',
                                                                gap: 12,
                                                                cursor: 'pointer',
                                                                padding:
                                                                    '10px 14px',
                                                                borderRadius: 10,
                                                                border: `1.5px solid ${isChecked ? '#126DFF' : '#e9ecef'}`,
                                                                background:
                                                                    isChecked
                                                                        ? 'rgba(18,109,255,0.05)'
                                                                        : '#fafafa',
                                                                transition:
                                                                    'all 0.15s',
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    flex: 1,
                                                                    minWidth: 0,
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        fontSize: 13,
                                                                        fontWeight: 600,
                                                                        color: '#18191d',
                                                                    }}
                                                                >
                                                                    {addon.name}
                                                                </div>
                                                                {addon.description && (
                                                                    <div
                                                                        style={{
                                                                            fontSize: 11,
                                                                            color: '#888',
                                                                            marginTop: 2,
                                                                        }}
                                                                    >
                                                                        {
                                                                            addon.description
                                                                        }
                                                                    </div>
                                                                )}
                                                                {canShowPrice && (
                                                                    <div
                                                                        style={{
                                                                            fontSize: 12,
                                                                            color: '#f7a800',
                                                                            fontWeight: 700,
                                                                            marginTop: 2,
                                                                        }}
                                                                    >
                                                                        {addonLabel(
                                                                            addon
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {/* Custom toggle switch */}
                                                            <div
                                                                onClick={() =>
                                                                    toggleAddon(
                                                                        addon.id
                                                                    )
                                                                }
                                                                style={{
                                                                    width: 42,
                                                                    height: 24,
                                                                    borderRadius: 12,
                                                                    background:
                                                                        isChecked
                                                                            ? '#126DFF'
                                                                            : '#dee2e6',
                                                                    position:
                                                                        'relative',
                                                                    transition:
                                                                        'background 0.2s',
                                                                    flexShrink: 0,
                                                                    cursor: 'pointer',
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        width: 18,
                                                                        height: 18,
                                                                        borderRadius:
                                                                            '50%',
                                                                        background:
                                                                            '#fff',
                                                                        position:
                                                                            'absolute',
                                                                        top: 3,
                                                                        left: isChecked
                                                                            ? 21
                                                                            : 3,
                                                                        transition:
                                                                            'left 0.2s',
                                                                        boxShadow:
                                                                            '0 1px 4px rgba(0,0,0,0.2)',
                                                                    }}
                                                                />
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Duration / price summary strip */}
                                    {form.pickup_date &&
                                        form.return_date &&
                                        !hasConflict && (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent:
                                                        'space-between',
                                                    background: '#f8f9fa',
                                                    borderRadius: 8,
                                                    padding: '10px 14px',
                                                    marginBottom: 14,
                                                    fontSize: 13,
                                                }}
                                            >
                                                <span style={{ color: '#555' }}>
                                                    <strong>{days}</strong>{' '}
                                                    {days === 1
                                                        ? 'day'
                                                        : 'days'}
                                                </span>
                                                {canShowPrice &&
                                                    !isQuoteMode && (
                                                        <span
                                                            style={{
                                                                color: '#126DFF',
                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            {vehicle.currency_symbol
                                                                ? formatWithSymbol(
                                                                      vehicle.daily_rate *
                                                                          days,
                                                                      vehicle.currency_symbol,
                                                                      true
                                                                  )
                                                                : vehicle.global_currency_symbol
                                                                  ? formatWithSymbol(
                                                                        vehicle.daily_rate *
                                                                            days,
                                                                        vehicle.global_currency_symbol,
                                                                        true
                                                                    )
                                                                  : formatCurrency(
                                                                        vehicle.daily_rate *
                                                                            days
                                                                    )}
                                                        </span>
                                                    )}
                                            </div>
                                        )}

                                    {/* Confirm / Request Quote */}
                                    <button
                                        type="button"
                                        className="site-button dark-bg"
                                        style={{
                                            width: '100%',
                                            opacity: hasConflict ? 0.5 : 1,
                                            borderRadius: 10,
                                            padding: '12px 24px',
                                            fontSize: 15,
                                            fontWeight: 700,
                                        }}
                                        onClick={handleConfirm}
                                        disabled={hasConflict}
                                    >
                                        {isQuoteMode
                                            ? 'Request a Quote'
                                            : 'Confirm Booking'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <MediaLightbox
                open={lightboxOpen}
                slides={imageSlides}
                index={lightboxIndex}
                onClose={() => setLightboxOpen(false)}
            />
        </>
    );
};
