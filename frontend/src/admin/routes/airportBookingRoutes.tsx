import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { PERMISSIONS } from '@/shared/config/permissions';
import { ProtectedRoute } from './ProtectedRoute';

const AllAirportBookings = lazy(() => import('@adminPages/airport-transfer/AllAirportBookings'));
const CreateAirportBooking = lazy(() => import('@adminPages/airport-transfer/CreateAirportBooking'));
const AirportBookingDetail = lazy(() => import('@adminPages/airport-transfer/AirportBookingDetail'));

export function AirportBookingRoutes() {
    return (
        <Route path="bookings">
            <Route
                index
                element={
                    <ProtectedRoute
                        permission={
                            PERMISSIONS.AIRPORT_TRANSFER.MANAGE_BOOKINGS
                        }
                    >
                        <AllAirportBookings />
                    </ProtectedRoute>
                }
            />
            <Route
                path="create"
                element={
                    <ProtectedRoute
                        permission={
                            PERMISSIONS.AIRPORT_TRANSFER.MANAGE_BOOKINGS
                        }
                    >
                        <CreateAirportBooking />
                    </ProtectedRoute>
                }
            />
            <Route
                path=":id"
                element={
                    <ProtectedRoute
                        permission={
                            PERMISSIONS.AIRPORT_TRANSFER.MANAGE_BOOKINGS
                        }
                    >
                        <AirportBookingDetail />
                    </ProtectedRoute>
                }
            />
        </Route>
    );
}
