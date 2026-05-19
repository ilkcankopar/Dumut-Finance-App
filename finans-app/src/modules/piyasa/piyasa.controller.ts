import { Request, Response } from "express";
import { asyncHandler } from "@utils/asyncHandler";
import { ApiResponse } from "@utils/ApiResponse";
import { piyasaService } from "./piyasa.service";
import { ApiError } from "@utils/ApiError";

export const piyasaController = {
  bist100: asyncHandler(async (_req: Request, res: Response) => {
    const veri = await piyasaService.bist100Getir();
    ApiResponse.success(res, veri, "BİST 100 getirildi");
  }),

  hisseGetir: asyncHandler(async (req: Request, res: Response) => {
    const { sembol } = req.params;
    const borsa = (req.query.borsa as string ?? "BIST").toUpperCase() as
      | "BIST"
      | "NYSE"
      | "NASDAQ";

    const veri = await piyasaService.hisseGetir(sembol.toUpperCase(), borsa);
    ApiResponse.success(res, veri);
  }),

  kriptoListesi: asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string ?? "50");
    const veri = await piyasaService.kriptoListesiGetir(limit);
    ApiResponse.success(res, veri, "Kripto listesi getirildi");
  }),

  dovizKurlari: asyncHandler(async (_req: Request, res: Response) => {
    const veri = await piyasaService.dovizKurlariGetir();
    ApiResponse.success(res, veri, "Döviz kurları getirildi");
  }),

  takipListesi: asyncHandler(async (req: Request, res: Response) => {
    const veri = await piyasaService.takipListesiGetir(req.kullanici!.id);
    ApiResponse.success(res, veri, "Takip listesi getirildi");
  }),

  takibeEkle: asyncHandler(async (req: Request, res: Response) => {
    const { tip, id, hedefFiyat } = req.body;
    const veri = await piyasaService.takibeEkle(
      req.kullanici!.id,
      tip,
      id,
      hedefFiyat
    );
    ApiResponse.created(res, veri, "Takibe eklendi");
  }),

  takiptenCikar: asyncHandler(async (req: Request, res: Response) => {
    const { tip, id } = req.params;
    if (tip !== "HISSE" && tip !== "KRIPTO") {
      throw ApiError.badRequest("Geçersiz tip");
    }
    const veri = await piyasaService.takiptenCikar(
      req.kullanici!.id,
      tip,
      id
    );
    ApiResponse.success(res, veri);
  }),

  yatirimOnerisi: asyncHandler(async (req: Request, res: Response) => {
    const veri = await piyasaService.yatirimOnerisiGetir(req.kullanici!.id);
    ApiResponse.success(res, veri, "Yatırım önerileri getirildi");
  }),

  altinFiyatlari: asyncHandler(async (_req: Request, res: Response) => {
    const veri = await piyasaService.altinGumusGetir();
    ApiResponse.success(res, veri, "Altın fiyatları getirildi");
  }),

  gumusFiyatlari: asyncHandler(async (_req: Request, res: Response) => {
    const veri = await piyasaService.gumusFiyatlariGetir();
    ApiResponse.success(res, veri, "Gümüş fiyatları getirildi");
  }),

  piyasaOzeti: asyncHandler(async (_req: Request, res: Response) => {
    const veri = await piyasaService.tumPiyasaOzetiGetir();
    ApiResponse.success(res, veri, "Piyasa özeti getirildi");
  }),
};