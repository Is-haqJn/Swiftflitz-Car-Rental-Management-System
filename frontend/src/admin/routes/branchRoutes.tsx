import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { PERMISSIONS } from '@/shared/config/permissions';
import { ProtectedRoute } from './ProtectedRoute';

const AllBranches = lazy(() => import('@adminPages/branches/AllBranches'));
const CreateBranch = lazy(() => import('@adminPages/branches/CreateBranch'));
const BranchMembers = lazy(() => import('@adminPages/branches/BranchMembers'));

export function BranchRoutes() {
    const navigate = useNavigate();

    return (
        <Route path="branches">
            <Route
                index
                element={
                    <ProtectedRoute permission={PERMISSIONS.BRANCHES.VIEW_ALL}>
                        <AllBranches
                            onAdd={() => navigate('create')}
                            onEdit={branch => navigate(`${branch.id}/edit`)}
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="create"
                element={
                    <ProtectedRoute permission={PERMISSIONS.BRANCHES.CREATE}>
                        <CreateBranch />
                    </ProtectedRoute>
                }
            />
            <Route
                path=":id/edit"
                element={
                    <ProtectedRoute permission={PERMISSIONS.BRANCHES.EDIT}>
                        <CreateBranch />
                    </ProtectedRoute>
                }
            />
            <Route
                path="members"
                element={
                    <ProtectedRoute
                        permission={PERMISSIONS.BRANCHES.MANAGE_MEMBERS}
                    >
                        <BranchMembers />
                    </ProtectedRoute>
                }
            />
        </Route>
    );
}
