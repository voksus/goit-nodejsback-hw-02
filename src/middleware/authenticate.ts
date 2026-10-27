import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

declare global {
    namespace Express {
        interface Request {
            user?: jwt.JwtPayload;
        }
    }
}

const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.replace(/^Bearer\s+/, "");

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        req.user = decoded as jwt.JwtPayload;
        next();
    } catch (_error) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

export default authenticate;
