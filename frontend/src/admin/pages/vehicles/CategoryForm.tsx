import { useEffect, useRef, useState } from 'react';
import IconPickerField from '@adminComponents/ui/IconPickerField';
import { FEATURE_ICONS } from '@adminConstants/featureIcons';
import { Row, Col, Card, Form, Button, Spinner } from 'react-bootstrap';
import { useForm, Controller } from 'react-hook-form';
import { applyServerErrors } from '@/shared/libs/utils';
import { useCurrency } from '@/shared/hooks/queries/useSettings';
import type {
    Category,
    CreateCategoryData,
} from '@/shared/types/category.types';
import {
    useCreateCategory,
    useUpdateCategory,
    useUploadCategoryImage,
    useDeleteCategoryImage,
} from '@/shared/hooks/queries/useCategories';

/* Types */
interface FormFields {
    name: string;
    description: string;
    icon: string;
    is_active: boolean;
    security_deposit: string;
    young_driver_age_threshold: string;
    young_driver_deposit: string;
    cancellation_fee: string;
    before_pickup_cancellation_fee: string;
    after_pickup_cancellation_fee: string;
    overdue_fee: string;
}

interface CategoryFormProps {
    category?: Category | null;
    onSuccess?: (category: Category) => void;
    onCancel?: () => void;
}

/* Defaults */
const EMPTY_FORM: FormFields = {
    name: '',
    description: '',
    icon: '',
    is_active: true,
    security_deposit: '',
    young_driver_age_threshold: '',
    young_driver_deposit: '',
    cancellation_fee: '',
    before_pickup_cancellation_fee: '',
    after_pickup_cancellation_fee: '',
    overdue_fee: '',
};

function categoryToForm(c: Category): FormFields {
    return {
        name: c.name ?? '',
        description: c.description ?? '',
        icon: c.icon ?? '',
        is_active: c.is_active ?? true,
        security_deposit:
            c.security_deposit != null ? String(c.security_deposit) : '',
        young_driver_age_threshold:
            c.young_driver_age_threshold != null
                ? String(c.young_driver_age_threshold)
                : '',
        young_driver_deposit:
            c.young_driver_deposit != null ? String(c.young_driver_deposit) : '',
        cancellation_fee:
            c.cancellation_fee != null ? String(c.cancellation_fee) : '',
        before_pickup_cancellation_fee:
            c.before_pickup_cancellation_fee != null
                ? String(c.before_pickup_cancellation_fee)
                : '',
        after_pickup_cancellation_fee:
            c.after_pickup_cancellation_fee != null
                ? String(c.after_pickup_cancellation_fee)
                : '',
        overdue_fee: c.overdue_fee != null ? String(c.overdue_fee) : '',
    };
}

/* Component */
export default function CategoryForm({
    category,
    onSuccess,
    onCancel,
}: CategoryFormProps) {
    const currency = useCurrency();
    const isEditing = Boolean(category);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const createMutation = useCreateCategory();
    const updateMutation = useUpdateCategory();
    const uploadImage = useUploadCategoryImage();
    const deleteImageMutation = useDeleteCategoryImage();

    const {
        register,
        handleSubmit,
        control,
        reset,
        watch,
        setError,
        clearErrors,
        formState: { errors, isSubmitting },
    } = useForm<FormFields>({
        defaultValues: EMPTY_FORM,
    });

    const watchedIcon = watch('icon');
    const watchedDescription = watch('description') ?? '';
    const DESCRIPTION_MAX = 500;

    // Image state (still managed locally)
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const isSaving = createMutation.isPending || updateMutation.isPending;
    const isUploadingImage = uploadImage.isPending;

    // Reset form when category changes
    useEffect(() => {
        reset(category ? categoryToForm(category) : EMPTY_FORM);
        clearErrors();
    }, [category, clearErrors, reset]);

    // Revoke any previously created object URL when previewUrl changes or when component unmounts.
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    // File handling
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            alert('Only JPEG, PNG, and WebP images are allowed.');
            return;
        }
        // revoke previous preview URL if present before creating a new one
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        const url = URL.createObjectURL(file);
        setSelectedFile(file);
        setPreviewUrl(url);
    };

    const handleClearImage = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDeleteExistingImage = () => {
        if (!category) return;
        if (window.confirm('Remove this image?')) {
            deleteImageMutation.mutate(category.id);
        }
    };

    // Submit
    const onSubmit = async (data: FormFields) => {
        // client-side required rules handled by react-hook-form
        try {
            let savedCategory: Category;
            const payload: CreateCategoryData = {
                name: data.name.trim(),
                description: data.description.trim(),
                icon: data.icon.trim() || undefined,
                is_active: data.is_active,
                security_deposit: data.security_deposit
                    ? Number(data.security_deposit)
                    : null,
                young_driver_age_threshold: data.young_driver_age_threshold
                    ? Number(data.young_driver_age_threshold)
                    : null,
                young_driver_deposit: data.young_driver_deposit
                    ? Number(data.young_driver_deposit)
                    : null,
                cancellation_fee: data.cancellation_fee
                    ? Number(data.cancellation_fee)
                    : null,
                before_pickup_cancellation_fee:
                    data.before_pickup_cancellation_fee
                        ? Number(data.before_pickup_cancellation_fee)
                        : null,
                after_pickup_cancellation_fee:
                    data.after_pickup_cancellation_fee
                        ? Number(data.after_pickup_cancellation_fee)
                        : null,
                overdue_fee: data.overdue_fee ? Number(data.overdue_fee) : null,
            };

            if (isEditing && category) {
                const res = await updateMutation.mutateAsync({
                    id: category.id,
                    data: payload,
                });
                savedCategory = res.data;
            } else {
                const res = await createMutation.mutateAsync(payload);
                savedCategory = res.data;
            }

            if (selectedFile) {
                await uploadImage.mutateAsync({
                    categoryId: savedCategory.id,
                    file: selectedFile,
                });
            }

            onSuccess?.(savedCategory);
        } catch (err: unknown) {
            applyServerErrors(err, setError);
        }
    };

    const existingImage = category?.image ?? null;
    const showExisting = isEditing && existingImage && !selectedFile;
    const showPreview = Boolean(selectedFile && previewUrl);

    return (
        <div className="pb-4">
            <Form onSubmit={handleSubmit(onSubmit)}>
                {/* server/global errors could be shown via an Alert here if desired */}

                <Row>
                    {/* Left: Form Fields */}
                    <Col md={7}>
                        <Card className="mb-4">
                            <Card.Header>
                                <Card.Title>
                                    {isEditing
                                        ? 'Edit Category'
                                        : 'New Category'}
                                </Card.Title>
                            </Card.Header>
                            <Card.Body>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        Name{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        {...register('name', {
                                            required: 'Name is required.',
                                        })}
                                        isInvalid={!!errors.name}
                                        placeholder="e.g. SUVs"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.name?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        Description{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        maxLength={DESCRIPTION_MAX}
                                        {...register('description', {
                                            required:
                                                'Description is required.',
                                            maxLength: {
                                                value: DESCRIPTION_MAX,
                                                message: `Description cannot exceed ${DESCRIPTION_MAX} characters.`,
                                            },
                                        })}
                                        isInvalid={!!errors.description}
                                        placeholder="Brief description of this category..."
                                    />
                                    <div className="d-flex justify-content-between mt-1">
                                        <Form.Control.Feedback
                                            type="invalid"
                                            className={
                                                errors.description
                                                    ? 'd-block'
                                                    : ''
                                            }
                                        >
                                            {errors.description?.message}
                                        </Form.Control.Feedback>
                                        <small
                                            className={
                                                watchedDescription.length >=
                                                DESCRIPTION_MAX
                                                    ? 'text-danger ms-auto'
                                                    : 'text-muted ms-auto'
                                            }
                                        >
                                            {watchedDescription.length}/
                                            {DESCRIPTION_MAX}
                                        </small>
                                    </div>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Icon</Form.Label>
                                    <div className="d-flex align-items-center gap-3">
                                        <Controller
                                            name="icon"
                                            control={control}
                                            render={({ field }) => (
                                                <IconPickerField
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                />
                                            )}
                                        />
                                        <div>
                                            {watchedIcon ? (
                                                <span className="text-muted small">
                                                    Selected:{' '}
                                                    <strong>
                                                        {FEATURE_ICONS.find(
                                                            i =>
                                                                i.name ===
                                                                watchedIcon
                                                        )?.label ?? watchedIcon}
                                                    </strong>
                                                </span>
                                            ) : (
                                                <span className="text-muted small">
                                                    Click the button to pick an
                                                    icon
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Form.Text className="text-muted">
                                        Optional. Shown as fallback when no
                                        image is uploaded.
                                    </Form.Text>
                                </Form.Group>

                                <Row>
                                    <Col md={6} className="mb-3">
                                        <Form.Group>
                                            <Form.Label>
                                                Security Deposit ({currency})
                                            </Form.Label>
                                            <Form.Control
                                                type="number"
                                                {...register(
                                                    'security_deposit'
                                                )}
                                                step="0.01"
                                                min={0}
                                                placeholder="Optional"
                                            />
                                            <Form.Text className="text-muted">
                                                Default deposit for vehicles in
                                                this category.
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6} className="mb-3">
                                        <Form.Group>
                                            <Form.Label>
                                                Young Driver Age Threshold
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
                                                Customers below this age pay the
                                                young driver deposit instead.
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6} className="mb-3">
                                        <Form.Group>
                                            <Form.Label>
                                                Young Driver Deposit ({currency})
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
                                                Deposit charged to young drivers
                                                in this category.
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6} className="mb-3">
                                        <Form.Group>
                                            <Form.Label>
                                                Before Pickup Cancellation Fee (
                                                {currency})
                                            </Form.Label>
                                            <Form.Control
                                                type="number"
                                                {...register(
                                                    'before_pickup_cancellation_fee'
                                                )}
                                                step="0.01"
                                                min={0}
                                                placeholder="Optional override"
                                            />
                                            <Form.Text className="text-muted">
                                                Overrides global before-pickup
                                                fee for this category.
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6} className="mb-3">
                                        <Form.Group>
                                            <Form.Label>
                                                After Pickup Cancellation Fee (
                                                {currency})
                                            </Form.Label>
                                            <Form.Control
                                                type="number"
                                                {...register(
                                                    'after_pickup_cancellation_fee'
                                                )}
                                                step="0.01"
                                                min={0}
                                                placeholder="Optional override"
                                            />
                                            <Form.Text className="text-muted">
                                                Overrides global after-pickup
                                                fee for this category.
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6} className="mb-3">
                                        <Form.Group>
                                            <Form.Label>
                                                Overdue Fee ({currency})
                                            </Form.Label>
                                            <Form.Control
                                                type="number"
                                                {...register('overdue_fee')}
                                                step="0.01"
                                                min={0}
                                                placeholder="Optional"
                                            />
                                            <Form.Text className="text-muted">
                                                Flat fee charged when a rental
                                                in this category goes overdue.
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Controller
                                    name="is_active"
                                    control={control}
                                    render={({ field }) => (
                                        <Form.Check
                                            type="switch"
                                            id="is_active"
                                            label="Active (visible to customers)"
                                            checked={field.value}
                                            onChange={e =>
                                                field.onChange(e.target.checked)
                                            }
                                        />
                                    )}
                                />
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Right: Image Upload */}
                    <Col md={5}>
                        <Card className="mb-4">
                            <Card.Header>
                                <Card.Title>Category Image</Card.Title>
                            </Card.Header>
                            <Card.Body>
                                {showExisting && (
                                    <div className="mb-3">
                                        <div className="position-relative d-inline-block w-100">
                                            <img
                                                src={existingImage!.urls.medium}
                                                alt="Current"
                                                className="w-100 rounded"
                                                style={{
                                                    height: '180px',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
                                                onClick={
                                                    handleDeleteExistingImage
                                                }
                                                disabled={
                                                    deleteImageMutation.isPending
                                                }
                                                title="Remove image"
                                            >
                                                {deleteImageMutation.isPending ? (
                                                    <Spinner
                                                        size="sm"
                                                        animation="border"
                                                    />
                                                ) : (
                                                    '×'
                                                )}
                                            </button>
                                        </div>
                                        <small className="text-muted d-block mt-1">
                                            Select a new file to replace this
                                            image.
                                        </small>
                                    </div>
                                )}

                                {showPreview && (
                                    <div className="mb-3">
                                        <div className="position-relative d-inline-block w-100">
                                            <img
                                                src={previewUrl!}
                                                alt="Preview"
                                                className="w-100 rounded"
                                                style={{
                                                    height: '180px',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
                                                onClick={handleClearImage}
                                                title="Remove selection"
                                            >
                                                ×
                                            </button>
                                        </div>
                                        <small className="text-muted d-block mt-1">
                                            {selectedFile?.name}
                                        </small>
                                    </div>
                                )}

                                {!showExisting && !showPreview && (
                                    <div
                                        className="border rounded d-flex align-items-center justify-content-center bg-light mb-3"
                                        style={{ height: '180px' }}
                                    >
                                        <div className="text-center text-muted">
                                            <div className="fs-1">
                                                {/* icon fallback from form */}
                                            </div>
                                            <small>No image selected</small>
                                        </div>
                                    </div>
                                )}

                                <Form.Control
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleFileSelect}
                                    size="sm"
                                />
                                <Form.Text className="text-muted">
                                    JPEG, PNG, or WebP. Max 5MB.
                                </Form.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <div className="d-flex justify-content-end gap-2">
                    {onCancel && (
                        <Button
                            variant="light"
                            type="button"
                            onClick={onCancel}
                            disabled={
                                isSubmitting || isSaving || isUploadingImage
                            }
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={isSubmitting || isSaving || isUploadingImage}
                    >
                        {isSubmitting || isSaving || isUploadingImage ? (
                            <>
                                <Spinner
                                    animation="border"
                                    size="sm"
                                    className="me-1"
                                />
                                {isUploadingImage
                                    ? 'Uploading image...'
                                    : 'Saving...'}
                            </>
                        ) : isEditing ? (
                            'Update Category'
                        ) : (
                            'Create Category'
                        )}
                    </Button>
                </div>
            </Form>
        </div>
    );
}
