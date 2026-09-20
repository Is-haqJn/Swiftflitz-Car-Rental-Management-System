import { useEffect } from 'react';
import { Card, Form, Row, Col, Button, Alert } from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import {
    useAirportLocation,
    useCreateAirportLocation,
    useUpdateAirportLocation,
} from '@/shared/hooks/queries/useAirportLocations';
import { useActiveAirports } from '@/shared/hooks/queries/useAirports';
import { useActiveBranches } from '@/shared/hooks/queries/useBranches';
import { ROUTES } from '@/shared/routes';
import { applyServerErrors } from '@/shared/libs/utils';
import { useTitle } from '@/shared/hooks';

/* Schema */
const locationSchema = z
    .object({
        location_type: z.enum(['terminal', 'area']),
        name: z.string().min(1, 'Name is required'),
        airport_id: z.string().nullable().optional(),
        branch_id: z.string().nullable().optional(),
        has_charge: z.boolean(),
        charge_amount: z.number().nullable().optional(),
        is_active: z.boolean(),
    })
    .superRefine((data, ctx) => {
        if (data.location_type === 'terminal' && !data.airport_id) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Airport is required for terminal locations',
                path: ['airport_id'],
            });
        }
        if (data.location_type === 'area' && !data.branch_id) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Branch is required for area locations',
                path: ['branch_id'],
            });
        }
        if (data.has_charge && !data.charge_amount) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Charge amount is required when has charge is enabled',
                path: ['charge_amount'],
            });
        }
    });

type LocationFormData = z.infer<typeof locationSchema>;

/* Component */
export default function CreateAirportLocation() {
    const title = useTitle('Add Location');
    const { id } = useParams<{ id?: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();

    const { data: locationRes, isLoading: locationLoading } =
        useAirportLocation(id ?? '');
    const createMutation = useCreateAirportLocation();
    const updateMutation = useUpdateAirportLocation();

    const { data: airportsRes } = useActiveAirports();
    const { data: branchesRes } = useActiveBranches();
    const airports = airportsRes?.data ?? [];
    const branches = branchesRes?.data ?? [];

    const location = isEdit ? locationRes?.data : undefined;
    const isPending = createMutation.isPending || updateMutation.isPending;

    const {
        register,
        handleSubmit,
        control,
        reset,
        watch,
        setValue,
        setError,
        formState: { errors },
    } = useForm<LocationFormData>({
        resolver: zodResolver(locationSchema),
        defaultValues: {
            location_type: 'terminal',
            has_charge: false,
            is_active: true,
            airport_id: null,
            branch_id: null,
            charge_amount: null,
        },
    });

    const locationType = watch('location_type');
    const hasCharge = watch('has_charge');

    // Clear opposing FK when type switches
    useEffect(() => {
        if (locationType === 'terminal') {
            setValue('branch_id', null);
        } else {
            setValue('airport_id', null);
        }
    }, [locationType, setValue]);

    useEffect(() => {
        if (location) {
            reset({
                location_type: location.location_type,
                name: location.name,
                airport_id: location.airport_id,
                branch_id: location.branch_id,
                has_charge: location.has_charge,
                charge_amount: location.charge_amount
                    ? parseFloat(location.charge_amount)
                    : null,
                is_active: location.is_active,
            });
        }
    }, [location?.id, reset]); // eslint-disable-line react-hooks/exhaustive-deps

    const onSubmit = (data: LocationFormData) => {
        const payload = {
            location_type: data.location_type,
            name: data.name,
            airport_id:
                data.location_type === 'terminal' ? data.airport_id : null,
            branch_id: data.location_type === 'area' ? data.branch_id : null,
            has_charge: data.has_charge,
            charge_amount: data.has_charge ? data.charge_amount : null,
            is_active: data.is_active,
        };

        if (isEdit) {
            updateMutation.mutate(
                { id: id!, payload },
                {
                    onSuccess: () =>
                        navigate(
                            ROUTES.DASHBOARD.AIRPORT_TRANSFER.LOCATIONS.ROOT
                        ),
                    onError: error => applyServerErrors(error, setError),
                }
            );
        } else {
            createMutation.mutate(payload, {
                onSuccess: () =>
                    navigate(ROUTES.DASHBOARD.AIRPORT_TRANSFER.LOCATIONS.ROOT),
                onError: error => applyServerErrors(error, setError),
            });
        }
    };

    if (isEdit && locationLoading) {
        return <SettingsFormSkeleton />;
    }

    if (isEdit && !location) {
        return <Alert variant="danger">Location not found.</Alert>;
    }

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>{isEdit ? 'Edit Location' : 'Add Location'}</h4>
                <p className="text-muted mb-0">
                    {isEdit
                        ? 'Update airport location details.'
                        : 'Add a terminal or area location for airport transfers.'}
                </p>
            </div>

            <Form onSubmit={handleSubmit(onSubmit)}>
                {(createMutation.isError || updateMutation.isError) && (
                    <Alert variant="danger" className="mb-3">
                        Failed to save location. Please check your inputs and
                        try again.
                    </Alert>
                )}

                <Card className="mb-3">
                    <Card.Header>
                        <h5 className="mb-0">Location Details</h5>
                    </Card.Header>
                    <Card.Body>
                        <Row className="g-3">
                            {/* Location Type */}
                            <Col md={12}>
                                <Form.Label className="fw-semibold">
                                    Location Type{' '}
                                    <span className="text-danger">*</span>
                                </Form.Label>
                                <div className="d-flex gap-4">
                                    <Controller
                                        name="location_type"
                                        control={control}
                                        render={({ field }) => (
                                            <>
                                                <Form.Check
                                                    type="radio"
                                                    id="type-terminal"
                                                    label="Terminal (linked to an airport)"
                                                    checked={
                                                        field.value ===
                                                        'terminal'
                                                    }
                                                    onChange={() =>
                                                        field.onChange(
                                                            'terminal'
                                                        )
                                                    }
                                                />
                                                <Form.Check
                                                    type="radio"
                                                    id="type-area"
                                                    label="Area (linked to a branch)"
                                                    checked={
                                                        field.value === 'area'
                                                    }
                                                    onChange={() =>
                                                        field.onChange('area')
                                                    }
                                                />
                                            </>
                                        )}
                                    />
                                </div>
                            </Col>

                            {/* Name */}
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>
                                        Location Name{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        {...register('name')}
                                        isInvalid={!!errors.name}
                                        placeholder="e.g. Terminal 3 International"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.name?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            {/* Airport dropdown - shown when terminal */}
                            {locationType === 'terminal' && (
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>
                                            Airport{' '}
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </Form.Label>
                                        <Controller
                                            name="airport_id"
                                            control={control}
                                            render={({ field }) => (
                                                <Form.Select
                                                    className="tw:h-[2.9rem]"
                                                    value={field.value ?? ''}
                                                    onChange={e =>
                                                        field.onChange(
                                                            e.target.value ||
                                                                null
                                                        )
                                                    }
                                                    isInvalid={
                                                        !!errors.airport_id
                                                    }
                                                >
                                                    <option value="">
                                                        - Select airport -
                                                    </option>
                                                    {airports.map(airport => (
                                                        <option
                                                            key={airport.id}
                                                            value={airport.id}
                                                        >
                                                            {airport.name} (
                                                            {airport.city})
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            )}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.airport_id?.message}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            )}

                            {/* Branch dropdown - shown when area */}
                            {locationType === 'area' && (
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>
                                            Branch{' '}
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </Form.Label>
                                        <Controller
                                            name="branch_id"
                                            control={control}
                                            render={({ field }) => (
                                                <Form.Select
                                                    className="tw:h-[2.9rem]"
                                                    value={field.value ?? ''}
                                                    onChange={e =>
                                                        field.onChange(
                                                            e.target.value ||
                                                                null
                                                        )
                                                    }
                                                    isInvalid={
                                                        !!errors.branch_id
                                                    }
                                                >
                                                    <option value="">
                                                        - Select branch -
                                                    </option>
                                                    {branches.map(branch => (
                                                        <option
                                                            key={branch.id}
                                                            value={branch.id}
                                                        >
                                                            {branch.name}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            )}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.branch_id?.message}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            )}

                            {/* Charge */}
                            <Col md={3} className="d-flex align-items-end pb-1">
                                <Controller
                                    name="has_charge"
                                    control={control}
                                    render={({ field }) => (
                                        <Form.Check
                                            type="switch"
                                            id="has_charge"
                                            label="Has Charge"
                                            checked={field.value}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </Col>

                            {hasCharge && (
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>
                                            Charge Amount{' '}
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </Form.Label>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            {...register('charge_amount', {
                                                valueAsNumber: true,
                                            })}
                                            isInvalid={!!errors.charge_amount}
                                            placeholder="0.00"
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.charge_amount?.message}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            )}

                            <Col md={3} className="d-flex align-items-end pb-1">
                                <Controller
                                    name="is_active"
                                    control={control}
                                    render={({ field }) => (
                                        <Form.Check
                                            type="switch"
                                            id="is_active"
                                            label="Active"
                                            checked={field.value}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <div className="d-flex justify-content-end gap-2">
                    <Button
                        variant="outline-secondary"
                        onClick={() =>
                            navigate(
                                ROUTES.DASHBOARD.AIRPORT_TRANSFER.LOCATIONS.ROOT
                            )
                        }
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={isPending}
                    >
                        {isPending
                            ? 'Saving...'
                            : isEdit
                              ? 'Save Changes'
                              : 'Create Location'}
                    </Button>
                </div>
            </Form>
        </div>
    );
}
