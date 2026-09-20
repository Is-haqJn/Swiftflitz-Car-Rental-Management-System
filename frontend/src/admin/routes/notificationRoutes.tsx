import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { PERMISSIONS } from '@/shared/config/permissions';
import { ProtectedRoute } from './ProtectedRoute';

const AllNotifications = lazy(() => import('@adminPages/notifications/AllNotifications'));
const NotificationDetail = lazy(() => import('@adminPages/notifications/NotificationDetail'));
const NewBookings = lazy(() => import('@adminPages/notifications/NewBookings'));
const ReturnReminders = lazy(() => import('@adminPages/notifications/ReturnReminders'));
const OverdueAlerts = lazy(() => import('@adminPages/notifications/OverdueAlerts'));
const QuoteRequestsNotifications = lazy(() => import('@adminPages/notifications/QuoteRequests'));

export function NotificationRoutes() {
    return (
        <Route path="notifications">
            <Route
                index
                element={
                    <ProtectedRoute permission={PERMISSIONS.NOTIFICATIONS.VIEW}>
                        <AllNotifications />
                    </ProtectedRoute>
                }
            />
            <Route
                path="new-bookings"
                element={
                    <ProtectedRoute permission={PERMISSIONS.NOTIFICATIONS.VIEW}>
                        <NewBookings />
                    </ProtectedRoute>
                }
            />
            <Route
                path="return-reminders"
                element={
                    <ProtectedRoute permission={PERMISSIONS.NOTIFICATIONS.VIEW}>
                        <ReturnReminders />
                    </ProtectedRoute>
                }
            />
            <Route
                path="overdue-alerts"
                element={
                    <ProtectedRoute permission={PERMISSIONS.NOTIFICATIONS.VIEW}>
                        <OverdueAlerts />
                    </ProtectedRoute>
                }
            />
            <Route
                path="quote-requests"
                element={
                    <ProtectedRoute permission={PERMISSIONS.NOTIFICATIONS.VIEW}>
                        <QuoteRequestsNotifications />
                    </ProtectedRoute>
                }
            />

            <Route
                path=":id"
                element={
                    <ProtectedRoute permission={PERMISSIONS.NOTIFICATIONS.VIEW}>
                        <NotificationDetail />
                    </ProtectedRoute>
                }
            />
        </Route>
    );
}
