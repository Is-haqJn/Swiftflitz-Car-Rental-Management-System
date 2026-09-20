import { ConfirmProvider } from '@/shared/hooks/useConfirm';
import { ThemeContextProvider } from '@adminContext/ThemeContext';
import type { ReactNode } from 'react';
import { useBroadcastInit } from '@/shared/hooks/useBroadcastInit';
import { OfflineIndicator } from '@/admin/components/common/OfflineIndicator';

interface AdminShellProps {
    children: ReactNode;
}

export const AdminShell = ({ children }: AdminShellProps) => {
    useBroadcastInit();
    return (
        <ThemeContextProvider>
            <ConfirmProvider>
                {children}
                <OfflineIndicator />
            </ConfirmProvider>
        </ThemeContextProvider>
    );
};
