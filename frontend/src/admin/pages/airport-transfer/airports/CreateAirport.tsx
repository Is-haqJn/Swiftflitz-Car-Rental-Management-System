import { useEffect, useState } from 'react';
import { Card, Form, Row, Col, Button, Alert } from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    useAirport,
    useCreateAirport,
    useUpdateAirport,
} from '@/shared/hooks/queries/useAirports';
import { useActiveBranches } from '@/shared/hooks/queries/useBranches';
import { selectAuthUser } from '@/store/slices/authSlice';
import { ROUTES } from '@/shared/routes';
import { applyServerErrors } from '@/shared/libs/utils';
import { useTitle } from '@/shared/hooks';

/* Schema */
const airportSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    city: z.string().min(1, 'City is required'),
    country: z.string().min(1, 'Country is required'),
    is_active: z.boolean(),
    vat_rate: z.number().min(0).max(100).nullable().optional(),
    branch_ids: z.array(z.string()).optional(),
});

type AirportFormData = z.infer<typeof airportSchema>;

/* Component */
export default function CreateAirport() {
    const title = useTitle('Add Airport');
    const { id } = useParams<{ id?: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();

    const { data: airportRes, isLoading: airportLoading } = useAirport(
        id ?? ''
    );
    const createMutation = useCreateAirport();
    const updateMutation = useUpdateAirport();

    const authUser = useSelector(selectAuthUser);
    /* Global users (no branch assignments) can assign to any branch. */
    const hasGlobalBranchAccess = !(authUser?.branches?.length ?? 0);

    const { data: branchesRes } = useActiveBranches();
    const activeBranches = branchesRes?.data ?? [];

    /* Global users always see the branch selector; restricted users auto-link when they have 1. */
    const showBranchSelector =
        hasGlobalBranchAccess || activeBranches.length > 1;
    const autoLinkBranch =
        !hasGlobalBranchAccess && activeBranches.length === 1
            ? activeBranches[0]
            : null;

    const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);

    const airport = isEdit ? airportRes?.data : undefined;
    const isPending = createMutation.isPending || updateMutation.isPending;

    const {
        register,
        handleSubmit,
        control,
        reset,
        setError,
        formState: { errors },
    } = useForm<AirportFormData>({
        resolver: zodResolver(airportSchema),
        defaultValues: { is_active: true },
    });

    useEffect(() => {
        if (airport) {
            reset({
                name: airport.name,
                city: airport.city,
                country: airport.country,
                is_active: airport.is_active,
                vat_rate:
                    airport.vat_rate != null
                        ? parseFloat(airport.vat_rate)
                        : undefined,
            });
        }
    }, [airport?.id, reset]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleToggleBranch = (branchId: string) => {
        setSelectedBranchIds(prev =>
            prev.includes(branchId)
                ? prev.filter(id => id !== branchId)
                : [...prev, branchId]
        );
    };

    const onSubmit = (data: AirportFormData) => {
        if (isEdit) {
            updateMutation.mutate(
                { id: id!, payload: data },
                {
                    onSuccess: () =>
                        navigate(
                            ROUTES.DASHBOARD.AIRPORT_TRANSFER.AIRPORTS.ROOT
                        ),
                    onError: error => applyServerErrors(error, setError),
                }
            );
        } else {
            const payload = {
                ...data,
                // Auto-link case handled by backend; pass selection when selector shown
                branch_ids: showBranchSelector ? selectedBranchIds : [],
            };
            createMutation.mutate(payload, {
                onSuccess: () =>
                    navigate(ROUTES.DASHBOARD.AIRPORT_TRANSFER.AIRPORTS.ROOT),
                onError: error => applyServerErrors(error, setError),
            });
        }
    };

    if (isEdit && airportLoading) {
        return <SettingsFormSkeleton />;
    }

    if (isEdit && !airport) {
        return <Alert variant="danger">Airport not found.</Alert>;
    }

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>{isEdit ? 'Edit Airport' : 'Add Airport'}</h4>
                <p className="text-muted mb-0">
                    {isEdit
                        ? 'Update airport information.'
                        : 'Register a new airport for transfers.'}
                </p>
            </div>

            <Form onSubmit={handleSubmit(onSubmit)}>
                {(createMutation.isError || updateMutation.isError) && (
                    <Alert variant="danger" className="mb-3">
                        Failed to save airport. Please check your inputs and try
                        again.
                    </Alert>
                )}

                <Card className="mb-3">
                    <Card.Header>
                        <h5 className="mb-0">Airport Information</h5>
                    </Card.Header>
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>
                                        Airport Name{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        {...register('name')}
                                        isInvalid={!!errors.name}
                                        placeholder="e.g. Kotoka International Airport"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.name?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>
                                        City{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        {...register('city')}
                                        isInvalid={!!errors.city}
                                        placeholder="e.g. Accra"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.city?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>
                                        Country{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        {...register('country')}
                                        isInvalid={!!errors.country}
                                        placeholder="e.g. Ghana"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.country?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label>VAT Rate (%)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        {...register('vat_rate', {
                                            valueAsNumber: true,
                                            setValueAs: v =>
                                                v === '' || isNaN(v)
                                                    ? null
                                                    : Number(v),
                                        })}
                                        isInvalid={!!errors.vat_rate}
                                        placeholder="e.g. 15"
                                    />
                                    <Form.Text className="text-muted">
                                        Leave blank to use global rate
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.vat_rate?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col
                                md={2}
                                className="d-flex align-items-center pb-1"
                            >
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

                {!isEdit && (
                    <Card className="mb-3">
                        <Card.Header>
                            <h5 className="mb-0">Branch Linking</h5>
                        </Card.Header>
                        <Card.Body>
                            {autoLinkBranch ? (
                                <Alert
                                    variant={
                                        autoLinkBranch.airport
                                            ? 'warning'
                                            : 'info'
                                    }
                                    className="mb-0"
                                >
                                    This airport will be automatically linked to{' '}
                                    <strong>{autoLinkBranch.name}</strong>.
                                    {autoLinkBranch.airport && (
                                        <div className="mt-1 small">
                                            Note: this branch currently serves{' '}
                                            <strong>
                                                {autoLinkBranch.airport.name}
                                            </strong>
                                            . Creating this airport will replace
                                            that link. Terminal locations under{' '}
                                            <strong>
                                                {autoLinkBranch.airport.name}
                                            </strong>{' '}
                                            will not be transferred.
                                        </div>
                                    )}
                                </Alert>
                            ) : showBranchSelector ? (
                                <>
                                    <p className="text-muted small mb-3">
                                        Select which branch(es) this airport
                                        serves. Leave empty to link later via
                                        branch settings.
                                    </p>
                                    <Row className="g-2">
                                        {activeBranches.map(branch => (
                                            <Col key={branch.id} md={4} xl={3}>
                                                <div>
                                                    <Form.Check
                                                        type="checkbox"
                                                        id={`branch-${branch.id}`}
                                                        label={branch.name}
                                                        checked={selectedBranchIds.includes(
                                                            branch.id
                                                        )}
                                                        onChange={() =>
                                                            handleToggleBranch(
                                                                branch.id
                                                            )
                                                        }
                                                    />
                                                    {branch.airport && (
                                                        <div className="text-warning small ms-4">
                                                            Currently serving:{' '}
                                                            {
                                                                branch.airport
                                                                    .name
                                                            }{' '}
                                                            - selecting this
                                                            will replace that
                                                            link
                                                        </div>
                                                    )}
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                </>
                            ) : null}
                        </Card.Body>
                    </Card>
                )}

                <div className="d-flex justify-content-end gap-2">
                    <Button
                        variant="outline-secondary"
                        onClick={() =>
                            navigate(
                                ROUTES.DASHBOARD.AIRPORT_TRANSFER.AIRPORTS.ROOT
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
                              : 'Create Airport'}
                    </Button>
                </div>
            </Form>
        </div>
    );
}
