import { z } from 'zod';

export const LoginResponseSchema = z.object({
    status: z.string(),
    message: z.string().optional(),
    token: z.string().optional(),
    data: z
        .object({
            user: z
                .object({ id: z.string(), name: z.string(), email: z.string() })
                .passthrough(),
            expires_at: z.string().optional(),
        })
        .passthrough()
        .optional(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;
