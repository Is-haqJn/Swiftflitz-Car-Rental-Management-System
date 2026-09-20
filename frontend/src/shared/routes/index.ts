export const ROUTES = {
    FRONTEND: {
        HOME: '/',
        ABOUT: '/about',
        CHAUFFEUR_LISTING: '/chauffeur-services',
        CHAUFFEUR_CONFIRM: (id: string) => `/chauffeur-services/${id}/confirm`,
    },

    AUTH: {
        LOGIN: '/login',
        AUTH_LOGIN: '/auth/login',
        REGISTER: '/register',
        AUTH_REGISTER: '/auth/register',
        FORGOT_PASSWORD: '/forgot-password',
        AUTH_FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/reset-password',
        AUTH_RESET_PASSWORD: '/auth/reset-password',
        VERIFY_EMAIL: '/verify-email',
        AUTH_VERIFY_EMAIL: '/auth/verify-email',
        VERIFY_EMAIL_TOKEN: (token: string) =>
            routeWithParams('/verify-email/:token', { token }),
        AUTH_VERIFY_EMAIL_TOKEN: (token: string) =>
            routeWithParams('/auth/verify-email/:token', { token }),
    },

    DASHBOARD: {
        ROOT: '/management/dashboard',
        PROFILE: '/management/profile',
        PROFILE_NOTIFICATION_PREFERENCES:
            '/management/profile/notification-preferences',

        USERS: {
            ROOT: '/management/users',
            CREATE: '/management/users/create',
            EDIT: (id: string | number) =>
                routeWithParams('/management/users/:id/edit', { id }),
            VIEW: (id: string | number) =>
                routeWithParams('/management/users/:id', { id }),
            DELETE: (id: string | number) =>
                routeWithParams('/management/users/delete/:id', { id }),
            ROLES: '/management/users/roles',
            CREATE_ROLE: '/management/users/roles/create',
            EDIT_ROLE: (id: string | number) =>
                routeWithParams('/management/users/roles/:id/edit', { id }),
            ACTIVITY_LOGS: '/management/users/activity-logs',
        },

        VEHICLES: {
            ROOT: '/management/vehicles',
            CREATE: '/management/vehicles/create',
            EDIT: (id: string | number) =>
                routeWithParams('/management/vehicles/edit/:id', { id }),
            VIEW: (id: string | number) =>
                routeWithParams('/management/vehicles/:id', { id }),
            AVAILABLE: '/management/vehicles/available',
            RENTED: '/management/vehicles/rented',
            MAINTENANCE: '/management/vehicles/maintenance',
            FEATURES: '/management/vehicles/features',
        },

        CUSTOMERS: {
            ROOT: '/management/customers',
            CREATE: '/management/customers/create',
            BLACKLISTED: '/management/customers/blacklisted',
            LICENSE_EXPIRED: '/management/customers/license-expired',
            LICENSE_EXPIRING_SOON:
                '/management/customers/license-expiring-soon',
            EDIT: (id: string | number) =>
                routeWithParams('/management/customers/edit/:id', { id }),
            VIEW: (id: string | number) =>
                routeWithParams('/management/customers/:id', { id }),
            HISTORY: '/management/customers/history',
        },

        RENTALS: {
            ROOT: '/management/rentals',
            ACTIVE: '/management/rentals/active',
            CREATE: '/management/rentals/create',
            NEW_BOOKING: '/management/rentals/new-booking',
            PENDING: '/management/rentals/pending',
            CONFIRMED: '/management/rentals/confirmed',
            OVERDUE: '/management/rentals/overdue',
            RETURNED: '/management/rentals/returned',
            PENDING_APPROVALS: '/management/rentals/pending-approval',
            COMPLETED: '/management/rentals/completed',
            CANCELLED: '/management/rentals/cancelled',
            BOOKING: '/management/rentals/booking',
            QUOTES: '/management/rentals/quotes',
            QUOTE_VIEW: (id: string | number) =>
                routeWithParams('/management/rentals/quotes/:quoteId', {
                    quoteId: id,
                }),
            CHARGES: '/management/rentals/charges',
            CHARGES_CREATE: '/management/rentals/charges/create',
            CHARGES_EDIT: (id: string | number) =>
                routeWithParams('/management/rentals/charges/:id/edit', { id }),
            SECURITY_DEPOSITS: '/management/rentals/security-deposits',
            RENTAL_LOCATIONS: '/management/rentals/locations',
            RENTAL_LOCATIONS_CREATE: '/management/rentals/locations/create',
            INSPECTIONS: '/management/rentals/inspections',
            EDIT: (id: string | number) =>
                routeWithParams('/management/rentals/edit/:id', { id }),
            VIEW: (id: string | number) =>
                routeWithParams('/management/rentals/:id', { id }),
            INVOICE: (id: string | number) =>
                routeWithParams('/management/rentals/:id/invoice', { id }),
            INSPECT: (id: string | number) =>
                routeWithParams('/management/rentals/:id/inspect', { id }),
        },

        REPORTS: {
            REVENUE: '/management/reports/revenue',
            VEHICLES: '/management/reports/vehicles',
            MANAGER_PERFORMANCE: '/management/reports/manager-performance',
            OUTSTANDING_PAYMENTS: '/management/reports/outstanding-payments',
            MAINTENANCE_REPAIRS: '/management/reports/maintenance-repairs',
            CUSTOMER_ANALYSIS: '/management/reports/customer-analysis',
            VEHICLE_EXPENSES: '/management/reports/vehicle-expenses',
        },

        NOTIFICATIONS: {
            ROOT: '/management/notifications',
            NEW_BOOKINGS: '/management/notifications/new-bookings',
            RETURN_REMINDERS: '/management/notifications/return-reminders',
            OVERDUE_ALERTS: '/management/notifications/overdue-alerts',
            QUOTE_REQUESTS: '/management/notifications/quote-requests',
            SETTINGS: '/management/notifications/settings',
            VIEW: (id: string) =>
                routeWithParams('/management/notifications/:id', { id }),
        },

        DISCOUNTS: {
            ROOT: '/management/discounts',
            CREATE: '/management/discounts/create',
            EDIT: (id: string) =>
                routeWithParams('/management/discounts/:id/edit', { id }),
            USAGES: '/management/discounts/usages',
        },

        COUPONS: {
            ROOT: '/management/coupons',
            CREATE: '/management/coupons/create',
            EDIT: (id: string | number) =>
                routeWithParams('/management/coupons/edit/:id', { id }),
            VIEW: (id: string | number) =>
                routeWithParams('/management/coupons/:id', { id }),
            ACTIVE: '/management/coupons/active',
            EXPIRED: '/management/coupons/expired',
            USED: '/management/coupons/used',
        },
        EXPORTS: {
            ROOT: '/management/exports',
        },

        BRANCHES: {
            ROOT: '/management/branches',
            CREATE: '/management/branches/create',
            EDIT: (id: string | number) =>
                routeWithParams('/management/branches/:id/edit', { id }),
            MEMBERS: '/management/branches/members',
        },

        AIRPORT_TRANSFER: {
            AIRPORTS: {
                ROOT: '/management/airport-transfer/airports',
                CREATE: '/management/airport-transfer/airports/create',
                EDIT: (id: string | number) =>
                    routeWithParams(
                        '/management/airport-transfer/airports/edit/:id',
                        { id }
                    ),
            },
            LOCATIONS: {
                ROOT: '/management/airport-transfer/locations',
                CREATE: '/management/airport-transfer/locations/create',
                EDIT: (id: string | number) =>
                    routeWithParams(
                        '/management/airport-transfer/locations/edit/:id',
                        { id }
                    ),
            },
            PACKAGES: {
                ROOT: '/management/airport-transfer/packages',
                CREATE: '/management/airport-transfer/packages/create',
                EDIT: (id: string | number) =>
                    routeWithParams(
                        '/management/airport-transfer/packages/edit/:id',
                        { id }
                    ),
            },
            PACKAGE_PRICING: {
                ROOT: '/management/airport-transfer/package-pricing',
                CREATE: '/management/airport-transfer/package-pricing/create',
            },
            CANCELLATION_SETTINGS:
                '/management/airport-transfer/cancellation-settings',
            CUSTOMERS: {
                ROOT: '/management/airport-transfer/customers',
            },
            BOOKINGS: {
                ROOT: '/management/airport-transfer/bookings',
                CREATE: '/management/airport-transfer/bookings/create',
                VIEW: (id: string | number) =>
                    routeWithParams(
                        '/management/airport-transfer/bookings/:id',
                        { id }
                    ),
            },
        },

        CHAUFFEUR_RENTAL: {
            BOOKINGS: {
                ROOT: '/management/chauffeur-rental/bookings',
                CREATE: '/management/chauffeur-rental/bookings/create',
                VIEW: (id: string | number) =>
                    routeWithParams(
                        '/management/chauffeur-rental/bookings/:id',
                        { id }
                    ),
            },
            CUSTOMERS: {
                ROOT: '/management/chauffeur-rental/customers',
            },
            LOCATIONS: {
                ROOT: '/management/chauffeur-rental/locations',
            },
            SETTINGS: '/management/chauffeur-rental/settings',
        },

        DRIVERS: {
            ROOT: '/management/drivers',
            CREATE: '/management/drivers/create',
            EDIT: (id: string | number) =>
                routeWithParams('/management/drivers/edit/:id', { id }),
            VIEW: (id: string | number) =>
                routeWithParams('/management/drivers/:id', { id }),
        },

        FLEET_VEHICLES: {
            ROOT: '/management/fleet-vehicles',
            CREATE: '/management/fleet-vehicles/create',
            EDIT: (id: string | number) =>
                routeWithParams('/management/fleet-vehicles/edit/:id', { id }),
            VIEW: (id: string | number) =>
                routeWithParams('/management/fleet-vehicles/:id', { id }),
        },

        CATEGORIES: {
            ROOT: '/management/categories',
            CREATE: '/management/categories/create',
            EDIT: (id: string | number) =>
                routeWithParams('/management/categories/edit/:id', { id }),
            VIEW: (id: string | number) =>
                routeWithParams('/management/categories/:id', { id }),
        },

        SETTINGS: {
            ROOT: '/management/settings',
            GENERAL: '/management/settings/general',
            RENTAL: '/management/settings/rental',
            PRICING: '/management/settings/pricing',
            EMAIL: '/management/settings/email',
            WHATSAPP: '/management/settings/whatsapp',
            SMS: '/management/settings/sms',
            PAYMENT: '/management/settings/payment',
            SEO: '/management/settings/seo',
            BACKUP: '/management/settings/backup',
            EMAIL_TEMPLATES: '/management/settings/email-templates',
            EMAIL_TEMPLATE_EDITOR: (key: string) =>
                `/management/settings/email-templates/${key}`,
            WHATSAPP_TEMPLATES: '/management/settings/whatsapp-templates',
            WHATSAPP_TEMPLATE_EDITOR: (key: string) =>
                `/management/settings/whatsapp-templates/${key}`,
            SMS_TEMPLATES: '/management/settings/sms-templates',
            SMS_TEMPLATE_EDITOR: (key: string) =>
                `/management/settings/sms-templates/${key}`,
            NOTIFICATION_SETTINGS: '/management/settings/notification-settings',
            POPUPS: '/management/settings/popups',
            TEST_EMAIL: '/management/settings/test-email',
            TEST_WHATSAPP: '/management/settings/test-whatsapp',
            TEST_SMS: '/management/settings/test-sms',
        },

        FINANCE: {
            TRANSACTIONS: {
                ROOT: '/management/finance/transactions',
                VIEW: (id: string) =>
                    routeWithParams('/management/finance/transactions/:id', {
                        id,
                    }),
            },
        },

        CONTENT: {
            ROOT: '/management/content',
            HEADER: '/management/content/header',
            HOMEPAGE: '/management/content/homepage',
            ABOUT: '/management/content/about',
            CONTACT: '/management/content/contact',
            SERVICES: '/management/content/services',
            FAQS: '/management/content/faqs',
            TERMS: '/management/content/terms',
            PRIVACY: '/management/content/privacy',
            LISTING: '/management/content/listing',
            SHARE_CAR: '/management/content/share-car',
            AIRPORT_TRANSFER: '/management/content/airport-transfer',
            FOOTER: '/management/content/footer',
            TESTIMONIALS: '/management/content/testimonials',
        },
    },

    ERROR: {
        NOT_FOUND: '/404',
        FORBIDDEN: '/403',
        SERVER_ERROR: '/500',
    },
};

function routeWithParams(
    route: string,
    params: Record<string, string | number>
) {
    return route.replace(
        /:([a-zA-Z]+)/g,
        (_, key) => params[key]?.toString() ?? ''
    );
}
