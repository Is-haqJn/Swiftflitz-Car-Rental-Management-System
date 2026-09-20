import { Fragment, useEffect } from 'react';
import { Row, Col, Form, Card, Button, Spinner } from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '@/shared/routes';
import type {
    AdditionalCharge,
    ChargeScope,
    ChargeType,
} from '@/shared/types/additional-charge.types';
import {
    useCreateAdditionalCharge,
    useUpdateAdditionalCharge,
    useAdditionalCharge,
} from '@/shared/hooks/queries/useAdditionalCharges';
import { useActiveBranches } from '@/shared/hooks/queries/useBranches';
import { useCategories } from '@/shared/hooks/queries/useCategories';
import { useVehicles } from '@/shared/hooks/queries/useVehicles';
import { selectAuthUser } from '@/store/slices/authSlice';
import { useTitle } from '@/shared/hooks';
import { applyServerErrors } from '@/shared/libs/utils';
import { useCurrency } from '@/shared/hooks/queries/useSettings';

/* Types */
interface ChargeFormData {
    branch_id: string;
    name: string;
    description: string;
    scope: ChargeScope;
    category_id: string;
    vehicle_id: string;
    charge_type: ChargeType;
    amount: string;
    stock_quantity: string;
    is_waivable: boolean;
    is_active: boolean;
}

interface CreateAdditionalChargeProps {
    charge?: AdditionalCharge | null;
    onSuccess?: (charge: AdditionalCharge) => void;
    onCancel?: () => void;
}

/* Helpers */
function chargeToFormDefaults(c: AdditionalCharge): ChargeFormData {
    return {
        branch_id: c.branch_id ?? '',
        name: c.name,
        description: c.description ?? '',
        scope: c.scope,
        category_id: c.category_id ?? '',
        vehicle_id: c.vehicle_id ?? '',
        charge_type: c.charge_type,
        amount: String(c.amount),
        stock_quantity:
            c.stock_quantity != null ? String(c.stock_quantity) : '',
        is_waivable: c.is_waivable,
        is_active: c.is_active,
    };
}

/* Main Component */
export default function CreateAdditionalCharge({
    charge: chargeProp,
    onSuccess,
    onCancel,
}: CreateAdditionalChargeProps) {
    const currency = useCurrency();
    const navigate = useNavigate();
    const { id: routeId } = useParams<{ id: string }>();

    const { data: fetchedChargeRes, isLoading: loadingCharge } =
        useAdditionalCharge(routeId ?? '');
    const fetchedCharge = fetchedChargeRes?.data;

    const charge = chargeProp ?? fetchedCharge ?? null;
    const isEditing = Boolean(charge);
    const title = useTitle(isEditing ? 'Edit Charge' : 'Add Charge');

    const authUser = useSelector(selectAuthUser);
    const userBranches = authUser?.branches ?? [];
    const hasGlobalBranchAccess = !userBranches.length;
    const showBranchSelector = hasGlobalBranchAccess || userBranches.length > 1;

    const { data: branchesResponse } = useActiveBranches();
    const allBranches = branchesResponse?.data ?? [];

    const { data: categoriesResponse } = useCategories({ per_page: 200 });
    const categories = categoriesResponse?.data ?? [];

    const { data: vehiclesResponse } = useVehicles({ per_page: 200 });
    const vehicles = vehiclesResponse?.data ?? [];

    const {
        register,
        handleSubmit,
        control,
        setError,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ChargeFormData>({
        defaultValues: {
            branch_id:
                !hasGlobalBranchAccess && userBranches.length === 1
                    ? userBranches[0].id
                    : '',
            name: '',
            description: '',
            scope: 'global',
            category_id: '',
            vehicle_id: '',
            charge_type: 'flat',
            amount: '',
            stock_quantity: '',
            is_waivable: false,
            is_active: true,
        },
    });

    const scope = useWatch({ control, name: 'scope' });

    useEffect(() => {
        if (charge?.id) {
            reset(chargeToFormDefaults(charge));
        }
    }, [charge?.id, reset]);

    const createMutation = useCreateAdditionalCharge();
    const updateMutation = useUpdateAdditionalCharge();
    const isBusy = createMutation.isPending || updateMutation.isPending;

    const onSubmit = async (data: ChargeFormData) => {
        const payload = {
            branch_id: data.branch_id || null,
            name: data.name,
            description: data.description || null,
            scope: data.scope,
            category_id:
                data.scope === 'category' ? data.category_id || null : null,
            vehicle_id:
                data.scope === 'vehicle' ? data.vehicle_id || null : null,
            charge_type: data.charge_type,
            amount: Number(data.amount),
            stock_quantity:
                data.scope === 'regular' && data.stock_quantity !== ''
                    ? Number(data.stock_quantity)
                    : null,
            is_waivable: data.is_waivable,
            is_active: data.is_active,
        };

        if (isEditing && charge?.id) {
            updateMutation.mutate(
                { id: charge.id, payload },
                {
                    onSuccess: res => {
                        onSuccess?.(res.data) ??
                            navigate(ROUTES.DASHBOARD.RENTALS.CHARGES);
                    },
                    onError: (err: unknown) => applyServerErrors(err, setError),
                }
            );
        } else {
            createMutation.mutate(payload, {
                onSuccess: res => {
                    onSuccess?.(res.data) ??
                        navigate(ROUTES.DASHBOARD.RENTALS.CHARGES);
                },
                onError: (err: unknown) => applyServerErrors(err, setError),
            });
        }
    };

    /* Render */
    if (routeId && loadingCharge) {
        return <SettingsFormSkeleton />;
    }

    return (
        <Fragment>
            {title}
            <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                {/* Charge Details */}
                <Card className="mb-4">
                    <Card.Header>
                        <Card.Title>
                            {isEditing
                                ? 'Edit Charge'
                                : 'New Additional Charge'}
                        </Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            {/* Branch selector */}
                            {showBranchSelector && (
                                <Col md={6} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>
                                            Branch{' '}
                                            {hasGlobalBranchAccess && (
                                                <span className="text-muted small">
                                                    (leave empty for org-wide)
                                                </span>
                                            )}
                                        </Form.Label>
                                        <Form.Select
                                            {...register('branch_id')}
                                            isInvalid={!!errors.branch_id}
                                        >
                                            {hasGlobalBranchAccess && (
                                                <option value="">
                                                    Org-wide (all branches)
                                                </option>
                                            )}
                                            {!hasGlobalBranchAccess && (
                                                <option value="">
                                                    Select branch…
                                                </option>
                                            )}
                                            {(hasGlobalBranchAccess
                                                ? allBranches
                                                : userBranches
                                            ).map(b => (
                                                <option key={b.id} value={b.id}>
                                                    {b.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            {errors.branch_id?.message}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            )}

                            {/* Name */}
                            <Col
                                md={showBranchSelector ? 6 : 12}
                                className="mb-3"
                            >
                                <Form.Group>
                                    <Form.Label>
                                        Charge Name{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        placeholder="e.g. Airport Transfer Fee"
                                        {...register('name', {
                                            required: 'Charge name is required',
                                        })}
                                        isInvalid={!!errors.name}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.name?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Description */}
                        <Row>
                            <Col md={12} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        placeholder="Optional description…"
                                        {...register('description')}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Scope + conditional fields */}
                        <Row>
                            <Col md={4} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        Scope{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Select
                                        {...register('scope', {
                                            required: 'Scope is required',
                                        })}
                                        isInvalid={!!errors.scope}
                                    >
                                        <option value="global">
                                            Global - applied to all rentals
                                        </option>
                                        <option value="category">
                                            Category - applied by vehicle
                                            category
                                        </option>
                                        <option value="vehicle">
                                            Vehicle - applied to a specific
                                            vehicle
                                        </option>
                                        <option value="regular">
                                            Regular - manually selected per
                                            rental
                                        </option>
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.scope?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            {/* Category picker */}
                            {scope === 'category' && (
                                <Col md={4} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>
                                            Category{' '}
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </Form.Label>
                                        <Form.Select
                                            {...register('category_id', {
                                                required:
                                                    scope === 'category'
                                                        ? 'Category is required'
                                                        : false,
                                            })}
                                            isInvalid={!!errors.category_id}
                                        >
                                            <option value="">
                                                Select category…
                                            </option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            {errors.category_id?.message}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            )}

                            {/* Vehicle picker */}
                            {scope === 'vehicle' && (
                                <Col md={4} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>
                                            Vehicle{' '}
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </Form.Label>
                                        <Form.Select
                                            {...register('vehicle_id', {
                                                required:
                                                    scope === 'vehicle'
                                                        ? 'Vehicle is required'
                                                        : false,
                                            })}
                                            isInvalid={!!errors.vehicle_id}
                                        >
                                            <option value="">
                                                Select vehicle…
                                            </option>
                                            {vehicles.map(v => (
                                                <option key={v.id} value={v.id}>
                                                    {v.name} - {v.license_plate}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            {errors.vehicle_id?.message}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            )}

                            {/* Stock quantity - regular only */}
                            {scope === 'regular' && (
                                <Col md={4} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Stock Quantity</Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="0"
                                            step="1"
                                            placeholder="Leave blank for unlimited"
                                            {...register('stock_quantity', {
                                                min: {
                                                    value: 0,
                                                    message:
                                                        'Must be 0 or greater',
                                                },
                                            })}
                                            isInvalid={!!errors.stock_quantity}
                                        />
                                        <Form.Text className="text-muted">
                                            Leave blank for unlimited
                                            availability
                                        </Form.Text>
                                        <Form.Control.Feedback type="invalid">
                                            {errors.stock_quantity?.message}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            )}
                        </Row>

                        {/* Charge type + amount */}
                        <Row>
                            <Col md={4} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        Charge Type{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Select
                                        {...register('charge_type', {
                                            required: 'Charge type is required',
                                        })}
                                        isInvalid={!!errors.charge_type}
                                    >
                                        <option value="flat">
                                            Flat - fixed amount
                                        </option>
                                        <option value="per_day">
                                            Per Day - amount × rental days
                                        </option>
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.charge_type?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        Amount ({currency}){' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        {...register('amount', {
                                            required: 'Amount is required',
                                            min: {
                                                value: 0,
                                                message: 'Must be 0 or greater',
                                            },
                                        })}
                                        isInvalid={!!errors.amount}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.amount?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Settings */}
                <Card className="mb-4">
                    <Card.Header>
                        <Card.Title>Settings</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={4} className="mb-3">
                                <Form.Group>
                                    <Form.Check
                                        type="switch"
                                        id="is_waivable"
                                        label="Waivable"
                                        {...register('is_waivable')}
                                    />
                                    <Form.Text className="text-muted d-block mt-1">
                                        Managers can choose to waive this charge
                                        per rental
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={4} className="mb-3">
                                <Form.Group>
                                    <Form.Check
                                        type="switch"
                                        id="is_active"
                                        label="Active"
                                        {...register('is_active')}
                                    />
                                    <Form.Text className="text-muted d-block mt-1">
                                        Inactive charges are hidden from rental
                                        creation
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Actions */}
                <div className="d-flex justify-content-end gap-2">
                    <Button
                        variant="light"
                        type="button"
                        onClick={() =>
                            onCancel?.() ??
                            navigate(ROUTES.DASHBOARD.RENTALS.CHARGES)
                        }
                        disabled={isBusy}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={isBusy || isSubmitting}
                    >
                        {isBusy ? (
                            <>
                                <Spinner
                                    size="sm"
                                    animation="border"
                                    className="me-1"
                                />
                                Saving…
                            </>
                        ) : isEditing ? (
                            'Save Changes'
                        ) : (
                            'Create Charge'
                        )}
                    </Button>
                </div>
            </Form>
        </Fragment>
    );
}
