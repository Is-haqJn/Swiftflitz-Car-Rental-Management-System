import { describe, it, expect } from 'vitest';
import {
    loginSchema,
    registerSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    createVehicleSchema,
    createRentalSchema,
    createCouponSchema,
    createUserSchema,
    editUserSchema,
} from '../validations';

/* loginSchema */
describe('loginSchema', () => {
    it('passes with email and password', () => {
        const result = loginSchema.safeParse({
            email: 'user@example.com',
            password: 'secret',
        });
        expect(result.success).toBe(true);
    });

    it('fails when password is empty', () => {
        const result = loginSchema.safeParse({
            email: 'user@example.com',
            password: '',
        });
        expect(result.success).toBe(false);
    });

    it('passes with optional username', () => {
        const result = loginSchema.safeParse({
            email: 'user@example.com',
            password: 'secret',
            username: 'johndoe',
        });
        expect(result.success).toBe(true);
    });

    it('fails when username is shorter than 3 chars', () => {
        const result = loginSchema.safeParse({
            email: 'user@example.com',
            password: 'secret',
            username: 'ab',
        });
        expect(result.success).toBe(false);
    });
});

/* registerSchema */
describe('registerSchema', () => {
    const valid = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        password_confirmation: 'password123',
    };

    it('passes with valid data', () => {
        expect(registerSchema.safeParse(valid).success).toBe(true);
    });

    it('fails when name is too short', () => {
        const result = registerSchema.safeParse({ ...valid, name: 'Jo' });
        expect(result.success).toBe(false);
    });

    it('fails when email is invalid', () => {
        const result = registerSchema.safeParse({
            ...valid,
            email: 'not-an-email',
        });
        expect(result.success).toBe(false);
    });

    it('fails when passwords do not match', () => {
        const result = registerSchema.safeParse({
            ...valid,
            password_confirmation: 'different',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            const paths = result.error.issues.map(e => e.path.join('.'));
            expect(paths).toContain('password_confirmation');
        }
    });

    it('fails when password is too short', () => {
        const result = registerSchema.safeParse({
            ...valid,
            password: 'abc',
            password_confirmation: 'abc',
        });
        expect(result.success).toBe(false);
    });
});

/* forgotPasswordSchema */
describe('forgotPasswordSchema', () => {
    it('passes with valid email', () => {
        expect(
            forgotPasswordSchema.safeParse({ email: 'a@b.com' }).success
        ).toBe(true);
    });

    it('fails with invalid email', () => {
        expect(
            forgotPasswordSchema.safeParse({ email: 'not-email' }).success
        ).toBe(false);
    });
});

/* resetPasswordSchema */
describe('resetPasswordSchema', () => {
    const valid = {
        token: 'abc123',
        email: 'user@example.com',
        password: 'newpassword',
        password_confirmation: 'newpassword',
    };

    it('passes with valid data', () => {
        expect(resetPasswordSchema.safeParse(valid).success).toBe(true);
    });

    it('fails when token is empty', () => {
        expect(
            resetPasswordSchema.safeParse({ ...valid, token: '' }).success
        ).toBe(false);
    });

    it('fails when passwords do not match', () => {
        const result = resetPasswordSchema.safeParse({
            ...valid,
            password_confirmation: 'wrong',
        });
        expect(result.success).toBe(false);
    });

    it('fails when password is shorter than 8 chars', () => {
        expect(
            resetPasswordSchema.safeParse({
                ...valid,
                password: 'short',
                password_confirmation: 'short',
            }).success
        ).toBe(false);
    });
});

/* createVehicleSchema */
describe('createVehicleSchema', () => {
    const currentYear = new Date().getFullYear();
    const valid = {
        category_id: '1',
        name: 'Toyota Corolla',
        make: 'Toyota',
        model: 'Corolla',
        year: String(currentYear),
        roadworthy_expiry_date: '2026-01-01',
        insurance_expiry_date: '2026-01-01',
        license_plate: 'GR-1234-21',
        color: 'White',
        seats: '5',
        daily_rate: '100',
    };

    it('passes with all required fields', () => {
        expect(createVehicleSchema.safeParse(valid).success).toBe(true);
    });

    it('fails when year is before 1900', () => {
        const result = createVehicleSchema.safeParse({
            ...valid,
            year: '1800',
        });
        expect(result.success).toBe(false);
    });

    it('fails when year is after current year + 1', () => {
        const result = createVehicleSchema.safeParse({
            ...valid,
            year: String(currentYear + 2),
        });
        expect(result.success).toBe(false);
    });

    it('fails when year is not a number', () => {
        const result = createVehicleSchema.safeParse({
            ...valid,
            year: 'abcd',
        });
        expect(result.success).toBe(false);
    });

    it('fails when seats is 0', () => {
        const result = createVehicleSchema.safeParse({ ...valid, seats: '0' });
        expect(result.success).toBe(false);
    });

    it('fails when daily_rate is 0', () => {
        const result = createVehicleSchema.safeParse({
            ...valid,
            daily_rate: '0',
        });
        expect(result.success).toBe(false);
    });

    it('fails when daily_rate is negative', () => {
        const result = createVehicleSchema.safeParse({
            ...valid,
            daily_rate: '-50',
        });
        expect(result.success).toBe(false);
    });

    it('allows odometer to be empty', () => {
        expect(
            createVehicleSchema.safeParse({ ...valid, odometer: '' }).success
        ).toBe(true);
    });

    it('fails when odometer is negative', () => {
        const result = createVehicleSchema.safeParse({
            ...valid,
            odometer: '-1',
        });
        expect(result.success).toBe(false);
    });
});

/* createRentalSchema */
describe('createRentalSchema', () => {
    const valid = {
        vehicle_id: '1',
        customer_id: '2',
        status: 'pending' as const,
        pickup_date: '2026-04-01',
        pickup_time: '10:00',
        return_date: '2026-04-05',
        return_time: '10:00',
        payment_status: 'pending' as const,
    };

    it('passes with all required fields', () => {
        expect(createRentalSchema.safeParse(valid).success).toBe(true);
    });

    it('fails when vehicle_id is missing', () => {
        const { vehicle_id: _, ...rest } = valid;
        expect(createRentalSchema.safeParse(rest).success).toBe(false);
    });

    it('fails when return_date is before pickup_date', () => {
        const result = createRentalSchema.safeParse({
            ...valid,
            return_date: '2026-03-31',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            const paths = result.error.issues.map(e => e.path.join('.'));
            expect(paths).toContain('return_date');
        }
    });

    it('fails when return_date equals pickup_date', () => {
        const result = createRentalSchema.safeParse({
            ...valid,
            return_date: '2026-04-01',
        });
        expect(result.success).toBe(false);
    });

    it('fails when deposit_amount is negative', () => {
        const result = createRentalSchema.safeParse({
            ...valid,
            deposit_amount: '-50',
        });
        expect(result.success).toBe(false);
    });

    it('allows empty optional fields', () => {
        expect(
            createRentalSchema.safeParse({
                ...valid,
                deposit_amount: '',
                discount_amount: '',
                amount_paid: '',
            }).success
        ).toBe(true);
    });
});

/* createCouponSchema */
describe('createCouponSchema', () => {
    const valid = {
        name: 'Summer Sale',
        type: 'percentage' as const,
        value: '10',
    };

    it('passes with required fields only', () => {
        expect(createCouponSchema.safeParse(valid).success).toBe(true);
    });

    it('fails when name is empty', () => {
        expect(
            createCouponSchema.safeParse({ ...valid, name: '' }).success
        ).toBe(false);
    });

    it('fails when value is 0', () => {
        expect(
            createCouponSchema.safeParse({ ...valid, value: '0' }).success
        ).toBe(false);
    });

    it('fails when code contains special characters', () => {
        const result = createCouponSchema.safeParse({
            ...valid,
            code: 'SALE-10%',
        });
        expect(result.success).toBe(false);
    });

    it('passes when code is alphanumeric', () => {
        expect(
            createCouponSchema.safeParse({ ...valid, code: 'SUMMER10' }).success
        ).toBe(true);
    });

    it('fails when code exceeds 50 chars', () => {
        const result = createCouponSchema.safeParse({
            ...valid,
            code: 'A'.repeat(51),
        });
        expect(result.success).toBe(false);
    });

    it('fails when valid_days is 0', () => {
        const result = createCouponSchema.safeParse({
            ...valid,
            valid_days: '0',
        });
        expect(result.success).toBe(false);
    });
});

/* createUserSchema */
describe('createUserSchema', () => {
    const valid = {
        name: 'Jane Doe',
        email: 'jane@example.com',
    };

    it('passes with required fields only', () => {
        expect(createUserSchema.safeParse(valid).success).toBe(true);
    });

    it('fails when email is invalid', () => {
        expect(
            createUserSchema.safeParse({ ...valid, email: 'bad' }).success
        ).toBe(false);
    });

    it('fails when name is empty', () => {
        expect(createUserSchema.safeParse({ ...valid, name: '' }).success).toBe(
            false
        );
    });

    it('fails when password is set and passwords do not match', () => {
        const result = createUserSchema.safeParse({
            ...valid,
            password: 'password123',
            password_confirmation: 'different',
        });
        expect(result.success).toBe(false);
    });

    it('passes when password is empty (not required)', () => {
        expect(
            createUserSchema.safeParse({
                ...valid,
                password: '',
                password_confirmation: '',
            }).success
        ).toBe(true);
    });

    it('passes when passwords match', () => {
        expect(
            createUserSchema.safeParse({
                ...valid,
                password: 'newpassword',
                password_confirmation: 'newpassword',
            }).success
        ).toBe(true);
    });

    it('fails when username exceeds 50 chars', () => {
        const result = createUserSchema.safeParse({
            ...valid,
            username: 'u'.repeat(51),
        });
        expect(result.success).toBe(false);
    });
});

/* editUserSchema */
describe('editUserSchema', () => {
    // editUserSchema has the same shape and refine as createUserSchema
    const valid = {
        name: 'Jane Doe',
        email: 'jane@example.com',
    };

    it('passes with required fields only', () => {
        expect(editUserSchema.safeParse(valid).success).toBe(true);
    });

    it('fails when passwords do not match', () => {
        const result = editUserSchema.safeParse({
            ...valid,
            password: 'newpass1',
            password_confirmation: 'different',
        });
        expect(result.success).toBe(false);
    });

    it('passes with empty password (no change)', () => {
        expect(
            editUserSchema.safeParse({
                ...valid,
                password: '',
                password_confirmation: '',
            }).success
        ).toBe(true);
    });
});
