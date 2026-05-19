import { Request, Response } from "express";
import { asyncHandler } from "@utils/asyncHandler";
import { ApiResponse } from "@utils/ApiResponse";
import { hedefService } from "./hedef.service";

export const hedefController = {
  olustur: asyncHandler(async (req: Request, res: Response) => {
    const veri = await hedefService.hedefOlustur(
      req.kullanici!.id,
      req.body
    );
    ApiResponse.created(res, veri, "Hedef oluşturuldu");
  }),

  listele: asyncHandler(async (req: Request, res: Response) => {
    const veri = await hedefService.hedefleriGetir(req.kullanici!.id);
    ApiResponse.success(res, veri, "Hedefler getirildi");
  }),

  getir: asyncHandler(async (req: Request, res: Response) => {
    const veri = await hedefService.hedefGetir(
      req.kullanici!.id,
      req.params.id
    );
    ApiResponse.success(res, veri);
  }),

  guncelle: asyncHandler(async (req: Request, res: Response) => {
    const veri = await hedefService.hedefGuncelle(
      req.kullanici!.id,
      req.params.id,
      req.body
    );
    ApiResponse.success(res, veri, "Hedef güncellendi");
  }),

  katki: asyncHandler(async (req: Request, res: Response) => {
    const veri = await hedefService.katki(
      req.kullanici!.id,
      req.params.id,
      req.body
    );
    ApiResponse.success(
      res,
      veri,
      veri.tamamlandi ? "🎉 Hedef tamamlandı!" : "Katkı eklendi"
    );
  }),

  sil: asyncHandler(async (req: Request, res: Response) => {
    const veri = await hedefService.hedefSil(
      req.kullanici!.id,
      req.params.id
    );
    ApiResponse.success(res, veri);
  }),

  gecmis: asyncHandler(async (req: Request, res: Response) => {
    const veri = await hedefService.hedefGecmisiniGetir(
      req.kullanici!.id,
      req.params.id
    );
    ApiResponse.success(res, veri, "Hedef geçmişi getirildi");
  }),

  istatistikler: asyncHandler(async (req: Request, res: Response) => {
    const veri = await hedefService.istatistikler(req.kullanici!.id);
    ApiResponse.success(res, veri, "İstatistikler getirildi");
  }),

  arkadasHedefiniGetir: asyncHandler(async (req: Request, res: Response) => {
    const veri = await hedefService.arkadasHedefleriniGetir(
      req.kullanici!.id,
      req.params.arkadasId
    );
    ApiResponse.success(res, veri, "Arkadaş hedefleri getirildi");
  }),
};