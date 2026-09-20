import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { airportCancellationSettingsService } from '@/services/airportCancellationSettingsService';
import type { AirportCancellationSettingsData } from '@/shared/types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';

export const airportCancellationSettingsKeys = {
    settings: ['airport-cancellation-settings'] as const,
};

export function useAirportCancellationSettings() {
    return useQuery({
        queryKey: airportCancellationSettingsKeys.settings,
        queryFn: () => airportCancellationSettingsService.getSettings(),
    });
}

export function useUpdateAirportCancellationSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: AirportCancellationSettingsData) =>
            airportCancellationSettingsService.updateSettings(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: airportCancellationSettingsKeys.settings,
            });
            toast.success('Cancellation settings saved', {
                id: 'airport-cancellation-settings-save',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to save cancellation settings'),
                { id: 'airport-cancellation-settings-save-error' }
            ),
    });
}
