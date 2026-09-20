import { useEffect, useState } from 'react';
import {
    Card,
    Form,
    Row,
    Col,
    Button,
    Spinner,
    Alert,
    InputGroup,
} from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import {
    useAirportPackage,
    useCreateAirportPackage,
    useUpdateAirportPackage,
    useUploadAirportPackagePhoto,
} from '@/shared/hooks/queries/useAirportPackages';
import { ROUTES } from '@/shared/routes';
import { applyServerErrors } from '@/shared/libs/utils';
import { useTitle } from '@/shared/hooks';
import { FaPlane } from 'react-icons/fa6';

/* Schema */
const packageSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional().or(z.literal('')),
    features: z
        .array(
            z.object({
                value: z.string().min(1, 'Feature cannot be empty'),
            })
        )
        .min(1, 'At least one feature is required'),
    is_available_for_pickup: z.boolean(),
    is_available_for_dropoff: z.boolean(),
    auto_assign_vehicle: z.boolean(),
    is_active: z.boolean(),
});

type PackageFormData = z.infer<typeof packageSchema>;

/* Component */
export default function CreateAirportPackage() {
    const title = useTitle('Add Package');
    const { id } = useParams<{ id?: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();

    const { data: packageRes, isLoading: packageLoading } = useAirportPackage(
        id ?? ''
    );
    const createMutation = useCreateAirportPackage();
    const updateMutation = useUpdateAirportPackage();
    const uploadPhotoMutation = useUploadAirportPackagePhoto();

    const pkg = isEdit ? packageRes?.data : undefined;
    const isPending = createMutation.isPending || updateMutation.isPending;

    const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        control,
        reset,
        setError,
        formState: { errors },
    } = useForm<PackageFormData>({
        resolver: zodResolver(packageSchema),
        defaultValues: {
            is_available_for_pickup: true,
            is_available_for_dropoff: true,
            auto_assign_vehicle: false,
            is_active: true,
            features: [{ value: '' }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'features',
    });

    useEffect(() => {
        if (pkg) {
            reset({
                name: pkg.name,
                description: pkg.description ?? '',
                features:
                    pkg.features.length > 0
                        ? pkg.features.map(f => ({ value: f }))
                        : [{ value: '' }],
                is_available_for_pickup: pkg.is_available_for_pickup,
                is_available_for_dropoff: pkg.is_available_for_dropoff,
                auto_assign_vehicle: pkg.auto_assign_vehicle,
                is_active: pkg.is_active,
            });
        }
    }, [pkg?.id, reset]); // eslint-disable-line react-hooks/exhaustive-deps

    const onSubmit = (data: PackageFormData) => {
        const payload = {
            name: data.name,
            description: data.description || undefined,
            features: data.features.map(f => f.value),
            is_available_for_pickup: data.is_available_for_pickup,
            is_available_for_dropoff: data.is_available_for_dropoff,
            auto_assign_vehicle: data.auto_assign_vehicle,
            is_active: data.is_active,
        };

        if (isEdit) {
            updateMutation.mutate(
                { id: id!, payload },
                {
                    onSuccess: () =>
                        navigate(
                            ROUTES.DASHBOARD.AIRPORT_TRANSFER.PACKAGES.ROOT
                        ),
                    onError: error => applyServerErrors(error, setError),
                }
            );
        } else {
            createMutation.mutate(payload, {
                onSuccess: res => {
                    if (pendingPhoto) {
                        uploadPhotoMutation.mutate(
                            { id: res.data.id, file: pendingPhoto },
                            {
                                onSettled: () =>
                                    navigate(
                                        ROUTES.DASHBOARD.AIRPORT_TRANSFER
                                            .PACKAGES.ROOT
                                    ),
                            }
                        );
                    } else {
                        navigate(
                            ROUTES.DASHBOARD.AIRPORT_TRANSFER.PACKAGES.ROOT
                        );
                    }
                },
                onError: error => applyServerErrors(error, setError),
            });
        }
    };

    if (isEdit && packageLoading) {
        return <SettingsFormSkeleton />;
    }

    if (isEdit && !pkg) {
        return <Alert variant="danger">Package not found.</Alert>;
    }

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>{isEdit ? 'Edit Package' : 'Add Package'}</h4>
                <p className="text-muted mb-0">
                    {isEdit
                        ? 'Update airport transfer package details.'
                        : 'Create a new airport transfer package.'}
                </p>
            </div>

            <Form onSubmit={handleSubmit(onSubmit)}>
                {(createMutation.isError || updateMutation.isError) && (
                    <Alert variant="danger" className="mb-3">
                        Failed to save package. Please check your inputs and try
                        again.
                    </Alert>
                )}

                <Card className="mb-3">
                    <Card.Header>
                        <h5 className="mb-0">Package Details</h5>
                    </Card.Header>
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>
                                        Package Name{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        {...register('name')}
                                        isInvalid={!!errors.name}
                                        placeholder="e.g. Executive"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.name?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={1}
                                        {...register('description')}
                                        placeholder="Optional description"
                                    />
                                </Form.Group>
                            </Col>

                            {/* Availability switches */}
                            <Col md={3} className="d-flex align-items-end pb-1">
                                <Controller
                                    name="is_available_for_pickup"
                                    control={control}
                                    render={({ field }) => (
                                        <Form.Check
                                            type="switch"
                                            id="is_available_for_pickup"
                                            label="Available for Pickup"
                                            checked={field.value}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </Col>
                            <Col md={3} className="d-flex align-items-end pb-1">
                                <Controller
                                    name="is_available_for_dropoff"
                                    control={control}
                                    render={({ field }) => (
                                        <Form.Check
                                            type="switch"
                                            id="is_available_for_dropoff"
                                            label="Available for Dropoff"
                                            checked={field.value}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </Col>
                            <Col md={3} className="d-flex align-items-end pb-1">
                                <Controller
                                    name="auto_assign_vehicle"
                                    control={control}
                                    render={({ field }) => (
                                        <Form.Check
                                            type="switch"
                                            id="auto_assign_vehicle"
                                            label="Auto-assign Vehicle"
                                            checked={field.value}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </Col>
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

                {/* Features */}
                <Card className="mb-3">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">
                            Features <span className="text-danger">*</span>
                        </h5>
                        <Button
                            variant="outline-primary"
                            size="sm"
                            type="button"
                            onClick={() => append({ value: '' })}
                        >
                            + Add Feature
                        </Button>
                    </Card.Header>
                    <Card.Body>
                        {errors.features && !Array.isArray(errors.features) && (
                            <Alert variant="danger" className="py-2 mb-3">
                                {errors.features.message}
                            </Alert>
                        )}
                        <div className="d-flex flex-column gap-2">
                            {fields.map((field, index) => (
                                <InputGroup key={field.id}>
                                    <Form.Control
                                        {...register(`features.${index}.value`)}
                                        isInvalid={
                                            !!errors.features?.[index]?.value
                                        }
                                        placeholder={`Feature ${index + 1}`}
                                    />
                                    {fields.length > 1 && (
                                        <Button
                                            variant="outline-danger"
                                            type="button"
                                            onClick={() => remove(index)}
                                        >
                                            &times;
                                        </Button>
                                    )}
                                    <Form.Control.Feedback type="invalid">
                                        {
                                            errors.features?.[index]?.value
                                                ?.message
                                        }
                                    </Form.Control.Feedback>
                                </InputGroup>
                            ))}
                        </div>
                    </Card.Body>
                </Card>

                {/* Photo upload */}
                <Card className="mb-3">
                    <Card.Header>
                        <h5 className="mb-0">Package Photo</h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="d-flex align-items-center gap-3">
                            {/* Preview: edit uses saved photo, create uses local preview */}
                            {isEdit && pkg?.package_photo ? (
                                <img
                                    src={
                                        photoPreview ??
                                        pkg.package_photo.urls.medium
                                    }
                                    alt="Package photo"
                                    className="rounded"
                                    style={{
                                        height: 120,
                                        maxWidth: 200,
                                        objectFit: 'cover',
                                    }}
                                />
                            ) : photoPreview ? (
                                <img
                                    src={photoPreview}
                                    alt="Package photo preview"
                                    className="rounded"
                                    style={{
                                        height: 120,
                                        maxWidth: 200,
                                        objectFit: 'cover',
                                    }}
                                />
                            ) : (
                                <div
                                    className="rounded bg-light d-flex align-items-center justify-content-center text-muted"
                                    style={{
                                        width: 120,
                                        height: 120,
                                        fontSize: 32,
                                    }}
                                >
                                    <FaPlane />
                                </div>
                            )}
                            <div>
                                <Form.Label className="fw-semibold mb-1">
                                    {isEdit ? 'Change photo' : 'Upload photo'}
                                </Form.Label>
                                <Form.Control
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    disabled={uploadPhotoMutation.isPending}
                                    onChange={e => {
                                        const file = (
                                            e.target as HTMLInputElement
                                        ).files?.[0];
                                        if (!file) return;
                                        setPhotoPreview(
                                            URL.createObjectURL(file)
                                        );
                                        if (isEdit && id) {
                                            // Edit mode: upload immediately
                                            uploadPhotoMutation.mutate({
                                                id,
                                                file,
                                            });
                                        } else {
                                            // Create mode: hold for after submit
                                            setPendingPhoto(file);
                                        }
                                    }}
                                />
                                <Form.Text className="text-muted">
                                    JPEG, PNG or WebP · max 10 MB
                                </Form.Text>
                                {uploadPhotoMutation.isPending && (
                                    <div className="mt-2">
                                        <Spinner size="sm" className="me-1" />
                                        <small>Uploading...</small>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                <div className="d-flex justify-content-end gap-2">
                    <Button
                        variant="outline-secondary"
                        onClick={() =>
                            navigate(
                                ROUTES.DASHBOARD.AIRPORT_TRANSFER.PACKAGES.ROOT
                            )
                        }
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={isPending || uploadPhotoMutation.isPending}
                    >
                        {isPending
                            ? 'Saving...'
                            : isEdit
                              ? 'Save Changes'
                              : 'Create Package'}
                    </Button>
                </div>
            </Form>
        </div>
    );
}
