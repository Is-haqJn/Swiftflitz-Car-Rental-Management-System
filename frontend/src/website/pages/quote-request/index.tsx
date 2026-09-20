// Quote Request Page - public form for customers to submit a quote request.
// Step 1 of the quote flow: customer submits dates + vehicle selection.
//
// Supports ?vehicle_id=<uuid> URL param to pre-select a specific vehicle.

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTitle } from '@/shared/hooks';
import { FaTriangleExclamation, FaCheck } from 'react-icons/fa6';
import {
    publicQuoteService,
    type PublicQuoteRequestPayload,
} from '@/services/publicQuoteService';
import { getErrorMessage } from '@/shared/libs/utils';

/* Types */
interface LocationOption {
    id: string;
    name: string;
    is_airport?: boolean;
}

interface UnavailableRange {
    rental_id?: string;
    from: string; // YYYY-MM-DD
    to: string; // YYYY-MM-DD
}

interface VehicleOption {
    id: string;
    name: string;
    category?: { name: string };
    unavailable_dates?: UnavailableRange[];
}

/* Helpers */
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

function fmtDisplay(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function findConflicts(
    pickupDate: string,
    returnDate: string,
    ranges: UnavailableRange[]
): UnavailableRange[] {
    if (!pickupDate || !returnDate) return [];
    return ranges.filter(r => pickupDate < r.to && returnDate > r.from);
}

/* Component */
export default function QuoteRequestPage() {
    const [searchParams] = useSearchParams();
    const preselectedVehicleId = searchParams.get('vehicle_id') ?? '';

    const [locations, setLocations] = useState<LocationOption[]>([]);
    const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const title = useTitle(submitted ? 'Request Submitted' : 'Get a Quote');

    const [form, setForm] = useState<PublicQuoteRequestPayload>({
        name: '',
        email: '',
        phone: '',
        pickup_date: addDays(getTodayStr(), 1),
        return_date: '',
        pickup_location_id: '',
        vehicle_id: preselectedVehicleId || undefined,
        vehicle_preference: '',
        message: '',
    });

    useEffect(() => {
        publicQuoteService
            .getPickupLocations()
            .then(res => setLocations(res.data ?? []))
            .catch(() => setLocations([]));

        publicQuoteService
            .getVehicles()
            .then(res => setVehicles(res.data?.vehicles ?? []))
            .catch(() => setVehicles([]));
    }, []);

    const set = (field: keyof PublicQuoteRequestPayload, value: string) => {
        setForm(prev => {
            const next = { ...prev, [field]: value };
            if (
                field === 'pickup_date' &&
                next.return_date &&
                next.return_date <= value
            ) {
                next.return_date = addDays(value, 1);
            }
            return next;
        });
    };

    const selectedVehicle = useMemo(
        () => vehicles.find(v => v.id === form.vehicle_id) ?? null,
        [vehicles, form.vehicle_id]
    );

    const conflicts = useMemo(
        () =>
            findConflicts(
                form.pickup_date ?? '',
                form.return_date ?? '',
                selectedVehicle?.unavailable_dates ?? []
            ),
        [form.pickup_date, form.return_date, selectedVehicle]
    );

    const bookedRanges = selectedVehicle?.unavailable_dates ?? [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!form.return_date || form.return_date <= (form.pickup_date ?? '')) {
            setError('Return date must be after pickup date.');
            return;
        }
        if (conflicts.length > 0) {
            setError(
                'Your selected dates overlap with an existing booking for this vehicle. Please choose different dates.'
            );
            return;
        }

        setSubmitting(true);
        try {
            const payload: PublicQuoteRequestPayload = {
                name: form.name,
                email: form.email,
                phone: form.phone,
                pickup_date: form.pickup_date ?? '',
                return_date: form.return_date ?? '',
            };
            if (form.pickup_location_id)
                payload.pickup_location_id = form.pickup_location_id;
            if (form.vehicle_id) payload.vehicle_id = form.vehicle_id;
            if (form.vehicle_preference)
                payload.vehicle_preference = form.vehicle_preference;
            if (form.message) payload.message = form.message;

            await publicQuoteService.submitRequest(payload);
            setSubmitted(true);
        } catch (err: unknown) {
            setError(
                getErrorMessage(err, 'Something went wrong. Please try again.')
            );
        } finally {
            setSubmitting(false);
        }
    };

    /* Success state */
    if (submitted) {
        return (
            <>
                {title}
                <div
                    className="twm-inner-page-banner-area"
                    style={{
                        backgroundImage:
                            "url('/assets/images/main-slider/slide2/bg-pic1.jpg')",
                    }}
                >
                    <div className="container">
                        <div className="twm-inner-banner-heading">
                            <h2 className="twm-title">Request a Quote</h2>
                        </div>
                    </div>
                </div>
                <div className="section-full p-t80 p-b50 bg-white">
                    <div className="container">
                        <div className="row justify-content-center">
                            <div className="col-lg-6 text-center py-5">
                                <i
                                    className="fa fa-check-circle text-success mb-3"
                                    style={{ fontSize: '4rem' }}
                                />
                                <h3 className="mb-3">
                                    Quote Request Submitted!
                                </h3>
                                <p className="text-muted mb-4">
                                    Thank you! We'll prepare a personalised
                                    quote and send a confirmation link to your
                                    email within 24 hours.
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

    /* Form */
    return (
        <>
            {title}

            {/* Banner */}
            <div
                className="twm-inner-page-banner-area"
                style={{
                    backgroundImage:
                        "url('/assets/images/main-slider/slide2/bg-pic1.jpg')",
                }}
            >
                <div className="container">
                    <div className="twm-inner-banner-heading">
                        <h2 className="twm-title">Request a Quote</h2>
                        <p>Tell us about your rental needs</p>
                    </div>
                </div>
            </div>

            <div className="section-full p-t80 p-b50 bg-white">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-8">
                            <div className="section-head center mb-4">
                                <h2 className="twm-title">
                                    Request a Rental Quote
                                </h2>
                                <p className="text-muted">
                                    Fill in your details and preferred dates.
                                    Our team will prepare a personalised quote
                                    and send you a confirmation link.
                                </p>
                            </div>

                            {error && (
                                <div className="alert alert-danger">
                                    {error}
                                </div>
                            )}

                            <div
                                className="contact-box p-a30 bg-white"
                                style={{
                                    borderRadius: 8,
                                    boxShadow: '0 2px 16px rgba(0,0,0,.08)',
                                }}
                            >
                                <form onSubmit={handleSubmit}>
                                    {/* Personal Details */}
                                    <h5 className="mb-3">Your Details</h5>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                Full Name{' '}
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="John Doe"
                                                value={form.name}
                                                onChange={e =>
                                                    set('name', e.target.value)
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                Email Address{' '}
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                placeholder="you@example.com"
                                                value={form.email}
                                                onChange={e =>
                                                    set('email', e.target.value)
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                Phone Number{' '}
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                placeholder="+233 20 000 0000"
                                                value={form.phone}
                                                onChange={e =>
                                                    set('phone', e.target.value)
                                                }
                                                required
                                            />
                                        </div>
                                    </div>

                                    <hr className="my-4" />

                                    {/* Vehicle Selector */}
                                    <h5 className="mb-3">Vehicle</h5>
                                    <div className="mb-3">
                                        {vehicles.length > 0 ? (
                                            <select
                                                className="form-select"
                                                value={form.vehicle_id ?? ''}
                                                onChange={e =>
                                                    set(
                                                        'vehicle_id',
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    - No preference (we'll
                                                    assign the best match) -
                                                </option>
                                                {vehicles.map(v => (
                                                    <option
                                                        key={v.id}
                                                        value={v.id}
                                                    >
                                                        {v.name}
                                                        {v.category?.name
                                                            ? ` - ${v.category.name}`
                                                            : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="e.g. SUV, Toyota Hilux, Sedan…"
                                                value={
                                                    form.vehicle_preference ??
                                                    ''
                                                }
                                                onChange={e =>
                                                    set(
                                                        'vehicle_preference',
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        )}
                                        <small className="text-muted">
                                            {vehicles.length > 0
                                                ? "Select a specific vehicle or leave blank - we'll match you to the best available option."
                                                : 'Describe your preferred vehicle type.'}
                                        </small>

                                        {/* Booked periods warning */}
                                        {selectedVehicle &&
                                            bookedRanges.length > 0 && (
                                                <div
                                                    className="mt-2 p-2 rounded"
                                                    style={{
                                                        background: '#fff8e1',
                                                        border: '1px solid #ffe082',
                                                    }}
                                                >
                                                    <p
                                                        className="mb-1 small fw-semibold"
                                                        style={{
                                                            color: '#b45309',
                                                        }}
                                                    >
                                                        <FaTriangleExclamation className="me-1" />{' '}
                                                        This vehicle has
                                                        existing bookings -
                                                        avoid these dates:
                                                    </p>
                                                    <ul
                                                        className="mb-0 ps-3"
                                                        style={{ fontSize: 13 }}
                                                    >
                                                        {bookedRanges.map(r => (
                                                            <li
                                                                key={
                                                                    r.rental_id
                                                                }
                                                                style={{
                                                                    color: '#92400e',
                                                                }}
                                                            >
                                                                {fmtDisplay(
                                                                    r.from
                                                                )}{' '}
                                                                →{' '}
                                                                {fmtDisplay(
                                                                    r.to
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                        {/* Availability confirmation */}
                                        {selectedVehicle &&
                                            conflicts.length === 0 &&
                                            form.pickup_date &&
                                            form.return_date && (
                                                <div className="mt-2 alert alert-success py-2 mb-0 small">
                                                    <FaCheck className="me-1" />
                                                    <strong>
                                                        {selectedVehicle.name}
                                                    </strong>{' '}
                                                    is available for your
                                                    selected dates.
                                                </div>
                                            )}
                                    </div>

                                    <hr className="my-4" />

                                    {/* Rental Dates */}
                                    <h5 className="mb-3">Rental Dates</h5>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                Pickup Date{' '}
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="date"
                                                className={`form-control ${conflicts.length > 0 ? 'is-invalid' : ''}`}
                                                min={getTodayStr()}
                                                value={form.pickup_date}
                                                onChange={e =>
                                                    set(
                                                        'pickup_date',
                                                        e.target.value
                                                    )
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                Return Date{' '}
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="date"
                                                className={`form-control ${conflicts.length > 0 ? 'is-invalid' : ''}`}
                                                min={
                                                    form.pickup_date
                                                        ? addDays(
                                                              form.pickup_date,
                                                              1
                                                          )
                                                        : addDays(
                                                              getTodayStr(),
                                                              1
                                                          )
                                                }
                                                value={form.return_date}
                                                onChange={e =>
                                                    set(
                                                        'return_date',
                                                        e.target.value
                                                    )
                                                }
                                                required
                                            />
                                            {conflicts.length > 0 && (
                                                <div className="invalid-feedback d-block">
                                                    These dates conflict with an
                                                    existing booking (
                                                    {fmtDisplay(
                                                        conflicts[0].from
                                                    )}{' '}
                                                    →{' '}
                                                    {fmtDisplay(
                                                        conflicts[0].to
                                                    )}
                                                    ). Please choose different
                                                    dates.
                                                </div>
                                            )}
                                        </div>

                                        {locations.length > 0 && (
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">
                                                    Pickup Location
                                                </label>
                                                <select
                                                    className="form-select"
                                                    value={
                                                        form.pickup_location_id ??
                                                        ''
                                                    }
                                                    onChange={e =>
                                                        set(
                                                            'pickup_location_id',
                                                            e.target.value
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        - Select location
                                                        (optional) -
                                                    </option>
                                                    {locations.map(loc => (
                                                        <option
                                                            key={loc.id}
                                                            value={loc.id}
                                                        >
                                                            {loc.name}
                                                            {loc.is_airport
                                                                ? ' (Airport)'
                                                                : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {/* Message */}
                                    <div className="mb-4">
                                        <label className="form-label">
                                            Special Requests / Message{' '}
                                            <span className="text-muted small">
                                                (optional)
                                            </span>
                                        </label>
                                        <textarea
                                            className="form-control"
                                            rows={4}
                                            placeholder="Any additional requirements or questions…"
                                            value={form.message ?? ''}
                                            onChange={e =>
                                                set('message', e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="text-end">
                                        <button
                                            type="submit"
                                            className="site-button"
                                            disabled={
                                                submitting ||
                                                conflicts.length > 0
                                            }
                                        >
                                            {submitting
                                                ? 'Submitting…'
                                                : 'Submit Quote Request'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
