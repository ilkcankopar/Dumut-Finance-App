import { z } from 'zod';

export const arkadaslikIstekGonderSchema = z.object({
  body: z.object({
    alinanId: z.string({ required_error: "Alıcı ID zorunludur" }).uuid("Geçersiz kullanıcı ID"),
  }),
});

export const arkadaslikGuncelleSchema = z.object({
  body: z.object({
    hedefGoster: z.boolean().optional(),
    raporGoster: z.boolean().optional(),
  }),
});

export const kullaniciAraSchema = z.object({
  query: z.object({
    arama: z.string().optional(),
    sayfa: z.string().optional().default('1'),
    limit: z.string().optional().default('20'),
  }),
});

export type ArkadaslikIstekGonderDto = z.infer<typeof arkadaslikIstekGonderSchema>["body"];
export type ArkadaslikGuncelleDto = z.infer<typeof arkadaslikGuncelleSchema>["body"];
export type KullaniciAraDto = z.infer<typeof kullaniciAraSchema>["query"];
