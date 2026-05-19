import { Request, Response } from "express";
import { asyncHandler } from "@utils/asyncHandler";
import { ApiResponse } from "@utils/ApiResponse";
import { butceService } from "./butce.service";

export const butceController = {
  kurulumTamamla: asyncHandler(async (req: Request, res: Response) => {
    const veri = await butceService.kurulumTamamla(req.kullanici!.id, req.body);
    ApiResponse.success(res, veri, "Kurulum tamamlandı");
  }),

  durumGetir: asyncHandler(async (req: Request, res: Response) => {
    const veri = await butceService.butceDurumunuGetir(req.kullanici!.id);
    ApiResponse.success(res, veri, "Bütçe durumu getirildi");
  }),

  kalemiEkle: asyncHandler(async (req: Request, res: Response) => {
    const veri = await butceService.kalemiEkle(req.kullanici!.id, req.body);
    ApiResponse.created(res, veri, "Bütçe kalemi eklendi");
  }),

  kalemiSil: asyncHandler(async (req: Request, res: Response) => {
    const veri = await butceService.kalemiSil(
      req.kullanici!.id,
      req.params.id
    );
    ApiResponse.success(res, veri);
  }),

  onerileriGetir: asyncHandler(async (req: Request, res: Response) => {
    const veri = await butceService.onerileriGetir(req.kullanici!.id);
    ApiResponse.success(res, veri, "Öneriler getirildi");
  }),

  gunlukIpucu: asyncHandler(async (req: Request, res: Response) => {
    const veri = await butceService.gunlukIpucuGetir(req.kullanici!.id);
    ApiResponse.success(res, veri, "Günlük ipucu getirildi");
  }),

  aiYatirimOnerisi: asyncHandler(async (req: Request, res: Response) => {
    const veri = await butceService.aiYatirimOnerisiGetir(req.kullanici!.id);
    ApiResponse.success(res, veri, "Yapay zeka bütçe ve yatırım önerisi getirildi");
  }),
};