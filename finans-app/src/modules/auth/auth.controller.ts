import { Request, Response } from "express";
import { asyncHandler } from "@utils/asyncHandler";
import { ApiResponse } from "@utils/ApiResponse";
import { authService } from "./auth.service";

export const authController = {
  kayitOl: asyncHandler(async (req: Request, res: Response) => {
    const sonuc = await authService.kayitOl(req.body);
    ApiResponse.created(res, sonuc, "Hesap başarıyla oluşturuldu");
  }),

  girisYap: asyncHandler(async (req: Request, res: Response) => {
    const sonuc = await authService.girisYap(req.body);
    ApiResponse.success(res, sonuc, "Giriş başarılı");
  }),

  tokenYenile: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const tokenler = await authService.tokenYenile(refreshToken);
    ApiResponse.success(res, tokenler, "Token yenilendi");
  }),

  googleIleGiris: asyncHandler(async (req: Request, res: Response) => {
    const sonuc = await authService.googleIleGiris(req.body);
    ApiResponse.success(res, sonuc, "Google ile giriş başarılı");
  }),
};