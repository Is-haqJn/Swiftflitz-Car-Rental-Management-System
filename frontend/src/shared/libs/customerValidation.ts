// customerValidation.ts
import { z } from 'zod';

// Main Customer Schema
export const createCustomerSchema = z
    .object({
        /* Required fields */
        name: z.string().min(1, 'Name is required'),

        email: z
            .string()
            .min(1, 'Email is required')
            .email('Please enter a valid email address'),

        phone: z
            .string()
            .min(1, 'Phone number is required')
            .regex(/^\+?[0-9\s\-()]+$/, 'Please enter a valid phone number'),

        address: z.string().min(1, 'Address is required'),

        license_number: z.string().min(1, 'License number is required'),

        license_expiry_date: z
            .string()
            .min(1, 'License expiry date is required')
            .refine(
                val => !isNaN(Date.parse(val)),
                'Please enter a valid date'
            ),

        id_type: z.enum(['ghana_card', 'passport', 'voter_id'], {
            error: () => ({ message: 'Please select an ID type' }),
        }),

        id_number: z.string().min(1, 'ID number is required'),

        /* Optional fields */
        alt_phone: z
            .string()
            .regex(/^\+?[0-9\s\-()]*$/, 'Please enter a valid phone number')
            .optional()
            .or(z.literal('')),

        date_of_birth: z
            .string()
            .refine(
                val => !val || val === '' || !isNaN(Date.parse(val)),
                'Please enter a valid date'
            )
            .optional(),

        // All three sub-fields are optional strings; cross-field validation
        // is handled in superRefine below (if any one is filled, all are required)
        emergency_contact: z
            .object({
                name: z.string().optional().or(z.literal('')),
                phone: z.string().optional().or(z.literal('')),
                relationship: z.string().optional().or(z.literal('')),
            })
            .optional(),

        notes: z.string().optional(),

        is_blacklisted: z.boolean().optional(),

        blacklist_reason: z.string().optional(),
    })
    .superRefine((data, ctx) => {
        // Blacklist reason required when blacklisted
        if (data.is_blacklisted && !data.blacklist_reason?.trim()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Please provide a reason for blacklisting',
                path: ['blacklist_reason'],
            });
        }

        // Emergency contact: if any field is filled, all three are required
        const ec = data.emergency_contact;
        if (ec) {
            const anyFilled =
                ec.name?.trim() || ec.phone?.trim() || ec.relationship?.trim();
            if (anyFilled) {
                if (!ec.name?.trim())
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Contact name is required',
                        path: ['emergency_contact', 'name'],
                    });
                if (!ec.phone?.trim())
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Contact phone is required',
                        path: ['emergency_contact', 'phone'],
                    });
                if (!ec.relationship?.trim())
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Relationship is required',
                        path: ['emergency_contact', 'relationship'],
                    });
            }
        }
    });

export type CreateCustomerFormData = z.infer<typeof createCustomerSchema>;
