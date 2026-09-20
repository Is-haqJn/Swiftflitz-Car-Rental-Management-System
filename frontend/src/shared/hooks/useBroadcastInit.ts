import { useDashboardListener } from './queries/useDashboard';
import { useExportListener } from './queries/useExports';
import { useNotificationListener } from './queries/useNotifications';
import { usePaymentListener } from './queries/useTransactions';

/* Register all realtime Reverb/Echo listeners here. */
export const useBroadcastInit = () => {
    useExportListener();
    useNotificationListener();
    useDashboardListener();
    usePaymentListener();
};
