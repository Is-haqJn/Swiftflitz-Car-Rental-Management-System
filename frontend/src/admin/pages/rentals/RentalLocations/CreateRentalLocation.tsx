import { useEffect } from 'react';
import { Fragment } from 'react';
import { Row, Col, Form, Card, Button, Spinner } from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '@/shared/routes';
import type { RentalLocation } from '@/shared/types/rental-location.types';
import {
    useCreateRentalLocation,
    useUpdateRentalLocation,
    useRentalLocation,
} from '@/shared/hooks/queries/useRentalLocations';
import { useActiveBranches } from '@/shared/hooks/queries/useBranches';
import { selectAuthUser } from '@/store/slices/authSlice';
import { useTitle } from '@/shared/hooks';
import { applyServerErrors } from '@/shared/libs/utils';
import { useCurrency } from '@/shared/hooks/queries/useSettings';

/* Types */
interface LocationFormData {
    branch_id: string;
    name: string;
    pickup_charge: string;
    dropoff_charge: string;
    is_default: boolean;
    is_pickup: boolean;
    is_dropoff: boolean;
    is_active: boolean;
}

interface CreateRentalLocationProps {
    location?: RentalLocation | null;
    onSuccess?: (location: RentalLocation) => void;
    onCancel?: () => void;
}

/* Helpers */
function locationToFormDefaults(loc: RentalLocation): LocationFormData {
    return {
        branch_id: loc.branch_id ?? '',
        name: loc.name,
        pickup_charge:
            loc.pickup_charge != null ? String(loc.pickup_charge) : '',
        dropoff_charge:
            loc.dropoff_charge != null ? String(loc.dropoff_charge) : '',
        is_default: loc.is_default,
        is_pickup: loc.is_pickup,
        is_dropoff: loc.is_dropoff,
        is_active: loc.is_active,
    };
}

/* Main Component */
export default function CreateRentalLocation({
    location: locationProp,
    onSuccess,
    onCancel,
}: CreateRentalLocationProps) {
    const currency = useCurrency();
    const navigate = useNavigate();
    const { id: routeId } = useParams<{ id: string }>();

    // Fetch location when accessed via edit route (no prop passed)
    const { data: fetchedLocationRes, isLoading: loadingLocation } =
        useRentalLocation(routeId ?? '');
    const fetchedLocation = fetchedLocationRes?.data;

    const location = locationProp ?? fetchedLocation ?? null;
    const isEditing = Boolean(location);
    const title = useTitle(isEditing ? 'Edit Location' : 'Add Location');

    const authUser = useSelector(selectAuthUser);
    const userBranches = authUser?.branches ?? [];
    const hasGlobalBranchAccess = !userBranches.length;
    const showBranchSelector = hasGlobalBranchAccess || userBranches.length > 1;

    const { data: branchesResponse } = useActiveBranches();
    const allBranches = branchesResponse?.data ?? [];

    const {
        register,
        handleSubmit,
        setError,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<LocationFormData>({
        defaultValues: {
            branch_id:
                !hasGlobalBranchAccess && userBranches.length === 1
                    ? userBranches[0].id
                    : '',
            name: '',
            pickup_charge: '',
            dropoff_charge: '',
            is_default: false,
            is_pickup: true,
            is_dropoff: true,
            is_active: true,
        },
    });

    // Populate form once location data is available (prop or fetched)
    useEffect(() => {
        if (location?.id) {
            reset(locationToFormDefaults(location));
        }
    }, [location?.id, reset]);

    const createMutation = useCreateRentalLocation();
    const updateMutation = useUpdateRentalLocation();
    const isBusy = createMutation.isPending || updateMutation.isPending;

    const onSubmit = async (data: LocationFormData) => {
        const payload = {
            branch_id: data.branch_id,
            name: data.name,
            pickup_charge:
                data.pickup_charge !== '' ? Number(data.pickup_charge) : null,
            dropoff_charge:
                data.dropoff_charge !== '' ? Number(data.dropoff_charge) : null,
            is_default: data.is_default,
            is_pickup: data.is_pickup,
            is_dropoff: data.is_dropoff,
            is_active: data.is_active,
        };

        if (isEditing && location?.id) {
            const { branch_id: _b, ...updatePayload } = payload;
            updateMutation.mutate(
                { id: location.id, payload: updatePayload },
                {
                    onSuccess: res => {
                        onSuccess?.(res.data) ??
                            navigate(ROUTES.DASHBOARD.RENTALS.RENTAL_LOCATIONS);
                    },
                    onError: (err: unknown) => applyServerErrors(err, setError),
                }
            );
        } else {
            createMutation.mutate(payload, {
                onSuccess: res => {
                    onSuccess?.(res.data) ??
                        navigate(ROUTES.DASHBOARD.RENTALS.RENTAL_LOCATIONS);
                },
                onError: (err: unknown) => applyServerErrors(err, setError),
            });
        }
    };

    /* Render */
    if (routeId && loadingLocation) {
        return <SettingsFormSkeleton />;
    }

    return (
        <Fragment>
            {title}
            <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                {/* Location Details */}
                <Card className="mb-4">
                    <Card.Header>
                        <Card.Title>
                            {isEditing ? 'Edit Location' : 'New Location'}
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
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </Form.Label>
                                        <Form.Select
                                            {...register('branch_id', {
                                                required: 'Branch is required',
                                            })}
                                            isInvalid={!!errors.branch_id}
                                            disabled={isEditing}
                                        >
                                            <option value="">
                                                Select branch…
                                            </option>
                                            {hasGlobalBranchAccess
                                                ? allBranches.map(b => (
                                                      <option
                                                          key={b.id}
                                                          value={b.id}
                                                      >
                                                          {b.name}
                                                      </option>
                                                  ))
                                                : userBranches.map(b => (
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

                            {/* Location name */}
                            <Col
                                md={showBranchSelector ? 6 : 12}
                                className="mb-3"
                            >
                                <Form.Group>
                                    <Form.Label>
                                        Location Name{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        placeholder="e.g. Accra Main Office"
                                        {...register('name', {
                                            required:
                                                'Location name is required',
                                        })}
                                        isInvalid={!!errors.name}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.name?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Charges */}
                        <Row>
                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        Pickup Charge ({currency}) - optional
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        {...register('pickup_charge', {
                                            min: {
                                                value: 0,
                                                message: 'Must be 0 or greater',
                                            },
                                        })}
                                        isInvalid={!!errors.pickup_charge}
                                    />
                                    <Form.Text className="text-muted">
                                        Added when this location is chosen as
                                        pickup
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.pickup_charge?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        Dropoff Charge ({currency}) - optional
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        {...register('dropoff_charge', {
                                            min: {
                                                value: 0,
                                                message: 'Must be 0 or greater',
                                            },
                                        })}
                                        isInvalid={!!errors.dropoff_charge}
                                    />
                                    <Form.Text className="text-muted">
                                        Added when this location is chosen as
                                        dropoff
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.dropoff_charge?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Toggles */}
                <Card className="mb-4">
                    <Card.Header>
                        <Card.Title>Settings</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={3} className="mb-3">
                                <Form.Group>
                                    <Form.Check
                                        type="switch"
                                        id="is_default"
                                        label="Set as Default"
                                        {...register('is_default')}
                                    />
                                    <Form.Text className="text-muted d-block mt-1">
                                        Auto-selected in booking forms for this
                                        branch
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={3} className="mb-3">
                                <Form.Group>
                                    <Form.Check
                                        type="switch"
                                        id="is_pickup"
                                        label="Available for Pickup"
                                        {...register('is_pickup')}
                                    />
                                    <Form.Text className="text-muted d-block mt-1">
                                        Shown in pickup location dropdown
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={3} className="mb-3">
                                <Form.Group>
                                    <Form.Check
                                        type="switch"
                                        id="is_dropoff"
                                        label="Available for Dropoff"
                                        {...register('is_dropoff')}
                                    />
                                    <Form.Text className="text-muted d-block mt-1">
                                        Shown in dropoff location dropdown
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={3} className="mb-3">
                                <Form.Group>
                                    <Form.Check
                                        type="switch"
                                        id="is_active"
                                        label="Active"
                                        {...register('is_active')}
                                    />
                                    <Form.Text className="text-muted d-block mt-1">
                                        Inactive locations are hidden from all
                                        selection
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
                            navigate(ROUTES.DASHBOARD.RENTALS.RENTAL_LOCATIONS)
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
                            'Create Location'
                        )}
                    </Button>
                </div>
            </Form>
        </Fragment>
    );
}
