import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../../prisma/client.ts";
import type {
    LoginInput,
    RefreshTokenInput,
    RegisterInput,
} from "../validators/auth.validator.ts";

const generateTokens = (userId: number, username: string) => {
    const secret = process.env.JWT_SECRET!;
    const accessToken = jwt.sign({ sub: userId, username }, secret, {
        expiresIn: "15m",
    });
    const refreshToken = jwt.sign({ sub: userId, username }, secret, {
        expiresIn: "7d",
    });
    return { accessToken, refreshToken };
};

export const register = async (
    req: Request<{}, {}, RegisterInput>,
    res: Response,
) => {
    const { username, email, password, name } = req.body;

    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [{ username }, { email }],
        },
    });

    if (existingUser) {
        return res
            .status(409)
            .json({ error: "Username or email already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            username,
            email,
            password: hashedPassword,
            name,
        },
        select: {
            id: true,
            username: true,
            email: true,
            name: true,
        },
    });

    const { accessToken, refreshToken } = generateTokens(
        user.id,
        user.username,
    );

    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
        },
    });

    res.status(201).json({
        user,
        accessToken,
        refreshToken,
    });
};

export const login = async (
    req: Request<{}, {}, LoginInput>,
    res: Response,
) => {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
        where: { username },
    });

    if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = generateTokens(
        user.id,
        user.username,
    );

    await prisma.refreshToken.deleteMany({
        where: { userId: user.id },
    });

    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
        },
    });

    res.json({
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
        },
        accessToken,
        refreshToken,
    });
};

export const refresh = async (
    req: Request<{}, {}, RefreshTokenInput>,
    res: Response,
) => {
    const { refreshToken } = req.body;

    let payload: jwt.JwtPayload;
    try {
        payload = jwt.verify(
            refreshToken,
            process.env.JWT_SECRET!,
        ) as jwt.JwtPayload;
    } catch (_error) {
        return res.status(401).json({ error: "Invalid refresh token" });
    }

    const dbToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
    });

    if (!dbToken) {
        return res.status(401).json({ error: "Invalid refresh token" });
    }

    await prisma.refreshToken.delete({
        where: { token: refreshToken },
    });

    const tokens = generateTokens(Number(payload.sub), payload.username);

    await prisma.refreshToken.create({
        data: {
            token: tokens.refreshToken,
            userId: Number(payload.sub),
        },
    });

    res.json(tokens);
};

export const logout = async (req: Request, res: Response) => {
    const userId = Number(req.user?.sub);

    if (userId) {
        await prisma.refreshToken.deleteMany({
            where: { userId },
        });
    }

    res.status(204).end();
};

export const me = async (req: Request, res: Response) => {
    const userId = Number(req.user?.sub);

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            email: true,
            name: true,
            createdAt: true,
        },
    });

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
};
