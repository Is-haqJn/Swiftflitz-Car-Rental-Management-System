import { type SideBarItems } from '@admin/types';
import { ROUTES } from '@/shared/routes';
import { VscDashboard, VscGraph } from 'react-icons/vsc';
import { IoCarSportSharp } from 'react-icons/io5';
import {
    MdOutlineCarRental,
    MdOutlineNotificationsActive,
    MdOutlineScience,
    MdOutlineCreditCard,
} from 'react-icons/md';
import {
    FaUsers as FaMultiUsers,
    FaUserShield,
    FaCodeBranch,
    FaPercent,
    FaIdCard,
    FaTruck,
} from 'react-icons/fa6';
import { FcSettings } from 'react-icons/fc';
import { LuLayoutTemplate, LuDownload } from 'react-icons/lu';
import { PERMISSIONS } from '@/shared/config/permissions';

export const sideBarItems: SideBarItems[] = [
    {
        title: 'Dashboard',
        to: ROUTES.DASHBOARD.ROOT,
        iconStyle: <VscDashboard size={22} style={{ color: 'gray' }} />,
        className: 'mb-0',
    },
    { title: 'Operations', classChange: 'menu-title' },

    {
        title: ' Regular Rentals',
        classChange: 'mm-collapse',
        iconStyle: <MdOutlineCarRental size={25} style={{ color: 'gray' }} />,
        permission: [
            PERMISSIONS.RENTALS.VIEW_ALL,
            PERMISSIONS.RENTALS.MANAGE_ACTIVE,
            PERMISSIONS.RENTALS.CREATE,
            PERMISSIONS.RENTALS.MANAGE_PENDING_BOOKINGS,
            PERMISSIONS.RENTALS.MANAGE_OVERDUE,
            PERMISSIONS.RENTALS.MANAGE_PENDING_APPROVAL,
            PERMISSIONS.RENTALS.VIEW_INSPECTIONS,
            PERMISSIONS.RENTALS.VIEW_QUOTES,
            PERMISSIONS.RENTALS.MANAGE_ADDITIONAL_CHARGES,
            PERMISSIONS.RENTALS.MANAGE_SECURITY_DEPOSIT,
        ],
        content: [
            {
                title: 'All Rentals',
                to: ROUTES.DASHBOARD.RENTALS.ROOT,
                permission: PERMISSIONS.RENTALS.VIEW_ALL,
            },
            {
                title: 'Create Rental',
                to: ROUTES.DASHBOARD.RENTALS.CREATE,
                permission: PERMISSIONS.RENTALS.CREATE,
            },
            {
                title: 'New Booking',
                to: ROUTES.DASHBOARD.RENTALS.NEW_BOOKING,
                permission: PERMISSIONS.RENTALS.CREATE,
            },
            {
                title: 'Quote Requests',
                to: ROUTES.DASHBOARD.RENTALS.QUOTES,
                permission: PERMISSIONS.RENTALS.VIEW_QUOTES,
            },
            {
                title: 'Pending Bookings',
                to: ROUTES.DASHBOARD.RENTALS.PENDING,
                permission: PERMISSIONS.RENTALS.MANAGE_PENDING_BOOKINGS,
            },
            {
                title: 'Pending Approvals',
                to: ROUTES.DASHBOARD.RENTALS.PENDING_APPROVALS,
                permission: PERMISSIONS.RENTALS.MANAGE_PENDING_APPROVAL,
            },
            {
                title: 'Active Rentals',
                to: ROUTES.DASHBOARD.RENTALS.ACTIVE,
                permission: PERMISSIONS.RENTALS.MANAGE_ACTIVE,
            },
            {
                title: 'Overdue Rentals',
                to: ROUTES.DASHBOARD.RENTALS.OVERDUE,
                permission: PERMISSIONS.RENTALS.MANAGE_OVERDUE,
            },
            {
                title: 'Returned Rentals',
                to: ROUTES.DASHBOARD.RENTALS.RETURNED,
                permission: PERMISSIONS.RENTALS.VIEW_ALL,
            },
            {
                title: 'Completed Rentals',
                to: ROUTES.DASHBOARD.RENTALS.COMPLETED,
                permission: PERMISSIONS.RENTALS.VIEW_ALL,
            },
            {
                title: 'Cancelled Rentals',
                to: ROUTES.DASHBOARD.RENTALS.CANCELLED,
                permission: PERMISSIONS.RENTALS.VIEW_ALL,
            },
            {
                title: 'Inspection Log',
                to: ROUTES.DASHBOARD.RENTALS.INSPECTIONS,
                permission: PERMISSIONS.RENTALS.VIEW_INSPECTIONS,
            },
            {
                title: 'Additional Charges',
                to: ROUTES.DASHBOARD.RENTALS.CHARGES,
                permission: PERMISSIONS.RENTALS.MANAGE_ADDITIONAL_CHARGES,
            },
            {
                title: 'Security Deposits',
                to: ROUTES.DASHBOARD.RENTALS.SECURITY_DEPOSITS,
                permission: PERMISSIONS.RENTALS.MANAGE_SECURITY_DEPOSIT,
            },
            {
                title: 'Rental Locations',
                to: ROUTES.DASHBOARD.RENTALS.RENTAL_LOCATIONS,
                permission: PERMISSIONS.RENTALS.VIEW_ALL,
            },
        ],
    },

    {
        title: ' Airport Transfer',
        classChange: 'mm-collapse',
        iconStyle: <MdOutlineCarRental size={25} style={{ color: 'gray' }} />,
        permission: [
            PERMISSIONS.AIRPORT_TRANSFER.VIEW_ALL,
            PERMISSIONS.AIRPORT_TRANSFER.CREATE,
            PERMISSIONS.AIRPORT_TRANSFER.EDIT,
            PERMISSIONS.AIRPORT_TRANSFER.DELETE,
            PERMISSIONS.AIRPORT_TRANSFER.MANAGE_ACTIVE,
            PERMISSIONS.AIRPORT_TRANSFER.MANAGE_BOOKINGS,
            PERMISSIONS.AIRPORT_TRANSFER.MANAGE_PENDING_BOOKINGS,
            PERMISSIONS.AIRPORT_TRANSFER.MANAGE_PACKAGES,
            PERMISSIONS.AIRPORT_TRANSFER.MANAGE_LOCATIONS,
            PERMISSIONS.AIRPORT_TRANSFER.MANAGE_VEHICLES,
            PERMISSIONS.AIRPORT_TRANSFER.MANAGE_APPROVALS,
        ],
        content: [
            {
                title: 'Bookings',
                to: ROUTES.DASHBOARD.AIRPORT_TRANSFER.BOOKINGS.ROOT,
                permission: PERMISSIONS.AIRPORT_TRANSFER.MANAGE_BOOKINGS,
            },
            {
                title: 'Customers',
                to: ROUTES.DASHBOARD.AIRPORT_TRANSFER.CUSTOMERS.ROOT,
                permission: PERMISSIONS.AIRPORT_TRANSFER.VIEW_ALL,
            },
            {
                title: 'Airports',
                to: ROUTES.DASHBOARD.AIRPORT_TRANSFER.AIRPORTS.ROOT,
                permission: PERMISSIONS.AIRPORT_TRANSFER.VIEW_ALL,
            },
            {
                title: 'Locations',
                to: ROUTES.DASHBOARD.AIRPORT_TRANSFER.LOCATIONS.ROOT,
                permission: PERMISSIONS.AIRPORT_TRANSFER.MANAGE_LOCATIONS,
            },
            {
                title: 'Packages',
                to: ROUTES.DASHBOARD.AIRPORT_TRANSFER.PACKAGES.ROOT,
                permission: PERMISSIONS.AIRPORT_TRANSFER.MANAGE_PACKAGES,
            },
            {
                title: 'Package Pricing',
                to: ROUTES.DASHBOARD.AIRPORT_TRANSFER.PACKAGE_PRICING.ROOT,
                permission: PERMISSIONS.AIRPORT_TRANSFER.MANAGE_PACKAGES,
            },
            {
                title: 'Cancellation Settings',
                to: ROUTES.DASHBOARD.AIRPORT_TRANSFER.CANCELLATION_SETTINGS,
                permission: PERMISSIONS.AIRPORT_TRANSFER.MANAGE_PACKAGES,
            },
        ],
    },

    {
        title: ' Chauffeur Rental',
        classChange: 'mm-collapse',
        iconStyle: <MdOutlineCarRental size={25} style={{ color: 'gray' }} />,
        permission: [
            PERMISSIONS.CHAUFFEUR_RENTAL.VIEW_ALL,
            PERMISSIONS.CHAUFFEUR_RENTAL.MANAGE_BOOKINGS,
            PERMISSIONS.CHAUFFEUR_RENTAL.MANAGE_CUSTOMERS,
            PERMISSIONS.CHAUFFEUR_RENTAL.MANAGE_LOCATIONS,
            PERMISSIONS.CHAUFFEUR_RENTAL.MANAGE_SETTINGS,
        ],
        content: [
            {
                title: 'Bookings',
                to: ROUTES.DASHBOARD.CHAUFFEUR_RENTAL.BOOKINGS.ROOT,
                permission: PERMISSIONS.CHAUFFEUR_RENTAL.MANAGE_BOOKINGS,
            },
            {
                title: 'Create Booking',
                to: ROUTES.DASHBOARD.CHAUFFEUR_RENTAL.BOOKINGS.CREATE,
                permission: PERMISSIONS.CHAUFFEUR_RENTAL.CREATE,
            },
            {
                title: 'Customers',
                to: ROUTES.DASHBOARD.CHAUFFEUR_RENTAL.CUSTOMERS.ROOT,
                permission: PERMISSIONS.CHAUFFEUR_RENTAL.MANAGE_CUSTOMERS,
            },
            {
                title: 'Locations',
                to: ROUTES.DASHBOARD.CHAUFFEUR_RENTAL.LOCATIONS.ROOT,
                permission: PERMISSIONS.CHAUFFEUR_RENTAL.MANAGE_LOCATIONS,
            },
            {
                title: 'Settings',
                to: ROUTES.DASHBOARD.CHAUFFEUR_RENTAL.SETTINGS,
                permission: PERMISSIONS.CHAUFFEUR_RENTAL.MANAGE_SETTINGS,
            },
        ],
    },

    {
        title: 'Self-Drive Fleet',
        classChange: 'mm-collapse',
        iconStyle: <IoCarSportSharp size={22} style={{ color: 'gray' }} />,
        permission: [
            PERMISSIONS.VEHICLES.VIEW_ALL,
            PERMISSIONS.VEHICLES.CREATE,
            PERMISSIONS.VEHICLES.MANAGE_AVAILABLE,
            PERMISSIONS.VEHICLES.MANAGE_RENTED,
            PERMISSIONS.VEHICLES.MANAGE_MAINTENANCE,
            PERMISSIONS.VEHICLES.MANAGE_CATEGORIES,
            PERMISSIONS.VEHICLES.MANAGE_FEATURES,
        ],
        content: [
            {
                title: 'All Self-Drive Fleet',
                to: ROUTES.DASHBOARD.VEHICLES.ROOT,
                permission: PERMISSIONS.VEHICLES.VIEW_ALL,
            },
            {
                title: 'Available Self-Drive',
                to: ROUTES.DASHBOARD.VEHICLES.AVAILABLE,
                permission: PERMISSIONS.VEHICLES.MANAGE_AVAILABLE,
            },
            {
                title: 'Rented Self-Drive',
                to: ROUTES.DASHBOARD.VEHICLES.RENTED,
                permission: PERMISSIONS.VEHICLES.MANAGE_RENTED,
            },
            {
                title: 'Under Maintenance',
                to: ROUTES.DASHBOARD.VEHICLES.MAINTENANCE,
                permission: PERMISSIONS.VEHICLES.MANAGE_MAINTENANCE,
            },
            {
                title: 'Add New Vehicle',
                to: ROUTES.DASHBOARD.VEHICLES.CREATE,
                permission: PERMISSIONS.VEHICLES.CREATE,
            },
            {
                title: 'Vehicle Categories',
                to: ROUTES.DASHBOARD.CATEGORIES.ROOT,
                permission: PERMISSIONS.VEHICLES.MANAGE_CATEGORIES,
            },
            {
                title: 'Vehicle Features',
                to: ROUTES.DASHBOARD.VEHICLES.FEATURES,
                permission: PERMISSIONS.VEHICLES.MANAGE_FEATURES,
            },
        ],
    },
    {
        title: 'Chauffeured Fleet',
        classChange: 'mm-collapse',
        iconStyle: <FaTruck size={22} style={{ color: 'gray' }} />,
        permission: [
            PERMISSIONS.FLEET_VEHICLES.VIEW_ALL,
            PERMISSIONS.FLEET_VEHICLES.CREATE,
        ],
        content: [
            {
                title: 'All Chauffeured Fleet',
                to: ROUTES.DASHBOARD.FLEET_VEHICLES.ROOT,
                permission: PERMISSIONS.FLEET_VEHICLES.VIEW_ALL,
            },
            {
                title: 'Add Chauffeured Vehicle',
                to: ROUTES.DASHBOARD.FLEET_VEHICLES.CREATE,
                permission: PERMISSIONS.FLEET_VEHICLES.CREATE,
            },
        ],
    },
    {
        title: 'Drivers',
        classChange: 'mm-collapse',
        iconStyle: <FaIdCard size={22} style={{ color: 'gray' }} />,
        permission: [PERMISSIONS.DRIVERS.VIEW_ALL, PERMISSIONS.DRIVERS.CREATE],
        content: [
            {
                title: 'All Drivers',
                to: ROUTES.DASHBOARD.DRIVERS.ROOT,
                permission: PERMISSIONS.DRIVERS.VIEW_ALL,
            },
            {
                title: 'Add New Driver',
                to: ROUTES.DASHBOARD.DRIVERS.CREATE,
                permission: PERMISSIONS.DRIVERS.CREATE,
            },
        ],
    },
    {
        title: 'Customers',
        classChange: 'mm-collapse',
        iconStyle: <FaMultiUsers size={22} style={{ color: 'gray' }} />,
        permission: [
            PERMISSIONS.CUSTOMERS.VIEW_ALL,
            PERMISSIONS.CUSTOMERS.CREATE,
            PERMISSIONS.CUSTOMERS.BLACKLIST,
            PERMISSIONS.CUSTOMERS.MANAGE_LICENSE_EXPIRED,
            PERMISSIONS.CUSTOMERS.MANAGE_LICENSE_EXPIRING,
            PERMISSIONS.CUSTOMERS.VIEW_HISTORY,
        ],
        content: [
            {
                title: 'All Customers',
                to: ROUTES.DASHBOARD.CUSTOMERS.ROOT,
                permission: PERMISSIONS.CUSTOMERS.VIEW_ALL,
            },
            {
                title: 'Add New Customer',
                to: ROUTES.DASHBOARD.CUSTOMERS.CREATE,
                permission: PERMISSIONS.CUSTOMERS.CREATE,
            },
            {
                title: 'Customer History',
                to: ROUTES.DASHBOARD.CUSTOMERS.HISTORY,
                permission: PERMISSIONS.CUSTOMERS.VIEW_HISTORY,
            },
            {
                title: 'License Expiring Soon',
                to: ROUTES.DASHBOARD.CUSTOMERS.LICENSE_EXPIRING_SOON,
                permission: PERMISSIONS.CUSTOMERS.MANAGE_LICENSE_EXPIRING,
            },
            {
                title: 'License Expired Customer',
                to: ROUTES.DASHBOARD.CUSTOMERS.LICENSE_EXPIRED,
                permission: PERMISSIONS.CUSTOMERS.MANAGE_LICENSE_EXPIRED,
            },
            {
                title: 'Blacklisted Customer',
                to: ROUTES.DASHBOARD.CUSTOMERS.BLACKLISTED,
                permission: PERMISSIONS.CUSTOMERS.BLACKLIST,
            },
        ],
    },
    { title: 'Finance', classChange: 'menu-title' },
    {
        title: 'Transactions',
        to: ROUTES.DASHBOARD.FINANCE.TRANSACTIONS.ROOT,
        iconStyle: <MdOutlineCreditCard size={22} style={{ color: 'gray' }} />,
        permission: PERMISSIONS.TRANSACTIONS.VIEW_ALL,
    },
    {
        title: 'Discounts',
        to: ROUTES.DASHBOARD.DISCOUNTS.ROOT,
        classChange: 'mm-collapse',
        iconStyle: <FaPercent size={18} style={{ color: 'gray' }} />,
        permission: [
            PERMISSIONS.DISCOUNTS.VIEW_ALL,
            PERMISSIONS.DISCOUNTS.CREATE,
        ],
        content: [
            {
                title: 'Discount Rules',
                to: ROUTES.DASHBOARD.DISCOUNTS.ROOT,
                permission: PERMISSIONS.DISCOUNTS.VIEW_ALL,
            },
            {
                title: 'Discount Usages',
                to: ROUTES.DASHBOARD.DISCOUNTS.USAGES,
                permission: PERMISSIONS.DISCOUNTS.VIEW_ALL,
            },
            {
                title: 'Add Rule',
                to: ROUTES.DASHBOARD.DISCOUNTS.CREATE,
                permission: PERMISSIONS.DISCOUNTS.CREATE,
            },
        ],
    },
    {
        title: 'Rental Coupon',
        to: ROUTES.DASHBOARD.COUPONS.ROOT,
        classChange: 'mm-collapse',
        iconStyle: <MdOutlineScience size={22} style={{ color: 'gray' }} />,
        permission: [PERMISSIONS.COUPONS.VIEW_ALL, PERMISSIONS.COUPONS.CREATE],
        content: [
            {
                title: 'All Coupons',
                to: ROUTES.DASHBOARD.COUPONS.ROOT,
                permission: PERMISSIONS.COUPONS.VIEW_ALL,
            },
            {
                title: 'Active Coupons',
                to: ROUTES.DASHBOARD.COUPONS.ACTIVE,
                permission: PERMISSIONS.COUPONS.VIEW_ALL,
            },
            {
                title: 'Used Coupons',
                to: ROUTES.DASHBOARD.COUPONS.USED,
                permission: PERMISSIONS.COUPONS.VIEW_ALL,
            },
            {
                title: 'Expired Coupons',
                to: ROUTES.DASHBOARD.COUPONS.EXPIRED,
                permission: PERMISSIONS.COUPONS.VIEW_ALL,
            },
            {
                title: 'Create New Coupon',
                to: ROUTES.DASHBOARD.COUPONS.CREATE,
                permission: PERMISSIONS.COUPONS.CREATE,
            },
        ],
    },
    { title: 'Analytics', classChange: 'menu-title' },
    {
        title: 'Reports',
        classChange: 'mm-collapse',
        iconStyle: <VscGraph size={22} style={{ color: 'gray' }} />,
        permission: [
            PERMISSIONS.REPORTS.VIEW_ALL,
            PERMISSIONS.REPORTS.VIEW_REVENUE,
            PERMISSIONS.REPORTS.VIEW_UTILIZATION,
            PERMISSIONS.REPORTS.VIEW_MANAGER_PERFORMANCE,
            PERMISSIONS.REPORTS.VIEW_OUTSTANDING_PAYMENTS,
            PERMISSIONS.REPORTS.VIEW_MAINTENANCE,
            PERMISSIONS.REPORTS.VIEW_CUSTOMER_ANALYTICS,
        ],
        content: [
            {
                title: 'Revenue Reports',
                to: ROUTES.DASHBOARD.REPORTS.REVENUE,
                permission: PERMISSIONS.REPORTS.VIEW_REVENUE,
            },
            {
                title: 'Outstanding Payments',
                to: ROUTES.DASHBOARD.REPORTS.OUTSTANDING_PAYMENTS,
                permission: PERMISSIONS.REPORTS.VIEW_OUTSTANDING_PAYMENTS,
            },
            {
                title: 'Customer Analysis',
                to: ROUTES.DASHBOARD.REPORTS.CUSTOMER_ANALYSIS,
                permission: PERMISSIONS.REPORTS.VIEW_CUSTOMER_ANALYTICS,
            },
            {
                title: 'Vehicle Reports',
                to: ROUTES.DASHBOARD.REPORTS.VEHICLES,
                permission: PERMISSIONS.REPORTS.VIEW_UTILIZATION,
            },
            {
                title: 'Manager Performance',
                to: ROUTES.DASHBOARD.REPORTS.MANAGER_PERFORMANCE,
                permission: PERMISSIONS.REPORTS.VIEW_MANAGER_PERFORMANCE,
            },
            {
                title: 'Vehicle Expenses',
                to: ROUTES.DASHBOARD.REPORTS.VEHICLE_EXPENSES,
                permission: PERMISSIONS.REPORTS.VIEW_UTILIZATION,
            },
            {
                title: 'Maintenance on Repairs',
                to: ROUTES.DASHBOARD.REPORTS.MAINTENANCE_REPAIRS,
                permission: PERMISSIONS.REPORTS.VIEW_MAINTENANCE,
            },
        ],
    },
    {
        title: 'Exports & Downloads',
        to: ROUTES.DASHBOARD.EXPORTS.ROOT,
        iconStyle: <LuDownload size={22} style={{ color: 'gray' }} />,
        permission: [
            PERMISSIONS.EXPORTS.DOWNLOAD_ALL,
            PERMISSIONS.EXPORTS.DOWNLOAD_RENTALS,
            PERMISSIONS.EXPORTS.DOWNLOAD_VEHICLES,
            PERMISSIONS.EXPORTS.DOWNLOAD_CUSTOMERS,
            PERMISSIONS.EXPORTS.DOWNLOAD_REPORTS,
        ],
    },
    { title: 'Communications', classChange: 'menu-title' },
    {
        title: 'Notifications',
        to: ROUTES.DASHBOARD.NOTIFICATIONS.ROOT,
        classChange: 'mm-collapse',
        iconStyle: (
            <MdOutlineNotificationsActive size={22} style={{ color: 'gray' }} />
        ),
        permission: PERMISSIONS.NOTIFICATIONS.VIEW,
        content: [
            {
                title: 'All Notifications',
                to: ROUTES.DASHBOARD.NOTIFICATIONS.ROOT,
                permission: PERMISSIONS.NOTIFICATIONS.VIEW,
            },
            {
                title: 'Overdue Alerts',
                to: ROUTES.DASHBOARD.NOTIFICATIONS.OVERDUE_ALERTS,
                permission: PERMISSIONS.NOTIFICATIONS.VIEW,
            },
            {
                title: 'New Bookings',
                to: ROUTES.DASHBOARD.NOTIFICATIONS.NEW_BOOKINGS,
                permission: PERMISSIONS.NOTIFICATIONS.VIEW,
            },
            {
                title: 'Return Reminders',
                to: ROUTES.DASHBOARD.NOTIFICATIONS.RETURN_REMINDERS,
                permission: PERMISSIONS.NOTIFICATIONS.VIEW,
            },
            {
                title: 'Quote Requests',
                to: ROUTES.DASHBOARD.NOTIFICATIONS.QUOTE_REQUESTS,
                permission: PERMISSIONS.NOTIFICATIONS.VIEW,
            },
        ],
    },
    { title: 'Administration', classChange: 'menu-title' },
    {
        title: 'Users & Access',
        to: ROUTES.DASHBOARD.USERS.ROOT,
        classChange: 'mm-collapse',
        iconStyle: <FaUserShield size={22} style={{ color: 'gray' }} />,
        permission: [
            PERMISSIONS.USERS.VIEW_ALL,
            PERMISSIONS.USERS.CREATE,
            PERMISSIONS.ROLES.VIEW_ALL,
            PERMISSIONS.LOGS.VIEW_ACTIVITY,
        ],
        content: [
            {
                title: 'All Users',
                to: ROUTES.DASHBOARD.USERS.ROOT,
                permission: PERMISSIONS.USERS.VIEW_ALL,
            },
            {
                title: 'Add New User',
                to: ROUTES.DASHBOARD.USERS.CREATE,
                permission: PERMISSIONS.USERS.CREATE,
            },
            {
                title: 'Roles & Permissions',
                to: ROUTES.DASHBOARD.USERS.ROLES,
                permission: PERMISSIONS.ROLES.VIEW_ALL,
            },
            {
                title: 'Activity Logs',
                to: ROUTES.DASHBOARD.USERS.ACTIVITY_LOGS,
                permission: PERMISSIONS.LOGS.VIEW_ACTIVITY,
            },
        ],
    },
    {
        title: 'Branches',
        to: ROUTES.DASHBOARD.BRANCHES.ROOT,
        classChange: 'mm-collapse',
        iconStyle: <FaCodeBranch size={20} style={{ color: 'gray' }} />,
        permission: [
            PERMISSIONS.BRANCHES.VIEW_ALL,
            PERMISSIONS.BRANCHES.CREATE,
            PERMISSIONS.BRANCHES.MANAGE_MEMBERS,
        ],
        content: [
            {
                title: 'All Branches',
                to: ROUTES.DASHBOARD.BRANCHES.ROOT,
                permission: PERMISSIONS.BRANCHES.VIEW_ALL,
            },
            {
                title: 'Add New Branch',
                to: ROUTES.DASHBOARD.BRANCHES.CREATE,
                permission: PERMISSIONS.BRANCHES.CREATE,
            },
            {
                title: 'Branch Members',
                to: ROUTES.DASHBOARD.BRANCHES.MEMBERS,
                permission: PERMISSIONS.BRANCHES.MANAGE_MEMBERS,
            },
        ],
    },
    { title: 'Settings & Configuration', classChange: 'menu-title' },
    {
        title: 'Settings',
        to: ROUTES.DASHBOARD.SETTINGS.ROOT,
        classChange: 'mm-collapse',
        iconStyle: <FcSettings size={22} style={{ color: 'gray' }} />,
        permission: [
            PERMISSIONS.SETTINGS.VIEW_GENERAL,
            PERMISSIONS.SETTINGS.EDIT_GENERAL,
            PERMISSIONS.SETTINGS.EDIT_RENTAL,
            PERMISSIONS.SETTINGS.EDIT_PRICING,
            PERMISSIONS.SETTINGS.EDIT_EMAIL,
            PERMISSIONS.SETTINGS.EDIT_WHATSAPP,
            PERMISSIONS.SETTINGS.EDIT_WHATSAPP_TEMPLATES,
            PERMISSIONS.SETTINGS.EDIT_SMS,
            PERMISSIONS.SETTINGS.EDIT_SMS_TEMPLATES,
            PERMISSIONS.SETTINGS.EDIT_PAYMENT,
            PERMISSIONS.SETTINGS.MANAGE_BACKUP,
            PERMISSIONS.SETTINGS.TEST_EMAIL,
            PERMISSIONS.SETTINGS.TEST_WHATSAPP,
            PERMISSIONS.SETTINGS.TEST_SMS,
            PERMISSIONS.NOTIFICATIONS.MANAGE_SETTINGS,
            PERMISSIONS.WEBSITE.EDIT_HOMEPAGE,
        ],
        content: [
            {
                title: 'General Settings',
                to: ROUTES.DASHBOARD.SETTINGS.GENERAL,
                permission: PERMISSIONS.SETTINGS.VIEW_GENERAL,
            },
            {
                title: 'Rental Settings',
                to: ROUTES.DASHBOARD.SETTINGS.RENTAL,
                permission: PERMISSIONS.SETTINGS.EDIT_RENTAL,
            },
            {
                title: 'Pricing Settings',
                to: ROUTES.DASHBOARD.SETTINGS.PRICING,
                permission: PERMISSIONS.SETTINGS.EDIT_PRICING,
            },
            {
                title: 'Payment Settings',
                to: ROUTES.DASHBOARD.SETTINGS.PAYMENT,
                permission: PERMISSIONS.SETTINGS.EDIT_PAYMENT,
            },
            {
                title: 'Notification Settings',
                to: ROUTES.DASHBOARD.SETTINGS.NOTIFICATION_SETTINGS,
                permission: PERMISSIONS.NOTIFICATIONS.MANAGE_SETTINGS,
            },
            {
                title: 'Email Configuration',
                to: ROUTES.DASHBOARD.SETTINGS.EMAIL,
                permission: PERMISSIONS.SETTINGS.EDIT_EMAIL,
            },
            {
                title: 'Email Templates',
                to: ROUTES.DASHBOARD.SETTINGS.EMAIL_TEMPLATES,
                permission: PERMISSIONS.SETTINGS.EDIT_EMAIL,
            },
            {
                title: 'WhatsApp Settings',
                to: ROUTES.DASHBOARD.SETTINGS.WHATSAPP,
                permission: PERMISSIONS.SETTINGS.EDIT_WHATSAPP,
            },
            {
                title: 'WhatsApp Templates',
                to: ROUTES.DASHBOARD.SETTINGS.WHATSAPP_TEMPLATES,
                permission: PERMISSIONS.SETTINGS.EDIT_WHATSAPP_TEMPLATES,
            },
            {
                title: 'SMS Settings',
                to: ROUTES.DASHBOARD.SETTINGS.SMS,
                permission: PERMISSIONS.SETTINGS.EDIT_SMS,
            },
            {
                title: 'SMS Templates',
                to: ROUTES.DASHBOARD.SETTINGS.SMS_TEMPLATES,
                permission: PERMISSIONS.SETTINGS.EDIT_SMS_TEMPLATES,
            },
            {
                title: 'SEO Settings',
                to: ROUTES.DASHBOARD.SETTINGS.SEO,
                permission: PERMISSIONS.SETTINGS.EDIT_SEO,
            },
            {
                title: 'Popup Settings',
                to: ROUTES.DASHBOARD.SETTINGS.POPUPS,
                permission: PERMISSIONS.WEBSITE.EDIT_HOMEPAGE,
            },
            {
                title: 'Backup & Maintenance',
                to: ROUTES.DASHBOARD.SETTINGS.BACKUP,
                permission: PERMISSIONS.SETTINGS.MANAGE_BACKUP,
            },
            {
                title: 'Test Emails',
                to: ROUTES.DASHBOARD.SETTINGS.TEST_EMAIL,
                permission: PERMISSIONS.SETTINGS.TEST_EMAIL,
            },
            {
                title: 'Test WhatsApp',
                to: ROUTES.DASHBOARD.SETTINGS.TEST_WHATSAPP,
                permission: PERMISSIONS.SETTINGS.TEST_WHATSAPP,
            },
            {
                title: 'Test SMS',
                to: ROUTES.DASHBOARD.SETTINGS.TEST_SMS,
                permission: PERMISSIONS.SETTINGS.TEST_SMS,
            },
        ],
    },
    {
        title: 'Website Content',
        to: ROUTES.DASHBOARD.CONTENT.ROOT,
        classChange: 'mm-collapse',
        iconStyle: <LuLayoutTemplate size={22} style={{ color: 'gray' }} />,
        permission: [
            PERMISSIONS.WEBSITE.EDIT_HOMEPAGE,
            PERMISSIONS.WEBSITE.EDIT_ABOUT,
            PERMISSIONS.WEBSITE.EDIT_CONTACT,
            PERMISSIONS.WEBSITE.MANAGE_TESTIMONIALS,
        ],
        content: [
            {
                title: 'Header',
                to: ROUTES.DASHBOARD.CONTENT.HEADER,
                permission: PERMISSIONS.WEBSITE.EDIT_HOMEPAGE,
            },
            {
                title: 'Homepage Management',
                to: ROUTES.DASHBOARD.CONTENT.HOMEPAGE,
                permission: PERMISSIONS.WEBSITE.EDIT_HOMEPAGE,
            },
            {
                title: 'About Us Page',
                to: ROUTES.DASHBOARD.CONTENT.ABOUT,
                permission: PERMISSIONS.WEBSITE.EDIT_ABOUT,
            },
            {
                title: 'Services Page',
                to: ROUTES.DASHBOARD.CONTENT.SERVICES,
                permission: PERMISSIONS.WEBSITE.EDIT_HOMEPAGE,
            },
            // {
            //     title: 'Airport Transfer',
            //     to: ROUTES.DASHBOARD.CONTENT.AIRPORT_TRANSFER,
            //     permission: PERMISSIONS.WEBSITE.EDIT_HOMEPAGE,
            // },
            // {
            //     title: 'Listing Page',
            //     to: ROUTES.DASHBOARD.CONTENT.LISTING,
            //     permission: PERMISSIONS.WEBSITE.EDIT_HOMEPAGE,
            // },
            // {
            //     title: 'Share Your Car',
            //     to: ROUTES.DASHBOARD.CONTENT.SHARE_CAR,
            //     permission: PERMISSIONS.WEBSITE.EDIT_HOMEPAGE,
            // },
            {
                title: 'Contact Us Page',
                to: ROUTES.DASHBOARD.CONTENT.CONTACT,
                permission: PERMISSIONS.WEBSITE.EDIT_CONTACT,
            },
            {
                title: 'FAQs Page',
                to: ROUTES.DASHBOARD.CONTENT.FAQS,
                permission: PERMISSIONS.WEBSITE.EDIT_HOMEPAGE,
            },
            // {
            //     title: 'Testimonials',
            //     to: ROUTES.DASHBOARD.CONTENT.TESTIMONIALS,
            //     permission: PERMISSIONS.WEBSITE.MANAGE_TESTIMONIALS,
            // },
            {
                title: 'Terms & Conditions',
                to: ROUTES.DASHBOARD.CONTENT.TERMS,
                permission: PERMISSIONS.WEBSITE.EDIT_HOMEPAGE,
            },
            {
                title: 'Privacy Policy',
                to: ROUTES.DASHBOARD.CONTENT.PRIVACY,
                permission: PERMISSIONS.WEBSITE.EDIT_HOMEPAGE,
            },
            {
                title: 'Footer',
                to: ROUTES.DASHBOARD.CONTENT.FOOTER,
                permission: PERMISSIONS.WEBSITE.EDIT_HOMEPAGE,
            },
        ],
    },
];
