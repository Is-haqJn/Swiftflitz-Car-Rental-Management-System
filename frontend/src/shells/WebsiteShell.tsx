import type { ReactNode } from 'react';

interface WebsiteShellProps {
    children: ReactNode;
}

export const WebsiteShell = ({ children }: WebsiteShellProps) => {
    return <>{children}</>;
};
