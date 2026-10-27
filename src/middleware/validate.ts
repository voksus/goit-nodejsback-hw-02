import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

export const validateBody =
    (schema: z.ZodType) =>
    (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const flattened = z.flattenError(result.error);
            return res.status(400).json({
                error: "Validation failed",
                details:
                    Object.keys(flattened.fieldErrors).length > 0
                        ? flattened.fieldErrors
                        : flattened.formErrors,
            });
        }
        req.body = result.data;
        next();
    };

export const validateParams =
    (schema: z.ZodType) =>
    (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.params);
        if (!result.success) {
            return res.status(400).json({
                error: "Invalid parameters",
                details: z.flattenError(result.error).fieldErrors,
            });
        }
        next();
    };

export const validateQuery =
    (schema: z.ZodType) =>
    (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            return res.status(400).json({
                error: "Invalid query parameters",
                details: z.flattenError(result.error).fieldErrors,
            });
        }
        res.locals.query = result.data;
        next();
    };
