import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { publicQuoteService } from '@/services/publicQuoteService';
import { formatCurrency, formatDate, formatTime } from '@/shared/libs/utils';
import { settingsService } from '@/services/settingsService';
import { useAppSelector } from '@/store';
import { selectAuthUser } from '@/store/slices/authSlice';
import { selectActiveBranchId } from '@/store/slices/activeBranchSlice';
import type {
    GeneralSettingsData,
    RentalSettingsData,
    PricingSettingsData,
    CancellationSettingsData,
    OverdueSettingsData,
    EarlyReturnSettingsData,
    EmailSettingsData,
    WhatsAppSettingsData,
    SmsSettingsData,
    SeoSettingsData,
    PaymentSettingsData,
    S3SettingsData,
    HeaderSettingsData,
    HomepageSettingsData,
    AboutSettingsData,
    ServicesSettingsData,
    FaqSettingsData,
    TermsSettingsData,
    PrivacySettingsData,
    ContactSettingsData,
    FooterSettingsData,
    NotificationSettings,
    PopupSettingsData,
} from '@/shared/types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';

/* Query Keys */

export const publicQueryKeys = {
    contactBranches: ['public', 'contact-branches'] as const,
};

export function usePublicContactBranches() {
    return useQuery({
        queryKey: publicQueryKeys.contactBranches,
        queryFn: () => publicQuoteService.getContactBranches(),
        staleTime: 1000 * 60 * 5,
    });
}

export const settingsKeys = {
    general: ['settings', 'general'] as const,
    rental: ['settings', 'rental'] as const,
    pricing: ['settings', 'pricing'] as const,
    cancellation: ['settings', 'cancellation'] as const,
    overdue: ['settings', 'overdue'] as const,
    earlyReturn: ['settings', 'early-return'] as const,
    email: ['settings', 'email'] as const,
    whatsapp: ['settings', 'whatsapp'] as const,
    sms: ['settings', 'sms'] as const,
    seo: ['settings', 'seo'] as const,
    payment: ['settings', 'payment'] as const,
    s3: ['settings', 's3'] as const,
    systemInfo: ['system', 'info'] as const,
    header: ['settings', 'header'] as const,
    homepage: ['settings', 'homepage'] as const,
    about: ['settings', 'about'] as const,
    services: ['settings', 'services'] as const,
    faq: ['settings', 'faq'] as const,
    terms: ['settings', 'terms'] as const,
    privacy: ['settings', 'privacy'] as const,
    contact: ['settings', 'contact'] as const,
    footer: ['settings', 'footer'] as const,
    notificationSystem: ['settings', 'notification-system'] as const,
    icons: ['settings', 'icons'] as const,
    popups: ['settings', 'popups'] as const,
};

/* Queries */
export function useGeneralSettings() {
    return useQuery({
        queryKey: settingsKeys.general,
        queryFn: () => settingsService.getGeneral(),
    });
}

/**
 * Returns the active currency code for the current user.
 * Uses the active branch's currency when set; falls back to global GeneralSettings currency.
 */
export function useCurrency(): string {
    const { data } = useGeneralSettings();
    const user = useAppSelector(selectAuthUser);
    const activeBranchId = useAppSelector(selectActiveBranchId);
    const globalCurrency = data?.data?.currency ?? 'GHS';

    if (activeBranchId) {
        const branch = (user?.branches ?? []).find(
            b => b.id === activeBranchId
        );
        if (branch?.currency) return branch.currency;
    }

    return globalCurrency;
}

/**
 * Returns a pre-bound formatter - call it like `formatCurrency(amount)` with no second arg.
 * The currency code is read from GeneralSettings automatically and stays in sync.
 *
 * ```ts
 * const formatCurrency = useFormatCurrency();
 * formatCurrency(1500) // => "GHS 1,500.00"
 * ```
 */
export function useFormatCurrency() {
    const currency = useCurrency();
    return useCallback(
        (amount: number | null | undefined) => formatCurrency(amount, currency),
        [currency]
    );
}

/**
 * Returns timezone-aware date and time formatters bound to the app's GeneralSettings timezone.
 *
 * ```ts
 * const { formatDate, formatTime } = useFormatDate();
 * formatDate('2026-04-25T14:30:00Z') // => "25 Apr 2026"
 * formatTime('2026-04-25T14:30:00Z') // => "14:30"
 * ```
 */
export function useFormatDate() {
    const { data } = useGeneralSettings();
    const timezone = data?.data?.timezone ?? 'UTC';

    const formatDateFn = useCallback(
        (dateString: string | null | undefined): string => {
            if (!dateString) return '-';
            const parsed = new Date(dateString);
            if (isNaN(parsed.getTime())) return '-';
            try {
                return new Intl.DateTimeFormat('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    timeZone: timezone,
                }).format(parsed);
            } catch {
                return formatDate(dateString);
            }
        },
        [timezone]
    );

    const formatTimeFn = useCallback(
        (dateString: string | null | undefined): string => {
            if (!dateString) return '-';
            const parsed = new Date(dateString);
            if (isNaN(parsed.getTime())) return '-';
            try {
                return new Intl.DateTimeFormat('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    timeZone: timezone,
                }).format(parsed);
            } catch {
                return formatTime(dateString);
            }
        },
        [timezone]
    );

    return { formatDate: formatDateFn, formatTime: formatTimeFn };
}

export function useRentalSettings() {
    return useQuery({
        queryKey: settingsKeys.rental,
        queryFn: () => settingsService.getRental(),
    });
}

export function usePricingSettings() {
    return useQuery({
        queryKey: settingsKeys.pricing,
        queryFn: () => settingsService.getPricing(),
    });
}

export function useCancellationSettings() {
    return useQuery({
        queryKey: settingsKeys.cancellation,
        queryFn: () => settingsService.getCancellation(),
    });
}

export function useOverdueSettings() {
    return useQuery({
        queryKey: settingsKeys.overdue,
        queryFn: () => settingsService.getOverdue(),
    });
}

export function useEarlyReturnSettings() {
    return useQuery({
        queryKey: settingsKeys.earlyReturn,
        queryFn: () => settingsService.getEarlyReturn(),
    });
}

export function useEmailSettings() {
    return useQuery({
        queryKey: settingsKeys.email,
        queryFn: () => settingsService.getEmail(),
    });
}

export function useWhatsAppSettings() {
    return useQuery({
        queryKey: settingsKeys.whatsapp,
        queryFn: () => settingsService.getWhatsApp(),
    });
}

export function useSmsSettings() {
    return useQuery({
        queryKey: settingsKeys.sms,
        queryFn: () => settingsService.getSms(),
    });
}

export function useSeoSettings() {
    return useQuery({
        queryKey: settingsKeys.seo,
        queryFn: () => settingsService.getSeo(),
    });
}

/* Mutations */
export function useUpdateGeneralSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: GeneralSettingsData) =>
            settingsService.updateGeneral(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.general });
            toast.success('General settings saved', {
                id: 'settings-general-save',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to save general settings'),
                {
                    id: 'settings-general-save-error',
                }
            ),
    });
}

export function useUpdateRentalSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: RentalSettingsData) =>
            settingsService.updateRental(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.rental });
            toast.success('Rental settings saved', {
                id: 'settings-rental-save',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to save rental settings'),
                {
                    id: 'settings-rental-save-error',
                }
            ),
    });
}

export function useUpdatePricingSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: PricingSettingsData) =>
            settingsService.updatePricing(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.pricing });
            toast.success('Pricing settings saved', {
                id: 'settings-pricing-save',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to save pricing settings'),
                {
                    id: 'settings-pricing-save-error',
                }
            ),
    });
}

export function useUpdateCancellationSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CancellationSettingsData) =>
            settingsService.updateCancellation(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: settingsKeys.cancellation,
            });
            toast.success('Cancellation settings saved', {
                id: 'settings-cancellation-save',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to save cancellation settings'),
                { id: 'settings-cancellation-save-error' }
            ),
    });
}

export function useUpdateOverdueSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: OverdueSettingsData) =>
            settingsService.updateOverdue(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.overdue });
            toast.success('Overdue settings saved', {
                id: 'settings-overdue-save',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to save overdue settings'),
                { id: 'settings-overdue-save-error' }
            ),
    });
}

export function useUpdateEarlyReturnSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: EarlyReturnSettingsData) =>
            settingsService.updateEarlyReturn(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: settingsKeys.earlyReturn,
            });
            toast.success('Early return settings saved', {
                id: 'settings-early-return-save',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to save early return settings'),
                { id: 'settings-early-return-save-error' }
            ),
    });
}

export function useUpdateEmailSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: EmailSettingsData) =>
            settingsService.updateEmail(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.email });
            toast.success('Email settings saved', {
                id: 'settings-email-save',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to save email settings'),
                {
                    id: 'settings-email-save-error',
                }
            ),
    });
}

export function useTestEmailConfig() {
    return useMutation({
        mutationFn: (email: string) => settingsService.testEmail(email),
        onSuccess: res =>
            toast.success(res.message ?? 'Test email sent successfully', {
                id: 'settings-email-test',
            }),
        onError: error =>
            toast.error(getErrorMessage(error, 'Failed to send test email'), {
                id: 'settings-email-test-error',
            }),
    });
}

export function useTestSmsConfig() {
    return useMutation({
        mutationFn: ({ phone, type }: { phone: string; type?: string }) =>
            settingsService.testSms(phone, type),
        onSuccess: res =>
            toast.success(res.message ?? 'Test SMS sent successfully', {
                id: 'settings-sms-test',
            }),
        onError: error =>
            toast.error(getErrorMessage(error, 'Failed to send test SMS'), {
                id: 'settings-sms-test-error',
            }),
    });
}

export function useTestWhatsAppConfig() {
    return useMutation({
        mutationFn: ({ phone, type }: { phone: string; type?: string }) =>
            settingsService.testWhatsApp(phone, type),
        onSuccess: res =>
            toast.success(
                res.message ?? 'Test WhatsApp message sent successfully',
                {
                    id: 'settings-whatsapp-test',
                }
            ),
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to send test WhatsApp message'),
                {
                    id: 'settings-whatsapp-test-error',
                }
            ),
    });
}

export function useUpdateWhatsAppSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: WhatsAppSettingsData) =>
            settingsService.updateWhatsApp(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.whatsapp });
            toast.success('WhatsApp settings saved', {
                id: 'settings-whatsapp-save',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to save WhatsApp settings'),
                {
                    id: 'settings-whatsapp-save-error',
                }
            ),
    });
}

export function useUpdateSmsSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: SmsSettingsData) => settingsService.updateSms(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.sms });
            toast.success('SMS settings saved', {
                id: 'settings-sms-save',
            });
        },
        onError: error =>
            toast.error(getErrorMessage(error, 'Failed to save SMS settings'), {
                id: 'settings-sms-save-error',
            }),
    });
}

export function useUpdateSeoSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: SeoSettingsData) => settingsService.updateSeo(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.seo });
            toast.success('SEO settings saved', { id: 'settings-seo-save' });
        },
        onError: error =>
            toast.error(getErrorMessage(error, 'Failed to save SEO settings'), {
                id: 'settings-seo-save-error',
            }),
    });
}

export function usePaymentSettings() {
    return useQuery({
        queryKey: settingsKeys.payment,
        queryFn: () => settingsService.getPayment(),
    });
}

export function useUpdatePaymentSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: PaymentSettingsData) =>
            settingsService.updatePayment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.payment });
            toast.success('Payment settings saved', {
                id: 'settings-payment-save',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to save payment settings'),
                {
                    id: 'settings-payment-save-error',
                }
            ),
    });
}

export const MASKED = '••••••••••••••••';

export function isMasked(value: string | null | undefined): boolean {
    return value === MASKED;
}

export function useS3Settings() {
    return useQuery({
        queryKey: settingsKeys.s3,
        queryFn: () => settingsService.getS3Settings(),
    });
}

export function useUpdateS3Settings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: S3SettingsData) => {
            const payload: S3SettingsData = {};
            for (const [k, v] of Object.entries(data)) {
                if (typeof v === 'string' && isMasked(v)) {
                    continue;
                }
                (payload as Record<string, unknown>)[k] = v;
            }
            return settingsService.updateS3Settings(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.s3 });
            toast.success('S3 settings saved', { id: 'settings-s3-save' });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to save S3 settings'),
                { id: 'settings-s3-save-error' }
            ),
    });
}

/* Content Settings */
export function useHeaderSettings() {
    return useQuery({
        queryKey: settingsKeys.header,
        queryFn: () => settingsService.getHeader(),
    });
}

export function useHomepageSettings() {
    return useQuery({
        queryKey: settingsKeys.homepage,
        queryFn: () => settingsService.getHomepage(),
    });
}

export function useAboutSettings() {
    return useQuery({
        queryKey: settingsKeys.about,
        queryFn: () => settingsService.getAbout(),
    });
}

export function useServicesSettings() {
    return useQuery({
        queryKey: settingsKeys.services,
        queryFn: () => settingsService.getServices(),
    });
}

export function useFaqSettings() {
    return useQuery({
        queryKey: settingsKeys.faq,
        queryFn: () => settingsService.getFaq(),
    });
}

export function useTermsSettings() {
    return useQuery({
        queryKey: settingsKeys.terms,
        queryFn: () => settingsService.getTerms(),
    });
}

export function usePrivacySettings() {
    return useQuery({
        queryKey: settingsKeys.privacy,
        queryFn: () => settingsService.getPrivacy(),
    });
}

export function useContactSettings() {
    return useQuery({
        queryKey: settingsKeys.contact,
        queryFn: () => settingsService.getContact(),
    });
}

export function useFooterSettings() {
    return useQuery({
        queryKey: settingsKeys.footer,
        queryFn: () => settingsService.getFooter(),
    });
}

export function useUpdateHeaderSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: HeaderSettingsData) =>
            settingsService.updateHeader(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.header });
            toast.success('Header settings saved', {
                id: 'settings-header-save',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to save header settings'),
                {
                    id: 'settings-header-save-error',
                }
            ),
    });
}

export function useUpdateHomepageSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: HomepageSettingsData) =>
            settingsService.updateHomepage(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.homepage });
            toast.success('Homepage settings saved', {
                id: 'settings-homepage-save',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to save homepage settings'),
                {
                    id: 'settings-homepage-save-error',
                }
            ),
    });
}

export function useUploadHeroImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) => settingsService.uploadHeroImage(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.homepage });
            toast.success('Hero image uploaded', {
                id: 'settings-hero-image-upload',
            });
        },
        onError: error =>
            toast.error(getErrorMessage(error, 'Failed to upload hero image'), {
                id: 'settings-hero-image-upload-error',
            }),
    });
}

export function useUpdateAboutSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: AboutSettingsData) =>
            settingsService.updateAbout(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.about });
            toast.success('About settings saved', {
                id: 'settings-about-save',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to save about settings'),
                {
                    id: 'settings-about-save-error',
                }
            ),
    });
}

export function useUploadAboutBannerImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) =>
            settingsService.uploadAboutBannerImage(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.about });
            toast.success('Banner image uploaded', {
                id: 'settings-about-banner-image-upload',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to upload banner image'),
                { id: 'settings-about-banner-image-upload-error' }
            ),
    });
}

export function useUploadTeamPhoto() {
    return useMutation({
        mutationFn: (file: File) => settingsService.uploadTeamPhoto(file),
        onError: error =>
            toast.error(getErrorMessage(error, 'Failed to upload team photo'), {
                id: 'settings-team-photo-upload-error',
            }),
    });
}

export function useUploadAboutValuesBgImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) =>
            settingsService.uploadAboutValuesBgImage(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.about });
            toast.success('Values background image uploaded', {
                id: 'settings-about-values-bg-image-upload',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(
                    error,
                    'Failed to upload values background image'
                ),
                { id: 'settings-about-values-bg-image-upload-error' }
            ),
    });
}

export function useUploadAboutBgImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) => settingsService.uploadAboutBgImage(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.about });
            toast.success('Background image uploaded', {
                id: 'settings-about-bg-image-upload',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to upload background image'),
                { id: 'settings-about-bg-image-upload-error' }
            ),
    });
}

export function useUploadAboutOverlayImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) =>
            settingsService.uploadAboutOverlayImage(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.about });
            toast.success('Overlay image uploaded', {
                id: 'settings-about-overlay-image-upload',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to upload overlay image'),
                { id: 'settings-about-overlay-image-upload-error' }
            ),
    });
}

export function useIcons() {
    return useQuery({
        queryKey: settingsKeys.icons,
        queryFn: () => settingsService.getIcons(),
    });
}

export function useUploadWhyChooseUsBgImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) =>
            settingsService.uploadWhyChooseUsBgImage(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.homepage });
            toast.success('Background image uploaded', {
                id: 'settings-why-bg-image-upload',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to upload background image'),
                { id: 'settings-why-bg-image-upload-error' }
            ),
    });
}

export function useUploadChauffeurImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) => settingsService.uploadChauffeurImage(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.homepage });
            toast.success('Image uploaded', {
                id: 'settings-chauffeur-image-upload',
            });
        },
        onError: error =>
            toast.error(getErrorMessage(error, 'Failed to upload image'), {
                id: 'settings-chauffeur-image-upload-error',
            }),
    });
}

export function useUploadPickupProcessBgImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) =>
            settingsService.uploadPickupProcessBgImage(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.homepage });
            toast.success('Background image uploaded', {
                id: 'settings-pickup-process-bg-image-upload',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to upload background image'),
                { id: 'settings-pickup-process-bg-image-upload-error' }
            ),
    });
}

export function useUploadPickupProcessBottomImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) =>
            settingsService.uploadPickupProcessBottomImage(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.homepage });
            toast.success('Bottom image uploaded', {
                id: 'settings-pickup-process-bottom-image-upload',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to upload bottom image'),
                { id: 'settings-pickup-process-bottom-image-upload-error' }
            ),
    });
}

export function useUploadCardIcon() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) => settingsService.uploadCardIcon(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.icons });
            toast.success('Icon uploaded', { id: 'settings-card-icon-upload' });
        },
        onError: error =>
            toast.error(getErrorMessage(error, 'Failed to upload icon'), {
                id: 'settings-card-icon-upload-error',
            }),
    });
}

export function useUploadTestimonialImage() {
    return useMutation({
        mutationFn: (file: File) =>
            settingsService.uploadTestimonialImage(file),
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to upload testimonial image'),
                { id: 'settings-testimonial-image-upload-error' }
            ),
    });
}

export function useUpdateServicesSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ServicesSettingsData) =>
            settingsService.updateServices(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.services });
            toast.success('Services settings saved', {
                id: 'settings-services-save',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to save services settings'),
                {
                    id: 'settings-services-save-error',
                }
            ),
    });
}

export function useUploadServicesBannerImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) =>
            settingsService.uploadServicesBannerImage(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.services });
            toast.success('Banner image uploaded', {
                id: 'settings-services-banner-image-upload',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to upload banner image'),
                { id: 'settings-services-banner-image-upload-error' }
            ),
    });
}

export function useUploadServicesFacilityCardImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ file, index }: { file: File; index: number }) =>
            settingsService.uploadServicesFacilityCardImage(file, index),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.services });
            toast.success('Card image uploaded', {
                id: 'settings-services-facility-card-image-upload',
            });
        },
        onError: error =>
            toast.error(getErrorMessage(error, 'Failed to upload card image'), {
                id: 'settings-services-facility-card-image-upload-error',
            }),
    });
}

export function useUploadServicesWhyChooseUsBgImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) =>
            settingsService.uploadServicesWhyChooseUsBgImage(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.services });
            toast.success('Background image uploaded', {
                id: 'settings-services-why-choose-us-bg-image-upload',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to upload background image'),
                { id: 'settings-services-why-choose-us-bg-image-upload-error' }
            ),
    });
}

export function useUploadListingsBannerImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) =>
            settingsService.uploadListingsBannerImage(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.services });
            toast.success('Listings banner image uploaded', {
                id: 'settings-services-listings-banner-image-upload',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(
                    error,
                    'Failed to upload listings banner image'
                ),
                { id: 'settings-services-listings-banner-image-upload-error' }
            ),
    });
}

export function useUploadAirportTransferBannerImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) =>
            settingsService.uploadAirportTransferBannerImage(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.services });
            toast.success('Airport transfer banner image uploaded', {
                id: 'settings-services-airport-transfer-banner-image-upload',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(
                    error,
                    'Failed to upload airport transfer banner image'
                ),
                {
                    id: 'settings-services-airport-transfer-banner-image-upload-error',
                }
            ),
    });
}

export function useUploadChauffeurBannerImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) =>
            settingsService.uploadChauffeurBannerImage(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.services });
            toast.success('Chauffeur banner image uploaded', {
                id: 'settings-services-chauffeur-banner-image-upload',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(
                    error,
                    'Failed to upload chauffeur banner image'
                ),
                {
                    id: 'settings-services-chauffeur-banner-image-upload-error',
                }
            ),
    });
}

export function useUpdateFaqSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: FaqSettingsData) => settingsService.updateFaq(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.faq });
            toast.success('FAQ settings saved', { id: 'settings-faq-save' });
        },
        onError: error =>
            toast.error(getErrorMessage(error, 'Failed to save FAQ settings'), {
                id: 'settings-faq-save-error',
            }),
    });
}

export function useUploadFaqBannerImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) => settingsService.uploadFaqBannerImage(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.faq });
            toast.success('Banner image uploaded', {
                id: 'settings-faq-banner-upload',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to upload banner image'),
                { id: 'settings-faq-banner-upload-error' }
            ),
    });
}

export function useUploadFaqSectionBgImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) =>
            settingsService.uploadFaqSectionBgImage(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.faq });
            toast.success('Section background image uploaded', {
                id: 'settings-faq-section-bg-upload',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(
                    error,
                    'Failed to upload section background image'
                ),
                { id: 'settings-faq-section-bg-upload-error' }
            ),
    });
}

export function useUpdateTermsSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: TermsSettingsData) =>
            settingsService.updateTerms(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.terms });
            toast.success('Terms settings saved', {
                id: 'settings-terms-save',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to save terms settings'),
                { id: 'settings-terms-save-error' }
            ),
    });
}

export function useUploadTermsBannerImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) =>
            settingsService.uploadTermsBannerImage(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.terms });
            toast.success('Banner image uploaded', {
                id: 'settings-terms-banner-upload',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to upload banner image'),
                { id: 'settings-terms-banner-upload-error' }
            ),
    });
}

export function useUpdatePrivacySettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: PrivacySettingsData) =>
            settingsService.updatePrivacy(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.privacy });
            toast.success('Privacy settings saved', {
                id: 'settings-privacy-save',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to save privacy settings'),
                { id: 'settings-privacy-save-error' }
            ),
    });
}

export function useUploadPrivacyBannerImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) =>
            settingsService.uploadPrivacyBannerImage(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.privacy });
            toast.success('Banner image uploaded', {
                id: 'settings-privacy-banner-upload',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to upload banner image'),
                { id: 'settings-privacy-banner-upload-error' }
            ),
    });
}

export function useUpdateContactSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ContactSettingsData) =>
            settingsService.updateContact(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.contact });
            toast.success('Contact settings saved', {
                id: 'settings-contact-save',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to save contact settings'),
                {
                    id: 'settings-contact-save-error',
                }
            ),
    });
}

export function useUploadContactBannerImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) =>
            settingsService.uploadContactBannerImage(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.contact });
            toast.success('Contact banner image uploaded', {
                id: 'contact-banner-image-upload',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to upload contact banner image'),
                { id: 'contact-banner-image-upload-error' }
            ),
    });
}

export function useUploadContactSectionBgImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) =>
            settingsService.uploadContactSectionBgImage(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.contact });
            toast.success('Contact section background image uploaded', {
                id: 'contact-section-bg-upload',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(
                    error,
                    'Failed to upload contact section background image'
                ),
                { id: 'contact-section-bg-upload-error' }
            ),
    });
}

export function useUpdateFooterSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: FooterSettingsData) =>
            settingsService.updateFooter(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.footer });
            toast.success('Footer settings saved', {
                id: 'settings-footer-save',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to save footer settings'),
                {
                    id: 'settings-footer-save-error',
                }
            ),
    });
}

export function useClearCache() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (type: 'all' | 'config' | 'routes' | 'views') => {
            if (type === 'all') return settingsService.clearAllCaches();
            if (type === 'config') return settingsService.clearConfigCache();
            if (type === 'routes') return settingsService.clearRouteCache();
            return settingsService.clearViewCache();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: settingsKeys.systemInfo,
            });
            toast.success('Cache cleared successfully', { id: 'cache-clear' });
        },
        onError: error =>
            toast.error(getErrorMessage(error, 'Failed to clear cache'), {
                id: 'cache-clear-error',
            }),
    });
}

export function useNotificationSystemSettings() {
    return useQuery({
        queryKey: settingsKeys.notificationSystem,
        queryFn: () => settingsService.getNotificationSystemSettings(),
    });
}

export function useUpdateNotificationSystemSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<NotificationSettings>) =>
            settingsService.updateNotificationSystemSettings(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: settingsKeys.notificationSystem,
            });
            toast.success('Notification settings saved', {
                id: 'settings-notification-system-save',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to save notification settings'),
                { id: 'settings-notification-system-save-error' }
            ),
    });
}

export function usePopupSettings() {
    return useQuery({
        queryKey: settingsKeys.popups,
        queryFn: () => settingsService.getPopups(),
    });
}

export function useUpdatePopupSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: PopupSettingsData) =>
            settingsService.updatePopups(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.popups });
            toast.success('Popup settings saved', {
                id: 'settings-popups-save',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to save popup settings'),
                { id: 'settings-popups-save-error' }
            ),
    });
}

export function useUploadPromoImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) => settingsService.uploadPromoImage(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsKeys.popups });
            toast.success('Promo image uploaded', {
                id: 'settings-promo-image-upload',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to upload promo image'),
                { id: 'settings-promo-image-upload-error' }
            ),
    });
}
