import { z } from 'zod';

export const grupHedefOlusturSchema = z.object({
  body: z.object({
    ad: z.string({ required_error: "Ad zorunludur" })
      .min(2, 'Ad en az 2 karakter olmalı')
      .max(100),
    aciklama: z.string().max(500).optional(),
    hedefMiktar: z.number({ required_error: "Hedef miktar zorunludur" })
      .positive('Hedef miktar pozitif olmalı'),
    bitisTarihi: z.string().datetime().optional(),
    renk: z.string().optional().default('#4CAF50'),
    ikon: z.string().optional(),
    uyeIdleri: z.array(z.string().uuid()).optional(),
  }),
});

export const grupHedefGuncelleSchema = z.object({
  body: z.object({
    ad: z.string().min(2).max(100).optional(),
    aciklama: z.string().max(500).optional(),
    hedefMiktar: z.number().positive().optional(),
    bitisTarihi: z.string().datetime().optional().nullable(),
    renk: z.string().optional(),
    ikon: z.string().optional(),
  }),
});

export const katkiEkleSchema = z.object({
  body: z.object({
    miktar: z.number({ required_error: "Miktar zorunludur" })
      .positive('Miktar pozitif olmalı'),
  }),
});

export const uyeEkleSchema = z.object({
  body: z.object({
    kullaniciId: z.string({ required_error: "Kullanıcı ID zorunludur" }).uuid(),
  }),
});

export type GrupHedefOlusturDto = z.infer<typeof grupHedefOlusturSchema>["body"];
export type GrupHedefGuncelleDto = z.infer<typeof grupHedefGuncelleSchema>["body"];
export type KatkiEkleDto = z.infer<typeof katkiEkleSchema>["body"];
export type UyeEkleDto = z.infer<typeof uyeEkleSchema>["body"];
