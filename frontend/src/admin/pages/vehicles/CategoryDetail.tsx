import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCategory } from '@/shared/hooks/queries/useCategories';
import {
    useVehicles,
    useDeleteVehicle,
    vehicleKeys,
} from '@/shared/hooks/queries/useVehicles';
import {
    Card,
    Button,
    Alert,
    Row,
    Col,
    Badge,
    ListGroup,
} from 'react-bootstrap';
import { DetailPageSkeleton } from '@adminComponents/skeletons/DetailPageSkeleton';
import { Fragment } from 'react';
import { FEATURE_ICON_MAP } from '@adminConstants/featureIcons';
import DataTable, { type Column } from '@adminComponents/DataTable';
import type { Vehicle, VehicleStatus } from '@/shared/types/vehicles.types';
import { vehicleService } from '@/services';
import { useBulkDelete } from '@/shared/hooks/queries/useBulkDelete';
import { formatCurrency } from '@/shared/libs/utils';
import { formatWithSymbol } from '@/shared/libs/currency';
import { useTitle } from '@/shared/hooks';

/* Helpers */
const STATUS_BADGE: Record<VehicleStatus, { bg: string; label: string }> = {
    available: { bg: 'success', label: 'Available' },
    rented: { bg: 'primary', label: 'Rented' },
    maintenance: { bg: 'warning', label: 'Maintenance' },
    returned: { bg: 'info', label: 'Returned' },
    unavailable: { bg: 'secondary', label: 'Unavailable' },
    pending_approval: { bg: 'warning', label: 'Pending Approval' },
    retired: { bg: 'danger', label: 'Retired' },
};

/* Main Component */
export default function CategoryDetail() {
    const title = useTitle('Category Details');
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data, isLoading, isError } = useCategory(id!);
    const category = data?.data;

    const [page, setPage] = useState(1);
    const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const {
        data: vehiclesResponse,
        isLoading: vehiclesLoading,
        isError: vehiclesError,
    } = useVehicles(
        category ? { category_id: category.id, per_page: 10, page } : {}
    );

    const vehicles = vehiclesResponse?.data ?? [];
    const vehiclesMeta = vehiclesResponse?.meta ?? null;

    const deleteMutation = useDeleteVehicle();
    const { bulkDelete, isBulkDeleting } = useBulkDelete({
        deleteFn: (vid: string) => vehicleService.delete(vid),
        invalidateKeys: [vehicleKeys.lists()],
        entityName: 'vehicle',
        onSuccess: () => setSelectedIds([]),
    });

    const toggleSelectAll = () => {
        setSelectedIds(prev =>
            prev.length === vehicles.length ? [] : vehicles.map(v => v.id)
        );
    };

    const toggleOne = (vid: string | number) => {
        setSelectedIds(prev =>
            prev.includes(String(vid))
                ? prev.filter(x => x !== String(vid))
                : [...prev, String(vid)]
        );
    };

    const handleDeleteConfirm = () => {
        if (!deleteTarget) {
            return;
        }
        deleteMutation.mutate(deleteTarget.id, {
            onSettled: () => setDeleteTarget(null),
        });
    };

    /* Columns */
    const columns: Column<Vehicle>[] = [
        {
            key: 'vehicle',
            label: 'Vehicle',
            render: v => {
                const thumb = v.images?.[0]?.urls?.thumb;
                return (
                    <div className="d-flex align-items-center gap-2">
                        {thumb ? (
                            <img
                                src={thumb}
                                alt={v.name}
                                style={{
                                    width: 48,
                                    height: 36,
                                    objectFit: 'cover',
                                    borderRadius: 4,
                                    flexShrink: 0,
                                }}
                            />
                        ) : (
                            <div
                                className="bg-light rounded d-flex align-items-center justify-content-center"
                                style={{ width: 48, height: 36, flexShrink: 0 }}
                            >
                                <span
                                    className="text-muted"
                                    style={{ fontSize: 10 }}
                                >
                                    No img
                                </span>
                            </div>
                        )}
                        <div>
                            <Link
                                to={`/management/vehicles/${v.id}`}
                                className="fw-semibold text-primary d-block"
                            >
                                {v.name}
                            </Link>
                            <small className="text-muted">
                                {v.make} {v.model} · {v.year}
                            </small>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'license_plate',
            label: 'Plate',
            render: v => (
                <span className="badge bg-light text-dark border fw-semibold">
                    {v.license_plate}
                </span>
            ),
        },
        {
            key: 'transmission',
            label: 'Transmission',
            render: v => (
                <span className="text-capitalize">{v.transmission ?? '-'}</span>
            ),
        },
        {
            key: 'seats',
            label: 'Seats',
            render: v => v.seats,
        },
        {
            key: 'daily_rate',
            label: 'Daily Rate',
            render: v => (
                <strong>
                    {v.branch?.currency_symbol
                        ? formatWithSymbol(
                              v.daily_rate,
                              v.branch.currency_symbol
                          )
                        : formatCurrency(v.daily_rate)}
                </strong>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: v => {
                const cfg = STATUS_BADGE[v.status] ?? STATUS_BADGE.unavailable;
                return <Badge bg={cfg.bg}>{cfg.label}</Badge>;
            },
        },
        {
            key: 'actions',
            label: '',
            className: 'text-end',
            render: v => (
                <div className="d-flex justify-content-end gap-1">
                    <Link
                        to={`/management/vehicles/${v.id}`}
                        className="btn btn-light btn-sm"
                    >
                        View
                    </Link>
                    <Link
                        to={`/management/vehicles/${v.id}/edit`}
                        className="btn btn-light btn-sm"
                    >
                        Edit
                    </Link>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteTarget(v)}
                        disabled={deleteMutation.isPending}
                    >
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    /* Loading / Error states */
    if (isLoading) {
        return (
            <>
                {title}
                <DetailPageSkeleton cards={2} />
            </>
        );
    }

    if (isError || !category) {
        return (
            <Fragment>
                {title}
                <Alert variant="danger">Category not found.</Alert>
                <Button
                    variant="primary"
                    onClick={() => navigate('/management/categories')}
                >
                    Back to Categories
                </Button>
            </Fragment>
        );
    }

    /* Render */
    const IconComponent = category.icon
        ? FEATURE_ICON_MAP[category.icon]
        : null;

    return (
        <>
            {title}
            <div className="pb-4">
                {/* Header actions */}
                <div className="mb-3 d-flex justify-content-between align-items-center">
                    <Button
                        variant="light"
                        onClick={() => navigate('/management/categories')}
                    >
                        &larr; Back
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() =>
                            navigate(
                                `/management/categories/${category.id}/edit`
                            )
                        }
                    >
                        Edit Category
                    </Button>
                </div>

                {/* Category info card */}
                <Card className="mb-4">
                    <Card.Header>
                        <div className="d-flex align-items-center">
                            {IconComponent ? (
                                <IconComponent
                                    size={32}
                                    color="#495057"
                                    style={{ marginRight: 12 }}
                                />
                            ) : category.icon ? (
                                <span
                                    style={{
                                        fontSize: '2rem',
                                        marginRight: 12,
                                    }}
                                >
                                    {category.icon}
                                </span>
                            ) : null}
                            <div>
                                <h4 className="mb-0 d-inline">
                                    {category.name}
                                </h4>
                                <Badge
                                    bg={
                                        category.is_active
                                            ? 'success'
                                            : 'secondary'
                                    }
                                    className="ms-2 align-middle"
                                >
                                    {category.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={7}>
                                <ListGroup variant="flush">
                                    <ListGroup.Item>
                                        <strong>Description:</strong>
                                        <div className="text-muted mt-1">
                                            {category.description || (
                                                <span className="fst-italic">
                                                    No description provided.
                                                </span>
                                            )}
                                        </div>
                                    </ListGroup.Item>
                                    <ListGroup.Item>
                                        <strong>Icon:</strong>
                                        <span className="ms-2 d-inline-flex align-items-center">
                                            {IconComponent ? (
                                                <IconComponent
                                                    size={22}
                                                    color="#495057"
                                                />
                                            ) : category.icon ? (
                                                <span
                                                    style={{
                                                        fontSize: '1.5rem',
                                                    }}
                                                >
                                                    {category.icon}
                                                </span>
                                            ) : (
                                                <span className="text-muted">
                                                    No icon
                                                </span>
                                            )}
                                        </span>
                                    </ListGroup.Item>
                                    <ListGroup.Item>
                                        <strong>Status:</strong>
                                        <span className="ms-2">
                                            {category.is_active ? (
                                                <Badge bg="success">
                                                    Active
                                                </Badge>
                                            ) : (
                                                <Badge bg="secondary">
                                                    Inactive
                                                </Badge>
                                            )}
                                        </span>
                                    </ListGroup.Item>
                                </ListGroup>
                            </Col>
                            <Col md={5}>
                                <strong>Image:</strong>
                                <div className="mt-2">
                                    {category.image ? (
                                        <img
                                            src={category.image.urls.medium}
                                            alt={category.name}
                                            className="w-100 rounded border"
                                            style={{
                                                maxHeight: 200,
                                                objectFit: 'cover',
                                            }}
                                        />
                                    ) : (
                                        <div
                                            className="border rounded d-flex align-items-center justify-content-center bg-light"
                                            style={{ height: 200 }}
                                        >
                                            <span className="text-muted">
                                                No image uploaded
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Vehicles in this category */}
                <DataTable<Vehicle>
                    title={`Vehicles in "${category.name}"`}
                    data={vehicles}
                    columns={columns}
                    meta={vehiclesMeta}
                    isLoading={vehiclesLoading}
                    isError={vehiclesError}
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
                    onPageChange={setPage}
                    emptyTitle="No vehicles yet"
                    emptyMessage="No vehicles have been assigned to this category."
                />
            </div>
        </>
    );
}
