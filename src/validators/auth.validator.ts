import { z } from "zod";

export const RegisterSchema = z.object({
    username: z.string().trim().min(3).max(30),
    email: z.email(),
    password: z.string().min(6),
    name: z.string().trim().min(2),
});

export const LoginSchema = z.object({
    username: z.string().trim().min(1),
    password: z.string().min(1),
});

export const RefreshTokenSchema = z.object({
    refreshToken: z.string().min(1),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
