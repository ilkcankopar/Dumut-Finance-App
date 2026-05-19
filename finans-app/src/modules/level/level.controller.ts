import { Request, Response } from 'express';
import { levelService } from './level.service';
import { ApiResponse } from '@utils/ApiResponse';
import { asyncHandler } from '@utils/asyncHandler';

export const levelController = {
  durumGetir: asyncHandler(async (req: Request, res: Response) => {
    const kullaniciId = req.user!.id;
    const durum = await levelService.durumGetir(kullaniciId);
    ApiResponse.success(res, durum, 'Level durumu başarıyla getirildi');
  }),

  globalSiralama: asyncHandler(async (req: Request, res: Response) => {
    const kullaniciId = req.user!.id;
    const sayfa = parseInt(req.query.sayfa as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const siralama = await levelService.globalSiralama(kullaniciId, sayfa, limit);
    ApiResponse.success(res, siralama, 'Global sıralama başarıyla getirildi');
  }),

  arkadasSiralama: asyncHandler(async (req: Request, res: Response) => {
    const kullaniciId = req.user!.id;
    const siralama = await levelService.arkadasSiralamaXP(kullaniciId);
    ApiResponse.success(res, siralama, 'Arkadaş sıralaması başarıyla getirildi');
  }),

  ligSiralama: asyncHandler(async (req: Request, res: Response) => {
    const kullaniciId = req.user!.id;
    const lig = req.query.lig as string | undefined;
    const siralama = await levelService.ligSiralamaXP(kullaniciId, lig);
    ApiResponse.success(res, siralama, 'Lig sıralaması başarıyla getirildi');
  }),

  istatistikler: asyncHandler(async (req: Request, res: Response) => {
    const kullaniciId = req.user!.id;
    const istatistikler = await levelService.istatistikler(kullaniciId);
    ApiResponse.success(res, istatistikler, 'İstatistikler başarıyla getirildi');
  }),

  kullaniciProfil: asyncHandler(async (req: Request, res: Response) => {
    const isteyenKullaniciId = req.user!.id;
    const hedefKullaniciId = req.params.id;
    const profil = await levelService.kullaniciProfilGetir(hedefKullaniciId, isteyenKullaniciId);
    if (!profil) {
      return ApiResponse.error(res, 'Kullanıcı bulunamadı', 404);
    }
    ApiResponse.success(res, profil, 'Kullanıcı profili başarıyla getirildi');
  }),
};
