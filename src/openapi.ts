import {
    extendZodWithOpenApi,
    OpenApiGeneratorV3,
    OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
    AnnouncementParamsSchema,
    CreateAnnouncementSchema,
    GetAnnouncementsQuerySchema,
    UpdateAnnouncementSchema,
} from "./validators/announcements.validator.ts";
import {
    LoginSchema,
    RefreshTokenSchema,
    RegisterSchema,
} from "./validators/auth.validator.ts";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
});

// --- Auth Routes ---
registry.registerPath({
    method: "post",
    path: "/auth/register",
    description: "Register a new user",
    request: {
        body: {
            content: { "application/json": { schema: RegisterSchema } },
        },
    },
    responses: {
        201: { description: "User registered successfully" },
        400: { description: "Validation error" },
        409: { description: "Username or email already taken" },
    },
});

registry.registerPath({
    method: "post",
    path: "/auth/login",
    description: "User login",
    request: {
        body: {
            content: { "application/json": { schema: LoginSchema } },
        },
    },
    responses: {
        200: { description: "Login successful" },
        401: { description: "Invalid credentials" },
    },
});

registry.registerPath({
    method: "post",
    path: "/auth/refresh",
    description: "Refresh token pair",
    request: {
        body: {
            content: { "application/json": { schema: RefreshTokenSchema } },
        },
    },
    responses: {
        200: { description: "New token pair generated" },
        401: { description: "Invalid refresh token" },
    },
});

registry.registerPath({
    method: "post",
    path: "/auth/logout",
    description: "User logout",
    security: [{ bearerAuth: [] }],
    responses: {
        204: { description: "Logout successful" },
        401: { description: "Unauthorized access" },
    },
});

registry.registerPath({
    method: "get",
    path: "/auth/me",
    description: "Get current user profile",
    security: [{ bearerAuth: [] }],
    responses: {
        200: { description: "User profile data" },
        401: { description: "Unauthorized access" },
    },
});

// --- Announcements Routes ---
registry.registerPath({
    method: "get",
    path: "/announcements",
    description: "Get announcements list with pagination, search, and sorting",
    request: {
        query: GetAnnouncementsQuerySchema,
    },
    responses: {
        200: { description: "List of announcements with pagination" },
    },
});

registry.registerPath({
    method: "get",
    path: "/announcements/{id}",
    description: "Get announcement by ID",
    request: {
        params: AnnouncementParamsSchema,
    },
    responses: {
        200: { description: "Announcement details" },
        404: { description: "Announcement not found" },
    },
});

registry.registerPath({
    method: "post",
    path: "/announcements",
    description: "Create a new announcement",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                "application/json": { schema: CreateAnnouncementSchema },
            },
        },
    },
    responses: {
        201: { description: "Announcement created successfully" },
        401: { description: "Unauthorized access" },
    },
});

registry.registerPath({
    method: "patch",
    path: "/announcements/{id}",
    description: "Update own announcement",
    security: [{ bearerAuth: [] }],
    request: {
        params: AnnouncementParamsSchema,
        body: {
            content: {
                "application/json": { schema: UpdateAnnouncementSchema },
            },
        },
    },
    responses: {
        200: { description: "Announcement updated successfully" },
        401: { description: "Unauthorized access" },
        403: { description: "Access denied" },
        404: { description: "Announcement not found" },
    },
});

registry.registerPath({
    method: "delete",
    path: "/announcements/{id}",
    description: "Delete own announcement",
    security: [{ bearerAuth: [] }],
    request: {
        params: AnnouncementParamsSchema,
    },
    responses: {
        204: { description: "Announcement deleted successfully" },
        401: { description: "Unauthorized access" },
        403: { description: "Access denied" },
        404: { description: "Announcement not found" },
    },
});

export function generateOpenApiDocument() {
    const generator = new OpenApiGeneratorV3(registry.definitions);

    return generator.generateDocument({
        openapi: "3.0.0",
        info: {
            title: "Announcements Board REST API",
            version: "1.0.0",
            description:
                "REST API for announcements board with JWT authentication and ownership control",
        },
        servers: [{ url: "http://localhost:3000" }],
    });
}
