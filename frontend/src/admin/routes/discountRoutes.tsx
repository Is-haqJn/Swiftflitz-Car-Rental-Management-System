import { lazy } from 'react';
import { Route, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PERMISSIONS } from '@/shared/config/permissions';

const AllDiscountRules = lazy(() => import('@adminPages/discounts/AllDiscountRules'));
const CreateDiscountRule = lazy(() => import('@adminPages/discounts/CreateDiscountRule'));
const AllDiscountUsages = lazy(() => import('@adminPages/discounts/AllDiscountUsages'));

export function DiscountRoutes() {
    const navigate = useNavigate();

    return (
        <Route path="discounts">
            <Route
                index
                element={
                    <ProtectedRoute permission={PERMISSIONS.DISCOUNTS.VIEW_ALL}>
                        <AllDiscountRules
                            onAdd={() => navigate('create')}
                            onEdit={rule => navigate(`${rule.id}/edit`)}
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="create"
                element={
                    <ProtectedRoute permission={PERMISSIONS.DISCOUNTS.CREATE}>
                        <CreateDiscountRule />
                    </ProtectedRoute>
                }
            />
            <Route
                path=":id/edit"
                element={
                    <ProtectedRoute permission={PERMISSIONS.DISCOUNTS.EDIT}>
                        <CreateDiscountRule />
                    </ProtectedRoute>
                }
            />
            <Route
                path="usages"
                element={
                    <ProtectedRoute permission={PERMISSIONS.DISCOUNTS.VIEW_ALL}>
                        <AllDiscountUsages />
                    </ProtectedRoute>
                }
            />
        </Route>
    );
}
