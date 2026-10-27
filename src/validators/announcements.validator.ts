import { z } from "zod";

export const CreateAnnouncementSchema = z.object({
    title: z.string().trim().min(5).max(50),
    description: z.string().trim().min(10),
    price: z.number().positive(),
    category: z.enum(["sale", "service", "job", "other"]),
});

export const UpdateAnnouncementSchema =
    CreateAnnouncementSchema.partial().refine(
        (data) => Object.keys(data).length > 0,
        {
            message: "At least one field must be provided for update",
        },
    );

export const AnnouncementParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export const GetAnnouncementsQuerySchema = z.object({
    search: z.string().trim().optional(),
    sort: z.enum(["newest", "oldest"]).default("newest"),
    page: z.coerce.number().int().positive().default(1),
});

export type CreateAnnouncementInput = z.infer<typeof CreateAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof UpdateAnnouncementSchema>;
export type GetAnnouncementsQuery = z.infer<typeof GetAnnouncementsQuerySchema>;
