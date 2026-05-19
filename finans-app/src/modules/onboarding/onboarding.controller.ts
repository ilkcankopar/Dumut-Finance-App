import { Request, Response, NextFunction } from 'express';
import { onboardingService } from './onboarding.service';
import { KullaniciTipi } from '@prisma/client';

export const onboardingController = {
  async getKurulumVerileri(req: Request, res: Response, next: NextFunction) {
    try {
      const kullaniciTipi = (req.query.tip as KullaniciTipi) || 'BUSINESS';
      const data = await onboardingService.getKurulumVerileri(kullaniciTipi);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async kurulumTamamla(req: Request, res: Response, next: NextFunction) {
    try {
      const kullaniciId = req.kullanici!.id;
      const kullaniciTipi = req.kullanici!.kullaniciTipi as KullaniciTipi;
      const data = await onboardingService.kurulumTamamla(kullaniciId, kullaniciTipi, req.body);
      res.json({
        success: true,
        message: 'Kurulum başarıyla tamamlandı',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
};
