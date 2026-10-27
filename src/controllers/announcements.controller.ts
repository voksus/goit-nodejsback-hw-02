import type { Request, Response } from "express";
import prisma from "../../prisma/client.ts";
import type {
    CreateAnnouncementInput,
    GetAnnouncementsQuery,
    UpdateAnnouncementInput,
} from "../validators/announcements.validator.ts";

export const getAnnouncements = async (_req: Request, res: Response) => {
    const query = (res.locals.query || {}) as GetAnnouncementsQuery;
    const page = query.page || 1;
    const perPage = 10;
    const skip = (page - 1) * perPage;

    const where: any = {};
    if (query.search) {
        where.title = {
            contains: query.search,
            mode: "insensitive",
        };
    }

    const orderBy =
        query.sort === "oldest"
            ? { createdAt: "asc" as const }
            : { createdAt: "desc" as const };

    const [data, total] = await Promise.all([
        prisma.announcement.findMany({
            where,
            orderBy,
            skip,
            take: perPage,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        name: true,
                    },
                },
            },
        }),
        prisma.announcement.count({ where }),
    ]);

    res.json({
        data,
        pagination: {
            total,
            page,
            totalPages: Math.ceil(total / perPage) || 1,
            perPage,
        },
    });
};

export const getAnnouncementById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const announcement = await prisma.announcement.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    name: true,
                },
            },
        },
    });

    if (!announcement) {
        return res.status(404).json({ error: "Announcement not found" });
    }

    res.json(announcement);
};

export const createAnnouncement = async (
    req: Request<{}, {}, CreateAnnouncementInput>,
    res: Response,
) => {
    const userId = Number(req.user?.sub);

    const announcement = await prisma.announcement.create({
        data: {
            ...req.body,
            userId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    name: true,
                },
            },
        },
    });

    res.status(201).json(announcement);
};

export const updateAnnouncement = async (
    req: Request<{ id: string }, {}, UpdateAnnouncementInput>,
    res: Response,
) => {
    const id = Number(req.params.id);
    const userId = Number(req.user?.sub);

    const existing = await prisma.announcement.findUnique({
        where: { id },
    });

    if (!existing) {
        return res.status(404).json({ error: "Announcement not found" });
    }

    if (existing.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
    }

    const updated = await prisma.announcement.update({
        where: { id },
        data: req.body,
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    name: true,
                },
            },
        },
    });

    res.json(updated);
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const userId = Number(req.user?.sub);

    const existing = await prisma.announcement.findUnique({
        where: { id },
    });

    if (!existing) {
        return res.status(404).json({ error: "Announcement not found" });
    }

    if (existing.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
    }

    await prisma.announcement.delete({
        where: { id },
    });

    res.status(204).end();
};
