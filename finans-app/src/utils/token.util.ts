import jwt from 'jsonwebtoken';
import { config } from "@config/app.config";
import { ApiError } from './ApiError';

interface TokenPayload {
    kullaniciId: string;
    email: string;
    kullaniciTipi: string;
}

interface TokenCifti {
    accessToken: string;
    refreshToken: string;
}

export const tokenUtil = {
    tokenCiftiOlustur(payload: TokenPayload): TokenCifti {
        const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
            expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions["expiresIn"]
        })

        const refreshToken = jwt.sign(
            { kullaniciId: payload.kullaniciId },
            config.jwt.refreshSecret,
            {
                expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions["expiresIn"]
            }
        )

        return { accessToken, refreshToken };

    },

    accessTokenDogrula(token: string): TokenPayload {
        try {
            return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
        } catch (err) {
            if (err instanceof jwt.TokenExpiredError) {
                throw ApiError.unauthorized("Oturum süresi doldu, lütfen tekrar giriş yapın");
            }
            throw ApiError.unauthorized("Geçersiz token");
        }
    },


    refreshTokenDogrula(token: string): { kullaniciId: string } {
        try {
            return jwt.verify(token, config.jwt.refreshSecret) as {
                kullaniciId: string;
            };
        }
        catch {
            throw ApiError.unauthorized('Geçersiz Refresh token')
        }
    }
}
