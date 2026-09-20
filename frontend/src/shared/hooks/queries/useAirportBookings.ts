import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { airportBookingService } from '@/services/airportBookingService';
import { dashboardKeys } from './useDashboard';
import { transactionKeys } from './useTransactions';
import type {
    AirportBooking,
    CreateAirportBookingData,
    UpdateAirportBookingData,
    AssignDriverData,
    RecordPaymentData,
    CancelBookingData,
    AirportBookingFilters,
} from '@/shared/types/airport-booking.types';
import type { ApiResponse } from '@/shared/types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';

/* Query Keys */
export const airportBookingKeys = {
    all: ['airport-bookings'] as const,
    lists: () => [...airportBookingKeys.all, 'list'] as const,
    list: (filters: AirportBookingFilters) =>
        [...airportBookingKeys.lists(), filters] as const,
    details: () => [...airportBookingKeys.all, 'detail'] as const,
    detail: (id: string) => [...airportBookingKeys.details(), id] as const,
    blockedDates: (branchId: string) =>
        [...airportBookingKeys.all, 'blocked-dates', branchId] as const,
};

/* Queries */
export function useAirportBookingBlockedDates(branchId: string | undefined) {
    const from = new Date().toISOString().slice(0, 10);
    const to = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

    return useQuery({
        queryKey: airportBookingKeys.blockedDates(branchId ?? ''),
        queryFn: () => airportBookingService.blockedDates(branchId!, from, to),
        enabled: !!branchId,
        staleTime: 5 * 60 * 1000,
    });
}

export function useAirportBookings(filters: AirportBookingFilters = {}) {
    return useQuery({
        queryKey: airportBookingKeys.list(filters),
        queryFn: () => airportBookingService.list(filters),
        placeholderData: keepPreviousData,
    });
}

export function useAirportBooking(id: string) {
    return useQuery<ApiResponse<AirportBooking>>({
        queryKey: airportBookingKeys.detail(id),
        queryFn: () => airportBookingService.get(id),
        enabled: !!id,
    });
}

/* Mutations */
export function useCreateAirportBooking() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateAirportBookingData) =>
            airportBookingService.create(payload),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: airportBookingKeys.lists(),
            });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.recentActivity,
            });
            toast.success(
                res?.message || 'Airport booking created successfully.',
                { id: 'airport-booking-create' }
            );
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to create airport booking.')
            );
        },
    });
}

export function useUpdateAirportBooking() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: UpdateAirportBookingData;
        }) => airportBookingService.update(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: airportBookingKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: airportBookingKeys.detail(res.data.id),
            });
            toast.success(
                res?.message || 'Airport booking updated successfully'
            );
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to update airport booking.')
            );
        },
    });
}

export function useDeleteAirportBooking() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => airportBookingService.delete(id),
        onSuccess: data => {
            queryClient.invalidateQueries({
                queryKey: airportBookingKeys.lists(),
            });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            toast.success(
                data.message || 'Airport booking deleted successfully'
            );
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to delete airport booking.')
            );
        },
    });
}

export function useConfirmAirportBooking() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => airportBookingService.confirm(id),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: airportBookingKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: airportBookingKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            toast.success(res?.message || 'Booking confirmed successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to confirm booking.'));
        },
    });
}

export function useAssignAirportBookingDriver() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: AssignDriverData;
        }) => airportBookingService.assignDriver(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: airportBookingKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: airportBookingKeys.detail(res.data.id),
            });
            toast.success(res?.message || 'Driver assigned successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to assign driver.'));
        },
    });
}

export function useRemoveAirportBookingDriver() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => airportBookingService.removeDriver(id),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: airportBookingKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: airportBookingKeys.detail(res.data.id),
            });
            toast.success(res?.message || 'Driver removed successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to remove driver.'));
        },
    });
}

export function useStartAirportTrip() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => airportBookingService.startTrip(id),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: airportBookingKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: airportBookingKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.recentActivity,
            });
            toast.success(res?.message || 'Trip started successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to start trip.'));
        },
    });
}

export function useCompleteAirportTrip() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => airportBookingService.completeTrip(id),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: airportBookingKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: airportBookingKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.recentActivity,
            });
            toast.success(res?.message || 'Trip completed successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to complete trip.'));
        },
    });
}

export function useCancelAirportBooking() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: CancelBookingData;
        }) => airportBookingService.cancel(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: airportBookingKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: airportBookingKeys.detail(res.data.id),
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

export function useMarkAirportBookingNoShow() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => airportBookingService.noShow(id),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: airportBookingKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: airportBookingKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.recentActivity,
            });
            toast.success(res?.message || 'Booking marked as no-show');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to mark no-show.'));
        },
    });
}

export function useRecordAirportBookingPayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: RecordPaymentData;
        }) => airportBookingService.recordPayment(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: airportBookingKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: airportBookingKeys.detail(res.data.id),
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

export function useRefundAirportBooking() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => airportBookingService.refund(id),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: airportBookingKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: airportBookingKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: transactionKeys.all });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.revenueTrendAll,
            });
            toast.success(res?.message || 'Booking marked as refunded');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to mark refund.'));
        },
    });
}

export function useSendAirportPaymentLink() {
    return useMutation({
        mutationFn: (id: string) => airportBookingService.sendPaymentLink(id),
        onSuccess: res => {
            toast.success(res?.message || 'Payment link sent successfully.');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to send payment link.'));
        },
    });
}
