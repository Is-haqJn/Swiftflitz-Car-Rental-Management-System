import { lazy } from 'react';
import { Route, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PERMISSIONS } from '@/shared/config/permissions';
import { ROUTES } from '@/shared/routes';

const AllFleetVehicles = lazy(() => import('@adminPages/fleet-vehicles/AllFleetVehicles'));
const CreateFleetVehicle = lazy(() => import('@adminPages/fleet-vehicles/CreateFleetVehicle'));
const FleetVehicleDetail = lazy(() => import('@adminPages/fleet-vehicles/FleetVehicleDetail'));

export function FleetVehicleRoutes() {
    const navigate = useNavigate();

    return (
        <Route path="fleet-vehicles">
            {/* All Fleet Vehicles (index) */}
            <Route
                index
                element={
                    <ProtectedRoute
                        permission={PERMISSIONS.FLEET_VEHICLES.VIEW_ALL}
                    >
                        <AllFleetVehicles
                            onAdd={() =>
                                navigate(ROUTES.DASHBOARD.FLEET_VEHICLES.CREATE)
                            }
                            onEdit={vehicle =>
                                navigate(
                                    ROUTES.DASHBOARD.FLEET_VEHICLES.EDIT(
                                        vehicle.id
                                    )
                                )
                            }
                        />
                    </ProtectedRoute>
                }
            />

            {/* Create */}
            <Route
                path="create"
                element={
                    <ProtectedRoute
                        permission={PERMISSIONS.FLEET_VEHICLES.CREATE}
                    >
                        <CreateFleetVehicle />
                    </ProtectedRoute>
                }
            />

            {/* Edit */}
            <Route
                path="edit/:id"
                element={
                    <ProtectedRoute
                        permission={PERMISSIONS.FLEET_VEHICLES.EDIT}
                    >
                        <CreateFleetVehicle />
                    </ProtectedRoute>
                }
            />

            {/* Detail (wildcard - must be last) */}
            <Route
                path=":id"
                element={
                    <ProtectedRoute
                        permission={PERMISSIONS.FLEET_VEHICLES.VIEW_ALL}
                    >
                        <FleetVehicleDetail />
                    </ProtectedRoute>
                }
            />
        </Route>
    );
}
