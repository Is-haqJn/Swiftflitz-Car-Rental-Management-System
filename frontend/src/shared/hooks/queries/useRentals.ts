import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { rentalService } from '@/services/rentalService';
import { transactionKeys } from './useTransactions';
import { dashboardKeys } from './useDashboard';
import type {
    CreateRentalData,
    ExtendRentalData,
    UpdateRentalData,
    RentalFilters,
    ProcessPickupData,
    ProcessReturnData,
    ApproveReturnData,
    CancelRentalData,
    CancelPreview,
    SettleRentalData,
    SettleDamageData,
    RecordRepairCostData,
    SwitchVehicleData,
    SettleRefundData,
} from '@/shared/types/rental.types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';

/* Query Keys */
export const rentalKeys = {
    all: ['rentals'] as const,
    lists: () => [...rentalKeys.all, 'list'] as const,
    list: (filters: RentalFilters) => [...rentalKeys.lists(), filters] as const,
    details: () => [...rentalKeys.all, 'detail'] as const,
    detail: (id: string) => [...rentalKeys.details(), id] as const,
};

/* Queries */
export function useRentals(filters: RentalFilters = {}) {
    return useQuery({
        queryKey: rentalKeys.list(filters),
        queryFn: () => rentalService.list(filters),
        placeholderData: keepPreviousData,
    });
}

export function useRental(id: string) {
    return useQuery({
        queryKey: rentalKeys.detail(id),
        queryFn: () => rentalService.get(id),
        enabled: !!id,
    });
}

export function useCancelPreview(id: string | null) {
    return useQuery<CancelPreview>({
        queryKey: ['rentals', id, 'cancel-preview'],
        queryFn: async () => {
            const res = await rentalService.getCancelPreview(id!);
            return res.data;
        },
        enabled: !!id,
    });
}

/* Mutations */
export function useCreateRental() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateRentalData) => rentalService.create(data),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: rentalKeys.lists() });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.recentActivity,
            });
            toast.success(res.message || 'Rental created successfully', {
                id: 'rental-create',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to create rental'), {
                id: 'rental-create-error',
            });
        },
    });
}

export function useUpdateRental() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: UpdateRentalData;
        }) => rentalService.update(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: rentalKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: rentalKeys.detail(res.data.id),
            });
            toast.success(res.message || 'Rental updated', {
                id: 'rental-update',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to update rental'), {
                id: 'rental-update-error',
            });
        },
    });
}

export function useDeleteRental() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => rentalService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: rentalKeys.lists() });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            toast.success('Rental deleted', { id: 'rental-delete' });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to delete rental'), {
                id: 'rental-delete-error',
            });
        },
    });
}

export function useConfirmRental() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => rentalService.confirm(id),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: rentalKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: rentalKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.recentActivity,
            });
            toast.success('Rental confirmed', { id: 'rental-confirm' });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to confirm rental'), {
                id: 'rental-confirm-error',
            });
        },
    });
}

export function useUploadPickupVideos() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            videoTusTokens,
        }: {
            id: string;
            videoTusTokens: string[];
        }) => rentalService.uploadPickupVideos(id, videoTusTokens),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: rentalKeys.detail(res.data.id),
            });
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to attach pickup videos'),
                { id: 'rental-pickup-videos-error' }
            );
        },
    });
}

export function useUploadReturnVideos() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            videoTusTokens,
        }: {
            id: string;
            videoTusTokens: string[];
        }) => rentalService.uploadReturnVideos(id, videoTusTokens),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: rentalKeys.detail(res.data.id),
            });
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to attach return videos'),
                { id: 'rental-return-videos-error' }
            );
        },
    });
}

export function useProcessPickup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: ProcessPickupData }) =>
            rentalService.processPickup(id, data),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: rentalKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: rentalKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: transactionKeys.all });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.recentActivity,
            });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.upcomingReturns,
            });
            toast.success('Pickup processed', { id: 'rental-pickup' });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to process pickup'), {
                id: 'rental-pickup-error',
            });
        },
    });
}

export function useProcessReturn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: ProcessReturnData }) =>
            rentalService.processReturn(id, data),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: rentalKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: rentalKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: transactionKeys.all });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.recentActivity,
            });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.upcomingReturns,
            });
            toast.success('Return processed', { id: 'rental-return' });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to process return'), {
                id: 'rental-return-error',
            });
        },
    });
}

export function useApproveReturn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: ApproveReturnData }) =>
            rentalService.approveReturn(id, data),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: rentalKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: rentalKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.recentActivity,
            });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.upcomingReturns,
            });
            toast.success('Return approved - rental completed', {
                id: 'rental-approve',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to approve return'), {
                id: 'rental-approve-error',
            });
        },
    });
}

export function useCancelRental() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: CancelRentalData }) =>
            rentalService.cancel(id, data),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: rentalKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: rentalKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.recentActivity,
            });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.upcomingReturns,
            });
            toast.success('Rental cancelled', { id: 'rental-cancel' });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to cancel rental'), {
                id: 'rental-cancel-error',
            });
        },
    });
}

export function useSwitchVehicle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: SwitchVehicleData }) =>
            rentalService.switchVehicle(id, data),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: rentalKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: rentalKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.vehicleUtilization,
            });
            toast.success('Vehicle switched', { id: 'rental-switch' });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to switch vehicle'), {
                id: 'rental-switch-error',
            });
        },
    });
}

export function useSettleRental() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: SettleRentalData }) =>
            rentalService.settle(id, data),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: rentalKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: rentalKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: transactionKeys.all });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.revenueTrendAll,
            });
            const msg =
                res.data.amount_due <= 0
                    ? 'Rental fully settled'
                    : `Payment recorded. ${res.data.amount_due.toFixed(2)} remaining`;
            toast.success(msg, { id: 'rental-settle' });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to settle rental'), {
                id: 'rental-settle-error',
            });
        },
    });
}

export function useSettleDamage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: SettleDamageData }) =>
            rentalService.settleDamage(id, data),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: rentalKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: rentalKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: transactionKeys.all });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.revenueTrendAll,
            });
            toast.success('Damage settlement recorded', {
                id: 'rental-settle-damage',
            });
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to record damage settlement'),
                { id: 'rental-settle-damage-error' }
            );
        },
    });
}

export function useRecordRepairCost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: RecordRepairCostData;
        }) => rentalService.recordRepairCost(id, data),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: rentalKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: transactionKeys.all });
            toast.success('Repair cost recorded', {
                id: 'rental-record-repair-cost',
            });
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to record repair cost'),
                { id: 'rental-record-repair-cost-error' }
            );
        },
    });
}

export function useCollectDamageBalance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => rentalService.collectDamageBalance(id),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: rentalKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: rentalKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: transactionKeys.all });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.revenueTrendAll,
            });
            toast.success('Damage balance collected', {
                id: 'rental-collect-damage-balance',
            });
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to collect damage balance'),
                { id: 'rental-collect-damage-balance-error' }
            );
        },
    });
}

export function useCollectDeposit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => rentalService.collectDeposit(id),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: rentalKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: transactionKeys.all });
            toast.success('Security deposit collected', {
                id: 'rental-collect-deposit',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to collect deposit'), {
                id: 'rental-collect-deposit-error',
            });
        },
    });
}

export function useRefundDeposit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => rentalService.refundDeposit(id),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: rentalKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: transactionKeys.all });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.revenueTrendAll,
            });
            toast.success('Security deposit refunded', {
                id: 'rental-refund-deposit',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to refund deposit'), {
                id: 'rental-refund-deposit-error',
            });
        },
    });
}

export function useSettleWithDeposit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => rentalService.settleWithDeposit(id),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: rentalKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: transactionKeys.all });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.revenueTrendAll,
            });
            toast.success('Security deposit applied to balance', {
                id: 'rental-settle-with-deposit',
            });
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to apply security deposit'),
                { id: 'rental-settle-with-deposit-error' }
            );
        },
    });
}

export function useWaiveOverdue() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            rentalService.waiveOverdue(id, reason),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: rentalKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            toast.success('Overdue fee waived', {
                id: 'rental-waive-overdue',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to waive overdue fee'), {
                id: 'rental-waive-overdue-error',
            });
        },
    });
}

export function useSettleRefund() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: SettleRefundData }) =>
            rentalService.settleRefund(id, data),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: rentalKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: rentalKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.revenueTrendAll,
            });
            queryClient.invalidateQueries({ queryKey: transactionKeys.all });
            toast.success('Refund settled', { id: 'rental-settle-refund' });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to settle refund'), {
                id: 'rental-settle-refund-error',
            });
        },
    });
}

export function useExtendRental() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: ExtendRentalData }) =>
            rentalService.extendRental(id, data),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: rentalKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: rentalKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.upcomingReturns,
            });
            toast.success('Rental extended successfully', {
                id: 'rental-extend',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to extend rental'), {
                id: 'rental-extend-error',
            });
        },
    });
}

export function useSendPaymentLink() {
    return useMutation({
        mutationFn: (id: string) => rentalService.sendPaymentLink(id),
        onSuccess: () => {
            toast.success('Payment link sent to customer', {
                id: 'rental-send-payment-link',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to send payment link'), {
                id: 'rental-send-payment-link-error',
            });
        },
    });
}

export function useSendDamagePaymentLink() {
    return useMutation({
        mutationFn: (id: string) => rentalService.sendDamagePaymentLink(id),
        onSuccess: () => {
            toast.success('Damage payment link sent to customer', {
                id: 'rental-send-damage-payment-link',
            });
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to send damage payment link'),
                { id: 'rental-send-damage-payment-link-error' }
            );
        },
    });
}

export function useSendDepositPaymentLink() {
    return useMutation({
        mutationFn: (id: string) =>
            rentalService.sendSecurityDepositPaymentLink(id),
        onSuccess: () => {
            toast.success('Deposit payment link sent to customer', {
                id: 'rental-send-deposit-payment-link',
            });
        },
        onError: error => {
            toast.error(
                getErrorMessage(
                    error,
                    'Failed to send deposit payment link'
                ),
                { id: 'rental-send-deposit-payment-link-error' }
            );
        },
    });
}

export function useSendInvoice() {
    return useMutation({
        mutationFn: ({ id, note }: { id: string; note?: string }) =>
            rentalService.sendInvoice(id, note),
        onSuccess: () => {
            toast.success('Invoice sent to customer', {
                id: 'rental-send-invoice',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to send invoice'), {
                id: 'rental-send-invoice-error',
            });
        },
    });
}
