import { Request, Response } from "express";
import { asyncHandler } from "@utils/asyncHandler";
import { ApiResponse } from "@utils/ApiResponse";
import { kategoriService } from "./kategori.service";

export const kategoriController = {
  tumunuGetir: asyncHandler(async (req: Request, res: Response) => {
    const veri = await kategoriService.tumKategorileriGetir(req.kullanici!.id);
    ApiResponse.success(res, veri, "Kategoriler getirildi");
  }),

  olustur: asyncHandler(async (req: Request, res: Response) => {
    const veri = await kategoriService.kategoriOlustur(
      req.kullanici!.id,
      req.body
    );
    ApiResponse.created(res, veri, "Kategori oluşturuldu");
  }),

  guncelle: asyncHandler(async (req: Request, res: Response) => {
    const veri = await kategoriService.kategoriGuncelle(
      req.kullanici!.id,
      req.params.id,
      req.body
    );
    ApiResponse.success(res, veri, "Kategori güncellendi");
  }),

  sil: asyncHandler(async (req: Request, res: Response) => {
    const veri = await kategoriService.kategoriSil(
      req.kullanici!.id,
      req.params.id
    );
    ApiResponse.success(res, veri);
  }),
};