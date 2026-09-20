import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { PERMISSIONS } from '@/shared/config/permissions';
import { ProtectedRoute } from './ProtectedRoute';
import { AirportBookingRoutes } from './airportBookingRoutes';

const AllAirports = lazy(() => import('@adminPages/airport-transfer/airports/AllAirports'));
const CreateAirport = lazy(() => import('@adminPages/airport-transfer/airports/CreateAirport'));
const AllAirportLocations = lazy(() => import('@adminPages/airport-transfer/locations/AllAirportLocations'));
const CreateAirportLocation = lazy(() => import('@adminPages/airport-transfer/locations/CreateAirportLocation'));
const AllAirportPackages = lazy(() => import('@adminPages/airport-transfer/packages/AllAirportPackages'));
const CreateAirportPackage = lazy(() => import('@adminPages/airport-transfer/packages/CreateAirportPackage'));
const AllPackagePricing = lazy(() => import('@adminPages/airport-transfer/pricing/AllPackagePricing'));
const CreatePackagePricing = lazy(() => import('@adminPages/airport-transfer/pricing/CreatePackagePricing'));
const AirportCancellationSettings = lazy(() => import('@adminPages/airport-transfer/AirportCancellationSettings'));
const AllAirportCustomers = lazy(() => import('@adminPages/airport-transfer/AllAirportCustomers'));

export function AirportTransferRoutes() {
    const navigate = useNavigate();

    return (
        <Route path="airport-transfer">
            {/* Airports */}
            <Route path="airports">
                <Route
                    index
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.AIRPORT_TRANSFER.VIEW_ALL}
                        >
                            <AllAirports
                                onAdd={() => navigate('create')}
                                onEdit={airport =>
                                    navigate(`edit/${airport.id}`)
                                }
                            />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="create"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.AIRPORT_TRANSFER.CREATE}
                        >
                            <CreateAirport />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="edit/:id"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.AIRPORT_TRANSFER.EDIT}
                        >
                            <CreateAirport />
                        </ProtectedRoute>
                    }
                />
            </Route>

            {/* Locations */}
            <Route path="locations">
                <Route
                    index
                    element={
                        <ProtectedRoute
                            permission={
                                PERMISSIONS.AIRPORT_TRANSFER.MANAGE_LOCATIONS
                            }
                        >
                            <AllAirportLocations
                                onAdd={() => navigate('create')}
                                onEdit={location =>
                                    navigate(`edit/${location.id}`)
                                }
                            />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="create"
                    element={
                        <ProtectedRoute
                            permission={
                                PERMISSIONS.AIRPORT_TRANSFER.MANAGE_LOCATIONS
                            }
                        >
                            <CreateAirportLocation />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="edit/:id"
                    element={
                        <ProtectedRoute
                            permission={
                                PERMISSIONS.AIRPORT_TRANSFER.MANAGE_LOCATIONS
                            }
                        >
                            <CreateAirportLocation />
                        </ProtectedRoute>
                    }
                />
            </Route>

            {/* Packages */}
            <Route path="packages">
                <Route
                    index
                    element={
                        <ProtectedRoute
                            permission={
                                PERMISSIONS.AIRPORT_TRANSFER.MANAGE_PACKAGES
                            }
                        >
                            <AllAirportPackages
                                onAdd={() => navigate('create')}
                                onEdit={pkg => navigate(`edit/${pkg.id}`)}
                            />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="create"
                    element={
                        <ProtectedRoute
                            permission={
                                PERMISSIONS.AIRPORT_TRANSFER.MANAGE_PACKAGES
                            }
                        >
                            <CreateAirportPackage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="edit/:id"
                    element={
                        <ProtectedRoute
                            permission={
                                PERMISSIONS.AIRPORT_TRANSFER.MANAGE_PACKAGES
                            }
                        >
                            <CreateAirportPackage />
                        </ProtectedRoute>
                    }
                />
            </Route>

            {/* Package Pricing */}
            <Route path="package-pricing">
                <Route
                    index
                    element={
                        <ProtectedRoute
                            permission={
                                PERMISSIONS.AIRPORT_TRANSFER.MANAGE_PACKAGES
                            }
                        >
                            <AllPackagePricing
                                onAdd={() => navigate('create')}
                            />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="create"
                    element={
                        <ProtectedRoute
                            permission={
                                PERMISSIONS.AIRPORT_TRANSFER.MANAGE_PACKAGES
                            }
                        >
                            <CreatePackagePricing />
                        </ProtectedRoute>
                    }
                />
            </Route>

            {/* Cancellation Settings */}
            <Route
                path="cancellation-settings"
                element={
                    <ProtectedRoute
                        permission={
                            PERMISSIONS.AIRPORT_TRANSFER.MANAGE_PACKAGES
                        }
                    >
                        <AirportCancellationSettings />
                    </ProtectedRoute>
                }
            />

            {/* Customers */}
            <Route path="customers">
                <Route
                    index
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.AIRPORT_TRANSFER.VIEW_ALL}
                        >
                            <AllAirportCustomers />
                        </ProtectedRoute>
                    }
                />
            </Route>

            {/* Bookings */}
            {AirportBookingRoutes()}
        </Route>
    );
}
