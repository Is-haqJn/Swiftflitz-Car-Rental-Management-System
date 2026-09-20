// AllCategories.tsx
import { useState, useCallback, type ReactNode, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Category, CategoryFilters } from '@/shared/types/category.types';
import { categoryService } from '@/services';
import {
    useCategories,
    useDeleteCategory,
    categoryKeys,
} from '@/shared/hooks/queries/useCategories';
import { useBulkDelete } from '@/shared/hooks/queries/useBulkDelete';
import { usePermission, useTitle } from '@/shared/hooks';
import { SVGICON } from '@adminConstants/theme';
import { FEATURE_ICON_MAP } from '@adminConstants/featureIcons';
import DataTable, { type Column } from '@adminComponents/DataTable';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';

/* Types */
interface AllCategoriesProps {
    onAdd?: () => void;
    onEdit?: (category: Category) => void;
}

/* Main Component */
export default function AllCategories({ onAdd, onEdit }: AllCategoriesProps) {
    const title = useTitle('Categories');
    const { hasPermission } = usePermission();
    const hasManageCategories = hasPermission(
        PERMISSIONS.VEHICLES.MANAGE_CATEGORIES
    );

    const [filters, setFilters] = useState<CategoryFilters>({
        page: 1,
        per_page: 15,
        sort_by: 'created_at',
        sort_order: 'desc',
    });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

    const { data: response, isLoading, isError } = useCategories(filters);
    const deleteMutation = useDeleteCategory();
    const { bulkDelete, isBulkDeleting } = useBulkDelete({
        deleteFn: id => categoryService.delete(id),
        invalidateKeys: [categoryKeys.lists()],
        entityName: 'category',
        onSuccess: () => setSelectedIds([]),
    });

    const categories = useMemo<Category[]>(
        () => response?.data ?? [],
        [response]
    );
    const meta = response?.meta ?? null;

    /* Handlers */
    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }));
    }, []);

    const toggleSelectAll = useCallback(() => {
        setSelectedIds(prev =>
            prev.length === categories.length ? [] : categories.map(c => c.id)
        );
    }, [categories]);

    const toggleOne = useCallback((id: string | number) => {
        setSelectedIds(prev =>
            prev.includes(String(id))
                ? prev.filter(x => x !== String(id))
                : [...prev, String(id)]
        );
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (!deleteTarget) return;
        deleteMutation.mutate(deleteTarget.id, {
            onSettled: () => setDeleteTarget(null),
        });
    }, [deleteTarget, deleteMutation]);

    /* Columns */
    const columns: Column<Category>[] = [
        {
            key: 'category',
            label: 'Category',
            render: cat => (
                <div className="d-flex align-items-center">
                    {/* Image or icon fallback */}
                    {cat.image ? (
                        <img
                            src={cat.image.urls.thumb}
                            className="rounded me-2"
                            width="50"
                            height="36"
                            alt={cat.name}
                            style={{ objectFit: 'cover' }}
                        />
                    ) : (
                        <div
                            className="rounded me-2 bg-light d-flex align-items-center justify-content-center"
                            style={{ width: 50, height: 36 }}
                        >
                            {(() => {
                                const IconComponent = cat.icon
                                    ? FEATURE_ICON_MAP[cat.icon]
                                    : null;
                                return IconComponent ? (
                                    <IconComponent size={20} color="#495057" />
                                ) : (
                                    <span style={{ fontSize: 20 }}>
                                        {cat.icon ?? '📁'}
                                    </span>
                                );
                            })()}
                        </div>
                    )}
                    <div>
                        <span className="fw-bold">{cat.name}</span>
                        <br />
                        <small className="text-muted">{cat.slug}</small>
                    </div>
                </div>
            ),
        },
        {
            key: 'description',
            label: 'Description',
            render: cat => (
                <span
                    className="text-muted"
                    style={{
                        maxWidth: '250px',
                        display: 'inline-block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                    title={cat.description}
                >
                    {cat.description}
                </span>
            ),
        },
        {
            key: 'vehicles',
            label: 'Vehicles',
            render: cat => (
                <span className="badge bg-light text-dark">
                    {cat.vehicles_count ?? 0}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: cat => (
                <span
                    className={`badge ${cat.is_active ? 'bg-success' : 'bg-secondary'}`}
                >
                    {cat.is_active ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        ...(hasManageCategories
            ? [
                  {
                      key: 'actions' as const,
                      label: 'Action',
                      className: 'text-end',
                      render: (cat: Category) => (
                          <div className="d-flex justify-content-end">
                              <Link
                                  to={`/management/categories/${cat.id}`}
                                  className="btn btn-info shadow btn-xs sharp me-1"
                                  title="View"
                              >
                                  {SVGICON.eye}
                              </Link>
                              {onEdit && (
                                  <button
                                      type="button"
                                      onClick={() => onEdit(cat)}
                                      className="btn btn-primary shadow btn-xs sharp me-1"
                                      title="Edit"
                                  >
                                      {SVGICON.pencil}
                                  </button>
                              )}
                              <button
                                  type="button"
                                  onClick={() => setDeleteTarget(cat)}
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

    /* Header Actions */
    const headerActions: ReactNode = onAdd ? (
        <PermisssionGuard permission={PERMISSIONS.VEHICLES.MANAGE_CATEGORIES}>
            <button
                type="button"
                onClick={onAdd}
                className="btn btn-primary btn-sm"
            >
                {SVGICON.plus} Add Category
            </button>
        </PermisssionGuard>
    ) : null;

    /* Render */
    return (
        <>
            {title}
            <DataTable
                title="All Categories"
                data={categories}
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
                emptyTitle="No categories found"
                emptyMessage="Add your first vehicle category to get started."
            />
        </>
    );
}
