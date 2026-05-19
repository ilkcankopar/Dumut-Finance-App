import {z} from 'zod';

export const islemOlusturSchema = z.object({
    body : z.object({
        kategoriId : z.string({required_error : 'Kategori Zorunludur'}).uuid(),
        tip : z.enum(['GIDER','GELIR'],{
            required_error : 'İşlem Tipi zorunludur'
        }),
        baslik : z.string({required_error : 'Başlık zorunludur'})
        .min(2 ,'En az 2 karakter')
        .max(100)
        .trim(),

        miktar : z.number({required_error : 'Miktar zorunludur'})
        .positive('Miktar Sıfırdan büyük olmalıdır')
        .max(10_000_000,'Geçersiz Miktar'),

        periyot : z.enum(['HAFTALIK','AYLIK','YILLIK']).default('AYLIK'),
        sabitMi : z.boolean().default(false),
        odemeGunu : z.number().min(1).max(31).optional(), // Ayın hangi günü ödeneceği
        tarih : z.coerce.date().default(() => new Date()),
        notlar : z.string().max(500).optional(),
        etiketler : z.array(z.string().max(30)).max(5).default([]),
        sesleEklendi: z.boolean().default(false),
        fisUrl: z.string().url().optional().or(z.literal('')),
        ocrText: z.string().optional(),
        enlem: z.number().optional(),
        boylam: z.number().optional(),
        konumAd: z.string().optional(),
    })
})


export const islemGuncelleSchema = z.object({
    params: z.object({
      id: z.string().uuid(),
    }),
    body: z.object({
      baslik: z.string().min(2).max(100).trim().optional(),
      miktar: z.number().positive().max(10_000_000).optional(),
      kategoriId: z.string().uuid().optional(),
      periyot: z.enum(["HAFTALIK", "AYLIK", "YILLIK"]).optional(),
      sabitMi: z.boolean().optional(),
      odemeGunu: z.number().min(1).max(31).optional(),
      odendi: z.boolean().optional(),
      tarih: z.coerce.date().optional(),
      notlar: z.string().max(500).optional(),
      etiketler: z.array(z.string().max(30)).max(5).optional(),
      fisUrl: z.string().url().optional().or(z.literal('')),
      ocrText: z.string().optional(),
      enlem: z.number().optional(),
      boylam: z.number().optional(),
      konumAd: z.string().optional(),
    }),
  });


  export const islemListeSchema = z.object({
    query: z.object({
      tip: z.enum(["GIDER", "GELIR"]).optional(),
      kategoriId: z.string().uuid().optional(),
      sabitMi: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
      baslangic: z.coerce.date().optional(),
      bitis: z.coerce.date().optional(),
      sayfaBasinaKayit: z.coerce.number().min(1).max(100).default(20),
      sayfa: z.coerce.number().min(1).default(1),
      siralama: z.enum(["tarih", "miktar"]).default("tarih"),
      siralayis: z.enum(["asc", "desc"]).default("desc"),
      aramaMetni: z.string().max(100).optional(),
    }),
  });

  export type IslemOlusturDto = z.infer<typeof islemOlusturSchema>["body"];
export type IslemGuncelleDto = z.infer<typeof islemGuncelleSchema>["body"];
export type IslemListeQuery = z.infer<typeof islemListeSchema>["query"];