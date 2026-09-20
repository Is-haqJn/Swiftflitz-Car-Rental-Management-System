import { z } from 'zod';

export const PaymentInitiateResponseSchema = z.object({
    status: z.string(),
    message: z.string().optional(),
    data: z
        .object({
            reference: z.string(),
            authorization_url: z.string().nullable().optional(),
            meta: z.record(z.string(), z.unknown()).optional(),
        })
        .passthrough()
        .optional(),
});

export type PaymentInitiateResponse = z.infer<
    typeof PaymentInitiateResponseSchema
>;
