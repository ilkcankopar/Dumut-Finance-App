import { Request, Response } from "express";
import { asyncHandler } from "@utils/asyncHandler";
import { ApiResponse } from "@utils/ApiResponse";
import { rozetService } from "./rozet.service";

export const rozetController = {
  tumRozetleriGetir: asyncHandler(async (req: Request, res: Response) => {
    const rozetler = await rozetService.tumRozetleriGetir();
    ApiResponse.success(res, rozetler, "Rozetler getirildi");
  }),

  kullaniciRozetleriGetir: asyncHandler(async (req: Request, res: Response) => {
    const rozetler = await rozetService.kullaniciRozetleriGetir(req.user!.id);
    ApiResponse.success(res, rozetler, "Kullanıcı rozetleri getirildi");
  }),

  rozetKontrolEt: asyncHandler(async (req: Request, res: Response) => {
    const sonuc = await rozetService.rozetKontrolEt(req.user!.id);
    ApiResponse.success(res, sonuc, "Rozet kontrolü yapıldı");
  }),
};
