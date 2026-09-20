export const PERMISSIONS = {
    //! Dashboard
    DASHBOARD: {
        VIEW: 'dashboard.view',
        VIEW_ANALYTICS: 'dashboard.view_analytics',
    },

    AIRPORT_TRANSFER: {
        VIEW_ALL: 'airport_transfer.view_all',
        CREATE: 'airport_transfer.create',
        EDIT: 'airport_transfer.edit',
        DELETE: 'airport_transfer.delete',
        MANAGE_ACTIVE: 'airport_transfer.manage_active',
        MANAGE_BOOKINGS: 'airport_transfer.manage_bookings',
        MANAGE_PENDING_BOOKINGS: 'airport_transfer.manage_pending_bookings',
        MANAGE_PACKAGES: 'airport_transfer.airport_packages',
        MANAGE_LOCATIONS: 'airport_transfer.airport_locations',
        MANAGE_VEHICLES: 'airport_transfer.airport_vehicles',
        MANAGE_APPROVALS: 'airport_transfer.manage_approval',
    },

    CHAUFFEUR_RENTAL: {
        VIEW_ALL: 'chauffeur_rental.view_all',
        CREATE: 'chauffeur_rental.create',
        EDIT: 'chauffeur_rental.edit',
        DELETE: 'chauffeur_rental.delete',
        MANAGE_BOOKINGS: 'chauffeur_rental.manage_bookings',
        MANAGE_CUSTOMERS: 'chauffeur_rental.manage_customers',
        MANAGE_LOCATIONS: 'chauffeur_rental.manage_locations',
        MANAGE_SETTINGS: 'chauffeur_rental.manage_settings',
    },

    RENTALS: {
        VIEW_ALL: 'rentals.view_all',
        VIEW_OWN: 'rentals.view_own',
        CREATE: 'rentals.create',
        EDIT: 'rentals.edit',
        DELETE: 'rentals.delete',
        MARK_RETURNED: 'rentals.mark_returned',
        APPROVE_RETURN: 'rentals.approve_return',
        ADD_CHARGES: 'rentals.add_charges',
        UPDATE_STATUS: 'rentals.update_status',
        VIEW_QUOTES: 'rentals.view_quotes',
        MANAGE_QUOTES: 'rentals.manage_quotes',
        EXPORT: 'rentals.export',
        VIEW_DOCUMENTS: 'rentals.view_documents',
        VIEW_INSPECTIONS: 'rentals.view_inspections',
        MANAGE_ADDITIONAL_CHARGES: 'rentals.manage_additional_charges',
        MANAGE_ACTIVE: 'rentals.manage_active',
        MANAGE_PENDING_BOOKINGS: 'rentals.manage_pending_bookings',
        MANAGE_OVERDUE: 'rentals.manage_overdue',
        MANAGE_PENDING_APPROVAL: 'rentals.manage_pending_approval',
        MANAGE_SECURITY_DEPOSIT: 'rentals.manage_security_deposit',
        PROCESS_PICKUP: 'rentals.process_pickup',
        MANAGE_LOCATIONS: 'rentals.manage_locations',
        SEND_PAYMENT_LINK: 'rentals.send_payment_link',
    },
    VEHICLES: {
        VIEW_ALL: 'vehicles.view_all',
        CREATE: 'vehicles.create',
        EDIT: 'vehicles.edit',
        DELETE: 'vehicles.delete',
        MANAGE_AVAILABILITY: 'vehicles.manage_availability',
        MANAGE_PRICING: 'vehicles.manage_pricing',
        TOGGLE_PRICE_VISIBILITY: 'vehicles.toggle_price_visibility',
        MANAGE_MAINTENANCE: 'vehicles.manage_maintenance',
        MANAGE_INSURANCE: 'vehicles.manage_insurance',
        MANAGE_CATEGORIES: 'vehicles.manage_categories',
        MANAGE_FEATURES: 'vehicles.manage_features',
        EXPORT: 'vehicles.export',
        MANAGE_AVAILABLE: 'vehicles.manage_available',
        MANAGE_RENTED: 'vehicles.manage_rented',
    },
    CUSTOMERS: {
        VIEW_ALL: 'customers.view_all',
        CREATE: 'customers.create',
        EDIT: 'customers.edit',
        DELETE: 'customers.delete',
        VIEW_HISTORY: 'customers.view_history',
        VIEW_DOCUMENTS: 'customers.view_documents',
        BLACKLIST: 'customers.blacklist',
        EXPORT: 'customers.export',
        MANAGE_LICENSE_EXPIRED: 'customers.manage_license_expired',
        MANAGE_LICENSE_EXPIRING: 'customers.manage_license_expiring',
    },
    DRIVERS: {
        VIEW_ALL: 'drivers.view_all',
        CREATE: 'drivers.create',
        EDIT: 'drivers.edit',
        DELETE: 'drivers.delete',
    },
    FLEET_VEHICLES: {
        VIEW_ALL: 'fleet_vehicles.view_all',
        CREATE: 'fleet_vehicles.create',
        EDIT: 'fleet_vehicles.edit',
        DELETE: 'fleet_vehicles.delete',
    },
    REPORTS: {
        VIEW_ALL: 'reports.view_all',
        VIEW_REVENUE: 'reports.view_revenue',
        VIEW_UTILIZATION: 'reports.view_utilization',
        VIEW_MANAGER_PERFORMANCE: 'reports.view_manager_performance',
        VIEW_OUTSTANDING_PAYMENTS: 'reports.view_outstanding_payments',
        VIEW_MAINTENANCE: 'reports.view_maintenance',
        VIEW_CUSTOMER_ANALYTICS: 'reports.view_customer_analytics',
        EXPORT_PDF: 'reports.export_pdf',
        EXPORT_EXCEL: 'reports.export_excel',
    },
    NOTIFICATIONS: {
        VIEW: 'notifications.view',
        MARK_READ: 'notifications.mark_read',
        DELETE: 'notifications.delete',
        MANAGE_SETTINGS: 'notifications.manage_settings',
    },
    USERS: {
        VIEW_ALL: 'users.view_all',
        CREATE: 'users.create',
        EDIT: 'users.edit',
        DELETE: 'users.delete',
        ASSIGN_ROLES: 'users.assign_roles',
        IMPERSONATE: 'users.impersonate',
    },
    ROLES: {
        VIEW_ALL: 'roles.view_all',
        CREATE: 'roles.create',
        EDIT: 'roles.edit',
        DELETE: 'roles.delete',
    },
    LOGS: {
        VIEW_ACTIVITY: 'activity_logs.view',
        MANAGE_SESSIONS: 'sessions.manage',
    },
    SETTINGS: {
        VIEW_GENERAL: 'settings.view_general',
        EDIT_GENERAL: 'settings.edit_general',
        EDIT_RENTAL: 'settings.edit_rental',
        EDIT_PRICING: 'settings.edit_pricing',
        EDIT_EMAIL: 'settings.edit_email',
        EDIT_WHATSAPP: 'settings.edit_whatsapp',
        EDIT_WHATSAPP_TEMPLATES: 'settings.edit_whatsapp_templates',
        EDIT_SMS: 'settings.edit_sms',
        EDIT_SMS_TEMPLATES: 'settings.edit_sms_templates',
        EDIT_PAYMENT: 'settings.edit_payment',
        VIEW_BACKUP: 'settings.view_backup',
        MANAGE_BACKUP: 'settings.manage_backup',
        EDIT_BACKUP: 'settings.edit_backup',
        DELETE_BACKUP: 'settings.delete_backup',
        VIEW_LOGS: 'settings.view_logs',
        CLEAR_CACHE: 'settings.clear_cache',
        MANAGE_SECURITY_DEPOSIT: 'settings.manage_security_deposit',
        TEST_EMAIL: 'settings.test_email',
        TEST_WHATSAPP: 'settings.test_whatsapp',
        TEST_SMS: 'settings.test_sms',
        VIEW_SEO: 'settings.view_seo',
        EDIT_SEO: 'settings.edit_seo',
    },
    WEBSITE: {
        EDIT_HOMEPAGE: 'website.edit_homepage',
        EDIT_ABOUT: 'website.edit_about',
        EDIT_CONTACT: 'website.edit_contact',
        MANAGE_TESTIMONIALS: 'website.manage_testimonials',
        VIEW_SUBSCRIBERS: 'website.view_subscribers',
        MANAGE_STATIC_PAGES: 'website.manage_static_pages',
        EDIT_POLICIES: 'website.edit_policies',
        MANAGE_FAQ: 'website.manage_faq',
    },
    BRANCHES: {
        VIEW_ALL: 'branches.view_all',
        CREATE: 'branches.create',
        EDIT: 'branches.edit',
        DELETE: 'branches.delete',
        MANAGE_MEMBERS: 'branches.manage_members',
    },
    DISCOUNTS: {
        VIEW_ALL: 'discounts.view_all',
        CREATE: 'discounts.create',
        EDIT: 'discounts.edit',
        DELETE: 'discounts.delete',
    },
    COUPONS: {
        VIEW_ALL: 'coupons.view_all',
        CREATE: 'coupons.create',
        EDIT: 'coupons.edit',
        DELETE: 'coupons.delete',
    },
    TRANSACTIONS: {
        VIEW_ALL: 'transactions.view_all',
        EXPORT: 'transactions.export',
        RESOLVE: 'transactions.resolve',
    },
    EXPORTS: {
        DOWNLOAD_RENTALS: 'exports.download_rentals',
        DOWNLOAD_VEHICLES: 'exports.download_vehicles',
        DOWNLOAD_CUSTOMERS: 'exports.download_customers',
        DOWNLOAD_REPORTS: 'exports.download_reports',
        DOWNLOAD_ALL: 'exports.download_all',
    },
} as const;

export const PERMISSION_LABELS: Record<string, string> = {
    // Dashboard
    'dashboard.view': 'View dashboard',
    'dashboard.view_analytics': 'View detailed analytics',

    // Airport Transfer
    'airport_transfer.view_all': 'View all airport bookings',
    'airport_transfer.create': 'Create airport booking',
    'airport_transfer.edit': 'Edit airport booking',
    'airport_transfer.delete': 'Delete airport booking',
    'airport_transfer.manage_active': 'Manage active airport bookings',
    'airport_transfer.manage_bookings': 'Manage airport bookings',
    'airport_transfer.manage_pending_bookings':
        'Manage pending airport bookings',
    'airport_transfer.airport_packages': 'Manage airport packages',
    'airport_transfer.airport_locations': 'Manage airport locations',
    'airport_transfer.airport_vehicles': 'Manage airport vehicles',
    'airport_transfer.manage_approval': 'Manage airport booking approvals',

    // Drivers
    'drivers.view_all': 'View all drivers',
    'drivers.create': 'Add new driver',
    'drivers.edit': 'Edit driver details',
    'drivers.delete': 'Delete drivers',

    // Fleet Vehicles
    'fleet_vehicles.view_all': 'View all fleet vehicles',
    'fleet_vehicles.create': 'Add new fleet vehicle',
    'fleet_vehicles.edit': 'Edit fleet vehicle',
    'fleet_vehicles.delete': 'Delete fleet vehicles',

    // Rentals
    'rentals.view_all': 'View all rentals',
    'rentals.view_own': 'View own rentals only',
    'rentals.create': 'Create new rental',
    'rentals.edit': 'Edit rental details',
    'rentals.delete': 'Delete rentals',
    'rentals.mark_returned': 'Mark vehicle as returned',
    'rentals.approve_return': 'Approve return inspection',
    'rentals.add_charges': 'Add additional charges',
    'rentals.update_status': 'Change rental status',
    'rentals.view_quotes': 'View quote requests',
    'rentals.manage_quotes': 'Respond to quotes',
    'rentals.export': 'Export rental data',
    'rentals.view_documents': 'View pickup/return docs',
    'rentals.view_inspections': 'View inspection log',
    'rentals.manage_additional_charges': 'Manage additional charges catalog',
    'rentals.manage_active': 'Manage active rentals',
    'rentals.manage_pending_bookings': 'Manage pending bookings',
    'rentals.manage_overdue': 'Manage overdue rentals',
    'rentals.manage_pending_approval': 'Manage pending approvals',
    'rentals.manage_security_deposit': 'Manage security deposits',
    'rentals.process_pickup': 'Process vehicle pickup',
    'rentals.manage_locations': 'Manage rental pickup/dropoff locations',
    'rentals.send_payment_link': 'Send payment link to customer',

    // Vehicles
    'vehicles.view_all': 'View all vehicles',
    'vehicles.create': 'Add new vehicle',
    'vehicles.edit': 'Edit vehicle details',
    'vehicles.delete': 'Delete vehicles',
    'vehicles.manage_availability': 'Change availability',
    'vehicles.manage_pricing': 'Set/edit pricing',
    'vehicles.toggle_price_visibility': 'Show/hide prices',
    'vehicles.manage_maintenance': 'Maintenance tracking',
    'vehicles.manage_insurance': 'Insurance info',
    'vehicles.manage_categories': 'Manage categories',
    'vehicles.manage_features': 'Manage features',
    'vehicles.export': 'Export vehicle data',
    'vehicles.manage_available': 'View available vehicles',
    'vehicles.manage_rented': 'View rented vehicles',

    // Customers
    'customers.view_all': 'View all customers',
    'customers.create': 'Add new customer',
    'customers.edit': 'Edit customer info',
    'customers.delete': 'Delete customers',
    'customers.view_history': 'View rental history',
    'customers.view_documents': 'View documents',
    'customers.blacklist': 'Blacklist customers',
    'customers.export': 'Export customer data',
    'customers.manage_license_expired': 'View license expired customers',
    'customers.manage_license_expiring': 'View license expiring customers',

    // Reports
    'reports.view_all': 'Access all reports',
    'reports.view_revenue': 'View revenue reports',
    'reports.view_utilization': 'Vehicle utilization',
    'reports.view_manager_performance': 'Manager performance',
    'reports.view_outstanding_payments': 'Outstanding payments',
    'reports.view_maintenance': 'Maintenance reports',
    'reports.view_customer_analytics': 'Customer analytics',
    'reports.export_pdf': 'Export to PDF',
    'reports.export_excel': 'Export to Excel',

    // Notifications
    'notifications.view': 'View notifications',
    'notifications.mark_read': 'Mark as read',
    'notifications.delete': 'Delete notifications',
    'notifications.manage_settings': 'Manage settings',

    // Users & Access
    'users.view_all': 'View all users',
    'users.create': 'Create new user',
    'users.edit': 'Edit user details',
    'users.delete': 'Delete users',
    'users.assign_roles': 'Assign roles',
    'users.impersonate': 'Impersonate users',
    'roles.view_all': 'View all roles',
    'roles.create': 'Create custom role',
    'roles.edit': 'Edit role permissions',
    'roles.delete': 'Delete roles',
    'activity_logs.view': 'View activity logs',
    'sessions.manage': 'Manage user sessions',

    // Settings
    'settings.view_general': 'View general settings',
    'settings.edit_general': 'Edit general settings',
    'settings.edit_rental': 'Edit rental settings',
    'settings.edit_pricing': 'Edit pricing settings',
    'settings.edit_email': 'Email configuration',
    'settings.edit_whatsapp': 'WhatsApp configuration',
    'settings.edit_whatsapp_templates': 'Manage WhatsApp templates',
    'settings.edit_sms': 'SMS configuration',
    'settings.edit_sms_templates': 'Manage SMS templates',
    'settings.edit_payment': 'Payment settings',
    'settings.view_backup': 'View backup status',
    'settings.manage_backup': 'Manage backups',
    'settings.edit_backup': 'Edit backup schedule settings',
    'settings.delete_backup': 'Delete backup files',
    'settings.view_logs': 'View system logs',
    'settings.clear_cache': 'Clear cache',
    'settings.manage_security_deposit': 'Manage security deposit settings',
    'settings.test_email': 'Send test email',
    'settings.test_whatsapp': 'Send test WhatsApp message',
    'settings.test_sms': 'Send test SMS',
    'settings.view_seo': 'View SEO settings',
    'settings.edit_seo': 'Edit SEO settings',

    // Website Content
    'website.edit_homepage': 'Edit homepage',
    'website.edit_about': 'Edit about page',
    'website.edit_contact': 'Edit contact page',
    'website.manage_testimonials': 'Manage testimonials',
    'website.view_subscribers': 'View subscribers',
    'website.manage_static_pages': 'Manage static pages',
    'website.edit_policies': 'Edit T&C/Privacy',
    'website.manage_faq': 'Manage FAQs',

    // Chauffeur Rental
    'chauffeur_rental.view_all': 'View all chauffeur bookings',
    'chauffeur_rental.create': 'Create chauffeur booking',
    'chauffeur_rental.edit': 'Edit chauffeur booking',
    'chauffeur_rental.delete': 'Delete chauffeur booking',
    'chauffeur_rental.manage_bookings': 'Manage chauffeur bookings',
    'chauffeur_rental.manage_customers': 'Manage chauffeur customers',
    'chauffeur_rental.manage_locations': 'Manage chauffeur locations',
    'chauffeur_rental.manage_settings': 'Manage chauffeur settings',

    // Branches
    'branches.view_all': 'View all branches',
    'branches.create': 'Create new branch',
    'branches.edit': 'Edit branch details',
    'branches.delete': 'Delete branches',
    'branches.manage_members': 'Manage branch members',

    // Discount Rules
    'discounts.view_all': 'View all discount rules',
    'discounts.create': 'Create new discount rule',
    'discounts.edit': 'Edit discount rule',
    'discounts.delete': 'Delete discount rules',

    // Coupons
    'coupons.view_all': 'View all coupons',
    'coupons.create': 'Create new coupon',
    'coupons.edit': 'Edit coupon details',
    'coupons.delete': 'Delete coupons',

    // Finance & Transactions
    'transactions.view_all': 'View all payment transactions',
    'transactions.export': 'Export transaction data',
    'transactions.resolve': 'Resolve under-review transactions',

    // Exports & Downloads
    'exports.download_rentals': 'Download rental exports',
    'exports.download_vehicles': 'Download vehicle exports',
    'exports.download_customers': 'Download customer exports',
    'exports.download_reports': 'Download report exports',
    'exports.download_all': 'Download any export',
};

export const PERMISSION_GROUPS = [
    {
        name: 'Dashboard',
        description: 'Access to main dashboard and analytics',
        permissions: Object.values(PERMISSIONS.DASHBOARD),
    },
    {
        name: 'Airport Transfer',
        description: 'Manage airport transfer bookings, packages and locations',
        permissions: Object.values(PERMISSIONS.AIRPORT_TRANSFER),
    },
    {
        name: 'Rentals',
        description: 'Create, manage, and track vehicle rentals',
        permissions: Object.values(PERMISSIONS.RENTALS),
    },
    {
        name: 'Vehicles',
        description: 'Manage fleet, categories, and availability',
        permissions: Object.values(PERMISSIONS.VEHICLES),
    },
    {
        name: 'Customers',
        description: 'Manage customer database and history',
        permissions: Object.values(PERMISSIONS.CUSTOMERS),
    },
    {
        name: 'Reports',
        description: 'Financial and operational reporting',
        permissions: Object.values(PERMISSIONS.REPORTS),
    },
    {
        name: 'Notifications',
        description: 'View and manage system notifications',
        permissions: Object.values(PERMISSIONS.NOTIFICATIONS),
    },
    {
        name: 'Users & Access',
        description: 'Manage users, roles, and permissions',
        permissions: [
            ...Object.values(PERMISSIONS.USERS),
            ...Object.values(PERMISSIONS.ROLES),
            ...Object.values(PERMISSIONS.LOGS),
        ],
    },
    {
        name: 'Settings',
        description: 'Configure system-wide settings',
        permissions: Object.values(PERMISSIONS.SETTINGS),
    },
    {
        name: 'Website Content',
        description: 'Manage public website content',
        permissions: Object.values(PERMISSIONS.WEBSITE),
    },
    {
        name: 'Chauffeur Rental',
        description: 'Manage chauffeur bookings, customers, and settings',
        permissions: Object.values(PERMISSIONS.CHAUFFEUR_RENTAL),
    },
    {
        name: 'Drivers',
        description: 'Manage chauffeur drivers',
        permissions: Object.values(PERMISSIONS.DRIVERS),
    },
    {
        name: 'Fleet Vehicles',
        description: 'Manage vehicles used for chauffeur and airport services',
        permissions: Object.values(PERMISSIONS.FLEET_VEHICLES),
    },
    {
        name: 'Branches',
        description: 'Manage branches and their members',
        permissions: Object.values(PERMISSIONS.BRANCHES),
    },
    {
        name: 'Discount Rules',
        description: 'Manage automatic discount rules',
        permissions: Object.values(PERMISSIONS.DISCOUNTS),
    },
    {
        name: 'Coupons',
        description: 'Manage discount coupons',
        permissions: Object.values(PERMISSIONS.COUPONS),
    },
    {
        name: 'Finance & Transactions',
        description: 'View and export payment transactions',
        permissions: Object.values(PERMISSIONS.TRANSACTIONS),
    },
    {
        name: 'Exports & Downloads',
        description: 'Control access to data exports and downloads',
        permissions: Object.values(PERMISSIONS.EXPORTS),
    },
];

export const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS);

// Helper Functions

export const getPermissionLabel = (permission: string): string => {
    return PERMISSION_LABELS[permission] || permission;
};

export const getPermissionGroup = (permission: string) => {
    return PERMISSION_GROUPS.find(group =>
        group.permissions.includes(permission as never)
    );
};

export const permissionExists = (permission: string): boolean => {
    return ALL_PERMISSIONS.includes(permission);
};

export const getPermissionCategory = (permission: string): string => {
    return permission.split('.')[0];
};

export const getPermissionsArray = () => {
    return ALL_PERMISSIONS.map(permission => ({
        value: permission,
        label: getPermissionLabel(permission),
        group: getPermissionGroup(permission)?.name,
        category: getPermissionCategory(permission),
    }));
};
