import { Request, Response } from 'express';
import { mesajService } from './mesaj.service';
import { ApiResponse } from '@utils/ApiResponse';
import { asyncHandler } from '@utils/asyncHandler';

export const mesajController = {
  mesajGonder: asyncHandler(async (req: Request, res: Response) => {
    const gonderenId = req.user!.id;
    const { aliciId, icerik } = req.body;

    if (!aliciId || !icerik) {
      return ApiResponse.error(res, 'Alıcı ve mesaj içeriği gerekli', 400);
    }

    const mesaj = await mesajService.mesajGonder(gonderenId, aliciId, icerik);
    ApiResponse.success(res, mesaj, 'Mesaj gönderildi');
  }),

  konusmalar: asyncHandler(async (req: Request, res: Response) => {
    const kullaniciId = req.user!.id;
    const konusmalar = await mesajService.konusmalar(kullaniciId);
    ApiResponse.success(res, konusmalar, 'Konuşmalar getirildi');
  }),

  mesajlariGetir: asyncHandler(async (req: Request, res: Response) => {
    const kullaniciId = req.user!.id;
    const { kullaniciId: digerKullaniciId } = req.params;
    const { sayfa = '1' } = req.query;

    const mesajlar = await mesajService.mesajlariGetir(
      kullaniciId,
      digerKullaniciId,
      parseInt(sayfa as string)
    );
    ApiResponse.success(res, mesajlar, 'Mesajlar getirildi');
  }),

  hedefPaylas: asyncHandler(async (req: Request, res: Response) => {
    const gonderenId = req.user!.id;
    const { aliciId, hedefId } = req.body;

    if (!aliciId || !hedefId) {
      return ApiResponse.error(res, 'Alıcı ve hedef gerekli', 400);
    }

    const mesaj = await mesajService.hedefPaylas(gonderenId, aliciId, hedefId);
    ApiResponse.success(res, mesaj, 'Hedef paylaşıldı');
  }),

  butcePaylas: asyncHandler(async (req: Request, res: Response) => {
    const gonderenId = req.user!.id;
    const { aliciId } = req.body;

    if (!aliciId) {
      return ApiResponse.error(res, 'Alıcı gerekli', 400);
    }

    const mesaj = await mesajService.butcePaylas(gonderenId, aliciId);
    ApiResponse.success(res, mesaj, 'Bütçe paylaşıldı');
  }),

  rozetPaylas: asyncHandler(async (req: Request, res: Response) => {
    const gonderenId = req.user!.id;
    const { aliciId, rozetId } = req.body;

    if (!aliciId || !rozetId) {
      return ApiResponse.error(res, 'Alıcı ve rozet gerekli', 400);
    }

    const mesaj = await mesajService.rozetPaylas(gonderenId, aliciId, rozetId);
    ApiResponse.success(res, mesaj, 'Rozet paylaşıldı');
  }),

  okunmamisSayisi: asyncHandler(async (req: Request, res: Response) => {
    const kullaniciId = req.user!.id;
    const sayi = await mesajService.okunmamisSayisi(kullaniciId);
    ApiResponse.success(res, { sayi }, 'Okunmamış mesaj sayısı');
  }),
};
