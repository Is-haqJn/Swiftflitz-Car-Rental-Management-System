import { useState, useCallback, useMemo } from 'react';
import { Button, Col, Form, InputGroup, Modal, Row } from 'react-bootstrap';
import type {
    ChauffeurCustomer,
    ChauffeurCustomerFilters,
    CreateChauffeurCustomerData,
    UpdateChauffeurCustomerData,
} from '@/shared/types/chauffeur-customer.types';
import {
    useChauffeurCustomers,
    useCreateChauffeurCustomer,
    useUpdateChauffeurCustomer,
    useDeleteChauffeurCustomer,
    chauffeurCustomerKeys,
} from '@/shared/hooks/queries/useChauffeurCustomers';
import { chauffeurCustomerService } from '@/services/chauffeurCustomerService';
import { useBulkDelete } from '@/shared/hooks/queries/useBulkDelete';
import DataTable, { type Column } from '@adminComponents/DataTable';
import FilterBox from '@adminComponents/ui/FilterBox';
import { useTitle } from '@/shared/hooks';

function fmtDate(iso: string | null | undefined) {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

/* Customer Form Modal */
function CustomerFormModal({
    show,
    onHide,
    customer,
}: {
    show: boolean;
    onHide: () => void;
    customer?: ChauffeurCustomer | null;
}) {
    const isEdit = !!customer;
    const createMutation = useCreateChauffeurCustomer();
    const updateMutation = useUpdateChauffeurCustomer();

    const [form, setForm] = useState<{
        full_name: string;
        email: string;
        phone: string;
        expected_destination: string;
    }>({
        full_name: customer?.full_name ?? '',
        email: customer?.email ?? '',
        phone: customer?.phone ?? '',
        expected_destination: customer?.expected_destination ?? '',
    });

    const handleOpen = () => {
        setForm({
            full_name: customer?.full_name ?? '',
            email: customer?.email ?? '',
            phone: customer?.phone ?? '',
            expected_destination: customer?.expected_destination ?? '',
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            full_name: form.full_name,
            email: form.email || undefined,
            phone: form.phone,
            expected_destination: form.expected_destination || undefined,
        };

        if (isEdit && customer) {
            updateMutation.mutate(
                {
                    id: customer.id,
                    payload: payload as UpdateChauffeurCustomerData,
                },
                { onSuccess: () => onHide() }
            );
        } else {
            createMutation.mutate(payload as CreateChauffeurCustomerData, {
                onSuccess: () => {
                    onHide();
                    setForm({
                        full_name: '',
                        email: '',
                        phone: '',
                        expected_destination: '',
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
                    {isEdit ? 'Edit Customer' : 'New Chauffeur Customer'}
                </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Row className="g-3">
                        <Col xs={12}>
                            <Form.Group>
                                <Form.Label>Full Name *</Form.Label>
                                <Form.Control
                                    required
                                    value={form.full_name}
                                    onChange={e =>
                                        setForm(p => ({
                                            ...p,
                                            full_name: e.target.value,
                                        }))
                                    }
                                    placeholder="Full name"
                                />
                            </Form.Group>
                        </Col>
                        <Col xs={12}>
                            <Form.Group>
                                <Form.Label>Phone *</Form.Label>
                                <Form.Control
                                    required
                                    value={form.phone}
                                    onChange={e =>
                                        setForm(p => ({
                                            ...p,
                                            phone: e.target.value,
                                        }))
                                    }
                                    placeholder="+233..."
                                />
                            </Form.Group>
                        </Col>
                        <Col xs={12}>
                            <Form.Group>
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    value={form.email}
                                    onChange={e =>
                                        setForm(p => ({
                                            ...p,
                                            email: e.target.value,
                                        }))
                                    }
                                    placeholder="Optional"
                                />
                            </Form.Group>
                        </Col>
                        <Col xs={12}>
                            <Form.Group>
                                <Form.Label>Expected Destination</Form.Label>
                                <Form.Control
                                    value={form.expected_destination}
                                    onChange={e =>
                                        setForm(p => ({
                                            ...p,
                                            expected_destination:
                                                e.target.value,
                                        }))
                                    }
                                    placeholder="Optional"
                                />
                            </Form.Group>
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
                              : 'Create Customer'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

/* Main Component */
export default function AllChauffeurCustomers() {
    useTitle('Chauffeur Customers');
    const [filters, setFilters] = useState<ChauffeurCustomerFilters>({
        page: 1,
        per_page: 15,
    });
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<ChauffeurCustomer | null>(
        null
    );
    const [editTarget, setEditTarget] = useState<ChauffeurCustomer | null>(
        null
    );
    const [showCreate, setShowCreate] = useState(false);

    const {
        data: response,
        isLoading,
        isError,
    } = useChauffeurCustomers(filters);
    const deleteMutation = useDeleteChauffeurCustomer();

    const { bulkDelete, isBulkDeleting } = useBulkDelete({
        deleteFn: (id: string) => chauffeurCustomerService.delete(id),
        invalidateKeys: [chauffeurCustomerKeys.lists()],
        entityName: 'customer',
        onSuccess: () => setSelectedIds([]),
    });

    const customers = useMemo<ChauffeurCustomer[]>(
        () => response?.data ?? [],
        [response]
    );
    const meta = response?.meta ?? null;

    const handleSearch = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            setFilters(prev => ({
                ...prev,
                'filter[full_name]': search || undefined,
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
            prev.length === customers.length ? [] : customers.map(c => c.id)
        );
    }, [customers]);

    const toggleOne = useCallback((id: string | number) => {
        setSelectedIds(prev =>
            prev.includes(String(id))
                ? prev.filter(x => x !== String(id))
                : [...prev, String(id)]
        );
    }, []);

    const columns: Column<ChauffeurCustomer>[] = [
        {
            key: 'full_name',
            label: 'Name',
            render: c => (
                <div>
                    <span className="fw-semibold">{c.full_name}</span>
                    {c.email && (
                        <>
                            <br />
                            <small className="text-muted">{c.email}</small>
                        </>
                    )}
                </div>
            ),
        },
        { key: 'phone', label: 'Phone', render: c => <span>{c.phone}</span> },
        {
            key: 'expected_destination',
            label: 'Destination',
            render: c => <span>{c.expected_destination ?? '-'}</span>,
        },
        {
            key: 'created_at',
            label: 'Added',
            render: c => <span>{fmtDate(c.created_at)}</span>,
        },
        {
            key: 'actions' as const,
            label: 'Actions',
            className: 'text-end',
            render: (c: ChauffeurCustomer) => (
                <div className="d-flex justify-content-end gap-2">
                    <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => setEditTarget(c)}
                    >
                        Edit
                    </Button>
                    <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => setDeleteTarget(c)}
                    >
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    const headerActions = (
        <Button size="sm" variant="primary" onClick={() => setShowCreate(true)}>
            + New Customer
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
                                    placeholder="Customer name..."
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
                title="Chauffeur Customers"
                data={customers}
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
                deleteTargetName={deleteTarget?.full_name}
                onDeleteRequest={setDeleteTarget}
                onDeleteConfirm={handleDeleteConfirm}
                onDeleteCancel={() => setDeleteTarget(null)}
                isDeleting={deleteMutation.isPending}
                onPageChange={handlePageChange}
                headerActions={headerActions}
                emptyTitle="No customers found"
                emptyMessage="Create your first chauffeur customer."
            />

            <CustomerFormModal
                show={showCreate}
                onHide={() => setShowCreate(false)}
            />
            <CustomerFormModal
                show={!!editTarget}
                onHide={() => setEditTarget(null)}
                customer={editTarget}
            />
        </>
    );
}
