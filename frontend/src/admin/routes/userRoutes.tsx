import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { PERMISSIONS } from '@/shared/config/permissions';
import { ProtectedRoute } from './ProtectedRoute';

const AllUsers = lazy(() => import('@adminPages/users/AllUsers'));
const CreateUser = lazy(() => import('@adminPages/users/CreateUser'));
const EditUser = lazy(() => import('@adminPages/users/EditUser'));
const UserDetail = lazy(() => import('@adminPages/users/UserDetail'));
const AllRoles = lazy(() => import('@adminPages/users/AllRoles'));
const CreateRole = lazy(() => import('@adminPages/users/CreateRole'));
const EditRole = lazy(() => import('@adminPages/users/EditRole'));
const ActivityLogs = lazy(() => import('@adminPages/users/ActivityLogs'));

export function UserRoutes() {
    const navigate = useNavigate();

    return (
        <Route path="users">
            <Route
                index
                element={
                    <ProtectedRoute permission={PERMISSIONS.USERS.VIEW_ALL}>
                        <AllUsers onAdd={() => navigate('create')} />
                    </ProtectedRoute>
                }
            />
            <Route
                path="roles"
                element={
                    <ProtectedRoute permission={PERMISSIONS.ROLES.VIEW_ALL}>
                        <AllRoles />
                    </ProtectedRoute>
                }
            />
            <Route
                path="roles/create"
                element={
                    <ProtectedRoute permission={PERMISSIONS.ROLES.CREATE}>
                        <CreateRole />
                    </ProtectedRoute>
                }
            />
            <Route
                path="roles/:id/edit"
                element={
                    <ProtectedRoute permission={PERMISSIONS.ROLES.EDIT}>
                        <EditRole />
                    </ProtectedRoute>
                }
            />
            <Route
                path="activity-logs"
                element={
                    <ProtectedRoute permission={PERMISSIONS.LOGS.VIEW_ACTIVITY}>
                        <ActivityLogs />
                    </ProtectedRoute>
                }
            />
            <Route
                path="create"
                element={
                    <ProtectedRoute permission={PERMISSIONS.USERS.CREATE}>
                        <CreateUser />
                    </ProtectedRoute>
                }
            />
            <Route
                path=":id"
                element={
                    <ProtectedRoute permission={PERMISSIONS.USERS.VIEW_ALL}>
                        <UserDetail />
                    </ProtectedRoute>
                }
            />
            <Route
                path=":id/edit"
                element={
                    <ProtectedRoute permission={PERMISSIONS.USERS.EDIT}>
                        <EditUser />
                    </ProtectedRoute>
                }
            />
        </Route>
    );
}
