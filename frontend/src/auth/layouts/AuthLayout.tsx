import '@adminAssets/css/style.css';
import '@/shared/styles/custom.css';
import { Outlet } from 'react-router-dom';
import { useTitle } from '@/shared/hooks';

interface AuthLayoutProps {
    children?: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
    const title = useTitle('Authentication');
    return (
        <>
            {title}
            <div className="auth-layout tw:bg-secondary">
                {children}
                <Outlet />
            </div>
        </>
    );
};

export default AuthLayout;
