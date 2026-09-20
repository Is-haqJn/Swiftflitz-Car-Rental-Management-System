import { ThemeContextProvider } from '@adminContext/ThemeContext';
import type { ReactNode } from 'react';

interface AdminShellProps {
    children: ReactNode;
}

export const AdminShell = ({ children }: AdminShellProps) => {
    return <ThemeContextProvider>{children}</ThemeContextProvider>;
};
