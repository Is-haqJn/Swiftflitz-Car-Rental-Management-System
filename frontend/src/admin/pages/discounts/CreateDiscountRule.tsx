import { Fragment, useEffect } from 'react';
import { Row, Col, Form, Card, Button, Spinner } from 'react-bootstrap';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '@/shared/routes';
import type { DiscountRule } from '@/shared/types/discount-rule.types';
import {
    useCreateDiscountRule,
    useUpdateDiscountRule,
    useDiscountRule,
} from '@/shared/hooks/queries/useDiscountRules';
import { useActiveBranches } from '@/shared/hooks/queries/useBranches';
import { useCategories } from '@/shared/hooks/queries/useCategories';
import { useVehicles } from '@/shared/hooks/queries/useVehicles';
import { selectAuthUser } from '@/store/slices/authSlice';
import { useTitle } from '@/shared/hooks';
import { applyServerErrors } from '@/shared/libs/utils';
import { useCurrency } from '@/shared/hooks/queries/useSettings';
import DatePickerField from '@adminComponents/DatePickerField';

/* Types */
interface RuleFormData {
    branch_id: string;
    name: string;
    description: string;
    discount_type: string;
    discount_value: string;
    condition_type: string;
    condition_value: string;
    is_stackable: boolean;
    is_active: boolean;
    valid_from: string;
    valid_to: string;
}

interface CreateDiscountRuleProps {
    rule?: DiscountRule | null;
    onSuccess?: (rule: DiscountRule) => void;
    onCancel?: () => void;
}

/* Helpers */
function ruleToFormDefaults(r: DiscountRule): RuleFormData {
    return {
        branch_id: r.branch_id ?? '',
        name: r.name,
        description: r.description ?? '',
        discount_type: r.discount_type,
        discount_value: String(r.discount_value),
        condition_type: r.condition_type,
        condition_value: r.condition_value ?? '',
        is_stackable: r.is_stackable,
        is_active: r.is_active,
        valid_from: r.valid_from ?? '',
        valid_to: r.valid_to ?? '',
    };
}

const defaultValues: RuleFormData = {
    branch_id: '',
    name: '',
    description: '',
    discount_type: 'flat',
    discount_value: '',
    condition_type: 'none',
    condition_value: '',
    is_stackable: true,
    is_active: true,
    valid_from: '',
    valid_to: '',
};

/* Main Component */
export default function CreateDiscountRule({
    rule: ruleProp,
    onSuccess,
    onCancel,
}: CreateDiscountRuleProps) {
    const currency = useCurrency();
    const navigate = useNavigate();
    const { id: routeId } = useParams<{ id: string }>();

    const { data: fetchedRuleRes, isLoading: loadingRule } = useDiscountRule(
        routeId ?? ''
    );
    const fetchedRule = fetchedRuleRes?.data;

    const rule = ruleProp ?? fetchedRule ?? null;
    const isEditing = Boolean(rule);
    const title = useTitle(
        isEditing ? 'Edit Discount Rule' : 'Add Discount Rule'
    );

    const authUser = useSelector(selectAuthUser);
    const userBranches = authUser?.branches ?? [];
    const hasGlobalBranchAccess = !userBranches.length;
    const singleBranchManager =
        !hasGlobalBranchAccess && userBranches.length === 1;

    const { data: branchesResponse } = useActiveBranches();
    const allBranches = branchesResponse?.data ?? [];

    const { data: categoriesResponse } = useCategories({ per_page: 200 });
    const categories = categoriesResponse?.data ?? [];

    const { data: vehiclesResponse } = useVehicles({ per_page: 200 });
    const vehicles = vehiclesResponse?.data ?? [];

    const createMutation = useCreateDiscountRule();
    const updateMutation = useUpdateDiscountRule();
    const isSaving = createMutation.isPending || updateMutation.isPending;

    const {
        register,
        handleSubmit,
        reset,
        control,
        setError,
        formState: { errors },
    } = useForm<RuleFormData>({ defaultValues });

    const discountType = useWatch({ control, name: 'discount_type' });
    const conditionType = useWatch({ control, name: 'condition_type' });

    // Reset form when editing rule changes
    useEffect(() => {
        if (rule) {
            reset(ruleToFormDefaults(rule));
        } else if (!routeId) {
            reset(defaultValues);
            // Auto-set branch for single-branch managers
            if (singleBranchManager && userBranches[0]) {
                reset({ ...defaultValues, branch_id: userBranches[0].id });
            }
        }
    }, [rule?.id]);

    /* Submit */
    const onSubmit = (data: RuleFormData) => {
        const payload = {
            branch_id: data.branch_id || null,
            name: data.name,
            description: data.description || null,
            discount_type: data.discount_type as 'percentage' | 'flat',
            discount_value: parseFloat(data.discount_value),
            condition_type:
                data.condition_type as DiscountRule['condition_type'],
            condition_value: data.condition_value || null,
            is_stackable: data.is_stackable,
            is_active: data.is_active,
            valid_from: data.valid_from || null,
            valid_to: data.valid_to || null,
        };

        if (isEditing && rule) {
            updateMutation.mutate(
                { id: rule.id, payload },
                {
                    onSuccess: res => {
                        if (onSuccess) {
                            onSuccess(res.data);
                        } else {
                            navigate(ROUTES.DASHBOARD.DISCOUNTS.ROOT);
                        }
                    },
                    onError: (err: unknown) => {
                        applyServerErrors(err, setError);
                    },
                }
            );
        } else {
            createMutation.mutate(payload, {
                onSuccess: res => {
                    if (onSuccess) {
                        onSuccess(res.data);
                    } else {
                        navigate(ROUTES.DASHBOARD.DISCOUNTS.ROOT);
                    }
                },
                onError: (err: unknown) => {
                    applyServerErrors(err, setError);
                },
            });
        }
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            navigate(ROUTES.DASHBOARD.DISCOUNTS.ROOT);
        }
    };

    if (routeId && loadingRule) {
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
                {/* Card 1: Rule Details */}
                <Card className="mb-4">
                    <Card.Header>
                        <Card.Title>
                            {isEditing
                                ? 'Edit Discount Rule'
                                : 'New Discount Rule'}
                        </Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            {/* Branch */}
                            {hasGlobalBranchAccess && (
                                <Col md={6} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Branch</Form.Label>
                                        <Form.Select
                                            {...register('branch_id')}
                                            isInvalid={!!errors.branch_id}
                                        >
                                            <option value="">
                                                Org-wide (no branch)
                                            </option>
                                            {allBranches.map(b => (
                                                <option key={b.id} value={b.id}>
                                                    {b.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            {errors.branch_id?.message}
                                        </Form.Control.Feedback>
                                        <Form.Text muted>
                                            Leave blank to apply org-wide.
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                            )}
                            {!hasGlobalBranchAccess &&
                                !singleBranchManager &&
                                userBranches.length > 1 && (
                                    <Col md={6} className="mb-3">
                                        <Form.Group>
                                            <Form.Label>Branch</Form.Label>
                                            <Form.Select
                                                {...register('branch_id')}
                                                isInvalid={!!errors.branch_id}
                                            >
                                                <option value="">
                                                    Select branch…
                                                </option>
                                                {userBranches.map(b => (
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
                                )}

                            {/* Name */}
                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        Rule Name{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        {...register('name', {
                                            required: 'Name is required',
                                        })}
                                        isInvalid={!!errors.name}
                                        placeholder="e.g. Early Bird Discount"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.name?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            {/* Description */}
                            <Col md={12} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        {...register('description')}
                                        placeholder="Optional description of this rule…"
                                    />
                                </Form.Group>
                            </Col>

                            {/* Discount Type */}
                            <Col md={4} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        Discount Type{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Select
                                        {...register('discount_type', {
                                            required: true,
                                        })}
                                        isInvalid={!!errors.discount_type}
                                    >
                                        <option value="flat">Flat Rate</option>
                                        <option value="percentage">
                                            Percentage
                                        </option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            {/* Discount Value */}
                            <Col md={4} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        Discount Value{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <div className="input-group">
                                        {discountType === 'flat' && (
                                            <span className="input-group-text">
                                                {currency}
                                            </span>
                                        )}
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            {...register('discount_value', {
                                                required: 'Value is required',
                                                min: {
                                                    value: 0,
                                                    message: 'Must be ≥ 0',
                                                },
                                            })}
                                            isInvalid={!!errors.discount_value}
                                            placeholder={
                                                discountType === 'percentage'
                                                    ? '0–100'
                                                    : '0.00'
                                            }
                                        />
                                        {discountType === 'percentage' && (
                                            <span className="input-group-text">
                                                %
                                            </span>
                                        )}
                                        <Form.Control.Feedback type="invalid">
                                            {errors.discount_value?.message}
                                        </Form.Control.Feedback>
                                    </div>
                                </Form.Group>
                            </Col>

                            {/* Condition Type */}
                            <Col md={4} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        Condition Type{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Select
                                        {...register('condition_type', {
                                            required: true,
                                        })}
                                        isInvalid={!!errors.condition_type}
                                    >
                                        <option value="none">
                                            Always applies
                                        </option>
                                        <option value="rental_duration_days">
                                            Min. rental duration (days)
                                        </option>
                                        <option value="days_before_pickup">
                                            Days booked in advance
                                        </option>
                                        <option value="booking_source">
                                            Booking source
                                        </option>
                                        <option value="customer_completed_rentals">
                                            Customer completed rentals
                                        </option>
                                        <option value="base_amount">
                                            Min. base amount
                                        </option>
                                        <option value="vehicle_id">
                                            Specific vehicle
                                        </option>
                                        <option value="category_id">
                                            Specific category
                                        </option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            {/* Condition Value - conditional */}
                            {conditionType !== 'none' && (
                                <Col md={6} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>
                                            {conditionType ===
                                                'rental_duration_days' &&
                                                'Min. Rental Days'}
                                            {conditionType ===
                                                'days_before_pickup' &&
                                                'Days in Advance'}
                                            {conditionType ===
                                                'customer_completed_rentals' &&
                                                'Min. Completed Rentals'}
                                            {conditionType === 'base_amount' &&
                                                'Min. Base Amount'}
                                            {conditionType ===
                                                'booking_source' &&
                                                'Booking Source'}
                                            {conditionType === 'vehicle_id' &&
                                                'Vehicle'}
                                            {conditionType === 'category_id' &&
                                                'Category'}{' '}
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </Form.Label>

                                        {[
                                            'rental_duration_days',
                                            'days_before_pickup',
                                            'customer_completed_rentals',
                                            'base_amount',
                                        ].includes(conditionType) && (
                                            <Form.Control
                                                type="number"
                                                step={
                                                    conditionType ===
                                                    'base_amount'
                                                        ? '0.01'
                                                        : '1'
                                                }
                                                min="0"
                                                {...register(
                                                    'condition_value',
                                                    {
                                                        required:
                                                            'Condition value is required',
                                                    }
                                                )}
                                                isInvalid={
                                                    !!errors.condition_value
                                                }
                                            />
                                        )}

                                        {conditionType === 'booking_source' && (
                                            <Form.Select
                                                {...register(
                                                    'condition_value',
                                                    {
                                                        required:
                                                            'Select a source',
                                                    }
                                                )}
                                                isInvalid={
                                                    !!errors.condition_value
                                                }
                                            >
                                                <option value="">
                                                    Select source…
                                                </option>
                                                <option value="admin">
                                                    Admin
                                                </option>
                                                <option value="online">
                                                    Online
                                                </option>
                                                <option value="quote">
                                                    Quote
                                                </option>
                                            </Form.Select>
                                        )}

                                        {conditionType === 'vehicle_id' && (
                                            <Form.Select
                                                {...register(
                                                    'condition_value',
                                                    {
                                                        required:
                                                            'Select a vehicle',
                                                    }
                                                )}
                                                isInvalid={
                                                    !!errors.condition_value
                                                }
                                            >
                                                <option value="">
                                                    Select vehicle…
                                                </option>
                                                {vehicles.map(v => (
                                                    <option
                                                        key={v.id}
                                                        value={v.id}
                                                    >
                                                        {v.name} -{' '}
                                                        {v.license_plate}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        )}

                                        {conditionType === 'category_id' && (
                                            <Form.Select
                                                {...register(
                                                    'condition_value',
                                                    {
                                                        required:
                                                            'Select a category',
                                                    }
                                                )}
                                                isInvalid={
                                                    !!errors.condition_value
                                                }
                                            >
                                                <option value="">
                                                    Select category…
                                                </option>
                                                {categories.map(c => (
                                                    <option
                                                        key={c.id}
                                                        value={c.id}
                                                    >
                                                        {c.name}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        )}

                                        <Form.Control.Feedback type="invalid">
                                            {errors.condition_value?.message}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            )}
                        </Row>
                    </Card.Body>
                </Card>

                {/* Card 2: Validity & Settings */}
                <Card className="mb-4">
                    <Card.Header>
                        <Card.Title>Validity &amp; Settings</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            {/* Valid From */}
                            <Col md={3} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Valid From</Form.Label>
                                    <Controller
                                        name="valid_from"
                                        control={control}
                                        render={({ field }) => (
                                            <DatePickerField
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        )}
                                    />
                                    <Form.Text muted>
                                        Leave blank for no start limit.
                                    </Form.Text>
                                </Form.Group>
                            </Col>

                            {/* Valid To */}
                            <Col md={3} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Valid To</Form.Label>
                                    <Controller
                                        name="valid_to"
                                        control={control}
                                        render={({ field }) => (
                                            <DatePickerField
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        )}
                                    />
                                    <Form.Text muted>
                                        Leave blank for no end limit.
                                    </Form.Text>
                                </Form.Group>
                            </Col>

                            {/* Stackable */}
                            <Col
                                md={3}
                                className="mb-3 d-flex align-items-center"
                            >
                                <Form.Group>
                                    <Form.Check
                                        type="switch"
                                        id="is_stackable"
                                        label="Stackable"
                                        {...register('is_stackable')}
                                    />
                                    <Form.Text muted>
                                        Non-stackable rules cannot combine with
                                        others.
                                    </Form.Text>
                                </Form.Group>
                            </Col>

                            {/* Active */}
                            <Col
                                md={3}
                                className="mb-3 d-flex align-items-center"
                            >
                                <Form.Group>
                                    <Form.Check
                                        type="switch"
                                        id="is_active"
                                        label="Active"
                                        {...register('is_active')}
                                    />
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
                        onClick={handleCancel}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Spinner
                                    size="sm"
                                    animation="border"
                                    className="me-1"
                                />
                                Saving…
                            </>
                        ) : isEditing ? (
                            'Update Rule'
                        ) : (
                            'Create Rule'
                        )}
                    </Button>
                </div>
            </Form>
        </Fragment>
    );
}
