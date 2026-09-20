import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chauffeurSettingsService } from '@/services/chauffeurSettingsService';
import type {
    ChauffeurSettings,
    PublicChauffeurSettings,
    UpdateChauffeurSettingsData,
} from '@/shared/types/chauffeur-settings.types';
import type { ApiResponse } from '@/shared/types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';

const CHAUFFEUR_SETTINGS_KEY = ['chauffeur-settings'] as const;
const PUBLIC_CHAUFFEUR_SETTINGS_KEY = ['public', 'chauffeur-settings'] as const;

export function usePublicChauffeurSettings() {
    return useQuery<ApiResponse<PublicChauffeurSettings>>({
        queryKey: PUBLIC_CHAUFFEUR_SETTINGS_KEY,
        queryFn: () => chauffeurSettingsService.getPublic(),
        staleTime: 1000 * 60 * 10,
    });
}

export function useChauffeurSettings() {
    return useQuery<ApiResponse<ChauffeurSettings>>({
        queryKey: CHAUFFEUR_SETTINGS_KEY,
        queryFn: () => chauffeurSettingsService.get(),
    });
}

export function useUpdateChauffeurSettings() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: UpdateChauffeurSettingsData) =>
            chauffeurSettingsService.update(payload),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: CHAUFFEUR_SETTINGS_KEY });
            toast.success(res?.message || 'Settings saved successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to save settings.'));
        },
    });
}
