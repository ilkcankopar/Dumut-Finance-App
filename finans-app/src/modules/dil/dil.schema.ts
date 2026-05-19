import { z } from 'zod';

export const dilGuncelleSchema = z.object({
  body: z.object({
    dilKodu: z.string({ required_error: "Dil kodu zorunludur" })
      .min(2, 'Dil kodu en az 2 karakter olmalı')
      .max(5, 'Dil kodu en fazla 5 karakter olmalı'),
  }),
});

export type DilGuncelleDto = z.infer<typeof dilGuncelleSchema>["body"];
