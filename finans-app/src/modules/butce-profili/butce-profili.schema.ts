import { z } from "zod";

export const butceProfilOlusturSchema = z.object({
aylikToplamGelir: z.number({ required_error: "Aylık toplam gelir zorunludur" }).min(0),
aylikHedefHarcama: z.number({ required_error: "Aylık hedef harcama zorunludur" }).min(0),
paraBirimi: z.string().default("TRY"),
kurulumTamamlandi: z.boolean().default(true),
});

export const butceProfilGuncelleSchema = z.object({
  aylikToplamGelir: z.number().min(0).optional(),
  aylikHedefHarcama: z.number().min(0).optional(),
  paraBirimi: z.string().optional(),
  kurulumTamamlandi: z.boolean().optional(),
});

export type ButceProfilOlusturDto = z.infer<typeof butceProfilOlusturSchema>;
export type ButceProfilGuncelleDto = z.infer<typeof butceProfilGuncelleSchema>;
