import { Request, Response, NextFunction } from "express";
import { butceProfilService } from "./butce-profili.service";

export const butceProfilController = {
  async getir(req: Request, res: Response, next: NextFunction) {
    try {
      const kullaniciId = req.kullanici!.id;
      const profil = await butceProfilService.getir(kullaniciId);

      res.json({
        success: true,
        message: "Bütçe profili getirildi",
        data: profil,
      });
    } catch (error) {
      next(error);
    }
  },

  async olusturVeyaGuncelle(req: Request, res: Response, next: NextFunction) {
    try {
      const kullaniciId = req.kullanici!.id;
      const profil = await butceProfilService.olusturVeyaGuncelle(kullaniciId, req.body);

      res.status(201).json({
        success: true,
        message: "Bütçe profili kaydedildi",
        data: profil,
      });
    } catch (error) {
      next(error);
    }
  },

  async guncelle(req: Request, res: Response, next: NextFunction) {
    try {
      const kullaniciId = req.kullanici!.id;
      const profil = await butceProfilService.guncelle(kullaniciId, req.body);

      res.json({
        success: true,
        message: "Bütçe profili güncellendi",
        data: profil,
      });
    } catch (error) {
      next(error);
    }
  },
};
