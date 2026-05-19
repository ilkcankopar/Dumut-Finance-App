import { z } from "zod";


export const sesliIslemSchema = z.object({
  tip: z.enum(["GIDER", "GELIR"], {
    required_error: "İşlem tipi belirlenemedi",
  }),
  miktar: z
    .number({ required_error: "Miktar belirlenemedi" })
    .positive("Miktar sıfırdan büyük olmalıdır"),
  baslik: z.string().min(2).max(100),
  kategoriAdi: z.string(), 
  notlar: z.string().optional(),
  tarih: z.coerce.date().default(() => new Date()),
});

export const metindenIslemSchema = z.object({
  body: z.object({
    metin: z
      .string({ required_error: "Metin zorunludur" })
      .min(3, "En az 3 karakter giriniz")
      .max(500),
    onaylansinMi: z.boolean().default(false), 
  }),
});

export const sesliIslemOnaySchema = z.object({
  body: z.object({
    tip: z.enum(["GIDER", "GELIR"]),
    miktar: z.number().positive(),
    baslik: z.string().min(2).max(100),
    kategoriId: z.string().uuid("Geçersiz kategori"),
    notlar: z.string().optional(),
    tarih: z.coerce.date(),
  }),
});

export type SesliIslemDto = z.infer<typeof sesliIslemSchema>;
export type SesliIslemOnayDto = z.infer<typeof sesliIslemOnaySchema>["body"];