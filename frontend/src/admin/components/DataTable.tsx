import { Fragment, useState, type ReactNode } from 'react';
import { Card, Form, Table } from 'react-bootstrap';
import type { PaginatedMeta } from '@/shared/types';

/* Types */
export interface Column<T> {
    key: string;
    label: string;
    className?: string;
    render: (row: T) => ReactNode;
}

interface DataTableProps<T extends { id: string | number }> {
    // Data
    title: string;
    data: T[];
    columns: Column<T>[];
    meta?: PaginatedMeta | null;

    // State
    isLoading?: boolean;
    isError?: boolean;

    // Selection
    selectedIds?: (string | number)[];
    onSelectAll?: () => void;
    onSelectOne?: (id: string | number) => void;

    // Delete
    deleteTarget?: T | null;
    deleteTargetName?: string;
    onDeleteRequest?: (row: T) => void;
    onDeleteConfirm?: () => void;
    onDeleteCancel?: () => void;
    isDeleting?: boolean;

    // Bulk delete
    onBulkDelete?: () => void;
    isBulkDeleting?: boolean;

    // Pagination
    onPageChange?: (page: number) => void;
    perPage?: number;
    onPerPageChange?: (perPage: number) => void;

    // Header extras (e.g. Add button, filters)
    headerActions?: ReactNode;

    // Empty state
    emptyTitle?: string;
    emptyMessage?: string;
}

/* Main Component */
export default function DataTable<T extends { id: string | number }>({
    title,
    data,
    columns,
    meta,
    isLoading = false,
    isError = false,
    selectedIds = [],
    onSelectAll,
    onSelectOne,
    deleteTarget,
    deleteTargetName,
    onDeleteRequest,
    onDeleteConfirm,
    onDeleteCancel,
    isDeleting = false,
    onBulkDelete,
    isBulkDeleting = false,
    onPageChange,
    perPage,
    onPerPageChange,
    headerActions,
    emptyTitle = 'No records found',
    emptyMessage = 'Add your first record to get started.',
}: DataTableProps<T>) {
    const [showBulkConfirm, setShowBulkConfirm] = useState(false);

    const allSelected =
        data.length > 0 && data.every(row => selectedIds.includes(row.id));

    const colSpan =
        columns.length + (onSelectOne ? 1 : 0) + (onDeleteRequest ? 0 : 0);

    return (
        <Fragment>
            <Card>
                {/* Header */}
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <Card.Title className="mb-0">{title}</Card.Title>
                    <div className="d-flex align-items-center gap-2">
                        {meta && (
                            <span className="text-muted fs-14">
                                {meta.total} record{meta.total !== 1 ? 's' : ''}
                            </span>
                        )}
                        {onPerPageChange && (
                            <div className="d-flex align-items-center gap-1">
                                <span
                                    className="text-muted"
                                    style={{
                                        fontSize: '0.8rem',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    Show
                                </span>
                                <Form.Select
                                    size="sm"
                                    value={perPage ?? 15}
                                    onChange={e =>
                                        onPerPageChange(Number(e.target.value))
                                    }
                                    style={{
                                        width: '70px',
                                        fontSize: '0.8rem',
                                    }}
                                >
                                    {[15, 30, 50, 100].map(n => (
                                        <option key={n} value={n}>
                                            {n}
                                        </option>
                                    ))}
                                    <option value={-1}>All</option>
                                </Form.Select>
                            </div>
                        )}
                        {onBulkDelete && selectedIds.length > 0 && (
                            <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() => setShowBulkConfirm(true)}
                                disabled={isBulkDeleting}
                            >
                                Delete {selectedIds.length} selected
                            </button>
                        )}
                        {headerActions}
                    </div>
                </Card.Header>

                <Card.Body>
                    {/* Error */}
                    {isError && (
                        <div className="alert alert-danger" role="alert">
                            Failed to load records. Please try again.
                        </div>
                    )}

                    <Table
                        responsive
                        className="table-striped-thead table-wide table-sm table-border-last-0 text-nowrap mb-0"
                    >
                        <thead>
                            <tr>
                                {/* Checkbox column */}
                                {onSelectOne && (
                                    <th className="width50">
                                        <div className="form-check custom-checkbox checkbox-primary check-lg me-3">
                                            <input
                                                id="selectAll"
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={allSelected}
                                                onChange={onSelectAll}
                                            />
                                            <label
                                                htmlFor="selectAll"
                                                className="form-check-label"
                                            />
                                        </div>
                                    </th>
                                )}

                                {/* Dynamic columns */}
                                {columns.map(col => (
                                    <th key={col.key} className={col.className}>
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {isLoading ? (
                                <SkeletonRows rows={6} cols={colSpan} />
                            ) : data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={colSpan}
                                        className="text-center py-5"
                                    >
                                        <p className="mb-1 fw-bold">
                                            {emptyTitle}
                                        </p>
                                        <p className="text-muted fs-14 mb-0">
                                            {emptyMessage}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                data.map(row => (
                                    <tr key={row.id}>
                                        {/* Checkbox */}
                                        {onSelectOne && (
                                            <td>
                                                <div className="form-check custom-checkbox checkbox-primary check-lg me-3">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        id={`check_${row.id}`}
                                                        checked={selectedIds.includes(
                                                            row.id
                                                        )}
                                                        onChange={() =>
                                                            onSelectOne(row.id)
                                                        }
                                                    />
                                                    <label
                                                        className="form-check-label"
                                                        htmlFor={`check_${row.id}`}
                                                    />
                                                </div>
                                            </td>
                                        )}

                                        {/* Dynamic cells */}
                                        {columns.map(col => (
                                            <td
                                                key={col.key}
                                                className={col.className}
                                            >
                                                {col.render(row)}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>

                    {/* Pagination */}
                    {meta && meta.last_page > 1 && onPageChange && (
                        <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                            <small className="text-muted">
                                Showing {meta.from ?? 0}–{meta.to ?? 0} of{' '}
                                {meta.total}
                            </small>
                            <nav>
                                <ul className="pagination mb-0">
                                    <li
                                        className={`page-item ${meta.current_page <= 1 ? 'disabled' : ''}`}
                                    >
                                        <button
                                            className="page-link"
                                            style={{ whiteSpace: 'nowrap' }}
                                            onClick={() =>
                                                onPageChange(
                                                    meta.current_page - 1
                                                )
                                            }
                                        >
                                            « Prev
                                        </button>
                                    </li>

                                    {generatePageNumbers(
                                        meta.current_page,
                                        meta.last_page
                                    ).map((page, idx) =>
                                        page === '...' ? (
                                            <li
                                                key={`dots-${idx}`}
                                                className="page-item disabled"
                                            >
                                                <span className="page-link">
                                                    …
                                                </span>
                                            </li>
                                        ) : (
                                            <li
                                                key={page}
                                                className={`page-item ${page === meta.current_page ? 'active' : ''}`}
                                            >
                                                <button
                                                    className="page-link"
                                                    onClick={() =>
                                                        onPageChange(
                                                            page as number
                                                        )
                                                    }
                                                >
                                                    {page}
                                                </button>
                                            </li>
                                        )
                                    )}

                                    <li
                                        className={`page-item ${meta.current_page >= meta.last_page ? 'disabled' : ''}`}
                                    >
                                        <button
                                            className="page-link"
                                            style={{ whiteSpace: 'nowrap' }}
                                            onClick={() =>
                                                onPageChange(
                                                    meta.current_page + 1
                                                )
                                            }
                                        >
                                            Next »
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Bulk Delete Confirmation Modal */}
            {showBulkConfirm && (
                <div
                    className="modal fade show d-block"
                    tabIndex={-1}
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title">Delete Selected</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowBulkConfirm(false)}
                                    disabled={isBulkDeleting}
                                />
                            </div>
                            <div className="modal-body">
                                <p className="mb-0">
                                    Are you sure you want to delete{' '}
                                    <strong>
                                        {selectedIds.length} record
                                        {selectedIds.length !== 1 ? 's' : ''}
                                    </strong>
                                    ? This cannot be undone.
                                </p>
                            </div>
                            <div className="modal-footer border-0 pt-0">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-light"
                                    onClick={() => setShowBulkConfirm(false)}
                                    disabled={isBulkDeleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-danger"
                                    disabled={isBulkDeleting}
                                    onClick={() => {
                                        onBulkDelete?.();
                                        setShowBulkConfirm(false);
                                    }}
                                >
                                    {isBulkDeleting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-1" />
                                            Deleting...
                                        </>
                                    ) : (
                                        `Delete ${selectedIds.length}`
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div
                    className="modal fade show d-block"
                    tabIndex={-1}
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title">Confirm Delete</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={onDeleteCancel}
                                />
                            </div>
                            <div className="modal-body">
                                <p className="mb-0">
                                    Are you sure you want to delete{' '}
                                    <strong>{deleteTargetName}</strong>? This
                                    cannot be undone.
                                </p>
                            </div>
                            <div className="modal-footer border-0 pt-0">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-light"
                                    onClick={onDeleteCancel}
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-danger"
                                    onClick={onDeleteConfirm}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-1" />
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Fragment>
    );
}

/* Skeleton Rows */
function SkeletonRows({ rows, cols }: { rows: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j}>
                            <div className="placeholder-glow">
                                <span className="placeholder col-10 rounded" />
                            </div>
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

/* Page Number Generator */
function generatePageNumbers(
    current: number,
    last: number
): (number | string)[] {
    const pages: (number | string)[] = [];
    if (last <= 7) {
        for (let i = 1; i <= last; i++) pages.push(i);
        return pages;
    }
    pages.push(1);
    if (current > 3) pages.push('...');
    const start = Math.max(2, current - 1);
    const end = Math.min(last - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < last - 2) pages.push('...');
    pages.push(last);
    return pages;
}
