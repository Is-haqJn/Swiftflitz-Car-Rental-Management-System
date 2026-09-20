import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { PERMISSIONS } from '@/shared/config/permissions';
import { ProtectedRoute } from './ProtectedRoute';

const AllChauffeurBookings = lazy(() => import('@adminPages/chauffeur-rental/AllChauffeurBookings'));
const CreateChauffeurBooking = lazy(() => import('@adminPages/chauffeur-rental/CreateChauffeurBooking'));
const ChauffeurBookingDetail = lazy(() => import('@adminPages/chauffeur-rental/ChauffeurBookingDetail'));

export function ChauffeurBookingRoutes() {
    return (
        <Route path="bookings">
            <Route
                index
                element={
                    <ProtectedRoute
                        permission={
                            PERMISSIONS.CHAUFFEUR_RENTAL.MANAGE_BOOKINGS
                        }
                    >
                        <AllChauffeurBookings />
                    </ProtectedRoute>
                }
            />
            <Route
                path="create"
                element={
                    <ProtectedRoute
                        permission={PERMISSIONS.CHAUFFEUR_RENTAL.CREATE}
                    >
                        <CreateChauffeurBooking />
                    </ProtectedRoute>
                }
            />
            <Route
                path=":id"
                element={
                    <ProtectedRoute
                        permission={
                            PERMISSIONS.CHAUFFEUR_RENTAL.MANAGE_BOOKINGS
                        }
                    >
                        <ChauffeurBookingDetail />
                    </ProtectedRoute>
                }
            />
        </Route>
    );
}
