import { Button } from '@/shared/components/common/Button';
import { useLogout } from '@/shared/hooks';
import { useConfirm } from '@/shared/hooks/useConfirm';
import type { FC, ReactNode } from 'react';
import { VscSignOut } from 'react-icons/vsc';

interface LogoutButtonProps {
    variant?: 'primary' | 'danger' | 'success' | 'ghost';
    confirmBeforeLogout?: boolean;
    showIcon?: boolean;
    children?: ReactNode;
    className?: string;
}

export const LogoutButton: FC<LogoutButtonProps> = ({
    variant = 'ghost',
    confirmBeforeLogout = false,
    showIcon = false,
    children = 'Logout',
    className,
    ...props
}) => {
    const logoutMutation = useLogout();
    const { confirm } = useConfirm();

    const handleLogout = async () => {
        if (confirmBeforeLogout) {
            const confirmed = await confirm({
                title: 'Confirm Logout',
                message: 'Are you sure you want to log out?',
                confirmText: 'Yes, Logout',
                cancelText: 'Cancel',
                confirmVariant: 'danger',
            });

            if (!confirmed) return;
        }

        logoutMutation.mutate();
    };

    return (
        <Button
            variant={variant}
            onClick={handleLogout}
            //isLoading={logoutMutation.isPending}
            // loadingText="Logging out..."
            leftIcon={
                showIcon ? <VscSignOut className="tw:w-5 tw:h-5" /> : undefined
            }
            className={className}
            {...props}
        >
            {children}
        </Button>
    );
};
