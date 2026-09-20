import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PERMISSIONS } from '@/shared/config/permissions';

const AllCoupons = lazy(() => import('@adminPages/coupons/AllCoupons'));
const CreateCoupon = lazy(() => import('@adminPages/coupons/CreateCoupon'));

export function CouponRoutes() {
    return (
        <Route path="coupons">
            <Route
                index
                element={
                    <ProtectedRoute permission={PERMISSIONS.COUPONS.VIEW_ALL}>
                        <AllCoupons key="all" />
                    </ProtectedRoute>
                }
            />
            <Route
                path="active"
                element={
                    <ProtectedRoute permission={PERMISSIONS.COUPONS.VIEW_ALL}>
                        <AllCoupons
                            key="active"
                            initialFilters={{ 'filter[is_active]': '1' }}
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="expired"
                element={
                    <ProtectedRoute permission={PERMISSIONS.COUPONS.VIEW_ALL}>
                        <AllCoupons
                            key="expired"
                            initialFilters={{ 'filter[expired]': '1' }}
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="used"
                element={
                    <ProtectedRoute permission={PERMISSIONS.COUPONS.VIEW_ALL}>
                        <AllCoupons
                            key="used"
                            initialFilters={{ 'filter[used]': '1' }}
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="create"
                element={
                    <ProtectedRoute permission={PERMISSIONS.COUPONS.CREATE}>
                        <CreateCoupon />
                    </ProtectedRoute>
                }
            />
            <Route
                path="edit/:id"
                element={
                    <ProtectedRoute permission={PERMISSIONS.COUPONS.EDIT}>
                        <CreateCoupon />
                    </ProtectedRoute>
                }
            />
        </Route>
    );
}
