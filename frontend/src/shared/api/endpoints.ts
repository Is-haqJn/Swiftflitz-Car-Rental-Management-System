export const API_ENDPOINTS = {
    // Auth
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
        ME: '/auth/me',
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password',
        VERIFY_EMAIL: '/auth/verify-email',
        UPDATE_PASSWORD: '/auth/password',
        CSRF_TOKEN: '/sanctum/csrf-cookie',
    },

    // Users
    USERS: {
        BASE: '/users',
        BY_ID: (id: number | string) => `/users/${id}`,
        TOGGLE_ACTIVE: (id: number | string) => `/users/${id}/toggle-active`,
        ASSIGN_ROLES: (id: number | string) => `/users/${id}/roles`,
        ASSIGN_PERMISSIONS: (id: number | string) => `/users/${id}/permissions`,
        REVOKE_SESSIONS: (id: number | string) => `/users/${id}/sessions`,
        IMPERSONATE: (id: number | string) => `/users/${id}/impersonate`,
        AVAILABLE_ROLES: '/users/roles/available',
        AVAILABLE_PERMISSIONS: '/users/permissions/available',
        ACTIVITY_LOGS: '/activity-logs',
        ALL_SESSIONS: '/admin/sessions',
        REVOKE_ADMIN_SESSION: (tokenId: string) => `/admin/sessions/${tokenId}`,
    },

    // Roles
    ROLES: {
        BASE: '/roles',
        BY_ID: (id: number | string) => `/roles/${id}`,
        PERMISSIONS: '/roles/permissions',
        USERS: (id: number | string) => `/roles/${id}/users`,
    },

    // Dashboard
    DASHBOARD: {
        STATS: '/dashboard',
        REVENUE_TREND: '/dashboard/revenue-trend',
        VEHICLE_UTILIZATION: '/dashboard/vehicle-utilization',
        RECENT_ACTIVITY: '/dashboard/recent-activity',
        UPCOMING_RETURNS: '/dashboard/upcoming-returns',
    },

    // Rentals
    RENTALS: {
        BASE: '/rentals',
        BY_ID: (id: string) => `/rentals/${id}`,
        BY_STATUS: (status: string) => `/rentals/status/${status}`,
        UPDATE_STATUS: (id: string) => `/rentals/${id}/status`,
        UPDATE_PAYMENT: (id: string) => `/rentals/${id}/payment`,
        PICKUP: (id: string) => `/rentals/${id}/pickup`,
        RETURN: (id: string) => `/rentals/${id}/return`,
        COMPLETE: (id: string) => `/rentals/${id}/complete`,
        INSPECTION_COMPARISON: (id: string) =>
            `/rentals/${id}/inspection-comparison`,
        INSPECTIONS: (id: string) => `/rentals/${id}/inspections`,
        UPLOAD_PICKUP_VIDEOS: (id: string) =>
            `/rentals/${id}/upload-pickup-videos`,
        UPLOAD_RETURN_VIDEOS: (id: string) =>
            `/rentals/${id}/upload-return-videos`,
    },

    // Quote Requests
    QUOTE_REQUESTS: {
        BASE: '/quote-requests',
        BY_ID: (id: string) => `/quote-requests/${id}`,
        CONTACT: (id: string) => `/quote-requests/${id}/contact`,
        CONVERT: (id: string) => `/quote-requests/${id}/convert`,
        GENERATE: (id: string) => `/quote-requests/${id}/generate`,
        SEND: (id: string) => `/quote-requests/${id}/send`,
        EMAIL_PREVIEW: (id: string) => `/quote-requests/${id}/email-preview`,
    },

    // Reports
    REPORTS: {
        REVENUE: '/reports/revenue',
        VEHICLES: '/reports/vehicles',
        MANAGER_PERFORMANCE: '/reports/manager-performance',
        OUTSTANDING_PAYMENTS: '/reports/outstanding-payments',
        MAINTENANCE: '/reports/maintenance',
        CUSTOMER_ANALYSIS: '/reports/customer-analysis',
        VEHICLE_EXPENSES: '/reports/vehicle-expenses',
        EXPORT_PDF: (type: string) => `/reports/${type}/export/pdf`,
    },

    // Notifications
    NOTIFICATIONS: {
        BASE: '/notifications',
        BY_ID: (id: string) => `/notifications/${id}`,
        UNREAD_COUNT: '/notifications/unread-count',
        MARK_READ: (id: string) => `/notifications/${id}/read`,
        MARK_UNREAD: (id: string) => `/notifications/${id}/unread`,
        MARK_ALL_READ: '/notifications/read-all',
        DELETE_ALL_READ: '/notifications/read',
        SETTINGS: '/notifications/settings',
        TEST_EMAIL: '/notifications/test-email',
    },

    // Profile
    PROFILE: {
        BASE: '/profile',
        PASSWORD: '/profile/password',
        ACTIVITY: '/profile/activity',
        SESSIONS: '/profile/sessions',
        REVOKE_SESSION: (tokenId: string) => `/profile/sessions/${tokenId}`,
        PHOTO: '/profile/photo',
        REMOVE_PHOTO: '/profile/photo',
    },

    // Airport Cancellation Settings
    AIRPORT_CANCELLATION_SETTINGS: {
        BASE: '/airport-cancellation-settings',
    },

    // Airport Customers
    AIRPORT_CUSTOMERS: {
        BASE: '/airport-customers',
        BY_ID: (id: string) => `/airport-customers/${id}`,
        LOOKUP: '/airport-customers/lookup',
    },

    // Airport Bookings
    AIRPORT_BOOKINGS: {
        BASE: '/airport-bookings',
        BY_ID: (id: string) => `/airport-bookings/${id}`,
        CONFIRM: (id: string) => `/airport-bookings/${id}/confirm`,
        ASSIGN_DRIVER: (id: string) => `/airport-bookings/${id}/assign-driver`,
        REMOVE_DRIVER: (id: string) => `/airport-bookings/${id}/remove-driver`,
        START_TRIP: (id: string) => `/airport-bookings/${id}/start-trip`,
        COMPLETE_TRIP: (id: string) => `/airport-bookings/${id}/complete-trip`,
        CANCEL: (id: string) => `/airport-bookings/${id}/cancel`,
        NO_SHOW: (id: string) => `/airport-bookings/${id}/no-show`,
        PAYMENT: (id: string) => `/airport-bookings/${id}/payment`,
    },

    // Settings
    SETTINGS: {
        GENERAL: '/settings/general',
        RENTAL: '/settings/rental',
        PRICING: '/settings/pricing',
        CANCELLATION: '/settings/cancellation',
        OVERDUE: '/settings/overdue',
        EARLY_RETURN: '/settings/early-return',
        EMAIL: '/settings/email',
        EMAIL_TEST: '/settings/email/test',
        WHATSAPP: '/settings/whatsapp',
        WHATSAPP_TEST: '/settings/whatsapp/test',
        SMS: '/settings/sms',
        SMS_TEST: '/settings/sms/test',
        PAYMENT: '/settings/payment',
        SEO: '/settings/seo',
        HEADER: '/settings/header',
        HOMEPAGE: '/settings/homepage',
        HOMEPAGE_HERO_IMAGE: '/settings/homepage/hero-image',
        ABOUT: '/settings/about',
        ABOUT_BANNER_IMAGE: '/settings/about/banner-image',
        ABOUT_BG_IMAGE: '/settings/about/bg-image',
        ABOUT_OVERLAY_IMAGE: '/settings/about/overlay-image',
        ABOUT_VALUES_BG_IMAGE: '/settings/about/values-bg-image',
        ABOUT_TEAM_PHOTO: '/settings/about/team-photo',
        WHY_CHOOSE_US_BG_IMAGE: '/settings/why-choose-us/bg-image',
        CHAUFFEUR_IMAGE: '/settings/chauffeur/image',
        PICKUP_PROCESS_BG_IMAGE: '/settings/pickup-process/bg-image',
        PICKUP_PROCESS_BOTTOM_IMAGE: '/settings/pickup-process/bottom-image',
        ICONS: '/settings/icons',
        ICONS_UPLOAD: '/settings/icons/upload',
        TESTIMONIAL_IMAGE: '/settings/homepage/testimonial-image',
        SERVICES: '/settings/services',
        SERVICES_BANNER_IMAGE: '/settings/services/banner-image',
        SERVICES_FACILITY_CARD_IMAGE: '/settings/services/facility-card-image',
        SERVICES_WHY_CHOOSE_US_BG_IMAGE:
            '/settings/services/why-choose-us-bg-image',
        SERVICES_LISTINGS_BANNER_IMAGE:
            '/settings/services/listings-banner-image',
        SERVICES_AIRPORT_TRANSFER_BANNER_IMAGE:
            '/settings/services/airport-transfer-banner-image',
        SERVICES_CHAUFFEUR_BANNER_IMAGE:
            '/settings/services/chauffeur-banner-image',
        FAQ: '/settings/faq',
        FAQ_BANNER_IMAGE: '/settings/faq/banner-image',
        FAQ_SECTION_BG_IMAGE: '/settings/faq/section-bg-image',
        TERMS: '/settings/terms',
        TERMS_BANNER_IMAGE: '/settings/terms/banner-image',
        PRIVACY: '/settings/privacy',
        PRIVACY_BANNER_IMAGE: '/settings/privacy/banner-image',
        CONTACT: '/settings/contact',
        CONTACT_BANNER_IMAGE: '/settings/contact/banner-image',
        CONTACT_SECTION_BG_IMAGE: '/settings/contact/section-bg-image',
        FOOTER: '/settings/footer',
        NOTIFICATION_SYSTEM: '/settings/notifications',
        POPUPS: '/settings/popups',
        POPUPS_PROMO_IMAGE: '/settings/popups/promo-image',
        S3: '/settings/s3',
    },

    // Exports (sync, legacy)
    EXPORT: {
        RENTALS: '/export/rentals',
        CUSTOMERS: '/export/customers',
        VEHICLES: '/export/vehicles',
    },

    // Async Export Records
    EXPORTS: {
        BASE: '/exports',
        QUEUE: '/exports/queue',
        DOWNLOAD: (id: string) => `/exports/${id}/download`,
        DELETE: (id: string) => `/exports/${id}`,
    },

    // Email Templates
    EMAIL_TEMPLATES: {
        LIST: '/email-templates',
        SHOW: (key: string) => `/email-templates/${key}`,
        UPDATE: (key: string) => `/email-templates/${key}`,
        RESET: (key: string) => `/email-templates/${key}/reset`,
    },

    // WhatsApp Templates
    WHATSAPP_TEMPLATES: {
        LIST: '/whatsapp-templates',
        SHOW: (key: string) => `/whatsapp-templates/${key}`,
        UPDATE: (key: string) => `/whatsapp-templates/${key}`,
        RESET: (key: string) => `/whatsapp-templates/${key}/reset`,
    },

    // SMS Templates
    SMS_TEMPLATES: {
        LIST: '/sms-templates',
        SHOW: (key: string) => `/sms-templates/${key}`,
        UPDATE: (key: string) => `/sms-templates/${key}`,
        RESET: (key: string) => `/sms-templates/${key}/reset`,
    },

    // Public (unauthenticated) endpoints
    PUBLIC: {
        MAINTENANCE_STATUS: '/public/maintenance-status',
        VEHICLES: '/public/vehicles',
        SUBMIT_QUOTE: '/public/bookings',
        QUOTE_BY_TOKEN: (token: string) => `/public/quotes/${token}`,
        CONFIRM_QUOTE: (token: string) => `/public/quotes/${token}/confirm`,
        CANCEL_QUOTE: (token: string) => `/public/quotes/${token}/cancel`,
        RENTAL_LOCATIONS_PICKUP: '/public/rental-locations/pickup',
        AIRPORTS: '/public/airports',
        AIRPORT_PACKAGES: '/public/airport-packages',
        PAYMENT_CONFIG: '/settings/payment-config',
        VEHICLE_PRICING_PREVIEW: (id: string) =>
            `/public/vehicles/${id}/pricing-preview`,
        CONTACT_FORM: '/public/contact',
        CONTACT_BRANCHES: '/public/contact/branches',
        TRACK_RENTAL: (ref: string) => `/public/rentals/track/${ref}`,
    },

    // Payments
    PAYMENTS: {
        INITIATE: '/payments/initiate',
        PAYABLE_AMOUNT: '/payments/payable-amount',
        VERIFY: (reference: string) => `/payments/verify/${reference}`,
        STATUS: (reference: string) => `/payments/status/${reference}`,
        WEBHOOK: (provider: string) => `/payments/webhook/${provider}`,
    },

    // Transactions
    TRANSACTIONS: {
        LIST: '/transactions',
        TRENDS: '/transactions/trends',
        DETAIL: (id: string) => `/transactions/${id}`,
        RESOLVE: (id: string) => `/transactions/${id}/resolve`,
    },

    // System
    SYSTEM: {
        INFO: '/system/info',
        CACHE_CLEAR: '/system/cache/clear',
        CACHE_CONFIG: '/system/cache/config',
        CACHE_ROUTES: '/system/cache/routes',
        CACHE_VIEWS: '/system/cache/views',
        MAINTENANCE_MODE: '/system/maintenance-mode',
        RUN_MAINTENANCE: '/system/maintenance/run',
        BACKUP: '/system/backup',
        BACKUP_FULL: '/system/backup/full',
        BACKUPS: '/system/backups',
        BACKUP_DOWNLOAD: (filename: string) =>
            `/system/backups/${encodeURIComponent(filename)}`,
        BACKUP_DELETE: (filename: string) =>
            `/system/backups/${encodeURIComponent(filename)}`,
        BACKUP_SETTINGS: '/system/backup-settings',
        QUEUE_STATUS: '/system/queue/status',
        QUEUE_RESTART: '/system/queue/restart',
        QUEUE_FLUSH: '/system/queue/flush',
        QUEUE_RETRY: '/system/queue/retry',
        STORAGE_MIGRATE: '/system/storage/migrate',
        STORAGE_TEST_S3: '/system/storage/test-s3',
    },
};
