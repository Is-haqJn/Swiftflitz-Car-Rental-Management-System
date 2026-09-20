import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatTime(time: string | null | undefined): string {
    if (!time) return '-';
    const parsed = new Date(time);
    if (isNaN(parsed.getTime())) return '-';
    return new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(parsed);
}

export function formatDate(date: string | null | undefined): string {
    if (!date) return '-';
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return '-';
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(parsed);
}

export function formatDateTime(datetime: string | null | undefined): string {
    if (!datetime) return '-';
    const parsed = new Date(datetime);
    if (isNaN(parsed.getTime())) return '-';
    const datePart = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(parsed);
    const timePart = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(parsed);
    return `${datePart}, ${timePart}`;
}

/**
 * Format a role name by replacing underscores with spaces
 * and capitalizing each word. e.g. "super_admin" -> "Super Admin"
 */
export function formatRoleName(name: string): string {
    return name?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Format a status/enum string into a human-readable title.
 * e.g. "partially_paid" -> "Partially Paid", null -> "-"
 */
export function formatStatus(value: string | null | undefined): string {
    if (!value) return '-';
    return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

type ApiError = {
    response?: {
        data?: { message?: string; errors?: Record<string, string[]> };
        status?: number;
    };
    message?: string;
};

/**
 * Extract the human-readable error message from an Axios error.
 * For 422 validation errors, returns the first specific field error
 * instead of Laravel's generic "The given data was invalid." message.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
    const e = error as ApiError;
    if (e?.response?.status === 422 && e.response?.data?.errors) {
        const firstMessages = Object.values(e.response.data.errors)[0];
        if (firstMessages?.[0]) {
            return firstMessages[0];
        }
    }
    return e?.response?.data?.message || e?.message || fallback;
}

/**
 * Map server-side 422 validation errors onto react-hook-form fields.
 * Call inside a mutation's onError to show field-level server errors.
 */
export function applyServerErrors<T extends FieldValues>(
    error: unknown,
    setError: UseFormSetError<T>
): void {
    const e = error as ApiError;
    if (e?.response?.status === 422 && e.response?.data?.errors) {
        Object.entries(e.response.data.errors).forEach(([field, messages]) => {
            setError(field as Path<T>, { message: messages[0] });
        });
    }
}

/**
 * Format a number as currency using an ISO 4217 currency code (e.g. 'GHS', 'USD', 'GBP').
 * Falls back to plain number formatting if the code is invalid so the UI never goes blank.
 * Prefer calling this via the `useFormatCurrency()` hook so the code is read from settings
 * automatically - direct calls should only be used in non-component contexts.
 */
export function formatCurrency(
    amount: number | null | undefined,
    currencyCode = 'GHS'
): string {
    const value = Number(amount ?? 0);
    try {
        return new Intl.NumberFormat('en-GH', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 2,
        }).format(value);
    } catch {
        // currencyCode is not a valid ISO 4217 code - degrade gracefully
        return `${currencyCode} ${value.toFixed(2)}`;
    }
}

/**
 * Map a rental status string to its Bootstrap variant name.
 */
export function rentalStatusVariant(status: string): string {
    const map: Record<string, string> = {
        active: 'success',
        pending: 'warning',
        overdue: 'danger',
        completed: 'secondary',
        cancelled: 'dark',
        returned: 'info',
    };
    return map[status] ?? 'secondary';
}

/**
 * Format a byte count into a human-readable string (B / KB / MB).
 */
export function formatBytes(bytes: number | null): string {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format an ISO date string as a relative time label
 * (e.g. "Just now", "5m ago", "3h ago", "2d ago").
 */
export function formatTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

/**
 * Returns true if the given date string is in the past.
 */
export function isLicenseExpired(
    expiryDate: string | null | undefined
): boolean {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
}

/**
 * Returns true if the given date string is within the next 30 days
 * (but not yet expired).
 */
export function isLicenseExpiringSoon(
    expiryDate: string | null | undefined
): boolean {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
        (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
}

/**
 * Number of calendar days since the given date (past dates only).
 */
export function daysSinceExpiry(expiryDate: string): number {
    return Math.ceil(
        (Date.now() - new Date(expiryDate).getTime()) / (1000 * 60 * 60 * 24)
    );
}

/**
 * Convert any value to a string safely.
 * null / undefined → fallback (default '').
 */
export function safeStr(value: unknown, fallback = ''): string {
    if (value === null || value === undefined) return fallback;
    return String(value);
}

/**
 * Parse a Sanctum token name in the format "Browser - IP"
 * into its component parts.
 */
export function parseSessionName(name: string): {
    browser: string;
    ip: string;
} {
    const parts = name.split(' - ');
    if (parts.length === 2) {
        return { browser: parts[0].trim(), ip: parts[1].trim() };
    }
    return { browser: name, ip: '' };
}
