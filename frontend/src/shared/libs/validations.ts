import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string(),
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters long')
        .optional(),
    password: z.string().min(1, 'Password is required'),
    remember: z.boolean().optional(),
});

export const registerSchema = z
    .object({
        name: z.string().min(3, 'Name must be at least 3 characters long'),
        email: z.string().email('Invalid email address'),
        password: z
            .string()
            .min(6, 'Password must be at least 6 characters long'),
        password_confirmation: z
            .string()
            .min(6, 'Confirm Password must be at least 6 characters long'),
    })
    .refine(data => data.password === data.password_confirmation, {
        message: 'Passwords do not match',
        path: ['password_confirmation'],
    });

export const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z
    .object({
        token: z.string().min(1, 'Reset token is required'),
        email: z.string().email('Please enter a valid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        password_confirmation: z
            .string()
            .min(8, 'Please confirm your password'),
    })
    .refine(data => data.password === data.password_confirmation, {
        message: 'Passwords do not match',
        path: ['password_confirmation'],
    });

const currentYear = new Date().getFullYear();

// ══════════════════════════════════════════════════════════════
// Vehicle Schema - Form fields are STRINGS (like LoginPage)
// Conversion to numbers happens in onSubmit (like buildPayload)
// ══════════════════════════════════════════════════════════════

export const createVehicleSchema = z
    .object({
        /* Required fields (all as strings from form inputs) */
        category_id: z.string().min(1, 'Category is required'),
        branch_id: z.string().optional().nullable(),
        name: z.string().min(1, 'Vehicle name is required'),
        make: z.string().min(1, 'Make is required'),
        model: z.string().min(1, 'Model is required'),

        year: z
            .string()
            .min(1, 'Year is required')
            .refine(val => !isNaN(Number(val)), 'Please enter a valid year')
            .refine(
                val => {
                    const num = Number(val);
                    return num >= 1900 && num <= currentYear + 1;
                },
                `Year must be between 1900 and ${currentYear + 1}`
            ),

        roadworthy_expiry_date: z.string().optional().or(z.literal('')),
        insurance_expiry_date: z.string().optional().or(z.literal('')),

        license_plate: z.string().min(1, 'License plate is required'),
        color: z.string().min(1, 'Color is required'),

        seats: z
            .string()
            .min(1, 'Number of seats is required')
            .refine(val => !isNaN(Number(val)), 'Please enter a valid number')
            .refine(val => Number(val) >= 1, 'At least 1 seat required'),

        daily_rate: z
            .string()
            .min(1, 'Daily rate is required')
            .refine(val => !isNaN(Number(val)), 'Please enter a valid amount')
            .refine(
                val => Number(val) > 0,
                'Daily rate must be greater than 0'
            ),

        /* Optional fields (strings, can be empty) */
        vin: z.string().optional(),
        fuel_type: z
            .enum(['petrol', 'diesel', 'electric', 'hybrid'])
            .optional(),
        engine_size: z.string().optional(),

        odometer: z
            .string()
            .refine(
                val => !val || val === '' || !isNaN(Number(val)),
                'Please enter a valid number'
            )
            .refine(
                val => !val || val === '' || Number(val) >= 0,
                'Odometer cannot be negative'
            )
            .optional(),

        has_insurance: z.boolean().optional(),
        has_roadworthy: z.boolean().optional(),

        transmission: z.enum(['automatic', 'manual']).optional(),
        features: z.array(z.string()).optional(),

        security_deposit: z
            .string()
            .refine(
                val => !val || val === '' || !isNaN(Number(val)),
                'Please enter a valid amount'
            )
            .refine(
                val => !val || val === '' || Number(val) >= 0,
                'Security deposit cannot be negative'
            )
            .optional(),

        young_driver_age_threshold: z
            .string()
            .refine(
                val => !val || val === '' || !isNaN(Number(val)),
                'Please enter a valid age'
            )
            .refine(
                val =>
                    !val ||
                    val === '' ||
                    (Number(val) >= 16 && Number(val) <= 35),
                'Age threshold must be between 16 and 35'
            )
            .optional(),

        young_driver_deposit: z
            .string()
            .refine(
                val => !val || val === '' || !isNaN(Number(val)),
                'Please enter a valid amount'
            )
            .refine(
                val => !val || val === '' || Number(val) >= 0,
                'Young driver deposit cannot be negative'
            )
            .optional(),

        description: z.string().optional(),
        price_visible: z.boolean().optional(),
        status: z.string().optional(),
        condition_notes: z.string().optional(),
        is_featured: z.boolean().optional(),
    })
    .superRefine((data, ctx) => {
        if (data.has_insurance && !data.insurance_expiry_date) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Insurance expiry date is required',
                path: ['insurance_expiry_date'],
            });
        }
        if (data.has_roadworthy && !data.roadworthy_expiry_date) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Roadworthy expiry date is required',
                path: ['roadworthy_expiry_date'],
            });
        }
    });

export type CreateVehicleFormData = z.infer<typeof createVehicleSchema>;

// ══════════════════════════════════════════════════════════════
// Rental Schema - Form fields are STRINGS for number inputs
// Conversion to proper types happens in onSubmit
// ══════════════════════════════════════════════════════════════

export const createRentalSchema = z
    .object({
        vehicle_id: z.string().min(1, 'Vehicle is required'),
        customer_id: z.string().min(1, 'Customer is required'),
        manager_id: z.string().optional(),
        status: z.enum([
            'pending',
            'confirmed',
            'active',
            'returned',
            'completed',
            'cancelled',
            'overdue',
        ]),
        pickup_date: z.string().min(1, 'Pickup date is required'),
        pickup_time: z.string().min(1, 'Pickup time is required'),
        return_date: z.string().min(1, 'Return date is required'),
        return_time: z.string().min(1, 'Return time is required'),
        pickup_location: z.string().optional(),
        dropoff_location: z.string().optional(),
        pickup_location_id: z.string().optional(),
        dropoff_location_id: z.string().optional(),
        is_airport_pickup: z.boolean().optional(),
        selected_option_ids: z.array(z.string()).optional(),
        coupon_code: z.string().optional(),
        deposit_amount: z
            .string()
            .refine(
                val => !val || val === '' || !isNaN(Number(val)),
                'Please enter a valid amount'
            )
            .refine(
                val => !val || val === '' || Number(val) >= 0,
                'Deposit cannot be negative'
            )
            .optional(),
        discount_amount: z
            .string()
            .refine(
                val => !val || val === '' || !isNaN(Number(val)),
                'Please enter a valid amount'
            )
            .refine(
                val => !val || val === '' || Number(val) >= 0,
                'Discount cannot be negative'
            )
            .optional(),
        payment_status: z.enum(['pending', 'partial', 'paid', 'refunded']),
        amount_paid: z
            .string()
            .refine(
                val => !val || val === '' || !isNaN(Number(val)),
                'Please enter a valid amount'
            )
            .refine(
                val => !val || val === '' || Number(val) >= 0,
                'Amount paid cannot be negative'
            )
            .optional(),
        customer_notes: z.string().optional(),
        admin_notes: z.string().optional(),
        source: z
            .enum(['website', 'phone', 'walk_in', 'referral', 'quote_request'])
            .optional(),
        skip_security_deposit: z.boolean().optional(),
        security_deposit_override: z
            .string()
            .refine(
                val => !val || val === '' || !isNaN(Number(val)),
                'Please enter a valid amount'
            )
            .refine(
                val => !val || val === '' || Number(val) >= 0,
                'Deposit cannot be negative'
            )
            .optional(),
    })
    .refine(
        data => {
            if (!data.pickup_date || !data.return_date) return true;
            return new Date(data.return_date) > new Date(data.pickup_date);
        },
        {
            message: 'Return date must be after the pickup date',
            path: ['return_date'],
        }
    );

export type CreateRentalFormData = z.infer<typeof createRentalSchema>;

// ══════════════════════════════════════════════════════════════
// AdditionalCharge Schema
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// Rental Location Schema
// ══════════════════════════════════════════════════════════════

export const createRentalLocationSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    address: z.string().optional(),
    pickup_charge: z
        .string()
        .refine(val => !val || !isNaN(Number(val)), 'Enter a valid amount')
        .refine(val => !val || Number(val) >= 0, 'Charge cannot be negative')
        .optional(),
    dropoff_charge: z
        .string()
        .refine(val => !val || !isNaN(Number(val)), 'Enter a valid amount')
        .refine(val => !val || Number(val) >= 0, 'Charge cannot be negative')
        .optional(),
    is_active: z.boolean().optional(),
    available_for_pickup: z.boolean().optional(),
    available_for_dropoff: z.boolean().optional(),
    is_default: z.boolean().optional(),
    is_airport_terminal: z.boolean().optional(),
    branch_id: z.string().uuid().nullable().optional(),
});

export type CreateRentalLocationFormData = z.infer<
    typeof createRentalLocationSchema
>;

// ══════════════════════════════════════════════════════════════
// AdditionalCharge Schema
// ══════════════════════════════════════════════════════════════

export const createAdditionalChargeSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    scope: z.enum(['global', 'vehicle', 'category', 'option']),
    charge_type: z.enum(['fixed', 'percentage']),
    amount: z
        .string()
        .min(1, 'Amount is required')
        .refine(val => !isNaN(Number(val)), 'Please enter a valid amount')
        .refine(val => Number(val) >= 0, 'Amount cannot be negative'),
    is_per_day: z.boolean().optional(),
    is_active: z.boolean().optional(),
    vehicle_id: z.string().optional(),
    category_id: z.string().optional(),
});

export type CreateAdditionalChargeFormData = z.infer<
    typeof createAdditionalChargeSchema
>;

// ══════════════════════════════════════════════════════════════
// DiscountCoupon Schema
// ══════════════════════════════════════════════════════════════

export const createCouponSchema = z.object({
    code: z
        .string()
        .optional()
        .refine(
            val => !val || /^[a-zA-Z0-9]+$/.test(val),
            'Code must be letters and numbers only (no spaces or symbols)'
        )
        .refine(
            val => !val || val.length <= 50,
            'Code must be 50 characters or fewer'
        ),
    name: z.string().min(1, 'Coupon name is required'),
    description: z.string().optional(),
    type: z.enum(['percentage', 'fixed']),
    value: z
        .string()
        .min(1, 'Value is required')
        .refine(val => !isNaN(Number(val)), 'Enter a valid number')
        .refine(val => Number(val) > 0, 'Value must be greater than 0'),
    valid_days: z
        .string()
        .optional()
        .refine(
            val => !val || (!isNaN(Number(val)) && Number(val) > 0),
            'Enter a positive number of days'
        ),
    max_uses: z
        .string()
        .optional()
        .refine(
            val => !val || (!isNaN(Number(val)) && Number(val) > 0),
            'Enter a positive integer'
        ),
    min_rental_days: z
        .string()
        .optional()
        .refine(
            val => !val || (!isNaN(Number(val)) && Number(val) > 0),
            'Enter a positive integer'
        ),
    min_rental_amount: z
        .string()
        .optional()
        .refine(
            val => !val || (!isNaN(Number(val)) && Number(val) >= 0),
            'Enter a valid amount'
        ),
    is_active: z.boolean().optional(),
});

export type CreateCouponFormData = z.infer<typeof createCouponSchema>;
// User Schemas
// ══════════════════════════════════════════════════════════════

export const createUserSchema = z
    .object({
        name: z.string().min(1, 'Name is required'),
        email: z
            .string()
            .min(1, 'Email is required')
            .email('Invalid email address'),
        username: z
            .string()
            .max(50, 'Username too long')
            .optional()
            .or(z.literal('')),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .optional()
            .or(z.literal('')),
        password_confirmation: z.string().optional().or(z.literal('')),
        roles: z.array(z.string()).optional(),
        permissions: z.array(z.string()).optional(),
        is_active: z.boolean().optional(),
    })
    .refine(
        data => {
            if (!data.password || data.password === '') return true;
            return data.password === data.password_confirmation;
        },
        { message: 'Passwords do not match', path: ['password_confirmation'] }
    );

export type CreateUserFormData = z.infer<typeof createUserSchema>;

export const editUserSchema = z
    .object({
        name: z.string().min(1, 'Name is required'),
        email: z
            .string()
            .min(1, 'Email is required')
            .email('Invalid email address'),
        username: z
            .string()
            .max(50, 'Username too long')
            .optional()
            .or(z.literal('')),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .optional()
            .or(z.literal('')),
        password_confirmation: z.string().optional().or(z.literal('')),
        roles: z.array(z.string()).optional(),
        permissions: z.array(z.string()).optional(),
        is_active: z.boolean().optional(),
    })
    .refine(
        data => {
            if (!data.password || data.password === '') return true;
            return data.password === data.password_confirmation;
        },
        { message: 'Passwords do not match', path: ['password_confirmation'] }
    );

export type EditUserFormData = z.infer<typeof editUserSchema>;
