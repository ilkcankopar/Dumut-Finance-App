import { z } from 'zod';


export const hedefOlusturSchema = z.object({
  body: z.object({
    baslik: z.string({ required_error: 'Başlık zorunludur.' }).min(2, 'En az 2 karakter olmalıdır').max(100).trim(),
    aciklama: z.string().max(500).optional(),
    hedefMiktar: z.number({ required_error: 'Hedef Miktar zorunludur' }).positive('Hedef Miktar sıfırdan büyük olmalıdır').max(100_000_000, "Geçersiz Miktar"),
    hedefTarihi: z.coerce.date().min(new Date(), 'Hedef Tarihi geçmişte olamaz').optional(),
    oncelik: z.number().min(1, 'En Düşük öncelik 1').max(3, 'En yüksek öncelik 3').default(1),
    herkesGorsun: z.boolean().default(false),

    renk: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Geçersiz Renk').default('#4CAF50'),
    ikon: z.string().max(50).optional(),
    varlikSembol: z.string().max(50).optional(),
    varlikAdet: z.number().positive().optional(),
    varlikTip: z.string().max(50).optional()
  })
})


export const hedefGuncelleSchema = z.object({
  params: z.object({
    id: z.string().uuid('Geçersiz hedef ID')
  }),
  body: z.object({
    baslik: z.string().min(2).max(100).trim().optional(),
    aciklama: z.string().max(500).optional(),
    hedefMiktar: z.number().positive().optional(),
    hedefTarihi: z.coerce.date().optional(),
    oncelik: z.number().min(1).max(3).optional(),
    herkesGorsun: z.boolean().optional(),
    renk: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
    ikon: z.string().max(50).optional(),
    varlikSembol: z.string().max(50).optional(),
    varlikAdet: z.number().positive().optional(),
    varlikTip: z.string().max(50).optional(),
    durum: z
      .enum(["DEVAM_EDIYOR", "TAMAMLANDI"])
      .optional(),
  })
})

export const hedefKatkiSchema = z.object({
  params: z.object({
    id: z.string().uuid("Geçersiz hedef ID"),
  }),
  body: z.object({
    miktar: z
      .number({ required_error: "Miktar zorunludur" })
      .positive("Miktar sıfırdan büyük olmalıdır"),
    notlar: z.string().max(200).optional(),
  }),
});

export const hedefIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Geçersiz hedef ID"),
  }),
});

export type HedefOlusturDto = z.infer<typeof hedefOlusturSchema>["body"];
export type HedefGuncelleDto = z.infer<typeof hedefGuncelleSchema>["body"];
export type HedefKatkiDto = z.infer<typeof hedefKatkiSchema>["body"];