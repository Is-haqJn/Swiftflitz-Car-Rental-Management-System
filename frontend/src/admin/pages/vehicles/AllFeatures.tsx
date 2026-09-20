import { useState, useCallback, useMemo, type ReactNode } from 'react';
import { Modal, Form, Button, Spinner } from 'react-bootstrap';
import type { Feature, CreateFeatureData } from '@/shared/types/feature.types';
import { featureService } from '@/services';
import {
    useFeatures,
    useCreateFeature,
    useUpdateFeature,
    useDeleteFeature,
    featureKeys,
} from '@/shared/hooks/queries/useFeatures';
import { useBulkDelete } from '@/shared/hooks/queries/useBulkDelete';
import { usePermission, useTitle } from '@/shared/hooks';
import { SVGICON } from '@adminConstants/theme';
import { FEATURE_ICONS, FEATURE_ICON_MAP } from '@adminConstants/featureIcons';
import IconPickerField from '@adminComponents/ui/IconPickerField';
import DataTable, { type Column } from '@adminComponents/DataTable';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';
import type { GenericFilters } from '@/shared/types';

/* Main Component */
export default function AllFeatures() {
    const title = useTitle('Features');
    const { hasPermission } = usePermission();
    const hasManageFeatures = hasPermission(
        PERMISSIONS.VEHICLES.MANAGE_FEATURES
    );

    const [filters, setFilters] = useState<GenericFilters>({
        per_page: 10,
        sort: '-created_at',
    });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<Feature | null>(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editTarget, setEditTarget] = useState<Feature | null>(null);
    const [formName, setFormName] = useState('');
    const [formIcon, setFormIcon] = useState('');
    const [formActive, setFormActive] = useState(true);
    const [formError, setFormError] = useState('');

    const { data: response, isLoading, isError } = useFeatures(filters);
    const createMutation = useCreateFeature();
    const updateMutation = useUpdateFeature();
    const deleteMutation = useDeleteFeature();
    const { bulkDelete, isBulkDeleting } = useBulkDelete({
        deleteFn: id => featureService.delete(id),
        invalidateKeys: [featureKeys.all],
        entityName: 'feature',
        onSuccess: () => setSelectedIds([]),
    });

    const features = useMemo(() => response?.data || [], [response?.data]);
    const meta = response?.meta;

    /* Handlers */
    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }));
    }, []);

    const toggleSelectAll = useCallback(() => {
        setSelectedIds(prev =>
            prev.length === features?.length
                ? []
                : features?.map(f => String(f.id)) || []
        );
    }, [features]);

    const toggleOne = useCallback((id: string | number) => {
        setSelectedIds(prev =>
            prev.includes(String(id))
                ? prev.filter(x => x !== String(id))
                : [...prev, String(id)]
        );
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (!deleteTarget) {
            return;
        }
        deleteMutation.mutate(deleteTarget.id, {
            onSettled: () => setDeleteTarget(null),
        });
    }, [deleteTarget, deleteMutation]);

    /* Modal open/close */
    const openCreate = () => {
        setEditTarget(null);
        setFormName('');
        setFormIcon('');
        setFormActive(true);
        setFormError('');
        setShowModal(true);
    };

    const openEdit = (feature: Feature) => {
        setEditTarget(feature);
        setFormName(feature.name);
        setFormIcon(feature.icon ?? '');
        setFormActive(feature.is_active);
        setFormError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditTarget(null);
        setFormError('');
    };

    /* Save (create or update) */
    const handleSave = async () => {
        if (!formName.trim()) {
            setFormError('Feature name is required.');
            return;
        }

        const payload: CreateFeatureData = {
            name: formName.trim(),
            icon: formIcon || undefined,
            is_active: formActive,
        };

        try {
            if (editTarget) {
                await updateMutation.mutateAsync({
                    id: editTarget.id,
                    data: payload,
                });
            } else {
                await createMutation.mutateAsync(payload);
            }
            closeModal();
        } catch (err: unknown) {
            const axiosErr = err as {
                response?: { data?: { message?: string } };
            };
            setFormError(
                axiosErr?.response?.data?.message ?? 'Something went wrong.'
            );
        }
    };

    const isSaving = createMutation.isPending || updateMutation.isPending;

    /* Columns */
    const columns: Column<Feature>[] = [
        {
            key: 'name',
            label: 'Feature',
            render: feature => {
                const IconComponent = feature.icon
                    ? FEATURE_ICON_MAP[feature.icon]
                    : null;
                return (
                    <div className="d-flex align-items-center gap-2">
                        <span
                            style={{
                                width: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            {IconComponent ? (
                                <IconComponent size={20} color="#495057" />
                            ) : (
                                <span
                                    style={{
                                        fontSize: '1.2rem',
                                        lineHeight: 1,
                                        color: '#adb5bd',
                                    }}
                                >
                                    {feature.icon ?? '-'}
                                </span>
                            )}
                        </span>
                        <span className="fw-semibold">{feature.name}</span>
                    </div>
                );
            },
        },
        {
            key: 'status',
            label: 'Status',
            render: feature => (
                <span
                    className={`badge ${feature.is_active ? 'bg-success' : 'bg-secondary'}`}
                >
                    {feature.is_active ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        ...(hasManageFeatures
            ? [
                  {
                      key: 'actions' as const,
                      label: 'Action',
                      className: 'text-end',
                      render: (feature: Feature) => (
                          <div className="d-flex justify-content-end">
                              <button
                                  type="button"
                                  onClick={() => openEdit(feature)}
                                  className="btn btn-primary shadow btn-xs sharp me-1"
                                  title="Edit"
                              >
                                  {SVGICON.pencil}
                              </button>
                              <button
                                  type="button"
                                  onClick={() => setDeleteTarget(feature)}
                                  className="btn btn-danger shadow btn-xs sharp"
                                  title="Delete"
                              >
                                  {SVGICON.trash}
                              </button>
                          </div>
                      ),
                  },
              ]
            : []),
    ];

    const headerActions: ReactNode = (
        <PermisssionGuard permission={PERMISSIONS.VEHICLES.MANAGE_FEATURES}>
            <button
                type="button"
                onClick={openCreate}
                className="btn btn-primary btn-sm"
            >
                {SVGICON.plus} Add Feature
            </button>
        </PermisssionGuard>
    );

    /* Render */
    return (
        <>
            {title}
            <DataTable<Feature>
                title="Vehicle Features"
                data={features}
                columns={columns}
                meta={meta}
                isLoading={isLoading}
                isError={isError}
                selectedIds={selectedIds}
                onSelectAll={toggleSelectAll}
                onSelectOne={toggleOne}
                onBulkDelete={() => bulkDelete(selectedIds)}
                isBulkDeleting={isBulkDeleting}
                deleteTarget={deleteTarget}
                deleteTargetName={deleteTarget?.name}
                onDeleteRequest={setDeleteTarget}
                onDeleteConfirm={handleDeleteConfirm}
                onDeleteCancel={() => setDeleteTarget(null)}
                isDeleting={deleteMutation.isPending}
                onPageChange={handlePageChange}
                headerActions={headerActions}
                emptyTitle="No features yet"
                emptyMessage="Add your first vehicle feature to get started."
            />

            {/* Add / Edit Modal */}
            <Modal show={showModal} onHide={closeModal} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title>
                        {editTarget ? 'Edit Feature' : 'Add Feature'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {formError && (
                        <div className="alert alert-danger py-2 mb-3">
                            {formError}
                        </div>
                    )}

                    <Form.Group className="mb-3">
                        <Form.Label>
                            Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            type="text"
                            value={formName}
                            onChange={e => {
                                setFormName(e.target.value);
                                if (formError) {
                                    setFormError('');
                                }
                            }}
                            placeholder="e.g. Air Conditioning"
                            autoFocus
                        />
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label>Icon</Form.Label>
                        <div className="d-flex align-items-center gap-3">
                            <IconPickerField
                                value={formIcon}
                                onChange={setFormIcon}
                            />
                            <div>
                                {formIcon ? (
                                    <span className="text-muted small">
                                        Selected:{' '}
                                        <strong>
                                            {FEATURE_ICONS.find(
                                                i => i.name === formIcon
                                            )?.label ?? formIcon}
                                        </strong>
                                    </span>
                                ) : (
                                    <span className="text-muted small">
                                        Click the button to pick an icon
                                    </span>
                                )}
                            </div>
                        </div>
                        <Form.Text className="text-muted">
                            Optional. Shown next to the feature name.
                        </Form.Text>
                    </Form.Group>

                    <Form.Check
                        type="switch"
                        id="feature-active"
                        label="Active (visible in vehicle form)"
                        checked={formActive}
                        onChange={e => setFormActive(e.target.checked)}
                    />
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button
                        variant="light"
                        onClick={closeModal}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
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
                        ) : editTarget ? (
                            'Update'
                        ) : (
                            'Create'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
