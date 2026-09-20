import { useState, useEffect, useRef, useMemo } from 'react';
import { couponService } from '@/services/couponService';
import type { DiscountCoupon } from '@/shared/types/coupon.types';
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Form,
    Row,
    Spinner,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { parseISO, startOfDay } from 'date-fns';
import { useBranches } from '@/shared/hooks/queries/useBranches';
import {
    useAirportTerminals,
    useAirportAreas,
} from '@/shared/hooks/queries/useAirportLocations';
import { usePackageAssignmentsByAirport } from '@/shared/hooks/queries/useAirportPackageAssignments';
import { useAirportCustomerLookup } from '@/shared/hooks/queries/useAirportCustomers';
import {
    useCreateAirportBooking,
    useAirportBookingBlockedDates,
} from '@/shared/hooks/queries/useAirportBookings';
import { useTitle } from '@/shared/hooks';
import { ROUTES } from '@/shared/routes';
import DatePickerField from '@/admin/components/DatePickerField';
import TimePickerField from '@/admin/components/TimePickerField';
import type {
    CreateAirportBookingData,
    AirportBookingDirection,
    AirportPaymentMethod,
} from '@/shared/types/airport-booking.types';
import type { Branch } from '@/shared/types/branch.types';
import { FaPlane, FaCheck } from 'react-icons/fa6';
import { useGeneralSettings } from '@/shared/hooks/queries/useSettings';
import { formatWithSymbol } from '@/shared/libs/currency';

type FormValues = {
    branch_id: string;
    direction: AirportBookingDirection;
    terminal_location_id: string;
    area_location_id: string;
    scheduled_date: string;
    scheduled_time: string;
    package_assignment_id: string;
    passenger_count: number;
    specific_address: string;
    flight_number: string;
    airline: string;
    customer_full_name: string;
    customer_email: string;
    customer_phone: string;
    payment_method: AirportPaymentMethod | '';
    payment_reference: string;
    staff_notes: string;
};

export default function CreateAirportBooking() {
    useTitle('New Airport Booking');
    const navigate = useNavigate();
    const createBooking = useCreateAirportBooking();
    const { data: generalSettings } = useGeneralSettings();
    const globalSymbol = generalSettings?.data?.currency_symbol ?? '₵';
    const [showInfoPanel, setShowInfoPanel] = useState(true);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        control,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        defaultValues: {
            direction: 'pickup',
            passenger_count: 1,
            payment_method: '',
        },
    });

    const selectedBranchId = watch('branch_id');
    const selectedDirection = watch('direction');
    const selectedAssignmentId = watch('package_assignment_id');
    const selectedAreaId = watch('area_location_id');
    const customerEmail = watch('customer_email');
    const paymentMethod = watch('payment_method');

    const { data: blockedDatesData } =
        useAirportBookingBlockedDates(selectedBranchId);
    const blockedDates: Date[] = (
        blockedDatesData?.data?.blocked_dates ?? []
    ).map((d: string) => startOfDay(parseISO(d)));

    // State for pricing preview
    const [pricingPreview, setPricingPreview] = useState<{
        packageRate: number;
        areaCharge: number;
        couponDiscount: number;
        vatRate: number;
        vatAmount: number;
        total: number;
    } | null>(null);

    const [appliedCoupon, setAppliedCoupon] = useState<DiscountCoupon | null>(
        null
    );
    const [couponInput, setCouponInput] = useState('');
    const [couponError, setCouponError] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);

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
        setCouponInput(appliedCoupon?.code ?? '');
        setAppliedCoupon(null);
        setCouponError('');
    };

    // Track previous assignment/area to detect changes and reset coupon
    const prevAssignmentRef = useRef(selectedAssignmentId);
    const prevAreaRef = useRef(selectedAreaId);
    useEffect(() => {
        if (
            prevAssignmentRef.current !== selectedAssignmentId ||
            prevAreaRef.current !== selectedAreaId
        ) {
            setAppliedCoupon(null);
            setCouponError('');
            prevAssignmentRef.current = selectedAssignmentId;
            prevAreaRef.current = selectedAreaId;
        }
    }, [selectedAssignmentId, selectedAreaId]);

    // Fetch branches with airport service
    const { data: branchesData } = useBranches({
        'filter[has_airport_service]': '1',
    } as never);
    const branches: Branch[] = (branchesData?.data ?? []).filter(
        (b: Branch) => b.has_airport_service
    );

    // Find selected branch to get airport_id
    const selectedBranch = branches.find(b => b.id === selectedBranchId);
    const branchCurrencySymbol =
        selectedBranch?.currency_symbol ?? globalSymbol;
    const airportId: string =
        (selectedBranch as { airport_id?: string })?.airport_id ?? '';

    // Terminals + Areas based on branch
    const { data: terminalsData } = useAirportTerminals(airportId);
    const { data: areasData } = useAirportAreas(selectedBranchId);
    const terminals = terminalsData?.data ?? [];
    const areas = useMemo(() => areasData?.data ?? [], [areasData?.data]);

    // Package assignments for the airport
    const { data: assignmentsData } = usePackageAssignmentsByAirport(airportId);
    const assignments = useMemo(
        () =>
            (assignmentsData?.data ?? []).filter(
                (a: { is_active?: boolean }) => a.is_active !== false
            ),
        [assignmentsData?.data]
    );

    // Customer lookup
    const { data: customerLookup } = useAirportCustomerLookup(
        customerEmail ?? ''
    );

    // Auto-fill customer fields when lookup finds a match
    useEffect(() => {
        const found = customerLookup?.data;
        if (found) {
            setValue('customer_full_name', found.full_name);
            setValue('customer_phone', found.phone);
        }
    }, [customerLookup, setValue]);

    // Compute pricing preview when assignment, area, or coupon changes
    useEffect(() => {
        if (!selectedAssignmentId || !selectedAreaId) {
            setPricingPreview(null);
            return;
        }
        const assignment = assignments.find(
            (a: { id?: string }) => a.id === selectedAssignmentId
        );
        const area = areas.find(
            (l: { id?: string }) => l.id === selectedAreaId
        );
        if (!assignment || !area) {
            setPricingPreview(null);
            return;
        }
        const packageRate = Number(assignment.base_price ?? 0);
        const areaCharge = area.has_charge
            ? Number(area.charge_amount ?? 0)
            : 0;
        const subtotal = packageRate + areaCharge;
        const vatRate = Number(assignment.vat_rate ?? 15);
        const couponDiscount = appliedCoupon
            ? appliedCoupon.type === 'percentage'
                ? Math.round((appliedCoupon.value / 100) * subtotal * 100) / 100
                : Math.min(appliedCoupon.value, subtotal)
            : 0;
        const discountedSubtotal = subtotal - couponDiscount;
        const vatAmount =
            Math.round(((discountedSubtotal * vatRate) / 100) * 100) / 100;
        const total = Math.round((discountedSubtotal + vatAmount) * 100) / 100;
        setPricingPreview({
            packageRate,
            areaCharge,
            couponDiscount,
            vatRate,
            vatAmount,
            total,
        });
    }, [
        selectedAssignmentId,
        selectedAreaId,
        assignments,
        areas,
        appliedCoupon,
    ]);

    const onSubmit = (values: FormValues) => {
        const payload: CreateAirportBookingData = {
            branch_id: values.branch_id,
            direction: values.direction,
            package_assignment_id: values.package_assignment_id,
            terminal_location_id: values.terminal_location_id,
            area_location_id: values.area_location_id,
            scheduled_at: `${values.scheduled_date}T${values.scheduled_time}:00`,
            passenger_count: Number(values.passenger_count),
            customer_full_name: values.customer_full_name,
            customer_email: values.customer_email,
            customer_phone: values.customer_phone,
            specific_address: values.specific_address || undefined,
            flight_number: values.flight_number || undefined,
            airline: values.airline || undefined,
            payment_method:
                (values.payment_method as AirportPaymentMethod) || undefined,
            payment_reference: values.payment_reference || undefined,
            staff_notes: values.staff_notes || undefined,
            coupon_code: appliedCoupon?.code,
        };

        createBooking.mutate(payload, {
            onSuccess: () => {
                navigate(ROUTES.DASHBOARD.AIRPORT_TRANSFER.BOOKINGS.ROOT);
            },
        });
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0 fw-bold">New Airport Booking</h4>
                <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => navigate(-1)}
                >
                    Back
                </Button>
            </div>

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
                                Before Creating an Airport Booking
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
                                        Ensure{' '}
                                        <strong>Airport Locations</strong>{' '}
                                        (airports) are configured under{' '}
                                        <em>Airport Transfer - Locations</em>.
                                    </li>
                                    <li>
                                        Ensure <strong>Fleet Vehicles</strong>{' '}
                                        are assigned to the selected branch.
                                    </li>
                                    <li>
                                        Set up <strong>Airport Packages</strong>{' '}
                                        (fare pricing) before creating bookings.
                                    </li>
                                    <li>
                                        Select the correct{' '}
                                        <strong>Direction</strong> (Pickup or
                                        Dropoff) based on the customer&apos;s
                                        travel.
                                    </li>
                                </ol>
                                <span
                                    style={{ fontSize: 12, color: '#374151' }}
                                >
                                    Once booked, assign a driver and vehicle,
                                    then start the trip when ready.
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <Form onSubmit={handleSubmit(onSubmit)}>
                <Row className="g-4">
                    {/* Section 1: Branch + Direction */}
                    <Col md={12}>
                        <Card>
                            <Card.Header className="fw-semibold">
                                Booking Details
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={6} className="mb-3">
                                        <Form.Group>
                                            <Form.Label>Branch</Form.Label>
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
                                            <Form.Control.Feedback type="invalid">
                                                {errors.branch_id?.message}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6} className="mb-3">
                                        <Form.Group>
                                            <Form.Label>Direction</Form.Label>
                                            <div className="d-flex gap-3 mt-1">
                                                {(
                                                    [
                                                        'pickup',
                                                        'dropoff',
                                                    ] as AirportBookingDirection[]
                                                ).map(dir => (
                                                    <Card
                                                        key={dir}
                                                        className={`flex-fill text-center p-3 cursor-pointer border-2 ${
                                                            selectedDirection ===
                                                            dir
                                                                ? 'border-primary bg-primary text-white'
                                                                : 'border-secondary'
                                                        }`}
                                                        style={{
                                                            cursor: 'pointer',
                                                        }}
                                                        onClick={() =>
                                                            setValue(
                                                                'direction',
                                                                dir
                                                            )
                                                        }
                                                    >
                                                        <div className="fw-semibold">
                                                            <FaPlane className="me-1" />
                                                            {dir === 'pickup'
                                                                ? 'Airport Pickup'
                                                                : 'Airport Dropoff'}
                                                        </div>
                                                        <small
                                                            className={
                                                                selectedDirection ===
                                                                dir
                                                                    ? 'text-white text-opacity-75'
                                                                    : 'text-muted'
                                                            }
                                                        >
                                                            {dir === 'pickup'
                                                                ? 'Pick up from airport'
                                                                : 'Drop off at airport'}
                                                        </small>
                                                    </Card>
                                                ))}
                                            </div>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Section 2: Locations */}
                    <Col md={12}>
                        <Card>
                            <Card.Header className="fw-semibold">
                                Locations
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={4} className="mb-3">
                                        <Form.Group>
                                            <Form.Label>Terminal</Form.Label>
                                            <Form.Select
                                                {...register(
                                                    'terminal_location_id',
                                                    {
                                                        required:
                                                            'Terminal is required',
                                                    }
                                                )}
                                                isInvalid={
                                                    !!errors.terminal_location_id
                                                }
                                                disabled={!airportId}
                                            >
                                                <option value="">
                                                    Select terminal...
                                                </option>
                                                {terminals.map(
                                                    (t: {
                                                        id: string;
                                                        name: string;
                                                    }) => (
                                                        <option
                                                            key={t.id}
                                                            value={t.id}
                                                        >
                                                            {t.name}
                                                        </option>
                                                    )
                                                )}
                                            </Form.Select>
                                            <Form.Control.Feedback type="invalid">
                                                {
                                                    errors.terminal_location_id
                                                        ?.message
                                                }
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4} className="mb-3">
                                        <Form.Group>
                                            <Form.Label>Area</Form.Label>
                                            <Form.Select
                                                {...register(
                                                    'area_location_id',
                                                    {
                                                        required:
                                                            'Area is required',
                                                    }
                                                )}
                                                isInvalid={
                                                    !!errors.area_location_id
                                                }
                                                disabled={!selectedBranchId}
                                            >
                                                <option value="">
                                                    Select area...
                                                </option>
                                                {areas.map(a => (
                                                    <option
                                                        key={a.id}
                                                        value={a.id}
                                                    >
                                                        {a.name}
                                                        {a.has_charge
                                                            ? ` (+${branchCurrencySymbol} ${a.charge_amount ?? 0})`
                                                            : ''}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                            <Form.Control.Feedback type="invalid">
                                                {
                                                    errors.area_location_id
                                                        ?.message
                                                }
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4} className="mb-3">
                                        <Form.Group>
                                            <Form.Label>
                                                {selectedDirection === 'pickup'
                                                    ? 'Dropoff Address'
                                                    : 'Pickup Address'}
                                            </Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={2}
                                                placeholder="Specific address within the area..."
                                                {...register(
                                                    'specific_address'
                                                )}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4} className="mb-3">
                                        <Form.Group>
                                            <Form.Label>Date</Form.Label>
                                            <Controller
                                                name="scheduled_date"
                                                control={control}
                                                rules={{
                                                    required:
                                                        'Date is required',
                                                }}
                                                render={({ field }) => (
                                                    <DatePickerField
                                                        value={
                                                            field.value ?? ''
                                                        }
                                                        onChange={
                                                            field.onChange
                                                        }
                                                        isInvalid={
                                                            !!errors.scheduled_date
                                                        }
                                                        placeholder="Select date"
                                                        minDate={new Date()}
                                                        excludeDates={
                                                            blockedDates
                                                        }
                                                    />
                                                )}
                                            />
                                            {errors.scheduled_date && (
                                                <div className="invalid-feedback d-block">
                                                    {
                                                        errors.scheduled_date
                                                            .message
                                                    }
                                                </div>
                                            )}
                                        </Form.Group>
                                    </Col>
                                    <Col md={4} className="mb-3">
                                        <Form.Group>
                                            <Form.Label>Time</Form.Label>
                                            <Controller
                                                name="scheduled_time"
                                                control={control}
                                                rules={{
                                                    required:
                                                        'Time is required',
                                                }}
                                                render={({ field }) => (
                                                    <TimePickerField
                                                        value={
                                                            field.value ?? ''
                                                        }
                                                        onChange={
                                                            field.onChange
                                                        }
                                                        isInvalid={
                                                            !!errors.scheduled_time
                                                        }
                                                        placeholder="Select time"
                                                    />
                                                )}
                                            />
                                            {errors.scheduled_time && (
                                                <div className="invalid-feedback d-block">
                                                    {
                                                        errors.scheduled_time
                                                            .message
                                                    }
                                                </div>
                                            )}
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Section 3: Package */}
                    <Col md={12}>
                        <Card>
                            <Card.Header className="fw-semibold">
                                Package
                            </Card.Header>
                            <Card.Body>
                                {!airportId && (
                                    <Alert variant="info" className="small">
                                        Select a branch first to see available
                                        packages.
                                    </Alert>
                                )}
                                {errors.package_assignment_id && (
                                    <Alert variant="danger" className="small">
                                        {errors.package_assignment_id.message}
                                    </Alert>
                                )}
                                <input
                                    type="hidden"
                                    {...register('package_assignment_id', {
                                        required: 'Package is required',
                                    })}
                                />
                                <Row className="g-3">
                                    {assignments
                                        .filter(a =>
                                            selectedDirection === 'pickup'
                                                ? a.package
                                                      ?.is_available_for_pickup
                                                : a.package
                                                      ?.is_available_for_dropoff
                                        )
                                        .map(assignment => (
                                            <Col md={4} key={assignment.id}>
                                                <Card
                                                    className={`h-100 border-2 ${
                                                        selectedAssignmentId ===
                                                        assignment.id
                                                            ? 'border-primary bg-primary text-white'
                                                            : 'border-secondary'
                                                    }`}
                                                    style={{
                                                        cursor: 'pointer',
                                                    }}
                                                    onClick={() =>
                                                        setValue(
                                                            'package_assignment_id',
                                                            assignment.id
                                                        )
                                                    }
                                                >
                                                    <Card.Body>
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <strong>
                                                                {
                                                                    assignment
                                                                        .package
                                                                        ?.name
                                                                }
                                                            </strong>
                                                            <Badge
                                                                bg={
                                                                    selectedAssignmentId ===
                                                                    assignment.id
                                                                        ? 'light'
                                                                        : 'primary'
                                                                }
                                                                text={
                                                                    selectedAssignmentId ===
                                                                    assignment.id
                                                                        ? 'dark'
                                                                        : undefined
                                                                }
                                                            >
                                                                {formatWithSymbol(
                                                                    Number(
                                                                        assignment.base_price
                                                                    ),
                                                                    assignment.currency_symbol ??
                                                                        branchCurrencySymbol
                                                                )}
                                                            </Badge>
                                                        </div>
                                                        {assignment.package
                                                            ?.description && (
                                                            <p
                                                                className={`small mb-2 ${selectedAssignmentId === assignment.id ? 'text-white text-opacity-75' : 'text-muted'}`}
                                                            >
                                                                {
                                                                    assignment
                                                                        .package
                                                                        .description
                                                                }
                                                            </p>
                                                        )}
                                                        <ul
                                                            className={`small ps-3 mb-0 ${selectedAssignmentId === assignment.id ? 'text-white' : ''}`}
                                                        >
                                                            {(
                                                                assignment
                                                                    .package
                                                                    ?.features ??
                                                                []
                                                            ).map(
                                                                (
                                                                    f: string,
                                                                    i: number
                                                                ) => (
                                                                    <li key={i}>
                                                                        {f}
                                                                    </li>
                                                                )
                                                            )}
                                                        </ul>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        ))}
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Section 4: Customer Details */}
                    <Col md={12}>
                        <Card>
                            <Card.Header className="fw-semibold">
                                Customer Details
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={4} className="mb-3">
                                        <Form.Group>
                                            <Form.Label>
                                                Customer Email
                                            </Form.Label>
                                            <Form.Control
                                                type="email"
                                                placeholder="customer@email.com"
                                                {...register('customer_email', {
                                                    required:
                                                        'Email is required',
                                                    pattern: {
                                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                        message:
                                                            'Invalid email address',
                                                    },
                                                })}
                                                isInvalid={
                                                    !!errors.customer_email
                                                }
                                            />
                                            {customerLookup?.data && (
                                                <Form.Text className="text-success">
                                                    <FaCheck className="me-1" />{' '}
                                                    Existing customer found -
                                                    details auto-filled
                                                </Form.Text>
                                            )}
                                            <Form.Control.Feedback type="invalid">
                                                {errors.customer_email?.message}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4} className="mb-3">
                                        <Form.Group>
                                            <Form.Label>Full Name</Form.Label>
                                            <Form.Control
                                                placeholder="Full name"
                                                {...register(
                                                    'customer_full_name',
                                                    {
                                                        required:
                                                            'Full name is required',
                                                    }
                                                )}
                                                isInvalid={
                                                    !!errors.customer_full_name
                                                }
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {
                                                    errors.customer_full_name
                                                        ?.message
                                                }
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4} className="mb-3">
                                        <Form.Group>
                                            <Form.Label>Phone</Form.Label>
                                            <Form.Control
                                                placeholder="Phone number"
                                                {...register('customer_phone', {
                                                    required:
                                                        'Phone is required',
                                                })}
                                                isInvalid={
                                                    !!errors.customer_phone
                                                }
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errors.customer_phone?.message}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4} className="mb-3">
                                        <Form.Group>
                                            <Form.Label>
                                                Passenger Count (max 4)
                                            </Form.Label>
                                            <Form.Control
                                                type="number"
                                                min={1}
                                                max={4}
                                                {...register(
                                                    'passenger_count',
                                                    {
                                                        required: 'Required',
                                                        min: {
                                                            value: 1,
                                                            message:
                                                                'At least 1 passenger',
                                                        },
                                                        max: {
                                                            value: 4,
                                                            message:
                                                                'Maximum 4 passengers',
                                                        },
                                                    }
                                                )}
                                                isInvalid={
                                                    !!errors.passenger_count
                                                }
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {
                                                    errors.passenger_count
                                                        ?.message
                                                }
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Section 5: Flight Details (optional) */}
                    <Col md={12}>
                        <Card>
                            <Card.Header className="fw-semibold">
                                Flight Details{' '}
                                <span className="text-muted fw-normal">
                                    (optional)
                                </span>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={4} className="mb-3">
                                        <Form.Group>
                                            <Form.Label>
                                                Flight Number
                                            </Form.Label>
                                            <Form.Control
                                                placeholder="e.g. EK 789"
                                                {...register('flight_number')}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4} className="mb-3">
                                        <Form.Group>
                                            <Form.Label>Airline</Form.Label>
                                            <Form.Control
                                                placeholder="e.g. Emirates"
                                                {...register('airline')}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Section 6: Payment (optional) */}
                    <Col md={12}>
                        <Card>
                            <Card.Header className="fw-semibold">
                                Payment{' '}
                                <span className="text-muted fw-normal">
                                    (optional - leave blank for pending)
                                </span>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={4} className="mb-3">
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
                                    {paymentMethod && (
                                        <Col md={4} className="mb-3">
                                            <Form.Group>
                                                <Form.Label>
                                                    Payment Reference
                                                </Form.Label>
                                                <Form.Control
                                                    placeholder="Reference number (if applicable)"
                                                    {...register(
                                                        'payment_reference'
                                                    )}
                                                />
                                            </Form.Group>
                                        </Col>
                                    )}
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Section 7: Staff Notes */}
                    <Col md={12}>
                        <Card>
                            <Card.Header className="fw-semibold">
                                Staff Notes{' '}
                                <span className="text-muted fw-normal">
                                    (optional)
                                </span>
                            </Card.Header>
                            <Card.Body>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    placeholder="Internal notes - not shown to customer"
                                    {...register('staff_notes')}
                                />
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Pricing Preview */}
                    {pricingPreview && (
                        <Col md={12}>
                            <Card className="bg-light">
                                <Card.Header className="fw-semibold">
                                    Pricing Summary
                                </Card.Header>
                                <Card.Body>
                                    <div className="d-flex flex-column gap-1">
                                        <div className="d-flex justify-content-between">
                                            <span>Package rate</span>
                                            <span>
                                                {formatWithSymbol(
                                                    pricingPreview.packageRate,
                                                    branchCurrencySymbol
                                                )}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span>Area surcharge</span>
                                            <span>
                                                {formatWithSymbol(
                                                    pricingPreview.areaCharge,
                                                    branchCurrencySymbol
                                                )}
                                            </span>
                                        </div>
                                        {pricingPreview.couponDiscount > 0 && (
                                            <div className="d-flex justify-content-between text-success fw-semibold">
                                                <span>
                                                    Coupon (
                                                    {appliedCoupon!.code})
                                                </span>
                                                <span>
                                                    -{' '}
                                                    {formatWithSymbol(
                                                        pricingPreview.couponDiscount,
                                                        branchCurrencySymbol
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                        <div className="d-flex justify-content-between text-muted small">
                                            <span>
                                                VAT ({pricingPreview.vatRate}%)
                                            </span>
                                            <span>
                                                {formatWithSymbol(
                                                    pricingPreview.vatAmount,
                                                    branchCurrencySymbol
                                                )}
                                            </span>
                                        </div>

                                        {/* Coupon input */}
                                        <div className="mt-2">
                                            {appliedCoupon ? (
                                                <div
                                                    className="d-flex align-items-center justify-content-between rounded px-3 py-2"
                                                    style={{
                                                        background: '#f0fdf4',
                                                        border: '1px solid #86efac',
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    <span className="text-success fw-semibold">
                                                        ✓ {appliedCoupon.code}{' '}
                                                        applied
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="btn btn-link btn-sm p-0 text-success"
                                                        onClick={
                                                            handleRemoveCoupon
                                                        }
                                                        title="Remove coupon"
                                                        style={{
                                                            fontSize: 18,
                                                            lineHeight: 1,
                                                        }}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="d-flex gap-2">
                                                        <Form.Control
                                                            size="sm"
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
                                                                ) {
                                                                    e.preventDefault();
                                                                    void handleApplyCoupon();
                                                                }
                                                            }}
                                                            style={{
                                                                fontSize: 13,
                                                            }}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline-secondary"
                                                            size="sm"
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
                                                        </Button>
                                                    </div>
                                                    {couponError && (
                                                        <div
                                                            className="text-danger mt-1"
                                                            style={{
                                                                fontSize: 12,
                                                            }}
                                                        >
                                                            {couponError}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        <hr className="my-1" />
                                        <div className="d-flex justify-content-between fw-bold fs-5">
                                            <span>Total</span>
                                            <span>
                                                {formatWithSymbol(
                                                    pricingPreview.total,
                                                    branchCurrencySymbol
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    )}

                    {/* Actions */}
                    <Col md={12}>
                        <div className="d-flex justify-content-end gap-2">
                            <Button
                                variant="light"
                                onClick={() => navigate(-1)}
                                disabled={
                                    isSubmitting || createBooking.isPending
                                }
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={
                                    isSubmitting || createBooking.isPending
                                }
                            >
                                {createBooking.isPending ? (
                                    <>
                                        <Spinner size="sm" className="me-1" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Booking'
                                )}
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Form>
        </>
    );
}
