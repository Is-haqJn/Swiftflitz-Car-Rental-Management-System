import { useState, useCallback, useMemo } from 'react';
import { Button, Col, Form, InputGroup, Modal, Row } from 'react-bootstrap';
import type {
    ChauffeurLocation,
    ChauffeurLocationFilters,
    CreateChauffeurLocationData,
    UpdateChauffeurLocationData,
} from '@/shared/types/chauffeur-location.types';
import {
    useChauffeurLocations,
    useCreateChauffeurLocation,
    useUpdateChauffeurLocation,
    useDeleteChauffeurLocation,
    chauffeurLocationKeys,
} from '@/shared/hooks/queries/useChauffeurLocations';
import { chauffeurLocationService } from '@/services/chauffeurLocationService';
import { useBulkDelete } from '@/shared/hooks/queries/useBulkDelete';
import { useBranches } from '@/shared/hooks/queries/useBranches';
import DataTable, { type Column } from '@adminComponents/DataTable';
import FilterBox from '@adminComponents/ui/FilterBox';
import { useTitle } from '@/shared/hooks';
import { formatWithSymbol } from '@/shared/libs/currency';
import { useGeneralSettings } from '@/shared/hooks/queries/useSettings';

/* Location Form Modal */
function LocationFormModal({
    show,
    onHide,
    location,
}: {
    show: boolean;
    onHide: () => void;
    location?: ChauffeurLocation | null;
}) {
    const isEdit = !!location;
    const createMutation = useCreateChauffeurLocation();
    const updateMutation = useUpdateChauffeurLocation();

    const { data: branchesData } = useBranches();
    const branches = branchesData?.data ?? [];

    const [form, setForm] = useState<{
        branch_id: string;
        name: string;
        charge: string;
        is_active: boolean;
    }>({
        branch_id: location?.branch_id ?? '',
        name: location?.name ?? '',
        charge:
            location?.charge !== null && location?.charge !== undefined
                ? String(location.charge)
                : '',
        is_active: location?.is_active ?? true,
    });

    const handleOpen = () => {
        setForm({
            branch_id: location?.branch_id ?? '',
            name: location?.name ?? '',
            charge:
                location?.charge !== null && location?.charge !== undefined
                    ? String(location.charge)
                    : '',
            is_active: location?.is_active ?? true,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const chargeValue = form.charge !== '' ? Number(form.charge) : null;

        if (isEdit && location) {
            const payload: UpdateChauffeurLocationData = {
                name: form.name,
                charge: chargeValue,
                is_active: form.is_active,
            };
            updateMutation.mutate(
                { id: location.id, payload },
                { onSuccess: () => onHide() }
            );
        } else {
            const payload: CreateChauffeurLocationData = {
                branch_id: form.branch_id,
                name: form.name,
                charge: chargeValue,
                is_active: form.is_active,
            };
            createMutation.mutate(payload, {
                onSuccess: () => {
                    onHide();
                    setForm({
                        branch_id: '',
                        name: '',
                        charge: '',
                        is_active: true,
                    });
                },
            });
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Modal show={show} onHide={onHide} centered onShow={handleOpen}>
            <Modal.Header closeButton>
                <Modal.Title className="fs-6">
                    {isEdit ? 'Edit Location' : 'New Chauffeur Location'}
                </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Row className="g-3">
                        {!isEdit && (
                            <Col xs={12}>
                                <Form.Group>
                                    <Form.Label>Branch *</Form.Label>
                                    <Form.Select
                                        required
                                        value={form.branch_id}
                                        onChange={e =>
                                            setForm(p => ({
                                                ...p,
                                                branch_id: e.target.value,
                                            }))
                                        }
                                    >
                                        <option value="">
                                            Select branch...
                                        </option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        )}
                        <Col xs={12}>
                            <Form.Group>
                                <Form.Label>Location Name *</Form.Label>
                                <Form.Control
                                    required
                                    value={form.name}
                                    onChange={e =>
                                        setForm(p => ({
                                            ...p,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. Kotoka Airport"
                                />
                            </Form.Group>
                        </Col>
                        <Col xs={12}>
                            <Form.Group>
                                <Form.Label>Pickup Charge</Form.Label>
                                <Form.Control
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.charge}
                                    onChange={e =>
                                        setForm(p => ({
                                            ...p,
                                            charge: e.target.value,
                                        }))
                                    }
                                    placeholder="Leave blank for no extra charge"
                                />
                                <Form.Text className="text-muted">
                                    Optional - added to booking total when this
                                    location is selected.
                                </Form.Text>
                            </Form.Group>
                        </Col>
                        <Col xs={12}>
                            <Form.Check
                                type="switch"
                                id="location-is-active"
                                label="Active"
                                checked={form.is_active}
                                onChange={e =>
                                    setForm(p => ({
                                        ...p,
                                        is_active: e.target.checked,
                                    }))
                                }
                            />
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={onHide}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={isPending}
                    >
                        {isPending
                            ? 'Saving...'
                            : isEdit
                              ? 'Save Changes'
                              : 'Create Location'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

/* Main Component */
export default function AllChauffeurLocations() {
    useTitle('Chauffeur Locations');
    const { data: generalSettings } = useGeneralSettings();
    const globalSymbol = generalSettings?.data?.currency_symbol ?? '₵';
    const [filters, setFilters] = useState<ChauffeurLocationFilters>({
        page: 1,
        per_page: 15,
    });
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<ChauffeurLocation | null>(
        null
    );
    const [editTarget, setEditTarget] = useState<ChauffeurLocation | null>(
        null
    );
    const [showCreate, setShowCreate] = useState(false);

    const {
        data: response,
        isLoading,
        isError,
    } = useChauffeurLocations(filters);
    const deleteMutation = useDeleteChauffeurLocation();

    const { bulkDelete, isBulkDeleting } = useBulkDelete({
        deleteFn: (id: string) => chauffeurLocationService.delete(id),
        invalidateKeys: [chauffeurLocationKeys.lists()],
        entityName: 'location',
        onSuccess: () => setSelectedIds([]),
    });

    const locations = useMemo<ChauffeurLocation[]>(
        () => response?.data ?? [],
        [response]
    );
    const meta = response?.meta ?? null;

    const handleSearch = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            setFilters(prev => ({
                ...prev,
                'filter[name]': search || undefined,
                page: 1,
            }));
        },
        [search]
    );

    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }));
    }, []);

    const handleClearFilters = useCallback(() => {
        setSearch('');
        setFilters({ page: 1, per_page: 15 });
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (!deleteTarget) return;
        deleteMutation.mutate(deleteTarget.id, {
            onSettled: () => setDeleteTarget(null),
        });
    }, [deleteTarget, deleteMutation]);

    const toggleSelectAll = useCallback(() => {
        setSelectedIds(prev =>
            prev.length === locations.length ? [] : locations.map(l => l.id)
        );
    }, [locations]);

    const toggleOne = useCallback((id: string | number) => {
        setSelectedIds(prev =>
            prev.includes(String(id))
                ? prev.filter(x => x !== String(id))
                : [...prev, String(id)]
        );
    }, []);

    const columns: Column<ChauffeurLocation>[] = [
        {
            key: 'name',
            label: 'Location',
            render: loc => (
                <div>
                    <span className="fw-semibold">{loc.name}</span>
                    {loc.branch && (
                        <>
                            <br />
                            <small className="text-muted">
                                {loc.branch.name}
                            </small>
                        </>
                    )}
                </div>
            ),
        },
        {
            key: 'charge',
            label: 'Pickup Charge',
            render: loc => (
                <span>
                    {loc.charge !== null
                        ? formatWithSymbol(
                              Number(loc.charge),
                              loc.branch?.currency_symbol ?? globalSymbol
                          )
                        : '-'}
                </span>
            ),
        },
        {
            key: 'is_active',
            label: 'Status',
            render: loc => (
                <span
                    className={`badge bg-${loc.is_active ? 'success' : 'secondary'}`}
                >
                    {loc.is_active ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        {
            key: 'actions' as const,
            label: 'Actions',
            className: 'text-end',
            render: (loc: ChauffeurLocation) => (
                <div className="d-flex justify-content-end gap-2">
                    <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => setEditTarget(loc)}
                    >
                        Edit
                    </Button>
                    <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => setDeleteTarget(loc)}
                    >
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    const headerActions = (
        <Button size="sm" variant="primary" onClick={() => setShowCreate(true)}>
            + New Location
        </Button>
    );

    return (
        <>
            <FilterBox>
                <Form onSubmit={handleSearch}>
                    <Row className="g-3 align-items-end">
                        <Col md={4}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Search by Name
                            </Form.Label>
                            <InputGroup>
                                <Form.Control
                                    placeholder="Location name..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    Search
                                </button>
                            </InputGroup>
                        </Col>
                        <Col md={1}>
                            <button
                                type="button"
                                className="btn btn-outline-secondary w-100"
                                onClick={handleClearFilters}
                            >
                                Clear
                            </button>
                        </Col>
                    </Row>
                </Form>
            </FilterBox>

            <DataTable
                title="Chauffeur Locations"
                data={locations}
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
                emptyTitle="No locations found"
                emptyMessage="Create your first chauffeur pickup location."
            />

            <LocationFormModal
                show={showCreate}
                onHide={() => setShowCreate(false)}
            />
            <LocationFormModal
                show={!!editTarget}
                onHide={() => setEditTarget(null)}
                location={editTarget}
            />
        </>
    );
}
