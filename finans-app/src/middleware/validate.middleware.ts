import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ApiError } from "@utils/ApiError";



export const validate = (schema: ZodSchema) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const result = schema.safeParse({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        if (!result.success) {
            const hatalar = result.error.flatten();

            // Zod hatalarını bizim standart formatımıza çeviriyoruz
            const formatlanmisHatalar: Record<string, string[]> = {};

            Object.entries(hatalar.fieldErrors).forEach(([alan, mesajlar]) => {
                const temizAlan = alan.replace(/^(body|query|params)\./, "");
                formatlanmisHatalar[temizAlan] = mesajlar as string[];
            });

            throw ApiError.badRequest("Validasyon hatası", formatlanmisHatalar);
        }


        req.body = result.data.body;
        req.query = result.data.query ?? req.query;

        next();
    };
};