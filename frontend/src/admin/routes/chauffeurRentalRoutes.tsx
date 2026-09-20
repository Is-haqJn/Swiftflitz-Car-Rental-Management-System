import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { PERMISSIONS } from '@/shared/config/permissions';
import { ProtectedRoute } from './ProtectedRoute';
import { ChauffeurBookingRoutes } from './chauffeurBookingRoutes';

const AllChauffeurCustomers = lazy(() => import('@adminPages/chauffeur-rental/AllChauffeurCustomers'));
const AllChauffeurLocations = lazy(() => import('@adminPages/chauffeur-rental/AllChauffeurLocations'));
const ChauffeurSettings = lazy(() => import('@adminPages/chauffeur-rental/ChauffeurSettings'));

export function ChauffeurRentalRoutes() {
    return (
        <Route path="chauffeur-rental">
            {/* Bookings */}
            {ChauffeurBookingRoutes()}

            {/* Customers */}
            <Route path="customers">
                <Route
                    index
                    element={
                        <ProtectedRoute
                            permission={
                                PERMISSIONS.CHAUFFEUR_RENTAL.MANAGE_CUSTOMERS
                            }
                        >
                            <AllChauffeurCustomers />
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
                                PERMISSIONS.CHAUFFEUR_RENTAL.MANAGE_LOCATIONS
                            }
                        >
                            <AllChauffeurLocations />
                        </ProtectedRoute>
                    }
                />
            </Route>

            {/* Settings */}
            <Route
                path="settings"
                element={
                    <ProtectedRoute
                        permission={
                            PERMISSIONS.CHAUFFEUR_RENTAL.MANAGE_SETTINGS
                        }
                    >
                        <ChauffeurSettings />
                    </ProtectedRoute>
                }
            />
        </Route>
    );
}
