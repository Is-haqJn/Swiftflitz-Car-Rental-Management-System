import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { smsTemplateService } from '@/services/smsTemplateService';
import type { UpdateSmsTemplatePayload } from '@/shared/types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';

export const smsTemplateKeys = {
    all: ['sms-templates'] as const,
    detail: (key: string) => ['sms-templates', key] as const,
};

export function useSmsTemplates() {
    return useQuery({
        queryKey: smsTemplateKeys.all,
        queryFn: () => smsTemplateService.getAll(),
        staleTime: 1000 * 60 * 5,
    });
}

export function useSmsTemplate(key: string) {
    return useQuery({
        queryKey: smsTemplateKeys.detail(key),
        queryFn: () => smsTemplateService.getByKey(key),
        staleTime: 1000 * 60 * 5,
        enabled: Boolean(key),
    });
}

export function useUpdateSmsTemplate(key: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UpdateSmsTemplatePayload) =>
            smsTemplateService.update(key, payload),
        onSuccess: res => {
            toast.success(res.message ?? 'Template saved successfully');
            queryClient.invalidateQueries({
                queryKey: smsTemplateKeys.detail(key),
            });
            queryClient.invalidateQueries({ queryKey: smsTemplateKeys.all });
        },
        onError: error =>
            toast.error(getErrorMessage(error, 'Failed to save template')),
    });
}

export function useResetSmsTemplate(key: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => smsTemplateService.reset(key),
        onSuccess: res => {
            toast.success(res.message ?? 'Template reset to default');
            queryClient.invalidateQueries({
                queryKey: smsTemplateKeys.detail(key),
            });
            queryClient.invalidateQueries({ queryKey: smsTemplateKeys.all });
        },
        onError: error =>
            toast.error(getErrorMessage(error, 'Failed to reset template')),
    });
}
