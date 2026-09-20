import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Card } from 'react-bootstrap';
import { PERMISSIONS } from '@/shared/config/permissions';
import { ProtectedRoute } from './ProtectedRoute';

const AllVehicles = lazy(() => import('@adminPages/vehicles/AllVehicles'));
const CreateVehicle = lazy(() => import('@adminPages/vehicles/CreateVehicle'));
const EditVehicle = lazy(() => import('@adminPages/vehicles/EditVehicle'));
const VehicleDetail = lazy(() => import('@adminPages/vehicles/VehicleDetail'));
const VehicleImageUpload = lazy(() => import('@adminPages/vehicles/VehicleImageUpload'));
const AvailableVehicles = lazy(() =>
    import('@adminPages/vehicles/FilteredVehicleTables').then(m => ({ default: m.AvailableVehicles }))
);
const RentedVehicles = lazy(() =>
    import('@adminPages/vehicles/FilteredVehicleTables').then(m => ({ default: m.RentedVehicles }))
);
const MaintenanceVehicles = lazy(() =>
    import('@adminPages/vehicles/FilteredVehicleTables').then(m => ({ default: m.MaintenanceVehicles }))
);
const AllCategories = lazy(() => import('@adminPages/vehicles/AllCategories'));
const CategoryForm = lazy(() => import('@adminPages/vehicles/CategoryForm'));
const EditCategory = lazy(() => import('@adminPages/vehicles/EditCategory'));
const AllFeatures = lazy(() => import('@adminPages/vehicles/AllFeatures'));
const CategoryDetail = lazy(() => import('@adminPages/vehicles/CategoryDetail'));

export function VehicleRoutes() {
    const navigate = useNavigate();

    return (
        <>
            <Route path="vehicles">
                <Route
                    index
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.VEHICLES.VIEW_ALL}
                        >
                            <AllVehicles
                                onAdd={() => navigate('create')}
                                onEdit={vehicle =>
                                    navigate(`${vehicle.id}/edit`)
                                }
                            />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="create"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.VEHICLES.CREATE}
                        >
                            <div className="page-titles mb-3">
                                <Card.Title style={{ color: '#0074ff' }}>
                                    ADD A NEW VEHICLE
                                </Card.Title>
                            </div>
                            <CreateVehicle
                                onSuccess={vehicle =>
                                    navigate(
                                        `/management/vehicles/${vehicle.id}/upload-images`
                                    )
                                }
                                onCancel={() =>
                                    navigate('/management/vehicles')
                                }
                            />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path=":id/upload-images"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.VEHICLES.CREATE}
                        >
                            <VehicleImageUpload />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="available"
                    element={
                        <ProtectedRoute
                            permission={[
                                PERMISSIONS.VEHICLES.VIEW_ALL,
                                PERMISSIONS.VEHICLES.MANAGE_AVAILABLE,
                            ]}
                        >
                            <AvailableVehicles
                                onAdd={() =>
                                    navigate('/management/vehicles/create')
                                }
                                onEdit={vehicle =>
                                    navigate(
                                        `/management/vehicles/${vehicle.id}/edit`
                                    )
                                }
                            />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="rented"
                    element={
                        <ProtectedRoute
                            permission={[
                                PERMISSIONS.VEHICLES.VIEW_ALL,
                                PERMISSIONS.VEHICLES.MANAGE_RENTED,
                            ]}
                        >
                            <RentedVehicles
                                onEdit={vehicle =>
                                    navigate(
                                        `/management/vehicles/${vehicle.id}/edit`
                                    )
                                }
                            />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="maintenance"
                    element={
                        <ProtectedRoute
                            permission={[
                                PERMISSIONS.VEHICLES.VIEW_ALL,
                                PERMISSIONS.VEHICLES.MANAGE_MAINTENANCE,
                            ]}
                        >
                            <MaintenanceVehicles
                                onAdd={() =>
                                    navigate('/management/vehicles/create')
                                }
                                onEdit={vehicle =>
                                    navigate(
                                        `/management/vehicles/${vehicle.id}/edit`
                                    )
                                }
                            />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="features"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.VEHICLES.MANAGE_FEATURES}
                        >
                            <AllFeatures />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path=":id"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.VEHICLES.VIEW_ALL}
                        >
                            <VehicleDetail />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path=":id/edit"
                    element={
                        <ProtectedRoute permission={PERMISSIONS.VEHICLES.EDIT}>
                            <EditVehicle />
                        </ProtectedRoute>
                    }
                />
            </Route>

            <Route path="categories">
                <Route
                    index
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.VEHICLES.MANAGE_CATEGORIES}
                        >
                            <AllCategories
                                onAdd={() => navigate('create')}
                                onEdit={category =>
                                    navigate(`${category.id}/edit`)
                                }
                            />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="create"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.VEHICLES.MANAGE_CATEGORIES}
                        >
                            <div className="page-titles mb-3">
                                <Card.Title style={{ color: '#0074ff' }}>
                                    ADD A NEW CATEGORY
                                </Card.Title>
                            </div>
                            <CategoryForm
                                onSuccess={() =>
                                    navigate('/management/categories')
                                }
                                onCancel={() =>
                                    navigate('/management/categories')
                                }
                            />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path=":id"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.VEHICLES.MANAGE_CATEGORIES}
                        >
                            <CategoryDetail />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path=":id/edit"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.VEHICLES.MANAGE_CATEGORIES}
                        >
                            <EditCategory />
                        </ProtectedRoute>
                    }
                />
            </Route>
        </>
    );
}
