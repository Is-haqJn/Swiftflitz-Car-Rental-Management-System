import { describe, it, expect, vi } from 'vitest';
import {
    cn,
    formatCurrency,
    formatRoleName,
    getErrorMessage,
    applyServerErrors,
    rentalStatusVariant,
} from '../utils';

/* cn() */
describe('cn', () => {
    it('merges class strings', () => {
        expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('handles conditional classes (falsy values omitted)', () => {
        expect(cn('foo', false && 'bar', undefined, null, 'baz')).toBe(
            'foo baz'
        );
    });

    it('resolves Tailwind conflicts (last wins)', () => {
        // twMerge keeps the last conflicting Tailwind utility
        expect(cn('p-2', 'p-4')).toBe('p-4');
    });

    it('handles arrays and objects', () => {
        expect(cn(['foo', 'bar'], { baz: true, qux: false })).toBe(
            'foo bar baz'
        );
    });

    it('returns empty string when no arguments', () => {
        expect(cn()).toBe('');
    });
});

/* formatRoleName() */
describe('formatRoleName', () => {
    it('formats snake_case to Title Case', () => {
        expect(formatRoleName('super_admin')).toBe('Super Admin');
    });

    it('capitalises each word', () => {
        expect(formatRoleName('branch_manager')).toBe('Branch Manager');
    });

    it('handles single word with no underscore', () => {
        expect(formatRoleName('admin')).toBe('Admin');
    });

    it('handles multiple underscores', () => {
        expect(formatRoleName('some_very_long_role')).toBe(
            'Some Very Long Role'
        );
    });

    it('handles already-capitalised input gracefully', () => {
        expect(formatRoleName('Super_Admin')).toBe('Super Admin');
    });
});

/* getErrorMessage() */
describe('getErrorMessage', () => {
    it('returns the fallback when error is null', () => {
        expect(getErrorMessage(null, 'Something went wrong')).toBe(
            'Something went wrong'
        );
    });

    it('returns message from response.data.message for non-422 errors', () => {
        const error = {
            response: { status: 500, data: { message: 'Server error' } },
        };
        expect(getErrorMessage(error, 'fallback')).toBe('Server error');
    });

    it('returns e.message when no response.data.message', () => {
        const error = { message: 'Network Error' };
        expect(getErrorMessage(error, 'fallback')).toBe('Network Error');
    });

    it('extracts first field error from 422 validation errors', () => {
        const error = {
            response: {
                status: 422,
                data: {
                    message: 'The given data was invalid.',
                    errors: {
                        email: ['The email field is required.'],
                        name: ['The name field is required.'],
                    },
                },
            },
        };
        // Should return the first field's first message, not the generic 422 message
        expect(getErrorMessage(error, 'fallback')).toBe(
            'The email field is required.'
        );
    });

    it('falls back to response.data.message when 422 errors object is empty', () => {
        const error = {
            response: {
                status: 422,
                data: { message: 'Validation failed.', errors: {} },
            },
        };
        expect(getErrorMessage(error, 'fallback')).toBe('Validation failed.');
    });

    it('returns fallback when error has no useful info', () => {
        expect(getErrorMessage({}, 'default fallback')).toBe(
            'default fallback'
        );
    });
});

/* applyServerErrors() */
describe('applyServerErrors', () => {
    it('calls setError for each field in a 422 response', () => {
        const setError = vi.fn();
        const error = {
            response: {
                status: 422,
                data: {
                    errors: {
                        email: ['Email is already taken.'],
                        password: ['Password is too short.'],
                    },
                },
            },
        };

        applyServerErrors(error, setError);

        expect(setError).toHaveBeenCalledTimes(2);
        expect(setError).toHaveBeenCalledWith('email', {
            message: 'Email is already taken.',
        });
        expect(setError).toHaveBeenCalledWith('password', {
            message: 'Password is too short.',
        });
    });

    it('does nothing when error is not a 422', () => {
        const setError = vi.fn();
        const error = { response: { status: 500, data: {} } };

        applyServerErrors(error, setError);

        expect(setError).not.toHaveBeenCalled();
    });

    it('does nothing when error has no response', () => {
        const setError = vi.fn();
        applyServerErrors({ message: 'Network Error' }, setError);
        expect(setError).not.toHaveBeenCalled();
    });

    it('does nothing when errors object is absent', () => {
        const setError = vi.fn();
        const error = {
            response: { status: 422, data: { message: 'Validation error' } },
        };
        applyServerErrors(error, setError);
        expect(setError).not.toHaveBeenCalled();
    });
});

/* formatCurrency() */
describe('formatCurrency', () => {
    it('formats a positive amount with default GHS currency', () => {
        const result = formatCurrency(100);
        expect(result).toContain('100');
    });

    it('formats zero as 0.00', () => {
        const result = formatCurrency(0, 'USD');
        expect(result).toContain('0.00');
    });

    it('formats null as 0.00', () => {
        const result = formatCurrency(null, 'USD');
        expect(result).toContain('0.00');
    });

    it('formats undefined as 0.00', () => {
        const result = formatCurrency(undefined, 'USD');
        expect(result).toContain('0.00');
    });

    it('always includes two decimal places', () => {
        const result = formatCurrency(50.5, 'GBP');
        expect(result).toContain('50.50');
    });

    it('falls back gracefully for an invalid currency code', () => {
        const result = formatCurrency(42, 'INVALID');
        expect(result).toBe('INVALID 42.00');
    });
});

/* rentalStatusVariant() */
describe('rentalStatusVariant', () => {
    it.each([
        ['active', 'success'],
        ['pending', 'warning'],
        ['overdue', 'danger'],
        ['completed', 'secondary'],
        ['cancelled', 'dark'],
        ['returned', 'info'],
    ])('maps %s → %s', (status, expected) => {
        expect(rentalStatusVariant(status)).toBe(expected);
    });

    it('returns "secondary" for unknown status', () => {
        expect(rentalStatusVariant('unknown_status')).toBe('secondary');
    });

    it('returns "secondary" for empty string', () => {
        expect(rentalStatusVariant('')).toBe('secondary');
    });
});
