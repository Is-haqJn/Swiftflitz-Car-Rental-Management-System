import type { ReactNode } from 'react';

interface AuthShellProps {
    children: ReactNode;
}

export const AuthShell = ({ children }: AuthShellProps) => {
    return <>{children}</>;
};
