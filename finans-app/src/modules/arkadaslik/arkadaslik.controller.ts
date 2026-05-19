import { Request, Response } from "express";
import { asyncHandler } from "@utils/asyncHandler";
import { ApiResponse } from "@utils/ApiResponse";
import { arkadaslikService } from "./arkadaslik.service";

export const arkadaslikController = {
  istekGonder: asyncHandler(async (req: Request, res: Response) => {
    const arkadaslik = await arkadaslikService.istekGonder(req.kullanici!.id, req.body);
    ApiResponse.created(res, arkadaslik, "Arkadaşlık isteği gönderildi");
  }),

  istekKabulEt: asyncHandler(async (req: Request, res: Response) => {
    const arkadaslik = await arkadaslikService.istekKabulEt(req.kullanici!.id, req.params.id);
    ApiResponse.success(res, arkadaslik, "Arkadaşlık isteği kabul edildi");
  }),

  istekReddet: asyncHandler(async (req: Request, res: Response) => {
    const sonuc = await arkadaslikService.istekReddet(req.kullanici!.id, req.params.id);
    ApiResponse.success(res, sonuc, "Arkadaşlık isteği reddedildi");
  }),

  arkadasiSil: asyncHandler(async (req: Request, res: Response) => {
    const sonuc = await arkadaslikService.arkadasiSil(req.kullanici!.id, req.params.id);
    ApiResponse.success(res, sonuc, "Arkadaş silindi");
  }),

  arkadaslariGetir: asyncHandler(async (req: Request, res: Response) => {
    const arkadaslar = await arkadaslikService.arkadaslariGetir(req.kullanici!.id);
    ApiResponse.success(res, arkadaslar, "Arkadaşlar getirildi");
  }),

  bekleyenIstekleriGetir: asyncHandler(async (req: Request, res: Response) => {
    const istekler = await arkadaslikService.bekleyenIstekleriGetir(req.kullanici!.id);
    ApiResponse.success(res, istekler, "Bekleyen istekler getirildi");
  }),

  ayarlariGuncelle: asyncHandler(async (req: Request, res: Response) => {
    const arkadaslik = await arkadaslikService.ayarlariGuncelle(
      req.kullanici!.id,
      req.params.id,
      req.body
    );
    ApiResponse.success(res, arkadaslik, "Arkadaşlık ayarları güncellendi");
  }),

  kullaniciAra: asyncHandler(async (req: Request, res: Response) => {
    const sonuc = await arkadaslikService.kullaniciAra(req.kullanici!.id, req.query as any);
    ApiResponse.success(res, sonuc, "Kullanıcılar getirildi");
  }),

  siralamaGetir: asyncHandler(async (req: Request, res: Response) => {
    const siralama = await arkadaslikService.siralamaGetir(req.kullanici!.id);
    ApiResponse.success(res, siralama, "Sıralama getirildi");
  }),
};
