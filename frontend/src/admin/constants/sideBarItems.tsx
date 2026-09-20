import { type SideBarItems } from '@admin/types';
import { ROUTES } from '@/shared/routes/routes';
import { VscDashboard, VscGraph } from 'react-icons/vsc';
import { IoCarSportSharp } from 'react-icons/io5';
import {
    MdOutlineCarRental,
    MdOutlineNotificationsActive,
} from 'react-icons/md';
import { FaUsers as FaMultiUsers, FaUserShield } from 'react-icons/fa6';
import { FcSettings } from 'react-icons/fc';
import { LuLayoutTemplate } from 'react-icons/lu';

export const sideBarItems: SideBarItems[] = [
    {
        title: 'Dashboard',
        to: ROUTES.DASHBOARD,
        iconStyle: <VscDashboard size={22} style={{ color: 'gray' }} />,
        className: 'mb-0',
    },
    { title: 'Management', classChange: 'menu-title' },
    {
        title: 'Rentals',
        classChange: 'mm-collapse',
        iconStyle: <MdOutlineCarRental size={25} style={{ color: 'gray' }} />,
        content: [
            { title: 'All Rentals', to: ROUTES.DASHBOARD },
            { title: 'Active Rentals', to: ROUTES.DASHBOARD },
            { title: 'Create Rental', to: ROUTES.DASHBOARD },
            { title: 'Pending Bookings', to: ROUTES.DASHBOARD },
            { title: 'Overdue Rentals', to: ROUTES.DASHBOARD },
            { title: 'Returned Approved', to: ROUTES.DASHBOARD },
            { title: 'Pending Approvals', to: ROUTES.DASHBOARD },
            { title: 'Completed Rentals', to: ROUTES.DASHBOARD },
            { title: 'Cancelled Rentals', to: ROUTES.DASHBOARD },
            { title: 'Quote Requests', to: ROUTES.DASHBOARD },
        ],
    },
    {
        title: 'Vehicles',
        classChange: 'mm-collapse',
        iconStyle: <IoCarSportSharp size={22} style={{ color: 'gray' }} />,
        content: [
            { title: 'All Vehicles', to: ROUTES.DASHBOARD },
            { title: 'Add New Vehicle', to: ROUTES.DASHBOARD },
            { title: 'Available Vehicles', to: ROUTES.DASHBOARD },
            { title: 'Rented Vehicles', to: ROUTES.DASHBOARD },
            { title: 'Under Maintenance', to: ROUTES.DASHBOARD },
            { title: 'Vehicle Categories', to: ROUTES.DASHBOARD },
            { title: 'Vehicle Features', to: ROUTES.DASHBOARD },
        ],
    },
    {
        title: 'Customers',
        classChange: 'mm-collapse',
        iconStyle: <FaMultiUsers size={22} style={{ color: 'gray' }} />,
        content: [
            { title: 'All Customers', to: ROUTES.DASHBOARD },
            { title: 'Add New Customer', to: ROUTES.DASHBOARD },
            { title: 'Blacklisted Customer', to: ROUTES.DASHBOARD },
            { title: 'Customer History', to: ROUTES.DASHBOARD },
        ],
    },
    {
        title: 'Reports',
        classChange: 'mm-collapse',
        iconStyle: <VscGraph size={22} style={{ color: 'gray' }} />,
        content: [
            { title: 'Revenue Reports', to: ROUTES.DASHBOARD },
            { title: 'Vehicle Reports', to: ROUTES.DASHBOARD },
            { title: 'Manager Performance', to: ROUTES.DASHBOARD },
            { title: 'Outstanding Payments', to: ROUTES.DASHBOARD },
            { title: 'Maintenance on Repairs', to: ROUTES.DASHBOARD },
            { title: 'Customer Analysis', to: ROUTES.DASHBOARD },
        ],
    },
    {
        title: 'Notifications',
        to: ROUTES.DASHBOARD,
        classChange: 'mm-collapse',
        iconStyle: (
            <MdOutlineNotificationsActive size={22} style={{ color: 'gray' }} />
        ),
        content: [
            { title: 'All Notifications', to: ROUTES.DASHBOARD },
            { title: 'New Bookings', to: ROUTES.DASHBOARD },
            { title: 'Return Reminders', to: ROUTES.DASHBOARD },
            { title: 'Overdue Alerts', to: ROUTES.DASHBOARD },
            { title: 'Quote Requests', to: ROUTES.DASHBOARD },
            { title: 'Notification Settings', to: ROUTES.DASHBOARD },
        ],
    },
    { title: 'User Management', classChange: 'menu-title' },
    {
        title: 'Users & Access',
        to: ROUTES.DASHBOARD_USERS,
        classChange: 'mm-collapse',
        iconStyle: <FaUserShield size={22} style={{ color: 'gray' }} />,
        content: [
            { title: 'All Users', to: ROUTES.DASHBOARD_USERS },
            { title: 'Add New User', to: ROUTES.DASHBOARD_USER_CREATE },
            { title: 'Roles & Permissions', to: ROUTES.DASHBOARD },
            { title: 'Activity Logs', to: ROUTES.DASHBOARD },
        ],
    },
    { title: 'Settings & Configuration', classChange: 'menu-title' },
    {
        title: 'Settings',
        to: ROUTES.DASHBOARD,
        classChange: 'mm-collapse',
        iconStyle: <FcSettings size={22} style={{ color: 'gray' }} />,
        content: [
            { title: 'General Settings', to: ROUTES.DASHBOARD },
            { title: 'Rental Settings', to: ROUTES.DASHBOARD },
            { title: 'Pricing Settings', to: ROUTES.DASHBOARD },
            { title: 'Email Configuration', to: ROUTES.DASHBOARD },
            { title: 'WhatsApp Settings', to: ROUTES.DASHBOARD },
            { title: 'Payment Settings', to: ROUTES.DASHBOARD },
            { title: 'SEO Settings', to: ROUTES.DASHBOARD },
            { title: 'Backup & Maintenance', to: ROUTES.DASHBOARD },
        ],
    },
    {
        title: 'Website Content',
        to: ROUTES.DASHBOARD,
        classChange: 'mm-collapse',
        iconStyle: <LuLayoutTemplate size={22} style={{ color: 'gray' }} />,
        content: [
            { title: 'Header', to: ROUTES.DASHBOARD },
            { title: 'Homepage Management', to: ROUTES.DASHBOARD },
            { title: 'About Us Page', to: ROUTES.DASHBOARD },
            { title: 'Contact Us Page', to: ROUTES.DASHBOARD },
            { title: 'Listing Page', to: ROUTES.DASHBOARD },
            { title: 'Share Your Car', to: ROUTES.DASHBOARD },
            { title: 'Airport Transfer', to: ROUTES.DASHBOARD },
            { title: 'Footer', to: ROUTES.DASHBOARD },
            { title: 'Testimonials', to: ROUTES.DASHBOARD },
        ],
    },
];
