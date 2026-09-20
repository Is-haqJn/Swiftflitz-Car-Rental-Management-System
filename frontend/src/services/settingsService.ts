import { apiClient } from '@/shared/api/apiClient';
import { API_ENDPOINTS } from '@/shared/api/endpoints';
import type { ApiResponse } from '@/shared/types';
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
    SystemInfo,
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
    S3SettingsData,
} from '@/shared/types';

export const settingsService = {
    async getGeneral(): Promise<ApiResponse<GeneralSettingsData>> {
        return apiClient.get<ApiResponse<GeneralSettingsData>>(
            API_ENDPOINTS.SETTINGS.GENERAL
        );
    },

    async updateGeneral(
        data: GeneralSettingsData
    ): Promise<ApiResponse<GeneralSettingsData>> {
        return apiClient.put<ApiResponse<GeneralSettingsData>>(
            API_ENDPOINTS.SETTINGS.GENERAL,
            data
        );
    },

    async getRental(): Promise<ApiResponse<RentalSettingsData>> {
        return apiClient.get<ApiResponse<RentalSettingsData>>(
            API_ENDPOINTS.SETTINGS.RENTAL
        );
    },

    async updateRental(
        data: RentalSettingsData
    ): Promise<ApiResponse<RentalSettingsData>> {
        return apiClient.put<ApiResponse<RentalSettingsData>>(
            API_ENDPOINTS.SETTINGS.RENTAL,
            data
        );
    },

    async getPricing(): Promise<ApiResponse<PricingSettingsData>> {
        return apiClient.get<ApiResponse<PricingSettingsData>>(
            API_ENDPOINTS.SETTINGS.PRICING
        );
    },

    async updatePricing(
        data: PricingSettingsData
    ): Promise<ApiResponse<PricingSettingsData>> {
        return apiClient.put<ApiResponse<PricingSettingsData>>(
            API_ENDPOINTS.SETTINGS.PRICING,
            data
        );
    },

    async getCancellation(): Promise<ApiResponse<CancellationSettingsData>> {
        return apiClient.get<ApiResponse<CancellationSettingsData>>(
            API_ENDPOINTS.SETTINGS.CANCELLATION
        );
    },

    async updateCancellation(
        data: CancellationSettingsData
    ): Promise<ApiResponse<CancellationSettingsData>> {
        return apiClient.put<ApiResponse<CancellationSettingsData>>(
            API_ENDPOINTS.SETTINGS.CANCELLATION,
            data
        );
    },

    async getOverdue(): Promise<ApiResponse<OverdueSettingsData>> {
        return apiClient.get<ApiResponse<OverdueSettingsData>>(
            API_ENDPOINTS.SETTINGS.OVERDUE
        );
    },

    async updateOverdue(
        data: OverdueSettingsData
    ): Promise<ApiResponse<OverdueSettingsData>> {
        return apiClient.put<ApiResponse<OverdueSettingsData>>(
            API_ENDPOINTS.SETTINGS.OVERDUE,
            data
        );
    },

    async getEarlyReturn(): Promise<ApiResponse<EarlyReturnSettingsData>> {
        return apiClient.get<ApiResponse<EarlyReturnSettingsData>>(
            API_ENDPOINTS.SETTINGS.EARLY_RETURN
        );
    },

    async updateEarlyReturn(
        data: EarlyReturnSettingsData
    ): Promise<ApiResponse<EarlyReturnSettingsData>> {
        return apiClient.put<ApiResponse<EarlyReturnSettingsData>>(
            API_ENDPOINTS.SETTINGS.EARLY_RETURN,
            data
        );
    },

    async getEmail(): Promise<ApiResponse<EmailSettingsData>> {
        return apiClient.get<ApiResponse<EmailSettingsData>>(
            API_ENDPOINTS.SETTINGS.EMAIL
        );
    },

    async updateEmail(
        data: EmailSettingsData
    ): Promise<ApiResponse<EmailSettingsData>> {
        return apiClient.put<ApiResponse<EmailSettingsData>>(
            API_ENDPOINTS.SETTINGS.EMAIL,
            data
        );
    },

    async testEmail(email: string): Promise<ApiResponse<null>> {
        return apiClient.post<ApiResponse<null>>(
            API_ENDPOINTS.SETTINGS.EMAIL_TEST,
            { email }
        );
    },

    async getWhatsApp(): Promise<ApiResponse<WhatsAppSettingsData>> {
        return apiClient.get<ApiResponse<WhatsAppSettingsData>>(
            API_ENDPOINTS.SETTINGS.WHATSAPP
        );
    },

    async updateWhatsApp(
        data: WhatsAppSettingsData
    ): Promise<ApiResponse<WhatsAppSettingsData>> {
        return apiClient.put<ApiResponse<WhatsAppSettingsData>>(
            API_ENDPOINTS.SETTINGS.WHATSAPP,
            data
        );
    },

    async testWhatsApp(
        phone: string,
        type?: string
    ): Promise<ApiResponse<null>> {
        return apiClient.post<ApiResponse<null>>(
            API_ENDPOINTS.SETTINGS.WHATSAPP_TEST,
            { phone, type }
        );
    },

    async getSms(): Promise<ApiResponse<SmsSettingsData>> {
        return apiClient.get<ApiResponse<SmsSettingsData>>(
            API_ENDPOINTS.SETTINGS.SMS
        );
    },

    async updateSms(
        data: SmsSettingsData
    ): Promise<ApiResponse<SmsSettingsData>> {
        return apiClient.put<ApiResponse<SmsSettingsData>>(
            API_ENDPOINTS.SETTINGS.SMS,
            data
        );
    },

    async testSms(phone: string, type?: string): Promise<ApiResponse<null>> {
        return apiClient.post<ApiResponse<null>>(
            API_ENDPOINTS.SETTINGS.SMS_TEST,
            { phone, type }
        );
    },

    async getSeo(): Promise<ApiResponse<SeoSettingsData>> {
        return apiClient.get<ApiResponse<SeoSettingsData>>(
            API_ENDPOINTS.SETTINGS.SEO
        );
    },

    async updateSeo(
        data: SeoSettingsData
    ): Promise<ApiResponse<SeoSettingsData>> {
        return apiClient.put<ApiResponse<SeoSettingsData>>(
            API_ENDPOINTS.SETTINGS.SEO,
            data
        );
    },

    async getPayment(): Promise<ApiResponse<PaymentSettingsData>> {
        return apiClient.get<ApiResponse<PaymentSettingsData>>(
            API_ENDPOINTS.SETTINGS.PAYMENT
        );
    },

    async updatePayment(
        data: PaymentSettingsData
    ): Promise<ApiResponse<PaymentSettingsData>> {
        return apiClient.put<ApiResponse<PaymentSettingsData>>(
            API_ENDPOINTS.SETTINGS.PAYMENT,
            data
        );
    },

    async getHeader(): Promise<ApiResponse<HeaderSettingsData>> {
        return apiClient.get<ApiResponse<HeaderSettingsData>>(
            API_ENDPOINTS.SETTINGS.HEADER
        );
    },

    async updateHeader(
        data: HeaderSettingsData
    ): Promise<ApiResponse<HeaderSettingsData>> {
        return apiClient.put<ApiResponse<HeaderSettingsData>>(
            API_ENDPOINTS.SETTINGS.HEADER,
            data
        );
    },

    async getHomepage(): Promise<ApiResponse<HomepageSettingsData>> {
        return apiClient.get<ApiResponse<HomepageSettingsData>>(
            API_ENDPOINTS.SETTINGS.HOMEPAGE
        );
    },

    async updateHomepage(
        data: HomepageSettingsData
    ): Promise<ApiResponse<HomepageSettingsData>> {
        return apiClient.put<ApiResponse<HomepageSettingsData>>(
            API_ENDPOINTS.SETTINGS.HOMEPAGE,
            data
        );
    },

    async uploadHeroImage(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<ApiResponse<HomepageSettingsData>> {
        const formData = new FormData();
        formData.append('image', file);

        return apiClient.upload<ApiResponse<HomepageSettingsData>>(
            API_ENDPOINTS.SETTINGS.HOMEPAGE_HERO_IMAGE,
            formData,
            onProgress
        );
    },

    async getAbout(): Promise<ApiResponse<AboutSettingsData>> {
        return apiClient.get<ApiResponse<AboutSettingsData>>(
            API_ENDPOINTS.SETTINGS.ABOUT
        );
    },

    async updateAbout(
        data: AboutSettingsData
    ): Promise<ApiResponse<AboutSettingsData>> {
        return apiClient.put<ApiResponse<AboutSettingsData>>(
            API_ENDPOINTS.SETTINGS.ABOUT,
            data
        );
    },

    async uploadAboutBannerImage(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<ApiResponse<AboutSettingsData>> {
        const formData = new FormData();
        formData.append('image', file);

        return apiClient.upload<ApiResponse<AboutSettingsData>>(
            API_ENDPOINTS.SETTINGS.ABOUT_BANNER_IMAGE,
            formData,
            onProgress
        );
    },

    async uploadTeamPhoto(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<ApiResponse<{ url: string }>> {
        const formData = new FormData();
        formData.append('image', file);

        return apiClient.upload<ApiResponse<{ url: string }>>(
            API_ENDPOINTS.SETTINGS.ABOUT_TEAM_PHOTO,
            formData,
            onProgress
        );
    },

    async uploadAboutValuesBgImage(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<ApiResponse<AboutSettingsData>> {
        const formData = new FormData();
        formData.append('image', file);

        return apiClient.upload<ApiResponse<AboutSettingsData>>(
            API_ENDPOINTS.SETTINGS.ABOUT_VALUES_BG_IMAGE,
            formData,
            onProgress
        );
    },

    async uploadAboutBgImage(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<ApiResponse<AboutSettingsData>> {
        const formData = new FormData();
        formData.append('image', file);

        return apiClient.upload<ApiResponse<AboutSettingsData>>(
            API_ENDPOINTS.SETTINGS.ABOUT_BG_IMAGE,
            formData,
            onProgress
        );
    },

    async uploadAboutOverlayImage(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<ApiResponse<AboutSettingsData>> {
        const formData = new FormData();
        formData.append('image', file);

        return apiClient.upload<ApiResponse<AboutSettingsData>>(
            API_ENDPOINTS.SETTINGS.ABOUT_OVERLAY_IMAGE,
            formData,
            onProgress
        );
    },

    async getIcons(): Promise<
        ApiResponse<{ url: string; filename: string }[]>
    > {
        return apiClient.get<ApiResponse<{ url: string; filename: string }[]>>(
            API_ENDPOINTS.SETTINGS.ICONS
        );
    },

    async uploadCardIcon(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<ApiResponse<{ url: string; filename: string }>> {
        const formData = new FormData();
        formData.append('image', file);

        return apiClient.upload<ApiResponse<{ url: string; filename: string }>>(
            API_ENDPOINTS.SETTINGS.ICONS_UPLOAD,
            formData,
            onProgress
        );
    },

    async uploadWhyChooseUsBgImage(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<ApiResponse<HomepageSettingsData>> {
        const formData = new FormData();
        formData.append('image', file);

        return apiClient.upload<ApiResponse<HomepageSettingsData>>(
            API_ENDPOINTS.SETTINGS.WHY_CHOOSE_US_BG_IMAGE,
            formData,
            onProgress
        );
    },

    async uploadChauffeurImage(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<ApiResponse<HomepageSettingsData>> {
        const formData = new FormData();
        formData.append('image', file);

        return apiClient.upload<ApiResponse<HomepageSettingsData>>(
            API_ENDPOINTS.SETTINGS.CHAUFFEUR_IMAGE,
            formData,
            onProgress
        );
    },

    async uploadPickupProcessBgImage(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<ApiResponse<HomepageSettingsData>> {
        const formData = new FormData();
        formData.append('image', file);

        return apiClient.upload<ApiResponse<HomepageSettingsData>>(
            API_ENDPOINTS.SETTINGS.PICKUP_PROCESS_BG_IMAGE,
            formData,
            onProgress
        );
    },

    async uploadPickupProcessBottomImage(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<ApiResponse<HomepageSettingsData>> {
        const formData = new FormData();
        formData.append('image', file);

        return apiClient.upload<ApiResponse<HomepageSettingsData>>(
            API_ENDPOINTS.SETTINGS.PICKUP_PROCESS_BOTTOM_IMAGE,
            formData,
            onProgress
        );
    },

    async uploadTestimonialImage(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<ApiResponse<{ path: string; filename: string }>> {
        const formData = new FormData();
        formData.append('image', file);

        return apiClient.upload<
            ApiResponse<{ path: string; filename: string }>
        >(API_ENDPOINTS.SETTINGS.TESTIMONIAL_IMAGE, formData, onProgress);
    },

    async getServices(): Promise<ApiResponse<ServicesSettingsData>> {
        return apiClient.get<ApiResponse<ServicesSettingsData>>(
            API_ENDPOINTS.SETTINGS.SERVICES
        );
    },

    async updateServices(
        data: ServicesSettingsData
    ): Promise<ApiResponse<ServicesSettingsData>> {
        return apiClient.put<ApiResponse<ServicesSettingsData>>(
            API_ENDPOINTS.SETTINGS.SERVICES,
            data
        );
    },

    async uploadServicesBannerImage(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<ApiResponse<ServicesSettingsData>> {
        const formData = new FormData();
        formData.append('image', file);

        return apiClient.upload<ApiResponse<ServicesSettingsData>>(
            API_ENDPOINTS.SETTINGS.SERVICES_BANNER_IMAGE,
            formData,
            onProgress
        );
    },

    async uploadServicesFacilityCardImage(
        file: File,
        index: number,
        onProgress?: (percent: number) => void
    ): Promise<ApiResponse<{ path: string }>> {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('index', String(index));

        return apiClient.upload<ApiResponse<{ path: string }>>(
            API_ENDPOINTS.SETTINGS.SERVICES_FACILITY_CARD_IMAGE,
            formData,
            onProgress
        );
    },

    async uploadServicesWhyChooseUsBgImage(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<ApiResponse<ServicesSettingsData>> {
        const formData = new FormData();
        formData.append('image', file);

        return apiClient.upload<ApiResponse<ServicesSettingsData>>(
            API_ENDPOINTS.SETTINGS.SERVICES_WHY_CHOOSE_US_BG_IMAGE,
            formData,
            onProgress
        );
    },

    async uploadListingsBannerImage(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<ApiResponse<ServicesSettingsData>> {
        const formData = new FormData();
        formData.append('image', file);

        return apiClient.upload<ApiResponse<ServicesSettingsData>>(
            API_ENDPOINTS.SETTINGS.SERVICES_LISTINGS_BANNER_IMAGE,
            formData,
            onProgress
        );
    },

    async uploadAirportTransferBannerImage(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<ApiResponse<ServicesSettingsData>> {
        const formData = new FormData();
        formData.append('image', file);

        return apiClient.upload<ApiResponse<ServicesSettingsData>>(
            API_ENDPOINTS.SETTINGS.SERVICES_AIRPORT_TRANSFER_BANNER_IMAGE,
            formData,
            onProgress
        );
    },

    async uploadChauffeurBannerImage(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<ApiResponse<ServicesSettingsData>> {
        const formData = new FormData();
        formData.append('image', file);

        return apiClient.upload<ApiResponse<ServicesSettingsData>>(
            API_ENDPOINTS.SETTINGS.SERVICES_CHAUFFEUR_BANNER_IMAGE,
            formData,
            onProgress
        );
    },

    async getFaq(): Promise<ApiResponse<FaqSettingsData>> {
        return apiClient.get<ApiResponse<FaqSettingsData>>(
            API_ENDPOINTS.SETTINGS.FAQ
        );
    },

    async updateFaq(
        data: FaqSettingsData
    ): Promise<ApiResponse<FaqSettingsData>> {
        return apiClient.put<ApiResponse<FaqSettingsData>>(
            API_ENDPOINTS.SETTINGS.FAQ,
            data
        );
    },

    async uploadFaqBannerImage(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<ApiResponse<FaqSettingsData>> {
        const formData = new FormData();
        formData.append('image', file);

        return apiClient.upload<ApiResponse<FaqSettingsData>>(
            API_ENDPOINTS.SETTINGS.FAQ_BANNER_IMAGE,
            formData,
            onProgress
        );
    },

    async uploadFaqSectionBgImage(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<ApiResponse<FaqSettingsData>> {
        const formData = new FormData();
        formData.append('image', file);

        return apiClient.upload<ApiResponse<FaqSettingsData>>(
            API_ENDPOINTS.SETTINGS.FAQ_SECTION_BG_IMAGE,
            formData,
            onProgress
        );
    },

    async getTerms(): Promise<ApiResponse<TermsSettingsData>> {
        return apiClient.get<ApiResponse<TermsSettingsData>>(
            API_ENDPOINTS.SETTINGS.TERMS
        );
    },

    async updateTerms(
        data: TermsSettingsData
    ): Promise<ApiResponse<TermsSettingsData>> {
        return apiClient.put<ApiResponse<TermsSettingsData>>(
            API_ENDPOINTS.SETTINGS.TERMS,
            data
        );
    },

    async uploadTermsBannerImage(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<ApiResponse<TermsSettingsData>> {
        const formData = new FormData();
        formData.append('image', file);

        return apiClient.upload<ApiResponse<TermsSettingsData>>(
            API_ENDPOINTS.SETTINGS.TERMS_BANNER_IMAGE,
            formData,
            onProgress
        );
    },

    async getPrivacy(): Promise<ApiResponse<PrivacySettingsData>> {
        return apiClient.get<ApiResponse<PrivacySettingsData>>(
            API_ENDPOINTS.SETTINGS.PRIVACY
        );
    },

    async updatePrivacy(
        data: PrivacySettingsData
    ): Promise<ApiResponse<PrivacySettingsData>> {
        return apiClient.put<ApiResponse<PrivacySettingsData>>(
            API_ENDPOINTS.SETTINGS.PRIVACY,
            data
        );
    },

    async uploadPrivacyBannerImage(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<ApiResponse<PrivacySettingsData>> {
        const formData = new FormData();
        formData.append('image', file);

        return apiClient.upload<ApiResponse<PrivacySettingsData>>(
            API_ENDPOINTS.SETTINGS.PRIVACY_BANNER_IMAGE,
            formData,
            onProgress
        );
    },

    async uploadContactBannerImage(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<ApiResponse<ContactSettingsData>> {
        const formData = new FormData();
        formData.append('image', file);

        return apiClient.upload<ApiResponse<ContactSettingsData>>(
            API_ENDPOINTS.SETTINGS.CONTACT_BANNER_IMAGE,
            formData,
            onProgress
        );
    },

    async uploadContactSectionBgImage(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<ApiResponse<ContactSettingsData>> {
        const formData = new FormData();
        formData.append('image', file);

        return apiClient.upload<ApiResponse<ContactSettingsData>>(
            API_ENDPOINTS.SETTINGS.CONTACT_SECTION_BG_IMAGE,
            formData,
            onProgress
        );
    },

    async getContact(): Promise<ApiResponse<ContactSettingsData>> {
        return apiClient.get<ApiResponse<ContactSettingsData>>(
            API_ENDPOINTS.SETTINGS.CONTACT
        );
    },

    async updateContact(
        data: ContactSettingsData
    ): Promise<ApiResponse<ContactSettingsData>> {
        return apiClient.put<ApiResponse<ContactSettingsData>>(
            API_ENDPOINTS.SETTINGS.CONTACT,
            data
        );
    },

    async getFooter(): Promise<ApiResponse<FooterSettingsData>> {
        return apiClient.get<ApiResponse<FooterSettingsData>>(
            API_ENDPOINTS.SETTINGS.FOOTER
        );
    },

    async updateFooter(
        data: FooterSettingsData
    ): Promise<ApiResponse<FooterSettingsData>> {
        return apiClient.put<ApiResponse<FooterSettingsData>>(
            API_ENDPOINTS.SETTINGS.FOOTER,
            data
        );
    },

    async getSystemInfo(): Promise<ApiResponse<SystemInfo>> {
        return apiClient.get<ApiResponse<SystemInfo>>(
            API_ENDPOINTS.SYSTEM.INFO
        );
    },

    async clearAllCaches(): Promise<ApiResponse<null>> {
        return apiClient.post<ApiResponse<null>>(
            API_ENDPOINTS.SYSTEM.CACHE_CLEAR,
            {}
        );
    },

    async clearConfigCache(): Promise<ApiResponse<null>> {
        return apiClient.post<ApiResponse<null>>(
            API_ENDPOINTS.SYSTEM.CACHE_CONFIG,
            {}
        );
    },

    async clearRouteCache(): Promise<ApiResponse<null>> {
        return apiClient.post<ApiResponse<null>>(
            API_ENDPOINTS.SYSTEM.CACHE_ROUTES,
            {}
        );
    },

    async clearViewCache(): Promise<ApiResponse<null>> {
        return apiClient.post<ApiResponse<null>>(
            API_ENDPOINTS.SYSTEM.CACHE_VIEWS,
            {}
        );
    },

    async getNotificationSystemSettings(): Promise<
        ApiResponse<NotificationSettings>
    > {
        return apiClient.get<ApiResponse<NotificationSettings>>(
            API_ENDPOINTS.SETTINGS.NOTIFICATION_SYSTEM
        );
    },

    async updateNotificationSystemSettings(
        data: Partial<NotificationSettings>
    ): Promise<ApiResponse<NotificationSettings>> {
        return apiClient.put<ApiResponse<NotificationSettings>>(
            API_ENDPOINTS.SETTINGS.NOTIFICATION_SYSTEM,
            data
        );
    },

    async getPopups(): Promise<ApiResponse<PopupSettingsData>> {
        return apiClient.get<ApiResponse<PopupSettingsData>>(
            API_ENDPOINTS.SETTINGS.POPUPS
        );
    },

    async updatePopups(
        data: PopupSettingsData
    ): Promise<ApiResponse<PopupSettingsData>> {
        return apiClient.put<ApiResponse<PopupSettingsData>>(
            API_ENDPOINTS.SETTINGS.POPUPS,
            data
        );
    },

    async getS3Settings(): Promise<ApiResponse<S3SettingsData>> {
        return apiClient.get<ApiResponse<S3SettingsData>>(
            API_ENDPOINTS.SETTINGS.S3
        );
    },

    async updateS3Settings(
        data: S3SettingsData
    ): Promise<ApiResponse<S3SettingsData>> {
        return apiClient.put<ApiResponse<S3SettingsData>>(
            API_ENDPOINTS.SETTINGS.S3,
            data
        );
    },

    async uploadPromoImage(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<ApiResponse<{ promo_image_url: string | null }>> {
        const formData = new FormData();
        formData.append('image', file);

        return apiClient.upload<
            ApiResponse<{ promo_image_url: string | null }>
        >(API_ENDPOINTS.SETTINGS.POPUPS_PROMO_IMAGE, formData, onProgress);
    },
};
