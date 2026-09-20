import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTitle } from '@/shared/hooks';
import ReactDatePicker from 'react-datepicker';
import { format } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import '@/website/styles/sfBookingCalendar.css';
import {
    MdCalendarToday,
    MdColorLens,
    MdDirectionsCar,
    MdEventSeat,
    MdLocalGasStation,
    MdSettings,
    MdSpeed,
} from 'react-icons/md';
import type { ComponentType } from 'react';
import type { IconBaseProps } from 'react-icons';
import { FEATURE_ICON_MAP } from '@adminConstants/featureIcons';
import { apiClient } from '@/shared/api/apiClient';
import { useFormatCurrency } from '@/shared/hooks/queries/useSettings';
import { formatWithSymbol } from '@/shared/libs/currency';
import { usePublicVehicleBookedDates } from '@/shared/hooks/queries/useChauffeurBookings';
import type { FleetVehicle } from '@/shared/types/fleetVehicle.types';
import type { ApiResponse } from '@/shared/types';
import { BannerSection } from './sections/BannerSection';

/* Types */
interface ChauffeurLocation {
    id: string;
    name: string;
    charge: number | null;
    is_active: boolean;
}

interface ChauffeurBookingSettings {
    booking_window_start: string; // HH:mm
    booking_window_end: string; // HH:mm
}

interface ChauffeurBookingForm {
    pickup_date: string;
    pickup_time: string;
    pickup_location_id: string;
    exact_address: string;
}

type SpecItem = {
    Icon: ComponentType<IconBaseProps>;
    label: string;
    value: string;
};

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

/* Time slot helpers */
function toMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
}

function formatTime12h(hhmm: string): string {
    const [h, m] = hhmm.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function generateTimeSlots(
    start: string,
    end: string,
    intervalMins = 30
): string[] {
    const slots: string[] = [];
    let cur = toMinutes(start);
    const endMins = toMinutes(end);
    while (cur <= endMins) {
        const h = Math.floor(cur / 60);
        const m = cur % 60;
        slots.push(
            `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
        );
        cur += intervalMins;
    }
    return slots;
}

interface GroupedSlots {
    morning: string[];
    afternoon: string[];
    evening: string[];
}

function groupSlots(slots: string[]): GroupedSlots {
    const morning: string[] = [];
    const afternoon: string[] = [];
    const evening: string[] = [];
    for (const slot of slots) {
        const h = parseInt(slot.split(':')[0], 10);
        if (h < 12) morning.push(slot);
        else if (h < 17) afternoon.push(slot);
        else evening.push(slot);
    }
    return { morning, afternoon, evening };
}

/* Labels */
const FUEL_LABEL: Record<string, string> = {
    petrol: 'Petrol',
    diesel: 'Diesel',
    electric: 'Electric',
    hybrid: 'Hybrid',
};

const TRANSMISSION_LABEL: Record<string, string> = {
    automatic: 'Automatic',
    manual: 'Manual',
    'semi-automatic': 'Semi-Automatic',
};

/* Component */
export default function ChauffeurVehicleDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const formatCurrency = useFormatCurrency();
    const formatVehicleAmount = (amount: number) =>
        vehicle?.branch?.currency_symbol
            ? formatWithSymbol(amount, vehicle.branch.currency_symbol)
            : formatCurrency(amount);

    const { data: bookedIntervals = [] } = usePublicVehicleBookedDates(
        id ?? null
    );

    const [vehicle, setVehicle] = useState<FleetVehicle | null>(null);
    const title = useTitle(
        vehicle
            ? `${vehicle.make} ${vehicle.model} - Chauffeur Services`
            : 'Chauffeur Services'
    );
    const [locations, setLocations] = useState<ChauffeurLocation[]>([]);
    const [bookingSettings, setBookingSettings] =
        useState<ChauffeurBookingSettings>({
            booking_window_start: '06:00',
            booking_window_end: '22:00',
        });
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [selectedImage, setSelectedImage] = useState(0);

    const tomorrow = addDays(getTodayStr(), 1);
    const [form, setForm] = useState<ChauffeurBookingForm>({
        pickup_date: tomorrow,
        pickup_time: '',
        pickup_location_id: '',
        exact_address: '',
    });

    useEffect(() => {
        if (!id) return;

        Promise.all([
            apiClient.get<ApiResponse<FleetVehicle>>(
                `/public/chauffeur-vehicles/${id}`
            ),
            apiClient.get<ApiResponse<ChauffeurLocation[]>>(
                '/public/chauffeur-locations'
            ),
            apiClient.get<ApiResponse<ChauffeurBookingSettings>>(
                '/public/chauffeur-settings'
            ),
        ])
            .then(([vehicleRes, locationsRes, settingsRes]) => {
                setVehicle(vehicleRes.data);
                setLocations(locationsRes.data ?? []);

                const settings = settingsRes.data;
                setBookingSettings(settings);

                // Default time to first slot in booking window
                const firstSlot = settings.booking_window_start;
                setForm(prev => ({ ...prev, pickup_time: firstSlot }));
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [id]);

    // If the initially selected date is booked, advance to the next available day.
    useEffect(() => {
        if (!bookedIntervals.length) return;
        let candidate = new Date(form.pickup_date + 'T00:00:00');
        let advanced = false;
        for (let i = 0; i < 365; i++) {
            const isBooked = bookedIntervals.some(
                ({ start, end }) => candidate >= start && candidate <= end
            );
            if (!isBooked) break;
            candidate.setDate(candidate.getDate() + 1);
            advanced = true;
        }
        if (advanced) {
            setField('pickup_date', format(candidate, 'yyyy-MM-dd'));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookedIntervals]);

    const timeSlots = useMemo(
        () =>
            generateTimeSlots(
                bookingSettings.booking_window_start,
                bookingSettings.booking_window_end
            ),
        [
            bookingSettings.booking_window_start,
            bookingSettings.booking_window_end,
        ]
    );

    const groupedSlots = useMemo(() => groupSlots(timeSlots), [timeSlots]);

    const setField = <K extends keyof ChauffeurBookingForm>(
        key: K,
        value: ChauffeurBookingForm[K]
    ) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleConfirm = () => {
        if (!vehicle) return;
        if (
            !form.pickup_date ||
            !form.pickup_time ||
            !form.pickup_location_id
        ) {
            return;
        }
        const selectedLocation =
            locations.find(l => l.id === form.pickup_location_id) ?? null;
        const chauffeurAssignment = vehicle.service_assignments?.find(
            a => a.service_type === 'chauffeur'
        );
        const bp = chauffeurAssignment?.base_price ?? null;
        const lc = selectedLocation?.charge ?? 0;
        navigate(`/chauffeur-services/${id}/confirm`, {
            state: {
                vehicle,
                form,
                selectedLocation,
                basePrice: bp,
                locationCharge: lc,
            },
        });
    };

    if (loading) {
        return (
            <>
                <BannerSection />
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
                <BannerSection />
                <div className="section-content p-t60 p-b120">
                    <div className="container">
                        <div className="text-center py-5">
                            <h4>This vehicle is not available.</h4>
                            <a
                                href="/chauffeur-services"
                                className="site-button dark-bg mt-3 d-inline-block"
                            >
                                Back to Chauffeur Services
                            </a>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const chauffeurAssignment = vehicle.service_assignments?.find(
        a => a.service_type === 'chauffeur'
    );
    const basePrice = chauffeurAssignment?.base_price ?? null;
    const photos = vehicle.photos ?? [];
    const displayPhoto = photos[selectedImage] ?? photos[0];
    const vehicleName = `${vehicle.make} ${vehicle.model}`;

    const specs: SpecItem[] = [];
    specs.push({
        Icon: MdEventSeat,
        label: 'Seats',
        value: `${vehicle.seats} Seats`,
    });
    if (vehicle.transmission)
        specs.push({
            Icon: MdSettings,
            label: 'Transmission',
            value:
                TRANSMISSION_LABEL[vehicle.transmission] ??
                vehicle.transmission,
        });
    if (vehicle.fuel_type)
        specs.push({
            Icon: MdLocalGasStation,
            label: 'Fuel Type',
            value: FUEL_LABEL[vehicle.fuel_type] ?? vehicle.fuel_type,
        });
    if (vehicle.engine)
        specs.push({ Icon: MdSpeed, label: 'Engine', value: vehicle.engine });
    if (vehicle.color)
        specs.push({ Icon: MdColorLens, label: 'Color', value: vehicle.color });
    specs.push({
        Icon: MdCalendarToday,
        label: 'Year',
        value: String(vehicle.year),
    });
    if (chauffeurAssignment?.category)
        specs.push({
            Icon: MdDirectionsCar,
            label: 'Category',
            value: chauffeurAssignment.category.name,
        });

    const selectedLocation =
        locations.find(l => l.id === form.pickup_location_id) ?? null;
    const locationCharge = selectedLocation?.charge ?? 0;

    const isFormValid =
        !!form.pickup_date && !!form.pickup_time && !!form.pickup_location_id;

    return (
        <>
            {title}
            <BannerSection title={vehicleName} />

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
                                    }}
                                >
                                    {displayPhoto ? (
                                        <img
                                            src={displayPhoto.urls.large}
                                            alt={vehicleName}
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
                                            🚗
                                        </div>
                                    )}
                                </div>

                                {photos.length > 1 && (
                                    <div
                                        className="d-flex gap-2 mt-2"
                                        style={{ overflowX: 'auto' }}
                                    >
                                        {photos.map((photo, idx) => (
                                            <button
                                                key={photo.id}
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
                                                    src={photo.urls.thumb}
                                                    alt={`${vehicleName} ${idx + 1}`}
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
                                                        style={{ fontSize: 13 }}
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
                                                                    ✓
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

                            {/* Specifications */}
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

                        {/* RIGHT: Booking Sidebar */}
                        <div className="col-xl-4 col-lg-12 col-md-12 sticky-sidebar">
                            <div className="twm-car-d-info m-b30">
                                {/* Price */}
                                <div className="twm-car-d-info-head">
                                    {basePrice !== null ? (
                                        <>
                                            <h3 className="twm-title">
                                                Chauffeur Price
                                            </h3>
                                            <div className="twm-price-section">
                                                <div className="v-price">
                                                    {formatVehicleAmount(
                                                        Number(basePrice)
                                                    )}
                                                </div>
                                                <div className="v-duration">
                                                    / Trip
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <h3 className="twm-title">
                                            Book This Vehicle
                                        </h3>
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

                                    {/* Pickup Time - grouped by Morning / Afternoon / Evening */}
                                    <div className="form-group mb-3">
                                        <label className="form-label">
                                            Pickup Time{' '}
                                            <span
                                                className="text-muted"
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 400,
                                                }}
                                            >
                                                (
                                                {formatTime12h(
                                                    bookingSettings.booking_window_start
                                                )}{' '}
                                                –{' '}
                                                {formatTime12h(
                                                    bookingSettings.booking_window_end
                                                )}
                                                )
                                            </span>
                                        </label>
                                        <select
                                            className="form-control"
                                            value={form.pickup_time}
                                            onChange={e =>
                                                setField(
                                                    'pickup_time',
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="">
                                                Select a time
                                            </option>
                                            {groupedSlots.morning.length >
                                                0 && (
                                                <optgroup label="Morning">
                                                    {groupedSlots.morning.map(
                                                        slot => (
                                                            <option
                                                                key={slot}
                                                                value={slot}
                                                            >
                                                                {formatTime12h(
                                                                    slot
                                                                )}
                                                            </option>
                                                        )
                                                    )}
                                                </optgroup>
                                            )}
                                            {groupedSlots.afternoon.length >
                                                0 && (
                                                <optgroup label="Afternoon">
                                                    {groupedSlots.afternoon.map(
                                                        slot => (
                                                            <option
                                                                key={slot}
                                                                value={slot}
                                                            >
                                                                {formatTime12h(
                                                                    slot
                                                                )}
                                                            </option>
                                                        )
                                                    )}
                                                </optgroup>
                                            )}
                                            {groupedSlots.evening.length >
                                                0 && (
                                                <optgroup label="Evening">
                                                    {groupedSlots.evening.map(
                                                        slot => (
                                                            <option
                                                                key={slot}
                                                                value={slot}
                                                            >
                                                                {formatTime12h(
                                                                    slot
                                                                )}
                                                            </option>
                                                        )
                                                    )}
                                                </optgroup>
                                            )}
                                        </select>
                                    </div>

                                    {/* Pickup Location */}
                                    <div className="form-group mb-3">
                                        <label className="form-label">
                                            Pickup Location
                                        </label>
                                        <select
                                            className="form-control"
                                            value={form.pickup_location_id}
                                            onChange={e =>
                                                setField(
                                                    'pickup_location_id',
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="">
                                                Select a location
                                            </option>
                                            {locations.map(loc => (
                                                <option
                                                    key={loc.id}
                                                    value={loc.id}
                                                >
                                                    {loc.name}
                                                    {loc.charge &&
                                                    loc.charge > 0
                                                        ? ` (+${formatVehicleAmount(loc.charge)})`
                                                        : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {selectedLocation &&
                                            locationCharge > 0 && (
                                                <div
                                                    className="mt-1 d-flex justify-content-between"
                                                    style={{
                                                        fontSize: 13,
                                                        color: '#555',
                                                    }}
                                                >
                                                    <span>Location charge</span>
                                                    <span>
                                                        {formatVehicleAmount(
                                                            locationCharge
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                    </div>

                                    {/* Exact Pickup Address */}
                                    <div className="form-group mb-3">
                                        <label className="form-label">
                                            Exact Pickup Address
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Enter your full pickup address"
                                            value={form.exact_address}
                                            onChange={e =>
                                                setField(
                                                    'exact_address',
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        className="site-button btn-block"
                                        disabled={!isFormValid}
                                        onClick={handleConfirm}
                                        style={{
                                            opacity: isFormValid ? 1 : 0.6,
                                        }}
                                    >
                                        Confirm Booking
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
