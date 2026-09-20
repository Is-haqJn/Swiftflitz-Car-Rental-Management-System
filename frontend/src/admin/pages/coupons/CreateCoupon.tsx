import { Fragment, useEffect, useState } from 'react';
import { Row, Col, Form, Card, Badge, Button, Spinner } from 'react-bootstrap';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/shared/routes';
import type {
    DiscountCoupon,
    CouponScope,
    CouponScopeType,
} from '@/shared/types/coupon.types';
import {
    useCreateCoupon,
    useUpdateCoupon,
    useCoupon,
} from '@/shared/hooks/queries/useCoupons';
import { useCategories } from '@/shared/hooks/queries/useCategories';
import { useFleetVehicles } from '@/shared/hooks/queries/useFleetVehicles';
import { useVehicles } from '@/shared/hooks/queries/useVehicles';
import { useAirportPackages } from '@/shared/hooks/queries/useAirportPackages';
import { useTitle } from '@/shared/hooks';
import { applyServerErrors } from '@/shared/libs/utils';
import { useCurrency } from '@/shared/hooks/queries/useSettings';

/* Types */
interface CouponFormData {
    coupon_type: string;
    name: string;
    description: string;
    code: string;
    type: string;
    value: string;
    valid_days: string;
    max_uses: string;
    max_uses_per_customer: string;
    min_rental_days: string;
    min_rental_amount: string;
    is_active: boolean;
}

const SCOPE_TYPE_LABELS: Record<CouponScopeType, string> = {
    rental: 'All Regular Rentals',
    chauffeur: 'All Chauffeur Transfers',
    airport: 'All Airport Transfers',
    airport_package: 'Specific Airport Package',
    vehicle: 'Specific Rental Vehicle',
    fleet_vehicle: 'Specific Fleet Vehicle',
    category: 'Specific Vehicle Category',
};

const SCOPE_TYPES_NEEDING_ID: CouponScopeType[] = [
    'vehicle',
    'fleet_vehicle',
    'category',
    'airport_package',
];

/* Helpers */
function couponToFormDefaults(c: DiscountCoupon): CouponFormData {
    return {
        coupon_type: c.coupon_type,
        name: c.name,
        description: c.description ?? '',
        code: '', // read-only on edit - not sent
        type: c.type,
        value: String(c.value),
        valid_days: c.valid_days != null ? String(c.valid_days) : '',
        max_uses: c.max_uses != null ? String(c.max_uses) : '',
        max_uses_per_customer:
            c.max_uses_per_customer != null
                ? String(c.max_uses_per_customer)
                : '',
        min_rental_days:
            c.min_rental_days != null ? String(c.min_rental_days) : '',
        min_rental_amount:
            c.min_rental_amount != null ? String(c.min_rental_amount) : '',
        is_active: c.is_active,
    };
}

const defaultValues: CouponFormData = {
    coupon_type: 'standard',
    name: '',
    description: '',
    code: '',
    type: 'percentage',
    value: '',
    valid_days: '',
    max_uses: '',
    max_uses_per_customer: '',
    min_rental_days: '',
    min_rental_amount: '',
    is_active: true,
};

/* Scope row sub-component */
function ScopeRow({
    scope,
    index,
    categories,
    rentalVehicles,
    fleetVehicles,
    airportPackages,
    onChange,
    onRemove,
}: {
    scope: CouponScope;
    index: number;
    categories: { id: string | number; name: string }[];
    rentalVehicles: {
        id: string;
        make: string;
        model: string;
        license_plate: string;
    }[];
    fleetVehicles: {
        id: string;
        make: string;
        model: string;
        license_plate: string;
    }[];
    airportPackages: { id: string; name: string }[];
    onChange: (index: number, updated: CouponScope) => void;
    onRemove: (index: number) => void;
}) {
    const needsId = SCOPE_TYPES_NEEDING_ID.includes(scope.scope_type);

    function handleTypeChange(newType: CouponScopeType) {
        onChange(index, { ...scope, scope_type: newType, scope_id: null });
    }

    function handleIdChange(newId: string) {
        onChange(index, { ...scope, scope_id: newId || null });
    }

    return (
        <Row className="align-items-center mb-2">
            <Col md={needsId ? 5 : 10}>
                <Form.Select
                    value={scope.scope_type}
                    onChange={e =>
                        handleTypeChange(e.target.value as CouponScopeType)
                    }
                    size="sm"
                >
                    {(Object.keys(SCOPE_TYPE_LABELS) as CouponScopeType[]).map(
                        type => (
                            <option key={type} value={type}>
                                {SCOPE_TYPE_LABELS[type]}
                            </option>
                        )
                    )}
                </Form.Select>
            </Col>

            {needsId && (
                <Col md={5}>
                    {scope.scope_type === 'category' && (
                        <Form.Select
                            value={scope.scope_id ?? ''}
                            onChange={e => handleIdChange(e.target.value)}
                            size="sm"
                        >
                            <option value="">- Select category -</option>
                            {categories.map(c => (
                                <option key={c.id} value={String(c.id)}>
                                    {c.name}
                                </option>
                            ))}
                        </Form.Select>
                    )}
                    {scope.scope_type === 'vehicle' && (
                        <Form.Select
                            value={scope.scope_id ?? ''}
                            onChange={e => handleIdChange(e.target.value)}
                            size="sm"
                        >
                            <option value="">- Select rental vehicle -</option>
                            {rentalVehicles.map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.make} {v.model} ({v.license_plate})
                                </option>
                            ))}
                        </Form.Select>
                    )}
                    {scope.scope_type === 'fleet_vehicle' && (
                        <Form.Select
                            value={scope.scope_id ?? ''}
                            onChange={e => handleIdChange(e.target.value)}
                            size="sm"
                        >
                            <option value="">- Select fleet vehicle -</option>
                            {fleetVehicles.map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.make} {v.model} ({v.license_plate})
                                </option>
                            ))}
                        </Form.Select>
                    )}
                    {scope.scope_type === 'airport_package' && (
                        <Form.Select
                            value={scope.scope_id ?? ''}
                            onChange={e => handleIdChange(e.target.value)}
                            size="sm"
                        >
                            <option value="">- Select package -</option>
                            {airportPackages.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </Form.Select>
                    )}
                </Col>
            )}

            <Col md={2}>
                <Button
                    type="button"
                    variant="outline-danger"
                    size="sm"
                    onClick={() => onRemove(index)}
                >
                    Remove
                </Button>
            </Col>
        </Row>
    );
}

/* Main Component */
export default function CreateCoupon() {
    const currency = useCurrency();
    const navigate = useNavigate();
    const { id: routeId } = useParams<{ id: string }>();

    const { data: fetchedRes, isLoading: loadingCoupon } = useCoupon(
        routeId ?? ''
    );
    const coupon = fetchedRes?.data ?? null;
    const isEditing = Boolean(routeId);
    const title = useTitle(isEditing ? 'Edit Coupon' : 'Add Coupon');

    const createMutation = useCreateCoupon();
    const updateMutation = useUpdateCoupon();
    const isSaving = createMutation.isPending || updateMutation.isPending;

    /* Scope state */
    const [scopes, setScopes] = useState<CouponScope[]>([]);

    /* Dropdown data */
    const { data: categoriesRes } = useCategories();
    const { data: rentalVehiclesRes } = useVehicles();
    const { data: fleetVehiclesRes } = useFleetVehicles();
    const { data: packagesRes } = useAirportPackages();

    const categories = categoriesRes?.data ?? [];
    const rentalVehicles = rentalVehiclesRes?.data ?? [];
    const fleetVehicles = fleetVehiclesRes?.data ?? [];
    const airportPackages = packagesRes?.data ?? [];

    const {
        register,
        handleSubmit,
        reset,
        control,
        setError,
        formState: { errors },
    } = useForm<CouponFormData>({ defaultValues });

    const discountType = useWatch({ control, name: 'type' });

    useEffect(() => {
        if (coupon) {
            reset(couponToFormDefaults(coupon));
            setScopes(
                (coupon.scopes ?? []).map(s => ({
                    scope_type: s.scope_type,
                    scope_id: s.scope_id,
                }))
            );
        } else if (!routeId) {
            reset(defaultValues);
            setScopes([]);
        }
    }, [coupon?.id]);

    /* Scope handlers */
    function addScope() {
        setScopes(prev => [
            ...prev,
            { scope_type: 'rental' as CouponScopeType, scope_id: null },
        ]);
    }

    function updateScope(index: number, updated: CouponScope) {
        setScopes(prev => prev.map((s, i) => (i === index ? updated : s)));
    }

    function removeScope(index: number) {
        setScopes(prev => prev.filter((_, i) => i !== index));
    }

    /* Submit */
    const onSubmit = (data: CouponFormData) => {
        const parseOptInt = (v: string) => (v.trim() ? parseInt(v, 10) : null);
        const parseOptFloat = (v: string) => (v.trim() ? parseFloat(v) : null);

        if (isEditing && coupon) {
            const payload = {
                coupon_type: data.coupon_type as DiscountCoupon['coupon_type'],
                name: data.name,
                description: data.description || null,
                type: data.type as DiscountCoupon['type'],
                value: parseFloat(data.value),
                valid_days: parseOptInt(data.valid_days),
                max_uses: parseOptInt(data.max_uses),
                max_uses_per_customer: parseOptInt(data.max_uses_per_customer),
                min_rental_days: parseOptInt(data.min_rental_days),
                min_rental_amount: parseOptFloat(data.min_rental_amount),
                is_active: data.is_active,
                scopes,
            };

            updateMutation.mutate(
                { id: coupon.id, payload },
                {
                    onSuccess: () => navigate(ROUTES.DASHBOARD.COUPONS.ROOT),
                    onError: (err: unknown) => applyServerErrors(err, setError),
                }
            );
        } else {
            const payload = {
                code: data.code.trim() || undefined,
                coupon_type: data.coupon_type as DiscountCoupon['coupon_type'],
                name: data.name,
                description: data.description || null,
                type: data.type as DiscountCoupon['type'],
                value: parseFloat(data.value),
                valid_days: parseOptInt(data.valid_days),
                max_uses: parseOptInt(data.max_uses),
                max_uses_per_customer: parseOptInt(data.max_uses_per_customer),
                min_rental_days: parseOptInt(data.min_rental_days),
                min_rental_amount: parseOptFloat(data.min_rental_amount),
                is_active: data.is_active,
                scopes,
            };

            createMutation.mutate(payload, {
                onSuccess: () => navigate(ROUTES.DASHBOARD.COUPONS.ROOT),
                onError: (err: unknown) => applyServerErrors(err, setError),
            });
        }
    };

    if (routeId && loadingCoupon) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" />
            </div>
        );
    }

    /* Render */
    return (
        <Fragment>
            {title}

            <Form onSubmit={handleSubmit(onSubmit)}>
                {/* Card 1: Identity */}
                <Card className="mb-4">
                    <Card.Header>
                        <Card.Title>
                            {isEditing ? 'Edit Coupon' : 'New Coupon'}
                        </Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            {/* Coupon Type */}
                            <Col md={4} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        Coupon Type{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Select
                                        {...register('coupon_type')}
                                        isInvalid={!!errors.coupon_type}
                                    >
                                        <option value="standard">
                                            Standard
                                        </option>
                                        <option value="first_time">
                                            First-Time Customer
                                        </option>
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.coupon_type?.message}
                                    </Form.Control.Feedback>
                                    <Form.Text muted>
                                        First-Time: only valid for customers
                                        with no prior completed rentals.
                                    </Form.Text>
                                </Form.Group>
                            </Col>

                            {/* Name */}
                            <Col md={4} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        Name{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        placeholder="e.g. Welcome Discount"
                                        {...register('name', {
                                            required: 'Name is required.',
                                        })}
                                        isInvalid={!!errors.name}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.name?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            {/* Coupon Code */}
                            {!isEditing ? (
                                <Col md={4} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Coupon Code</Form.Label>
                                        <Form.Control
                                            placeholder="Leave blank to auto-generate"
                                            {...register('code')}
                                            isInvalid={!!errors.code}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.code?.message}
                                        </Form.Control.Feedback>
                                        <Form.Text muted>
                                            Will be prefixed with your org
                                            prefix (e.g. SF). Leave blank for
                                            auto-generated code.
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                            ) : (
                                coupon && (
                                    <Col md={4} className="mb-3">
                                        <Form.Label>Coupon Code</Form.Label>
                                        <div className="pt-1">
                                            <Badge
                                                bg="secondary"
                                                className="font-monospace fs-6 px-3 py-2"
                                                style={{
                                                    letterSpacing: '0.08em',
                                                }}
                                            >
                                                {coupon.code}
                                            </Badge>
                                            <Form.Text
                                                muted
                                                className="d-block mt-1"
                                            >
                                                Code cannot be changed after
                                                creation.
                                            </Form.Text>
                                        </div>
                                    </Col>
                                )
                            )}

                            {/* Description */}
                            <Col md={12} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        placeholder="Optional description visible to staff"
                                        {...register('description')}
                                        isInvalid={!!errors.description}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.description?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Card 2: Discount */}
                <Card className="mb-4">
                    <Card.Header>
                        <Card.Title>Discount</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            {/* Discount Type */}
                            <Col md={4} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        Discount Type{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Select
                                        {...register('type')}
                                        isInvalid={!!errors.type}
                                    >
                                        <option value="percentage">
                                            Percentage (%)
                                        </option>
                                        <option value="fixed">
                                            Fixed Amount
                                        </option>
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.type?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            {/* Value */}
                            <Col md={4} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        Value{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <div className="input-group">
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            min={0}
                                            max={
                                                discountType === 'percentage'
                                                    ? 100
                                                    : undefined
                                            }
                                            placeholder={
                                                discountType === 'percentage'
                                                    ? '0 – 100'
                                                    : '0.00'
                                            }
                                            {...register('value', {
                                                required: 'Value is required.',
                                                min: {
                                                    value: 0,
                                                    message: 'Must be ≥ 0',
                                                },
                                            })}
                                            isInvalid={!!errors.value}
                                        />
                                        <span className="input-group-text">
                                            {discountType === 'percentage'
                                                ? '%'
                                                : currency}
                                        </span>
                                        <Form.Control.Feedback type="invalid">
                                            {errors.value?.message}
                                        </Form.Control.Feedback>
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Card 3: Applied To */}
                <Card className="mb-4">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <Card.Title className="mb-0">Applied To</Card.Title>
                        <Button
                            type="button"
                            variant="outline-primary"
                            size="sm"
                            onClick={addScope}
                        >
                            + Add scope
                        </Button>
                    </Card.Header>
                    <Card.Body>
                        {scopes.length === 0 ? (
                            <p className="text-muted mb-0 small">
                                No restrictions - applies to all booking types
                                (regular rentals, chauffeur transfers, and
                                airport transfers). Add a scope to restrict it.
                            </p>
                        ) : (
                            scopes.map((scope, i) => (
                                <ScopeRow
                                    key={i}
                                    scope={scope}
                                    index={i}
                                    categories={categories.map(c => ({
                                        id: c.id,
                                        name: c.name,
                                    }))}
                                    rentalVehicles={rentalVehicles.map(v => ({
                                        id: v.id,
                                        make: v.make,
                                        model: v.model,
                                        license_plate: v.license_plate,
                                    }))}
                                    fleetVehicles={fleetVehicles.map(v => ({
                                        id: v.id,
                                        make: v.make,
                                        model: v.model,
                                        license_plate: v.license_plate,
                                    }))}
                                    airportPackages={airportPackages.map(p => ({
                                        id: p.id,
                                        name: p.name,
                                    }))}
                                    onChange={updateScope}
                                    onRemove={removeScope}
                                />
                            ))
                        )}
                    </Card.Body>
                </Card>

                {/* Card 4: Limits & Conditions */}
                <Card className="mb-4">
                    <Card.Header>
                        <Card.Title>Limits &amp; Conditions</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            {/* Valid Days */}
                            <Col md={3} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Valid Days</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min={1}
                                        placeholder="e.g. 30"
                                        {...register('valid_days')}
                                        isInvalid={!!errors.valid_days}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.valid_days?.message}
                                    </Form.Control.Feedback>
                                    <Form.Text muted>
                                        Sets expiry to now + N days. Leave blank
                                        for no expiry.
                                    </Form.Text>
                                </Form.Group>
                            </Col>

                            {/* Max Total Uses */}
                            <Col md={3} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Max Total Uses</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min={1}
                                        placeholder="Unlimited"
                                        {...register('max_uses')}
                                        isInvalid={!!errors.max_uses}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.max_uses?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            {/* Max Uses Per Customer */}
                            <Col md={3} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        Max Uses Per Customer
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        min={1}
                                        placeholder="Unlimited"
                                        {...register('max_uses_per_customer')}
                                        isInvalid={
                                            !!errors.max_uses_per_customer
                                        }
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.max_uses_per_customer?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            {/* Min Rental Days */}
                            <Col md={3} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Min Rental Days</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min={1}
                                        placeholder="No minimum"
                                        {...register('min_rental_days')}
                                        isInvalid={!!errors.min_rental_days}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.min_rental_days?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            {/* Min Rental Amount */}
                            <Col md={3} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Min Rental Amount</Form.Label>
                                    <div className="input-group">
                                        <span className="input-group-text">
                                            {currency}
                                        </span>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            min={0}
                                            placeholder="0.00"
                                            {...register('min_rental_amount')}
                                            isInvalid={
                                                !!errors.min_rental_amount
                                            }
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.min_rental_amount?.message}
                                        </Form.Control.Feedback>
                                    </div>
                                </Form.Group>
                            </Col>

                            {/* Is Active */}
                            <Col md={12} className="mb-3">
                                <Form.Group>
                                    <Form.Check
                                        type="switch"
                                        id="is_active"
                                        label="Active"
                                        {...register('is_active')}
                                    />
                                    <Form.Text muted>
                                        Inactive coupons cannot be applied at
                                        checkout.
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Form Actions */}
                <div className="d-flex justify-content-end gap-2">
                    <Button
                        type="button"
                        variant="light"
                        onClick={() => navigate(ROUTES.DASHBOARD.COUPONS.ROOT)}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Spinner
                                    animation="border"
                                    size="sm"
                                    className="me-1"
                                />
                                Saving…
                            </>
                        ) : isEditing ? (
                            'Save Changes'
                        ) : (
                            'Create Coupon'
                        )}
                    </Button>
                </div>
            </Form>
        </Fragment>
    );
}
