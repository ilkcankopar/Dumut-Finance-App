import { Request, Response, NextFunction } from "express";
import { ApiError } from "@utils/ApiError";
import { logger } from "@config/logger.config";



export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    if (err instanceof ApiError) {
        logger.warn(`[${req.method}] ${req.path} → ${err.statusCode}: ${err.message}`);

        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors ?? null,
        });
    }

    logger.error("Beklenmedik hata:", {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    return res.status(500).json({
        success: false,
        message:
            process.env.NODE_ENV === "production"
                ? "Sunucu hatası oluştu"
                : err.message,
        errors: null,
    });
};