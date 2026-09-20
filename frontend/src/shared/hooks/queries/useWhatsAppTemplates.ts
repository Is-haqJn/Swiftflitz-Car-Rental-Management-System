import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { whatsappTemplateService } from '@/services/whatsappTemplateService';
import type { UpdateWhatsAppTemplatePayload } from '@/shared/types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';

export const whatsappTemplateKeys = {
    all: ['whatsapp-templates'] as const,
    detail: (key: string) => ['whatsapp-templates', key] as const,
};

export function useWhatsAppTemplates() {
    return useQuery({
        queryKey: whatsappTemplateKeys.all,
        queryFn: () => whatsappTemplateService.getAll(),
        staleTime: 1000 * 60 * 5,
    });
}

export function useWhatsAppTemplate(key: string) {
    return useQuery({
        queryKey: whatsappTemplateKeys.detail(key),
        queryFn: () => whatsappTemplateService.getByKey(key),
        staleTime: 1000 * 60 * 5,
        enabled: Boolean(key),
    });
}

export function useUpdateWhatsAppTemplate(key: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UpdateWhatsAppTemplatePayload) =>
            whatsappTemplateService.update(key, payload),
        onSuccess: res => {
            toast.success(res.message ?? 'Template saved successfully');
            queryClient.invalidateQueries({
                queryKey: whatsappTemplateKeys.detail(key),
            });
            queryClient.invalidateQueries({
                queryKey: whatsappTemplateKeys.all,
            });
        },
        onError: error =>
            toast.error(getErrorMessage(error, 'Failed to save template')),
    });
}

export function useResetWhatsAppTemplate(key: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => whatsappTemplateService.reset(key),
        onSuccess: res => {
            toast.success(res.message ?? 'Template reset to default');
            queryClient.invalidateQueries({
                queryKey: whatsappTemplateKeys.detail(key),
            });
            queryClient.invalidateQueries({
                queryKey: whatsappTemplateKeys.all,
            });
        },
        onError: error =>
            toast.error(getErrorMessage(error, 'Failed to reset template')),
    });
}
