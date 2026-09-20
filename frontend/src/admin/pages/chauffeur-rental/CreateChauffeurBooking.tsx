import { useState, useEffect } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Combobox } from '@headlessui/react';
import { format, addDays } from 'date-fns';
import { useBranches } from '@/shared/hooks/queries/useBranches';
import { useAvailableFleetVehiclesForChauffeur } from '@/shared/hooks/queries/useFleetVehicles';
import { useChauffeurLocations } from '@/shared/hooks/queries/useChauffeurLocations';
import {
    useCreateChauffeurBooking,
    useVehicleBookedDates,
} from '@/shared/hooks/queries/useChauffeurBookings';
import { useChauffeurSettings } from '@/shared/hooks/queries/useChauffeurSettings';
import { useTitle } from '@/shared/hooks';
import { ROUTES } from '@/shared/routes';
import DatePickerField from '@/admin/components/DatePickerField';
import HourSelect from '@/admin/components/HourSelect';
import type {
    CreateChauffeurBookingData,
    ChauffeurPaymentMethod,
} from '@/shared/types/chauffeur-booking.types';
import type { FleetVehicle } from '@/shared/types/fleetVehicle.types';
import type { ChauffeurLocation } from '@/shared/types/chauffeur-location.types';
import { useGeneralSettings } from '@/shared/hooks/queries/useSettings';
import { formatWithSymbol } from '@/shared/libs/currency';

type FormValues = {
    branch_id: string;
    vehicle_id: string;
    pickup_location_id: string;
    pickup_date: string;
    pickup_hour: string;
    customer_full_name: string;
    customer_email: string;
    customer_phone: string;
    customer_expected_destination: string;
    payment_method: ChauffeurPaymentMethod | '';
    payment_reference: string;
    staff_notes: string;
};

function PricingPreview({
    basePrice,
    pickupCharge,
    vatRate,
    currencySymbol,
}: {
    basePrice: number;
    pickupCharge: number;
    vatRate: number;
    currencySymbol: string;
}) {
    const vatAmount = Math.round(basePrice * (vatRate / 100) * 100) / 100;
    const total =
        Math.round((basePrice + vatAmount + pickupCharge) * 100) / 100;

    return (
        <Card>
            <Card.Header>
                <Card.Title className="fs-6">Pricing Preview</Card.Title>
            </Card.Header>
            <Card.Body>
                <div className="d-flex justify-content-between py-2 border-bottom">
                    <span className="text-muted small">Base Price</span>
                    <span className="fw-semibold">
                        {formatWithSymbol(basePrice, currencySymbol)}
                    </span>
                </div>
                {pickupCharge > 0 && (
                    <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="text-muted small">Pickup Charge</span>
                        <span className="fw-semibold">
                            {formatWithSymbol(pickupCharge, currencySymbol)}
                        </span>
                    </div>
                )}
                <div className="d-flex justify-content-between py-2 border-bottom">
                    <span className="text-muted small">VAT ({vatRate}%)</span>
                    <span className="fw-semibold">
                        {formatWithSymbol(vatAmount, currencySymbol)}
                    </span>
                </div>
                <div className="d-flex justify-content-between py-2 fw-bold">
                    <span>Total</span>
                    <span className="text-primary fs-5">
                        {formatWithSymbol(total, currencySymbol)}
                    </span>
                </div>
            </Card.Body>
        </Card>
    );
}

/** Parse "HH:mm" → hour integer (0–23), returns 0 as fallback */
function parseHour(hhmm: string): number {
    const parsed = parseInt(hhmm?.split(':')[0] ?? '0', 10);
    return isNaN(parsed) ? 0 : parsed;
}

export default function CreateChauffeurBooking() {
    useTitle('New Chauffeur Booking');
    const navigate = useNavigate();
    const [showInfoPanel, setShowInfoPanel] = useState(true);
    const createBooking = useCreateChauffeurBooking();
    const { data: generalSettings } = useGeneralSettings();
    const globalSymbol = generalSettings?.data?.currency_symbol ?? '₵';

    // Load booking window from settings
    const { data: settingsRes } = useChauffeurSettings();
    const settings = settingsRes?.data;
    const minHour = parseHour(settings?.booking_window_start ?? '08:00');
    const maxHour = parseHour(settings?.booking_window_end ?? '20:00');

    const {
        register,
        handleSubmit,
        watch,
        control,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        defaultValues: {
            payment_method: '',
            pickup_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        },
    });

    const selectedVehicleId = watch('vehicle_id');
    const selectedLocationId = watch('pickup_location_id');
    const watchedBranchId = watch('branch_id');

    const { data: bookedIntervals = [] } = useVehicleBookedDates(
        selectedVehicleId || null
    );

    // Data fetches
    const { data: branchesData } = useBranches();
    const branches = branchesData?.data ?? [];

    const { data: vehiclesData, isLoading: vehiclesLoading } =
        useAvailableFleetVehiclesForChauffeur();
    const vehicles: FleetVehicle[] = vehiclesData?.data ?? [];

    const [vehicleQuery, setVehicleQuery] = useState('');

    const branchVehicles = watchedBranchId
        ? vehicles.filter(v => v.branch_id === watchedBranchId)
        : vehicles;

    const filteredVehicles =
        vehicleQuery === ''
            ? branchVehicles
            : branchVehicles.filter(v =>
                  `${v.make ?? ''} ${v.model ?? ''} ${v.license_plate ?? ''}`
                      .toLowerCase()
                      .includes(vehicleQuery.toLowerCase())
              );

    useEffect(() => {
        setValue('vehicle_id', '');
    }, [watchedBranchId, setValue]);

    const { data: locationsData } = useChauffeurLocations({
        'filter[is_active]': '1',
        per_page: 100,
    });
    const locations: ChauffeurLocation[] = locationsData?.data ?? [];

    // Derived pricing
    const selectedVehicle =
        vehicles.find(v => v.id === selectedVehicleId) ?? null;
    const chauffeurAssignment = selectedVehicle?.service_assignments?.find(
        a => a.service_type === 'chauffeur' && a.is_active
    );
    const basePrice = chauffeurAssignment?.base_price ?? 0;

    const selectedLocation = locations.find(l => l.id === selectedLocationId);
    const pickupCharge = selectedLocation?.charge
        ? Number(selectedLocation.charge)
        : 0;

    const branchCurrencySymbol =
        selectedVehicle?.branch?.currency_symbol ?? globalSymbol;
    const vatRate = 15; // pulled from settings; approximate for preview

    const onSubmit = (data: FormValues) => {
        // Combine date + hour into a full datetime string for the API
        const pickupTime = `${data.pickup_date}T${data.pickup_hour}:00`;

        const payload: CreateChauffeurBookingData = {
            branch_id: data.branch_id,
            vehicle_id: data.vehicle_id,
            pickup_location_id: data.pickup_location_id || undefined,
            pickup_time: pickupTime,
            customer_full_name: data.customer_full_name,
            customer_email: data.customer_email || undefined,
            customer_phone: data.customer_phone,
            customer_expected_destination:
                data.customer_expected_destination || undefined,
            payment_method:
                (data.payment_method as ChauffeurPaymentMethod) || undefined,
            payment_reference: data.payment_reference || undefined,
            staff_notes: data.staff_notes || undefined,
        };

        createBooking.mutate(payload, {
            onSuccess: res => {
                navigate(
                    ROUTES.DASHBOARD.CHAUFFEUR_RENTAL.BOOKINGS.VIEW(res.data.id)
                );
            },
        });
    };

    return (
        <div className="pb-4">
            <h4 className="mb-3">New Chauffeur Booking</h4>

            {/* Setup guide */}
            <div
                className="alert alert-info border-0 mb-4"
                style={{
                    background: '#eff6ff',
                    borderLeft: '4px solid #3b82f6',
                    borderRadius: 8,
                }}
            >
                <div className="d-flex gap-3 align-items-start">
                    <i
                        className="fas fa-circle-info text-primary mt-1"
                        style={{ fontSize: 16, flexShrink: 0 }}
                    />
                    <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <strong style={{ fontSize: 13 }}>
                                Before Creating a Chauffeur Booking
                            </strong>
                            <button
                                type="button"
                                className="btn btn-link btn-sm p-0 ms-2 text-primary"
                                style={{ fontSize: '0.8rem' }}
                                onClick={() => setShowInfoPanel(v => !v)}
                            >
                                {showInfoPanel ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {showInfoPanel && (
                            <>
                                <ol
                                    className="mb-1 ps-3"
                                    style={{ fontSize: 12, lineHeight: 1.7 }}
                                >
                                    <li>
                                        Set up{' '}
                                        <strong>Chauffeur Locations</strong>{' '}
                                        (pickup/dropoff points) under{' '}
                                        <em>Chauffeur - Locations</em>.
                                    </li>
                                    <li>
                                        Ensure{' '}
                                        <a
                                            href="/management/fleet-vehicles"
                                            style={{
                                                color: '#1d4ed8',
                                                fontWeight: 600,
                                            }}
                                        >
                                            Chauffeured Fleet
                                        </a>{' '}
                                        vehicles are available and assigned to
                                        the branch.
                                    </li>
                                    <li>
                                        Configure{' '}
                                        <strong>Chauffeur Pricing</strong> rates
                                        under <em>Chauffeur - Settings</em>.
                                    </li>
                                    <li>
                                        Register the customer or use an existing
                                        chauffeur customer record.
                                    </li>
                                </ol>
                                <span
                                    style={{ fontSize: 12, color: '#374151' }}
                                >
                                    After booking, confirm it, assign a driver
                                    and vehicle, then start the trip when the
                                    customer is ready.
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {createBooking.isError && (
                <Alert variant="danger" className="mb-4">
                    Failed to create booking. Please check the form and try
                    again.
                </Alert>
            )}

            <Form onSubmit={handleSubmit(onSubmit)}>
                <Row className="g-4 align-items-start">
                    {/* Left column */}
                    <Col lg={8}>
                        {/* Booking Details */}
                        <Card className="mb-4">
                            <Card.Header>
                                <Card.Title className="fs-6">
                                    Booking Details
                                </Card.Title>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Branch *</Form.Label>
                                            <Form.Select
                                                {...register('branch_id', {
                                                    required:
                                                        'Branch is required',
                                                })}
                                                isInvalid={!!errors.branch_id}
                                            >
                                                <option value="">
                                                    Select branch...
                                                </option>
                                                {branches.map(b => (
                                                    <option
                                                        key={b.id}
                                                        value={b.id}
                                                    >
                                                        {b.name}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                            {errors.branch_id && (
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.branch_id.message}
                                                </Form.Control.Feedback>
                                            )}
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Vehicle *</Form.Label>
                                            <Controller
                                                name="vehicle_id"
                                                control={control}
                                                rules={{
                                                    required:
                                                        'Vehicle is required',
                                                }}
                                                render={({ field }) => (
                                                    <Combobox
                                                        value={selectedVehicle}
                                                        onChange={(
                                                            v: FleetVehicle | null
                                                        ) => {
                                                            field.onChange(
                                                                v?.id ?? ''
                                                            );
                                                            setVehicleQuery('');
                                                        }}
                                                        disabled={
                                                            vehiclesLoading
                                                        }
                                                    >
                                                        <div
                                                            style={{
                                                                position:
                                                                    'relative',
                                                            }}
                                                        >
                                                            <div className="input-group">
                                                                <Combobox.Input
                                                                    className={`form-control${errors.vehicle_id ? ' is-invalid' : ''}`}
                                                                    displayValue={(
                                                                        v: FleetVehicle | null
                                                                    ) =>
                                                                        v
                                                                            ? `${v.year} ${v.make} ${v.model} (${v.license_plate})`
                                                                            : ''
                                                                    }
                                                                    onChange={e =>
                                                                        setVehicleQuery(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    placeholder={
                                                                        vehiclesLoading
                                                                            ? 'Loading vehicles...'
                                                                            : 'Select or type to search...'
                                                                    }
                                                                />
                                                                <Combobox.Button
                                                                    className="input-group-text"
                                                                    style={{
                                                                        cursor: 'pointer',
                                                                    }}
                                                                >
                                                                    ▾
                                                                </Combobox.Button>
                                                            </div>
                                                            <Combobox.Options
                                                                style={{
                                                                    position:
                                                                        'absolute',
                                                                    zIndex: 1050,
                                                                    width: '100%',
                                                                    maxHeight: 240,
                                                                    overflowY:
                                                                        'auto',
                                                                    background:
                                                                        '#fff',
                                                                    border: '1px solid #dee2e6',
                                                                    borderRadius: 4,
                                                                    marginTop: 2,
                                                                    padding: 0,
                                                                    listStyle:
                                                                        'none',
                                                                }}
                                                            >
                                                                {filteredVehicles.length ===
                                                                0 ? (
                                                                    <li className="px-3 py-2 text-muted small">
                                                                        {vehiclesLoading
                                                                            ? 'Loading...'
                                                                            : 'No vehicles found.'}
                                                                    </li>
                                                                ) : (
                                                                    filteredVehicles.map(
                                                                        v => (
                                                                            <Combobox.Option
                                                                                key={
                                                                                    v.id
                                                                                }
                                                                                value={
                                                                                    v
                                                                                }
                                                                                className={({
                                                                                    active,
                                                                                }: {
                                                                                    active: boolean;
                                                                                }) =>
                                                                                    `px-3 py-2 small ${active ? 'bg-light' : ''}`
                                                                                }
                                                                                style={{
                                                                                    cursor: 'pointer',
                                                                                    listStyle:
                                                                                        'none',
                                                                                }}
                                                                            >
                                                                                {
                                                                                    v.year
                                                                                }{' '}
                                                                                {
                                                                                    v.make
                                                                                }{' '}
                                                                                {
                                                                                    v.model
                                                                                }{' '}
                                                                                <span className="text-muted">
                                                                                    (
                                                                                    {
                                                                                        v.license_plate
                                                                                    }

                                                                                    )
                                                                                </span>
                                                                            </Combobox.Option>
                                                                        )
                                                                    )
                                                                )}
                                                            </Combobox.Options>
                                                        </div>
                                                    </Combobox>
                                                )}
                                            />
                                            {errors.vehicle_id && (
                                                <Form.Control.Feedback
                                                    type="invalid"
                                                    className="d-block"
                                                >
                                                    {errors.vehicle_id.message}
                                                </Form.Control.Feedback>
                                            )}
                                        </Form.Group>
                                    </Col>

                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label>
                                                Pickup Location
                                            </Form.Label>
                                            <Form.Select
                                                {...register(
                                                    'pickup_location_id'
                                                )}
                                            >
                                                <option value="">
                                                    No specific location
                                                    (default)
                                                </option>
                                                {locations.map(l => (
                                                    <option
                                                        key={l.id}
                                                        value={l.id}
                                                    >
                                                        {l.name}
                                                        {l.charge
                                                            ? ` (+${branchCurrencySymbol} ${Number(l.charge).toFixed(2)})`
                                                            : ''}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>
                                                Pickup Date *
                                            </Form.Label>
                                            <Controller
                                                name="pickup_date"
                                                control={control}
                                                rules={{
                                                    required:
                                                        'Pickup date is required',
                                                }}
                                                render={({ field }) => (
                                                    <DatePickerField
                                                        value={field.value}
                                                        onChange={
                                                            field.onChange
                                                        }
                                                        minDate={addDays(
                                                            new Date(),
                                                            0
                                                        )}
                                                        excludeDateIntervals={
                                                            bookedIntervals
                                                        }
                                                        isInvalid={
                                                            !!errors.pickup_date
                                                        }
                                                        placeholder="Select date"
                                                    />
                                                )}
                                            />
                                            {errors.pickup_date && (
                                                <Form.Control.Feedback
                                                    type="invalid"
                                                    className="d-block"
                                                >
                                                    {errors.pickup_date.message}
                                                </Form.Control.Feedback>
                                            )}
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>
                                                Pickup Time *
                                            </Form.Label>
                                            <Controller
                                                name="pickup_hour"
                                                control={control}
                                                rules={{
                                                    required:
                                                        'Pickup time is required',
                                                }}
                                                render={({ field }) => (
                                                    <HourSelect
                                                        value={
                                                            field.value ?? ''
                                                        }
                                                        onChange={
                                                            field.onChange
                                                        }
                                                        minHour={minHour}
                                                        maxHour={maxHour}
                                                        placeholder="Select time..."
                                                        isInvalid={
                                                            !!errors.pickup_hour
                                                        }
                                                    />
                                                )}
                                            />
                                            {errors.pickup_hour && (
                                                <Form.Control.Feedback
                                                    type="invalid"
                                                    className="d-block"
                                                >
                                                    {errors.pickup_hour.message}
                                                </Form.Control.Feedback>
                                            )}
                                            {settings?.standard_return_time && (
                                                <Form.Text className="text-muted">
                                                    Standard return time:{' '}
                                                    {(() => {
                                                        const h = parseHour(
                                                            settings.standard_return_time
                                                        );
                                                        if (h === 0)
                                                            return '12:00 AM';
                                                        if (h < 12)
                                                            return `${h}:00 AM`;
                                                        if (h === 12)
                                                            return '12:00 PM';
                                                        return `${h - 12}:00 PM`;
                                                    })()}
                                                </Form.Text>
                                            )}
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Customer */}
                        <Card className="mb-4">
                            <Card.Header>
                                <Card.Title className="fs-6">
                                    Customer Details
                                </Card.Title>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Full Name *</Form.Label>
                                            <Form.Control
                                                placeholder="Customer full name"
                                                {...register(
                                                    'customer_full_name',
                                                    {
                                                        required:
                                                            'Customer name is required',
                                                    }
                                                )}
                                                isInvalid={
                                                    !!errors.customer_full_name
                                                }
                                            />
                                            {errors.customer_full_name && (
                                                <Form.Control.Feedback type="invalid">
                                                    {
                                                        errors
                                                            .customer_full_name
                                                            .message
                                                    }
                                                </Form.Control.Feedback>
                                            )}
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Phone *</Form.Label>
                                            <Form.Control
                                                placeholder="+233..."
                                                {...register('customer_phone', {
                                                    required:
                                                        'Phone is required',
                                                })}
                                                isInvalid={
                                                    !!errors.customer_phone
                                                }
                                            />
                                            {errors.customer_phone && (
                                                <Form.Control.Feedback type="invalid">
                                                    {
                                                        errors.customer_phone
                                                            .message
                                                    }
                                                </Form.Control.Feedback>
                                            )}
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Email</Form.Label>
                                            <Form.Control
                                                type="email"
                                                placeholder="Optional"
                                                {...register('customer_email')}
                                                isInvalid={
                                                    !!errors.customer_email
                                                }
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>
                                                Expected Destination
                                            </Form.Label>
                                            <Form.Control
                                                placeholder="Optional"
                                                {...register(
                                                    'customer_expected_destination'
                                                )}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Payment + Notes */}
                        <Card>
                            <Card.Header>
                                <Card.Title className="fs-6">
                                    Payment & Notes
                                </Card.Title>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>
                                                Payment Method
                                            </Form.Label>
                                            <Form.Select
                                                {...register('payment_method')}
                                            >
                                                <option value="">
                                                    Not paid yet
                                                </option>
                                                <option value="cash">
                                                    Cash
                                                </option>
                                                <option value="mobile_money">
                                                    Mobile Money
                                                </option>
                                                <option value="bank_transfer">
                                                    Bank Transfer
                                                </option>
                                                <option value="offline_transfer">
                                                    Offline Transfer
                                                </option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>
                                                Payment Reference
                                            </Form.Label>
                                            <Form.Control
                                                placeholder="Optional"
                                                {...register(
                                                    'payment_reference'
                                                )}
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col xs={12}>
                                        <Form.Group>
                                            <Form.Label>Staff Notes</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                placeholder="Internal notes..."
                                                {...register('staff_notes')}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Right column */}
                    <Col lg={4}>
                        <div className="sticky-top" style={{ top: '1rem' }}>
                            {selectedVehicle && basePrice > 0 ? (
                                <PricingPreview
                                    basePrice={basePrice}
                                    pickupCharge={pickupCharge}
                                    vatRate={vatRate}
                                    currencySymbol={branchCurrencySymbol}
                                />
                            ) : (
                                <Card>
                                    <Card.Body className="text-center text-muted py-5">
                                        <p className="mb-0">
                                            Select a vehicle to see the pricing
                                            preview.
                                        </p>
                                    </Card.Body>
                                </Card>
                            )}

                            <div className="d-grid mt-3 gap-2">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    disabled={
                                        isSubmitting || createBooking.isPending
                                    }
                                >
                                    {createBooking.isPending ? (
                                        <>
                                            <Spinner
                                                as="span"
                                                animation="border"
                                                size="sm"
                                                className="me-2"
                                            />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Booking'
                                    )}
                                </Button>
                                <Button
                                    variant="outline-secondary"
                                    onClick={() =>
                                        navigate(
                                            ROUTES.DASHBOARD.CHAUFFEUR_RENTAL
                                                .BOOKINGS.ROOT
                                        )
                                    }
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Form>
        </div>
    );
}
