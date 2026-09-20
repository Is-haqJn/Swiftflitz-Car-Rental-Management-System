import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { emailTemplateService } from '@/services/emailTemplateService';
import type { UpdateEmailTemplatePayload } from '@/shared/types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';

export const emailTemplateKeys = {
    all: ['email-templates'] as const,
    detail: (key: string) => ['email-templates', key] as const,
};

export function useEmailTemplates() {
    return useQuery({
        queryKey: emailTemplateKeys.all,
        queryFn: () => emailTemplateService.getAll(),
        staleTime: 1000 * 60 * 5,
    });
}

export function useEmailTemplate(key: string) {
    return useQuery({
        queryKey: emailTemplateKeys.detail(key),
        queryFn: () => emailTemplateService.getByKey(key),
        staleTime: 1000 * 60 * 5,
        enabled: Boolean(key),
    });
}

export function useUpdateEmailTemplate(key: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UpdateEmailTemplatePayload) =>
            emailTemplateService.update(key, payload),
        onSuccess: res => {
            toast.success(res.message ?? 'Template saved successfully');
            queryClient.invalidateQueries({
                queryKey: emailTemplateKeys.detail(key),
            });
            queryClient.invalidateQueries({ queryKey: emailTemplateKeys.all });
        },
        onError: error =>
            toast.error(getErrorMessage(error, 'Failed to save template')),
    });
}

export function useResetEmailTemplate(key: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => emailTemplateService.reset(key),
        onSuccess: res => {
            toast.success(res.message ?? 'Template reset to default');
            queryClient.invalidateQueries({
                queryKey: emailTemplateKeys.detail(key),
            });
            queryClient.invalidateQueries({ queryKey: emailTemplateKeys.all });
        },
        onError: error =>
            toast.error(getErrorMessage(error, 'Failed to reset template')),
    });
}
