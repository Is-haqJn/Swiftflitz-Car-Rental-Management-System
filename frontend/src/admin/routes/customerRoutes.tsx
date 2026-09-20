import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Card } from 'react-bootstrap';
import { PERMISSIONS } from '@/shared/config/permissions';
import { ROUTES } from '@/shared/routes';
import { ProtectedRoute } from './ProtectedRoute';

const AllCustomers = lazy(() => import('@adminPages/customers/AllCustomers'));
const CreateCustomer = lazy(() => import('@adminPages/customers/CreateCustomer'));
const CustomerDetail = lazy(() => import('@adminPages/customers/CustomerDetail'));
const EditCustomer = lazy(() => import('@adminPages/customers/EditCustomer'));
const BlacklistedCustomers = lazy(() =>
    import('@adminPages/customers/FilteredCustomerTables').then(m => ({ default: m.BlacklistedCustomers }))
);
const ExpiredLicenseCustomers = lazy(() =>
    import('@adminPages/customers/FilteredCustomerTables').then(m => ({ default: m.ExpiredLicenseCustomers }))
);
const ExpiredSoonLicenseCustomers = lazy(() =>
    import('@adminPages/customers/FilteredCustomerTables').then(m => ({ default: m.ExpiredSoonLicenseCustomers }))
);
const CustomerHistory = lazy(() => import('@adminPages/customers/CustomerHistory'));

export function CustomerRoutes() {
    const navigate = useNavigate();

    return (
        <Route path="customers">
            <Route
                index
                element={
                    <ProtectedRoute permission={PERMISSIONS.CUSTOMERS.VIEW_ALL}>
                        <AllCustomers
                            onAdd={() => navigate('create')}
                            onEdit={customer => navigate(`${customer.id}/edit`)}
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="blacklisted"
                element={
                    <ProtectedRoute permission={PERMISSIONS.CUSTOMERS.VIEW_ALL}>
                        <BlacklistedCustomers />
                    </ProtectedRoute>
                }
            />
            <Route
                path="license-expired"
                element={
                    <ProtectedRoute permission={PERMISSIONS.CUSTOMERS.VIEW_ALL}>
                        <ExpiredLicenseCustomers />
                    </ProtectedRoute>
                }
            />
            <Route
                path="license-expiring-soon"
                element={
                    <ProtectedRoute permission={PERMISSIONS.CUSTOMERS.VIEW_ALL}>
                        <ExpiredSoonLicenseCustomers />
                    </ProtectedRoute>
                }
            />
            <Route
                path="create"
                element={
                    <ProtectedRoute permission={PERMISSIONS.CUSTOMERS.CREATE}>
                        <div className="page-titles mb-3">
                            <Card.Title style={{ color: '#0074ff' }}>
                                ADD A NEW CUSTOMER
                            </Card.Title>
                        </div>
                        <CreateCustomer
                            onSuccess={() =>
                                navigate(ROUTES.DASHBOARD.CUSTOMERS.ROOT)
                            }
                            onCancel={() =>
                                navigate(ROUTES.DASHBOARD.CUSTOMERS.ROOT)
                            }
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="history"
                element={
                    <ProtectedRoute
                        permission={PERMISSIONS.CUSTOMERS.VIEW_HISTORY}
                    >
                        <CustomerHistory />
                    </ProtectedRoute>
                }
            />
            <Route
                path=":id"
                element={
                    <ProtectedRoute permission={PERMISSIONS.CUSTOMERS.VIEW_ALL}>
                        <CustomerDetail />
                    </ProtectedRoute>
                }
            />
            <Route
                path=":id/edit"
                element={
                    <ProtectedRoute permission={PERMISSIONS.CUSTOMERS.EDIT}>
                        <EditCustomer />
                    </ProtectedRoute>
                }
            />
        </Route>
    );
}
