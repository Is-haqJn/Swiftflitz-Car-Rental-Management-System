import { useEffect, useState } from 'react';
import { Row, Col, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useForm, Controller, useWatch } from 'react-hook-form';
import VehicleExpenseModal from '@adminPages/vehicles/VehicleExpenseModal';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { CreateVehicleData, Vehicle } from '@/shared/types';
import {
    useCreateVehicle,
    useUpdateVehicle,
} from '@/shared/hooks/queries/useVehicles';
import { useCategories } from '@/shared/hooks/queries/useCategories';
import { useActiveFeatures } from '@/shared/hooks/queries/useFeatures';
import { useActiveBranches } from '@/shared/hooks/queries/useBranches';
import { selectAuthUser } from '@/store/slices/authSlice';
import { useTitle } from '@/shared/hooks';
import {
    createVehicleSchema,
    type CreateVehicleFormData,
} from '@/shared/libs/validations';
import { applyServerErrors } from '@/shared/libs/utils';
import { useCurrency } from '@/shared/hooks/queries/useSettings';
import DatePickerField from '@/admin/components/DatePickerField';

/* Props */
interface VehicleFormProps {
    vehicle?: Vehicle | null;
    onSuccess?: (vehicle: Vehicle) => void;
    onCancel?: () => void;
}

/* Helper: Convert Vehicle to form defaults */
function safeStr(value: unknown, fallback = ''): string {
    if (value === null || value === undefined) return fallback;
    return String(value);
}

function vehicleToFormDefaults(vehicle: Vehicle): CreateVehicleFormData {
    // Extract category_id properly
    let categoryId = '';
    if (vehicle.category) {
        if (typeof vehicle.category === 'object' && 'id' in vehicle.category) {
            categoryId = String(vehicle.category.id);
        } else if (typeof vehicle.category === 'string') {
            categoryId = vehicle.category;
        }
    }

    return {
        category_id: categoryId,
        branch_id: vehicle.branch_id ?? '',
        name: safeStr(vehicle.name),
        make: safeStr(vehicle.make),
        model: safeStr(vehicle.model),
        year: safeStr(vehicle.year, String(new Date().getFullYear())),
        roadworthy_expiry_date: safeStr(vehicle.roadworthy_expiry_date),
        insurance_expiry_date: safeStr(vehicle.insurance_expiry_date),
        license_plate: safeStr(vehicle.license_plate),
        vin: safeStr(vehicle.vin),
        color: safeStr(vehicle.color),
        seats: safeStr(vehicle.seats, '5'),
        fuel_type: vehicle.fuel_type || 'petrol',
        engine_size: safeStr(vehicle.engine_size),
        odometer: safeStr(vehicle.odometer, '0'),
        has_insurance: Boolean(vehicle.has_insurance),
        has_roadworthy: Boolean(vehicle.has_roadworthy),
        transmission: vehicle.transmission || 'automatic',
        features: vehicle.features || [],
        daily_rate: safeStr(vehicle.daily_rate),
        security_deposit:
            vehicle.security_deposit != null
                ? safeStr(vehicle.security_deposit)
                : '',
        young_driver_age_threshold:
            vehicle.young_driver_age_threshold != null
                ? safeStr(vehicle.young_driver_age_threshold)
                : '',
        young_driver_deposit:
            vehicle.young_driver_deposit != null
                ? safeStr(vehicle.young_driver_deposit)
                : '',
        price_visible: Boolean(vehicle.price_visible),
        status: safeStr(vehicle.status, 'available'),
        description: safeStr(vehicle.description),
        condition_notes: safeStr(vehicle.condition_notes),
        is_featured: Boolean(vehicle.is_featured),
    };
}

/* Main Component */
export default function CreateVehicle({
    vehicle,
    onSuccess,
    onCancel,
}: VehicleFormProps) {
    const currency = useCurrency();
    const title = useTitle('Add Vehicle');
    const navigate = useNavigate();
    const isEditing = Boolean(vehicle);

    const authUser = useSelector(selectAuthUser);
    const { data: categoriesResponse, isLoading: loadingCategories } =
        useCategories();
    const { data: activeFeatures = [], isLoading: loadingFeatures } =
        useActiveFeatures();
    const { data: branchesResponse } = useActiveBranches();
    const createMutation = useCreateVehicle();
    const updateMutation = useUpdateVehicle();
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

    const categories = categoriesResponse?.data ?? [];
    const allBranches = branchesResponse?.data ?? [];
    /* Global users (no branch assignments) see all branches; restricted users see only theirs. */
    const userBranches = authUser?.branches ?? [];
    const hasGlobalBranchAccess = !userBranches.length;
    const branchOptions = hasGlobalBranchAccess ? allBranches : userBranches;

    /* React Hook Form with Zod (same pattern as LoginPage) */
    const {
        register,
        handleSubmit,
        control,
        reset,
        setValue,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<CreateVehicleFormData>({
        resolver: zodResolver(createVehicleSchema),
        defaultValues: {
            category_id: '',
            branch_id: '',
            name: '',
            make: '',
            model: '',
            year: String(new Date().getFullYear()),
            roadworthy_expiry_date: '',
            insurance_expiry_date: '',
            license_plate: '',
            vin: '',
            color: '',
            seats: '5',
            fuel_type: 'petrol',
            engine_size: '',
            odometer: '0',
            has_insurance: false,
            has_roadworthy: false,
            transmission: 'automatic',
            features: [],
            daily_rate: '',
            security_deposit: '',
            young_driver_age_threshold: '',
            young_driver_deposit: '',
            price_visible: true,
            status: 'available',
            description: '',
            condition_notes: '',
            is_featured: false,
        },
    });

    const selectedFeatures = useWatch({
        control,
        name: 'features',
        defaultValue: [],
    });
    const hasInsurance = useWatch({ control, name: 'has_insurance' });
    const hasRoadworthy = useWatch({ control, name: 'has_roadworthy' });

    // If editing a vehicle that is in maintenance, lock the status field
    const isVehicleInMaintenance = vehicle?.status === 'maintenance';

    /* Auto-fill branch for single-branch managers */
    useEffect(() => {
        if (!vehicle && !hasGlobalBranchAccess && userBranches.length === 1) {
            setValue('branch_id', userBranches[0].id);
        }
    }, [authUser?.id, vehicle, hasGlobalBranchAccess]); // eslint-disable-line react-hooks/exhaustive-deps

    /* Pre-fill form when editing - wait for categories so the select has options */
    useEffect(() => {
        if (vehicle && categories.length > 0) {
            const formData = vehicleToFormDefaults(vehicle);
            reset(formData);
        }
    }, [vehicle?.id, categories.length, reset]); // eslint-disable-line react-hooks/exhaustive-deps

    /* Feature toggle */
    const toggleFeature = (featureName: string) => {
        const current = selectedFeatures || [];
        const updated = current.includes(featureName)
            ? current.filter(f => f !== featureName)
            : [...current, featureName];
        setValue('features', updated);
    };

    /* Submit (convert strings to proper types for API) */
    const onSubmit = async (data: CreateVehicleFormData) => {
        // console.log('🚀 onSubmit CALLED - form validation passed!', {
        //     isEditing,
        //     vehicleId: vehicle?.id,
        // });

        try {
            //console.log('Form submitted', { isEditing, data });

            // Build payload - convert form strings to proper types
            // (Same pattern as your original buildPayload function)
            const payload: CreateVehicleData = {
                category_id: data.category_id,
                branch_id: data.branch_id || null,
                name: data.name.trim(),
                make: data.make.trim(),
                model: data.model.trim(),
                year: Number(data.year),
                roadworthy_expiry_date: data.roadworthy_expiry_date ?? '',
                insurance_expiry_date: data.insurance_expiry_date ?? '',
                license_plate: data.license_plate.trim(),
                vin: data.vin?.trim() || undefined,
                color: data.color.trim(),
                seats: Number(data.seats),
                fuel_type: data.fuel_type as CreateVehicleData['fuel_type'],
                engine_size: data.engine_size?.trim() || undefined,
                odometer: data.odometer ? Number(data.odometer) : 0,
                has_insurance: data.has_insurance ?? false,
                has_roadworthy: data.has_roadworthy ?? false,
                transmission:
                    data.transmission as CreateVehicleData['transmission'],
                features:
                    data.features && data.features.length > 0
                        ? data.features
                        : undefined,
                daily_rate: Number(data.daily_rate),
                security_deposit: data.security_deposit
                    ? Number(data.security_deposit)
                    : null,
                young_driver_age_threshold: data.young_driver_age_threshold
                    ? Number(data.young_driver_age_threshold)
                    : null,
                young_driver_deposit: data.young_driver_deposit
                    ? Number(data.young_driver_deposit)
                    : null,
                price_visible: data.price_visible,
                status: data.status as CreateVehicleData['status'],
                description: data.description?.trim() || undefined,
                condition_notes: data.condition_notes?.trim() || undefined,
                is_featured: data.is_featured,
            };

            //console.log('API payload', { payload });

            const res =
                isEditing && vehicle
                    ? await updateMutation.mutateAsync({
                          id: vehicle.id,
                          payload,
                      })
                    : await createMutation.mutateAsync(payload);

            //console.log('API response', res);

            const savedVehicle = res.data;

            if (onSuccess) {
                onSuccess(savedVehicle);
            } else {
                navigate(`/management/vehicles/${savedVehicle.id}`);
            }
        } catch (err) {
            applyServerErrors(err, setError);
        }
    };

    const isSaving =
        isSubmitting || createMutation.isPending || updateMutation.isPending;

    /* Render */
    return (
        <>
            {title}
            <div className="pb-4">
                <Form noValidate onSubmit={handleSubmit(onSubmit)}>
                    {Object.keys(errors).length > 0 && (
                        <Alert variant="danger" className="mb-3">
                            Please fix the highlighted errors before submitting.
                        </Alert>
                    )}

                    <Row>
                        {/* Main Column (col-xl-8) */}
                        <Col xl={8}>
                            {/* Vehicle Information */}
                            <div className="filter cm-content-box box-primary mb-3">
                                <div className="content-title">
                                    <div className="cpa">
                                        Vehicle Information
                                    </div>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() =>
                                            navigate('/management/vehicles')
                                        }
                                    >
                                        All Vehicles
                                    </Button>
                                </div>
                                <div className="cm-content-body form excerpt">
                                    <div className="card-body">
                                        <Row>
                                            <Col md={6} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Category{' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </Form.Label>
                                                    <Form.Select
                                                        className="tw:h-[2.9rem]"
                                                        {...register(
                                                            'category_id'
                                                        )}
                                                        isInvalid={
                                                            !!errors.category_id
                                                        }
                                                        disabled={
                                                            loadingCategories
                                                        }
                                                    >
                                                        <option value="">
                                                            {loadingCategories
                                                                ? 'Loading...'
                                                                : 'Select a category'}
                                                        </option>
                                                        {categories.map(cat => (
                                                            <option
                                                                key={cat.id}
                                                                value={cat.id}
                                                            >
                                                                {/*{cat.icon}{' '}*/}
                                                                {cat.name}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                    <Form.Control.Feedback type="invalid">
                                                        {
                                                            errors.category_id
                                                                ?.message
                                                        }
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>

                                            <Col md={6} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Branch
                                                    </Form.Label>
                                                    {!hasGlobalBranchAccess &&
                                                    userBranches.length ===
                                                        1 ? (
                                                        <Form.Control
                                                            readOnly
                                                            value={
                                                                userBranches[0]
                                                                    .name
                                                            }
                                                        />
                                                    ) : (
                                                        <Form.Select
                                                            className="tw:h-[2.9rem]"
                                                            {...register(
                                                                'branch_id'
                                                            )}
                                                            isInvalid={
                                                                !!errors.branch_id
                                                            }
                                                        >
                                                            <option value="">
                                                                Select a branch
                                                            </option>
                                                            {branchOptions.map(
                                                                b => (
                                                                    <option
                                                                        key={
                                                                            b.id
                                                                        }
                                                                        value={
                                                                            b.id
                                                                        }
                                                                    >
                                                                        {b.name}
                                                                    </option>
                                                                )
                                                            )}
                                                        </Form.Select>
                                                    )}
                                                    <Form.Control.Feedback type="invalid">
                                                        {
                                                            errors.branch_id
                                                                ?.message
                                                        }
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>

                                            <Col md={6} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Vehicle Name{' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </Form.Label>
                                                    <Form.Control
                                                        {...register('name')}
                                                        isInvalid={
                                                            !!errors.name
                                                        }
                                                        placeholder="e.g. Toyota Camry 2024"
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.name?.message}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>

                                            <Col md={4} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Make{' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </Form.Label>
                                                    <Form.Control
                                                        {...register('make')}
                                                        isInvalid={
                                                            !!errors.make
                                                        }
                                                        placeholder="e.g. Toyota"
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.make?.message}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>

                                            <Col md={4} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Model{' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </Form.Label>
                                                    <Form.Control
                                                        {...register('model')}
                                                        isInvalid={
                                                            !!errors.model
                                                        }
                                                        placeholder="e.g. Camry"
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.model?.message}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>

                                            <Col md={4} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Year{' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        {...register('year')}
                                                        isInvalid={
                                                            !!errors.year
                                                        }
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.year?.message}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>

                                            <Col md={4} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Color{' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </Form.Label>
                                                    <Form.Control
                                                        {...register('color')}
                                                        isInvalid={
                                                            !!errors.color
                                                        }
                                                        placeholder="e.g. White"
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.color?.message}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>

                                            <Col md={4} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        License Plate{' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </Form.Label>
                                                    <Form.Control
                                                        {...register(
                                                            'license_plate'
                                                        )}
                                                        isInvalid={
                                                            !!errors.license_plate
                                                        }
                                                        placeholder="e.g. GR-1234-24"
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {
                                                            errors.license_plate
                                                                ?.message
                                                        }
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>

                                            <Col md={4} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>VIN</Form.Label>
                                                    <Form.Control
                                                        {...register('vin')}
                                                        isInvalid={!!errors.vin}
                                                        placeholder="Optional"
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.vin?.message}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </div>
                                </div>
                            </div>

                            {/* Documents */}
                            <div className="filter cm-content-box box-primary mb-3">
                                <div className="content-title">
                                    <div className="cpa">Documents</div>
                                </div>
                                <div className="cm-content-body form excerpt">
                                    <div className="card-body">
                                        <Row>
                                            <Col md={6} className="mb-3">
                                                <Form.Group>
                                                    <div className="d-flex align-items-center gap-2 mb-2">
                                                        <Controller
                                                            name="has_insurance"
                                                            control={control}
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <Form.Check
                                                                    type="switch"
                                                                    id="has_insurance"
                                                                    label="Has Valid Insurance"
                                                                    checked={
                                                                        field.value ??
                                                                        false
                                                                    }
                                                                    onChange={e => {
                                                                        field.onChange(
                                                                            e
                                                                        );
                                                                        if (
                                                                            !e
                                                                                .target
                                                                                .checked
                                                                        )
                                                                            setValue(
                                                                                'insurance_expiry_date',
                                                                                ''
                                                                            );
                                                                    }}
                                                                />
                                                            )}
                                                        />
                                                    </div>
                                                    {hasInsurance && (
                                                        <>
                                                            <Form.Label className="small text-muted">
                                                                Insurance Expiry
                                                                Date
                                                            </Form.Label>
                                                            <Controller
                                                                name="insurance_expiry_date"
                                                                control={
                                                                    control
                                                                }
                                                                render={({
                                                                    field,
                                                                }) => (
                                                                    <DatePickerField
                                                                        value={
                                                                            field.value ??
                                                                            ''
                                                                        }
                                                                        onChange={
                                                                            field.onChange
                                                                        }
                                                                        isInvalid={
                                                                            !!errors.insurance_expiry_date
                                                                        }
                                                                        placeholder="Select expiry date"
                                                                        minDate={
                                                                            new Date()
                                                                        }
                                                                    />
                                                                )}
                                                            />
                                                            {errors.insurance_expiry_date && (
                                                                <div className="invalid-feedback d-block">
                                                                    {
                                                                        errors
                                                                            .insurance_expiry_date
                                                                            .message
                                                                    }
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </Form.Group>
                                            </Col>

                                            <Col md={6} className="mb-3">
                                                <Form.Group>
                                                    <div className="d-flex align-items-center gap-2 mb-2">
                                                        <Controller
                                                            name="has_roadworthy"
                                                            control={control}
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <Form.Check
                                                                    type="switch"
                                                                    id="has_roadworthy"
                                                                    label="Has Roadworthy Cert"
                                                                    checked={
                                                                        field.value ??
                                                                        false
                                                                    }
                                                                    onChange={e => {
                                                                        field.onChange(
                                                                            e
                                                                        );
                                                                        if (
                                                                            !e
                                                                                .target
                                                                                .checked
                                                                        )
                                                                            setValue(
                                                                                'roadworthy_expiry_date',
                                                                                ''
                                                                            );
                                                                    }}
                                                                />
                                                            )}
                                                        />
                                                    </div>
                                                    {hasRoadworthy && (
                                                        <>
                                                            <Form.Label className="small text-muted">
                                                                Roadworthy
                                                                Expiry Date
                                                            </Form.Label>
                                                            <Controller
                                                                name="roadworthy_expiry_date"
                                                                control={
                                                                    control
                                                                }
                                                                render={({
                                                                    field,
                                                                }) => (
                                                                    <DatePickerField
                                                                        value={
                                                                            field.value ??
                                                                            ''
                                                                        }
                                                                        onChange={
                                                                            field.onChange
                                                                        }
                                                                        isInvalid={
                                                                            !!errors.roadworthy_expiry_date
                                                                        }
                                                                        placeholder="Select expiry date"
                                                                        minDate={
                                                                            new Date()
                                                                        }
                                                                    />
                                                                )}
                                                            />
                                                            {errors.roadworthy_expiry_date && (
                                                                <div className="invalid-feedback d-block">
                                                                    {
                                                                        errors
                                                                            .roadworthy_expiry_date
                                                                            .message
                                                                    }
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </div>
                                </div>
                            </div>

                            {/* Technical Specifications */}
                            <div className="filter cm-content-box box-primary mb-3">
                                <div className="content-title">
                                    <div className="cpa">
                                        Technical Specifications
                                    </div>
                                </div>
                                <div className="cm-content-body form excerpt">
                                    <div className="card-body">
                                        <Row>
                                            <Col md={4} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Seats{' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        {...register('seats')}
                                                        isInvalid={
                                                            !!errors.seats
                                                        }
                                                        min={1}
                                                        max={50}
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.seats?.message}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>

                                            <Col md={4} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Fuel Type
                                                    </Form.Label>
                                                    <Form.Select
                                                        className="tw:h-[2.9rem]"
                                                        {...register(
                                                            'fuel_type'
                                                        )}
                                                        isInvalid={
                                                            !!errors.fuel_type
                                                        }
                                                    >
                                                        <option value="petrol">
                                                            Petrol
                                                        </option>
                                                        <option value="diesel">
                                                            Diesel
                                                        </option>
                                                        <option value="electric">
                                                            Electric
                                                        </option>
                                                        <option value="hybrid">
                                                            Hybrid
                                                        </option>
                                                    </Form.Select>
                                                    <Form.Control.Feedback type="invalid">
                                                        {
                                                            errors.fuel_type
                                                                ?.message
                                                        }
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>

                                            <Col md={4} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Engine Size
                                                    </Form.Label>
                                                    <Form.Control
                                                        {...register(
                                                            'engine_size'
                                                        )}
                                                        isInvalid={
                                                            !!errors.engine_size
                                                        }
                                                        placeholder="e.g. 2.5L"
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {
                                                            errors.engine_size
                                                                ?.message
                                                        }
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>

                                            <Col md={4} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Odometer (km)
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        {...register(
                                                            'odometer'
                                                        )}
                                                        isInvalid={
                                                            !!errors.odometer
                                                        }
                                                        min={0}
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {
                                                            errors.odometer
                                                                ?.message
                                                        }
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>

                                            <Col md={4} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Transmission
                                                    </Form.Label>
                                                    <Form.Select
                                                        className="tw:h-[2.9rem]"
                                                        {...register(
                                                            'transmission'
                                                        )}
                                                        isInvalid={
                                                            !!errors.transmission
                                                        }
                                                    >
                                                        <option value="automatic">
                                                            Automatic
                                                        </option>
                                                        <option value="manual">
                                                            Manual
                                                        </option>
                                                    </Form.Select>
                                                    <Form.Control.Feedback type="invalid">
                                                        {
                                                            errors.transmission
                                                                ?.message
                                                        }
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </div>
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="filter cm-content-box box-primary mb-3">
                                <div className="content-title">
                                    <div className="cpa">Pricing</div>
                                </div>
                                <div className="cm-content-body form excerpt">
                                    <div className="card-body">
                                        <Row>
                                            <Col md={4} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Daily Rate ({currency}){' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        {...register(
                                                            'daily_rate'
                                                        )}
                                                        isInvalid={
                                                            !!errors.daily_rate
                                                        }
                                                        placeholder="0.00"
                                                        step="0.01"
                                                        min={0}
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {
                                                            errors.daily_rate
                                                                ?.message
                                                        }
                                                    </Form.Control.Feedback>
                                                    <Form.Text className="text-muted">
                                                        Base rate per day in {currency}. Used to calculate rental cost before addons and discounts.
                                                    </Form.Text>
                                                </Form.Group>
                                            </Col>

                                            <Col md={4} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Security Deposit (
                                                        {currency})
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        {...register(
                                                            'security_deposit'
                                                        )}
                                                        placeholder="Optional"
                                                        step="0.01"
                                                        min={0}
                                                    />
                                                    <Form.Text className="text-muted">
                                                        Overrides category and
                                                        global deposit. Leave
                                                        blank to use
                                                        category/global default.
                                                    </Form.Text>
                                                </Form.Group>
                                            </Col>

                                            <Col md={4} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Young Driver Age
                                                        Threshold
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        {...register(
                                                            'young_driver_age_threshold'
                                                        )}
                                                        placeholder="e.g. 25"
                                                        min={16}
                                                        max={35}
                                                        step={1}
                                                    />
                                                    <Form.Text className="text-muted">
                                                        Customers below this age
                                                        pay the young driver
                                                        deposit instead.
                                                    </Form.Text>
                                                </Form.Group>
                                            </Col>

                                            <Col md={4} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Young Driver Deposit (
                                                        {currency})
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        {...register(
                                                            'young_driver_deposit'
                                                        )}
                                                        placeholder="Optional"
                                                        step="0.01"
                                                        min={0}
                                                    />
                                                    <Form.Text className="text-muted">
                                                        Deposit charged to young
                                                        drivers.
                                                    </Form.Text>
                                                </Form.Group>
                                            </Col>

                                            <Col md={12}>
                                                <Controller
                                                    name="price_visible"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Form.Check
                                                            type="checkbox"
                                                            id="price_visible"
                                                            label="Show prices publicly on the website"
                                                            checked={
                                                                field.value
                                                            }
                                                            onChange={
                                                                field.onChange
                                                            }
                                                        />
                                                    )}
                                                />
                                            </Col>
                                        </Row>
                                    </div>
                                </div>
                            </div>
                        </Col>
                        {/* end col-xl-8 */}

                        {/* Sidebar Column (col-xl-4) */}
                        <Col xl={4}>
                            {/* Status & Features */}
                            <div className="filter cm-content-box box-primary mb-3">
                                <div className="content-title">
                                    <div className="cpa">
                                        Status &amp; Features
                                    </div>
                                </div>
                                <div className="cm-content-body form excerpt">
                                    <div className="card-body">
                                        <Row>
                                            <Col md={6} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Status
                                                    </Form.Label>
                                                    {isVehicleInMaintenance ? (
                                                        <>
                                                            <Form.Control
                                                                readOnly
                                                                value="In Maintenance"
                                                                className="bg-warning-subtle text-warning-emphasis fw-semibold"
                                                            />
                                                            <Form.Text className="text-muted">
                                                                Use "Complete
                                                                Maintenance" to
                                                                mark as
                                                                available.
                                                            </Form.Text>
                                                            <div className="mt-2">
                                                                <Button
                                                                    type="button"
                                                                    variant="outline-warning"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        setShowMaintenanceModal(
                                                                            true
                                                                        )
                                                                    }
                                                                >
                                                                    Complete
                                                                    Maintenance
                                                                </Button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Form.Select
                                                                className="tw:h-[2.9rem]"
                                                                {...register(
                                                                    'status'
                                                                )}
                                                                isInvalid={
                                                                    !!errors.status
                                                                }
                                                            >
                                                                <option value="available">
                                                                    Available
                                                                </option>
                                                                <option value="rented">
                                                                    Rented
                                                                </option>
                                                                <option value="maintenance">
                                                                    Maintenance
                                                                </option>
                                                                <option value="pending_approval">
                                                                    Pending
                                                                    Approval
                                                                </option>
                                                                <option value="unavailable">
                                                                    Unavailable
                                                                </option>
                                                                <option value="retired">
                                                                    Retired
                                                                </option>
                                                            </Form.Select>
                                                            <Form.Control.Feedback type="invalid">
                                                                {
                                                                    errors
                                                                        .status
                                                                        ?.message
                                                                }
                                                            </Form.Control.Feedback>
                                                        </>
                                                    )}
                                                </Form.Group>
                                            </Col>

                                            <Col md={12} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Features
                                                    </Form.Label>
                                                    <div
                                                        className="border rounded p-3"
                                                        style={{
                                                            maxHeight: '250px',
                                                            overflowY: 'auto',
                                                        }}
                                                    >
                                                        <Row>
                                                            {loadingFeatures ? (
                                                                <div className="text-center py-3 text-muted">
                                                                    <Spinner
                                                                        animation="border"
                                                                        size="sm"
                                                                        className="me-2"
                                                                    />
                                                                    Loading
                                                                    features...
                                                                </div>
                                                            ) : activeFeatures.length ===
                                                              0 ? (
                                                                <div className="text-center py-3 text-muted small">
                                                                    No features
                                                                    available.{' '}
                                                                    <a
                                                                        href="/management/features"
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                    >
                                                                        Manage
                                                                        Features
                                                                    </a>
                                                                </div>
                                                            ) : (
                                                                activeFeatures.map(
                                                                    feature => (
                                                                        <Col
                                                                            md={
                                                                                4
                                                                            }
                                                                            sm={
                                                                                6
                                                                            }
                                                                            key={
                                                                                feature.id
                                                                            }
                                                                            className="mb-2"
                                                                        >
                                                                            <Form.Check
                                                                                type="checkbox"
                                                                                id={`feature-${feature.id}`}
                                                                                label={
                                                                                    <span className="d-inline-flex align-items-center gap-1">
                                                                                        {
                                                                                            feature.name
                                                                                        }
                                                                                    </span>
                                                                                }
                                                                                checked={
                                                                                    selectedFeatures?.includes(
                                                                                        feature.name
                                                                                    ) ||
                                                                                    false
                                                                                }
                                                                                onChange={() =>
                                                                                    toggleFeature(
                                                                                        feature.name
                                                                                    )
                                                                                }
                                                                            />
                                                                        </Col>
                                                                    )
                                                                )
                                                            )}
                                                        </Row>
                                                    </div>
                                                    <Form.Text className="text-muted">
                                                        {selectedFeatures?.length ||
                                                            0}{' '}
                                                        feature
                                                        {selectedFeatures?.length !==
                                                        1
                                                            ? 's'
                                                            : ''}{' '}
                                                        selected
                                                    </Form.Text>
                                                </Form.Group>
                                            </Col>

                                            <Col md={12} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Description
                                                    </Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={4}
                                                        {...register(
                                                            'description'
                                                        )}
                                                        isInvalid={
                                                            !!errors.description
                                                        }
                                                        placeholder="Describe this vehicle for customers..."
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {
                                                            errors.description
                                                                ?.message
                                                        }
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>

                                            <Col md={12} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Condition Notes
                                                    </Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={3}
                                                        {...register(
                                                            'condition_notes'
                                                        )}
                                                        isInvalid={
                                                            !!errors.condition_notes
                                                        }
                                                        placeholder="Any notes about the vehicle condition..."
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {
                                                            errors
                                                                .condition_notes
                                                                ?.message
                                                        }
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>

                                            <Col md={12}>
                                                <Controller
                                                    name="is_featured"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Form.Check
                                                            type="switch"
                                                            id="is_featured"
                                                            label="Mark as featured vehicle"
                                                            checked={
                                                                field.value
                                                            }
                                                            onChange={
                                                                field.onChange
                                                            }
                                                        />
                                                    )}
                                                />
                                            </Col>
                                        </Row>
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="filter cm-content-box box-primary mb-3">
                                <div className="cm-content-body form excerpt">
                                    <div className="card-body d-flex justify-content-end gap-2">
                                        {onCancel && (
                                            <Button
                                                variant="light"
                                                type="button"
                                                onClick={onCancel}
                                                disabled={isSaving}
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                        <Button
                                            variant="primary"
                                            type="submit"
                                            disabled={isSaving}
                                        >
                                            {isSaving ? (
                                                <>
                                                    <Spinner
                                                        animation="border"
                                                        size="sm"
                                                        className="me-1"
                                                    />
                                                    Saving...
                                                </>
                                            ) : isEditing ? (
                                                'Update Vehicle'
                                            ) : (
                                                'Create Vehicle'
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Col>
                        {/* end col-xl-4 */}
                    </Row>
                </Form>

                {/* Maintenance completion modal - shown when vehicle is in maintenance */}
                {vehicle && isVehicleInMaintenance && (
                    <VehicleExpenseModal
                        mode="maintenance"
                        show={showMaintenanceModal}
                        onHide={() => setShowMaintenanceModal(false)}
                        vehicleId={vehicle.id}
                        vehicleName={vehicle.name}
                    />
                )}
            </div>
        </>
    );
}
