import { Request, Response, NextFunction } from "express";
import { tokenUtil } from "@utils/token.util";
import { prisma } from "../prisma/client";
import { ApiError } from "@utils/ApiError";
import { asyncHandler } from "@utils/asyncHandler";

interface KullaniciBilgi {
    id: string;
    email: string;
    kullaniciTipi: string;
}

declare global {
    namespace Express {
        interface Request {
            kullanici?: KullaniciBilgi;
            user?: KullaniciBilgi;
        }
    }
}

export const authenticate = asyncHandler(
    async (req: Request, _res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            throw ApiError.unauthorized("Token bulunamadı");
        }

        const token = authHeader.split(" ")[1];
        const payload = tokenUtil.accessTokenDogrula(token);

        const kullanici = await prisma.kullanici.findUnique({
            where: { id: payload.kullaniciId },
            select: { id: true, email: true, kullaniciTipi: true },
        });

        if (!kullanici) {
            throw ApiError.unauthorized("Kullanıcı bulunamadı");
        }

        req.kullanici = kullanici;
        req.user = kullanici;
        next();
    }
);

export const auth = authenticate;
export const authMiddleware = authenticate;