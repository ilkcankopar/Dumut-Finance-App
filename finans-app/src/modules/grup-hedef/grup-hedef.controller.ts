import { Request, Response } from "express";
import { asyncHandler } from "@utils/asyncHandler";
import { ApiResponse } from "@utils/ApiResponse";
import { grupHedefService } from "./grup-hedef.service";

export const grupHedefController = {
  olustur: asyncHandler(async (req: Request, res: Response) => {
    const hedef = await grupHedefService.olustur(req.kullanici!.id, req.body);
    ApiResponse.created(res, hedef, "Grup hedef oluşturuldu");
  }),

  benimHedeflerim: asyncHandler(async (req: Request, res: Response) => {
    const hedefler = await grupHedefService.benimHedeflerim(req.kullanici!.id);
    ApiResponse.success(res, hedefler, "Grup hedefler getirildi");
  }),

  detayGetir: asyncHandler(async (req: Request, res: Response) => {
    const hedef = await grupHedefService.detayGetir(req.params.id);
    ApiResponse.success(res, hedef, "Grup hedef detayı getirildi");
  }),

  guncelle: asyncHandler(async (req: Request, res: Response) => {
    const hedef = await grupHedefService.guncelle(
      req.kullanici!.id,
      req.params.id,
      req.body
    );
    ApiResponse.success(res, hedef, "Grup hedef güncellendi");
  }),

  sil: asyncHandler(async (req: Request, res: Response) => {
    const sonuc = await grupHedefService.sil(req.kullanici!.id, req.params.id);
    ApiResponse.success(res, sonuc, "Grup hedef silindi");
  }),

  katkiEkle: asyncHandler(async (req: Request, res: Response) => {
    const hedef = await grupHedefService.katkiEkle(
      req.kullanici!.id,
      req.params.id,
      req.body
    );
    ApiResponse.success(res, hedef, "Katkı eklendi");
  }),

  uyeEkle: asyncHandler(async (req: Request, res: Response) => {
    const hedef = await grupHedefService.uyeEkle(
      req.kullanici!.id,
      req.params.id,
      req.body
    );
    ApiResponse.success(res, hedef, "Üye eklendi");
  }),

  uyeCikar: asyncHandler(async (req: Request, res: Response) => {
    const hedef = await grupHedefService.uyeCikar(
      req.kullanici!.id,
      req.params.id,
      req.params.uyeId
    );
    ApiResponse.success(res, hedef, "Üye çıkarıldı");
  }),

  ayril: asyncHandler(async (req: Request, res: Response) => {
    const sonuc = await grupHedefService.ayril(req.kullanici!.id, req.params.id);
    ApiResponse.success(res, sonuc, "Gruptan ayrıldınız");
  }),
};
