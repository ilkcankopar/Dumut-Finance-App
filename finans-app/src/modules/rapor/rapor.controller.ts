import { Request, Response } from 'express';
import { raporService } from './rapor.service';
import { ApiResponse } from '@utils/ApiResponse';
import { asyncHandler } from '@utils/asyncHandler';

export const raporController = {
  detayliRaporGetir: asyncHandler(async (req: Request, res: Response) => {
    const kullaniciId = req.user!.id;
    const { baslangic, bitis } = req.query;

    const baslangicTarih = baslangic ? new Date(baslangic as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const bitisTarih = bitis ? new Date(bitis as string) : new Date();

    const rapor = await raporService.detayliRaporGetir(kullaniciId, baslangicTarih, bitisTarih);
    ApiResponse.success(res, rapor, 'Detaylı rapor başarıyla getirildi');
  }),

  aiAnaliziGetir: asyncHandler(async (req: Request, res: Response) => {
    const kullaniciId = req.user!.id;
    const { tip, veri } = req.body;

    const analiz = await raporService.aiAnaliziGetir(kullaniciId, tip, veri);
    ApiResponse.success(res, { analiz }, 'AI analizi başarıyla oluşturuldu');
  }),
};
