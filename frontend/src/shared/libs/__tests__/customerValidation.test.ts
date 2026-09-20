import { describe, it, expect } from 'vitest';
import { createCustomerSchema } from '../customerValidation';

const validBase = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+233201234567',
    address: '123 Main St, Accra',
    license_number: 'DL-123456',
    license_expiry_date: '2028-01-01',
    id_type: 'ghana_card' as const,
    id_number: 'GHA-123456789',
};

/* Required fields */
describe('createCustomerSchema - required fields', () => {
    it('passes with all required fields', () => {
        expect(createCustomerSchema.safeParse(validBase).success).toBe(true);
    });

    it('fails when name is empty', () => {
        expect(
            createCustomerSchema.safeParse({ ...validBase, name: '' }).success
        ).toBe(false);
    });

    it('fails when email is invalid', () => {
        const result = createCustomerSchema.safeParse({
            ...validBase,
            email: 'not-an-email',
        });
        expect(result.success).toBe(false);
    });

    it('fails when email is empty', () => {
        expect(
            createCustomerSchema.safeParse({ ...validBase, email: '' }).success
        ).toBe(false);
    });

    it('fails when address is empty', () => {
        expect(
            createCustomerSchema.safeParse({ ...validBase, address: '' })
                .success
        ).toBe(false);
    });

    it('fails when license_number is empty', () => {
        expect(
            createCustomerSchema.safeParse({
                ...validBase,
                license_number: '',
            }).success
        ).toBe(false);
    });

    it('fails when id_number is empty', () => {
        expect(
            createCustomerSchema.safeParse({ ...validBase, id_number: '' })
                .success
        ).toBe(false);
    });
});

/* Phone validation */
describe('createCustomerSchema - phone', () => {
    it('accepts international format', () => {
        expect(
            createCustomerSchema.safeParse({
                ...validBase,
                phone: '+1 800 555-1234',
            }).success
        ).toBe(true);
    });

    it('accepts local format with parentheses', () => {
        expect(
            createCustomerSchema.safeParse({
                ...validBase,
                phone: '(020) 123-4567',
            }).success
        ).toBe(true);
    });

    it('fails when phone contains letters', () => {
        expect(
            createCustomerSchema.safeParse({ ...validBase, phone: 'abc123' })
                .success
        ).toBe(false);
    });

    it('fails when phone is empty', () => {
        expect(
            createCustomerSchema.safeParse({ ...validBase, phone: '' }).success
        ).toBe(false);
    });

    it('allows empty alt_phone', () => {
        expect(
            createCustomerSchema.safeParse({ ...validBase, alt_phone: '' })
                .success
        ).toBe(true);
    });

    it('fails when alt_phone contains letters', () => {
        expect(
            createCustomerSchema.safeParse({ ...validBase, alt_phone: 'abc' })
                .success
        ).toBe(false);
    });
});

/* License expiry date */
describe('createCustomerSchema - license_expiry_date', () => {
    it('accepts a valid ISO date', () => {
        expect(
            createCustomerSchema.safeParse({
                ...validBase,
                license_expiry_date: '2030-06-15',
            }).success
        ).toBe(true);
    });

    it('fails with an invalid date string', () => {
        expect(
            createCustomerSchema.safeParse({
                ...validBase,
                license_expiry_date: 'not-a-date',
            }).success
        ).toBe(false);
    });

    it('fails when license_expiry_date is empty', () => {
        expect(
            createCustomerSchema.safeParse({
                ...validBase,
                license_expiry_date: '',
            }).success
        ).toBe(false);
    });
});

/* id_type enum */
describe('createCustomerSchema - id_type', () => {
    it('accepts ghana_card', () => {
        expect(
            createCustomerSchema.safeParse({
                ...validBase,
                id_type: 'ghana_card',
            }).success
        ).toBe(true);
    });

    it('accepts passport', () => {
        expect(
            createCustomerSchema.safeParse({
                ...validBase,
                id_type: 'passport',
            }).success
        ).toBe(true);
    });

    it('accepts voter_id', () => {
        expect(
            createCustomerSchema.safeParse({
                ...validBase,
                id_type: 'voter_id',
            }).success
        ).toBe(true);
    });

    it('fails with unknown id_type', () => {
        expect(
            createCustomerSchema.safeParse({
                ...validBase,
                id_type: 'drivers_license',
            }).success
        ).toBe(false);
    });
});

/* Blacklist superRefine */
describe('createCustomerSchema - blacklist superRefine', () => {
    it('fails when is_blacklisted=true but no reason provided', () => {
        const result = createCustomerSchema.safeParse({
            ...validBase,
            is_blacklisted: true,
            blacklist_reason: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            const paths = result.error.issues.map(e => e.path.join('.'));
            expect(paths).toContain('blacklist_reason');
        }
    });

    it('fails when is_blacklisted=true and reason is only whitespace', () => {
        const result = createCustomerSchema.safeParse({
            ...validBase,
            is_blacklisted: true,
            blacklist_reason: '   ',
        });
        expect(result.success).toBe(false);
    });

    it('passes when is_blacklisted=true with a valid reason', () => {
        expect(
            createCustomerSchema.safeParse({
                ...validBase,
                is_blacklisted: true,
                blacklist_reason: 'Fraudulent activity',
            }).success
        ).toBe(true);
    });

    it('passes when is_blacklisted=false with no reason', () => {
        expect(
            createCustomerSchema.safeParse({
                ...validBase,
                is_blacklisted: false,
            }).success
        ).toBe(true);
    });
});

/* Emergency contact superRefine */
describe('createCustomerSchema - emergency_contact superRefine', () => {
    it('passes when emergency_contact is completely empty', () => {
        expect(
            createCustomerSchema.safeParse({
                ...validBase,
                emergency_contact: { name: '', phone: '', relationship: '' },
            }).success
        ).toBe(true);
    });

    it('fails when only name is filled (phone + relationship required)', () => {
        const result = createCustomerSchema.safeParse({
            ...validBase,
            emergency_contact: {
                name: 'Jane Doe',
                phone: '',
                relationship: '',
            },
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            const paths = result.error.issues.map(e => e.path.join('.'));
            expect(paths).toContain('emergency_contact.phone');
            expect(paths).toContain('emergency_contact.relationship');
        }
    });

    it('fails when only phone is filled (name + relationship required)', () => {
        const result = createCustomerSchema.safeParse({
            ...validBase,
            emergency_contact: {
                name: '',
                phone: '+233201234567',
                relationship: '',
            },
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            const paths = result.error.issues.map(e => e.path.join('.'));
            expect(paths).toContain('emergency_contact.name');
            expect(paths).toContain('emergency_contact.relationship');
        }
    });

    it('passes when all three emergency contact fields are filled', () => {
        expect(
            createCustomerSchema.safeParse({
                ...validBase,
                emergency_contact: {
                    name: 'Jane Doe',
                    phone: '+233201234567',
                    relationship: 'Spouse',
                },
            }).success
        ).toBe(true);
    });

    it('passes when emergency_contact is omitted entirely', () => {
        expect(createCustomerSchema.safeParse(validBase).success).toBe(true);
    });
});
