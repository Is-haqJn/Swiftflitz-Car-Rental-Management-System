import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { startOfDay, endOfDay } from 'date-fns';
import { chauffeurBookingService } from '@/services/chauffeurBookingService';
import { publicChauffeurService } from '@/services/publicChauffeurService';
import { dashboardKeys } from './useDashboard';
import { transactionKeys } from './useTransactions';
import type {
    ChauffeurBooking,
    CreateChauffeurBookingData,
    UpdateChauffeurBookingData,
    AssignChauffeurDriverData,
    RecordChauffeurPaymentData,
    CancelChauffeurBookingData,
    ChauffeurPickupLogData,
    ChauffeurReturnLogData,
    ChauffeurBookingFilters,
} from '@/shared/types/chauffeur-booking.types';
import type { ApiResponse } from '@/shared/types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';

/* Query Keys */
export const chauffeurBookingKeys = {
    all: ['chauffeur-bookings'] as const,
    lists: () => [...chauffeurBookingKeys.all, 'list'] as const,
    list: (filters: ChauffeurBookingFilters) =>
        [...chauffeurBookingKeys.lists(), filters] as const,
    details: () => [...chauffeurBookingKeys.all, 'detail'] as const,
    detail: (id: string) => [...chauffeurBookingKeys.details(), id] as const,
    vehicleBookedDates: (vehicleId: string) =>
        [
            ...chauffeurBookingKeys.all,
            'vehicle-booked-dates',
            vehicleId,
        ] as const,
};

/* Queries */
export function useChauffeurBookings(filters: ChauffeurBookingFilters = {}) {
    return useQuery({
        queryKey: chauffeurBookingKeys.list(filters),
        queryFn: () => chauffeurBookingService.list(filters),
        placeholderData: keepPreviousData,
    });
}

export function useChauffeurBooking(id: string) {
    return useQuery<ApiResponse<ChauffeurBooking>>({
        queryKey: chauffeurBookingKeys.detail(id),
        queryFn: () => chauffeurBookingService.get(id),
        enabled: !!id,
    });
}

/** Fetch booked date intervals for a vehicle (admin endpoint). */
export function useVehicleBookedDates(vehicleId: string | null) {
    return useQuery({
        queryKey: chauffeurBookingKeys.vehicleBookedDates(vehicleId ?? ''),
        queryFn: async () => {
            const res = await chauffeurBookingService.getVehicleBookedDates(
                vehicleId!
            );
            return (res.data ?? []).map(interval => ({
                start: startOfDay(new Date(interval.start)),
                end: endOfDay(new Date(interval.end)),
            }));
        },
        enabled: !!vehicleId,
    });
}

/** Fetch booked date intervals for a vehicle (public endpoint - no auth required). */
export function usePublicVehicleBookedDates(vehicleId: string | null) {
    return useQuery({
        queryKey: [
            ...chauffeurBookingKeys.vehicleBookedDates(vehicleId ?? ''),
            'public',
        ],
        queryFn: async () => {
            const res = await publicChauffeurService.getBookedDates(vehicleId!);
            return (res.data ?? []).map(interval => ({
                start: startOfDay(new Date(interval.start)),
                end: endOfDay(new Date(interval.end)),
            }));
        },
        enabled: !!vehicleId,
    });
}

/* Mutations */
export function useCreateChauffeurBooking() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateChauffeurBookingData) =>
            chauffeurBookingService.create(payload),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: chauffeurBookingKeys.lists(),
            });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.recentActivity,
            });
            toast.success(
                res?.message || 'Chauffeur booking created successfully'
            );
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to create chauffeur booking.')
            );
        },
    });
}

export function useUpdateChauffeurBooking() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: UpdateChauffeurBookingData;
        }) => chauffeurBookingService.update(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: chauffeurBookingKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: chauffeurBookingKeys.detail(res.data.id),
            });
            toast.success(res?.message || 'Booking updated successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to update booking.'));
        },
    });
}

export function useDeleteChauffeurBooking() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => chauffeurBookingService.delete(id),
        onSuccess: data => {
            queryClient.invalidateQueries({
                queryKey: chauffeurBookingKeys.lists(),
            });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            toast.success(data.message || 'Booking deleted successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to delete booking.'));
        },
    });
}

export function useConfirmChauffeurBooking() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => chauffeurBookingService.confirm(id),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: chauffeurBookingKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: chauffeurBookingKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            toast.success(res?.message || 'Booking confirmed');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to confirm booking.'));
        },
    });
}

export function useAssignChauffeurDriver() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: AssignChauffeurDriverData;
        }) => chauffeurBookingService.assignDriver(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: chauffeurBookingKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: chauffeurBookingKeys.detail(res.data.id),
            });
            toast.success(res?.message || 'Driver assigned successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to assign driver.'));
        },
    });
}

export function useRemoveChauffeurDriver() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => chauffeurBookingService.removeDriver(id),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: chauffeurBookingKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: chauffeurBookingKeys.detail(res.data.id),
            });
            toast.success(res?.message || 'Driver removed');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to remove driver.'));
        },
    });
}

export function useStartChauffeurTrip() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => chauffeurBookingService.startTrip(id),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: chauffeurBookingKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: chauffeurBookingKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.recentActivity,
            });
            toast.success(res?.message || 'Trip started');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to start trip.'));
        },
    });
}

export function useCompleteChauffeurTrip() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => chauffeurBookingService.completeTrip(id),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: chauffeurBookingKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: chauffeurBookingKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.recentActivity,
            });
            toast.success(res?.message || 'Trip completed');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to complete trip.'));
        },
    });
}

export function useCancelChauffeurBooking() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: CancelChauffeurBookingData;
        }) => chauffeurBookingService.cancel(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: chauffeurBookingKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: chauffeurBookingKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.recentActivity,
            });
            toast.success(res?.message || 'Booking cancelled');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to cancel booking.'));
        },
    });
}

export function useMarkChauffeurNoShow() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => chauffeurBookingService.noShow(id),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: chauffeurBookingKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: chauffeurBookingKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.recentActivity,
            });
            toast.success(res?.message || 'Marked as no-show');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to mark no-show.'));
        },
    });
}

export function useRecordChauffeurPayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: RecordChauffeurPaymentData;
        }) => chauffeurBookingService.recordPayment(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: chauffeurBookingKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: chauffeurBookingKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: transactionKeys.all });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.revenueTrendAll,
            });
            toast.success(res?.message || 'Payment recorded successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to record payment.'));
        },
    });
}

export function useLogChauffeurPickup() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: ChauffeurPickupLogData;
        }) => chauffeurBookingService.logPickup(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: chauffeurBookingKeys.detail(res.data.id),
            });
            toast.success(res?.message || 'Pickup logged successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to log pickup.'));
        },
    });
}

export function useLogChauffeurReturn() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: ChauffeurReturnLogData;
        }) => chauffeurBookingService.logReturn(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: chauffeurBookingKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: chauffeurBookingKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.recentActivity,
            });
            toast.success(res?.message || 'Return logged successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to log return.'));
        },
    });
}

export function useProcessChauffeurRefund() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            action,
            note,
        }: {
            id: string;
            action: 'approve' | 'waive';
            note?: string;
        }) => chauffeurBookingService.refund(id, { action, note }),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: chauffeurBookingKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: chauffeurBookingKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: transactionKeys.all });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.revenueTrendAll,
            });
            toast.success(res?.message || 'Refund processed.');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to process refund.'));
        },
    });
}

export function useSendChauffeurPaymentLink() {
    return useMutation({
        mutationFn: (id: string) => chauffeurBookingService.sendPaymentLink(id),
        onSuccess: res => {
            toast.success(res?.message || 'Payment link sent successfully.');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to send payment link.'));
        },
    });
}
