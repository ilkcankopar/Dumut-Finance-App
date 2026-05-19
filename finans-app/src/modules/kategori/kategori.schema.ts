import {z} from 'zod';

export  const kategoriOlusturSchema = z.object({
    body : z.object({
        ad : z.string({required_error : 'Kategori adı zorunludur'})
        .min(2,'En az 2 karakter olmalıdır')
        .max(50,'En Fazla 50 karakter olabilir')
        .trim(),

        tip : z.enum(['GIDER','GELIR','HER_IKISI'], {
            required_error : 'Kategori Tipi zorunludur',
        }),

        renk: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Geçerli bir hex renk kodu giriniz (#RRGGBB)")
        .default("#6366F1"),

        ikon : z.string().max(50).default('tag'),
        aylikHedef: z.number().nonnegative().default(0)
    })
});

export const kategoriGuncelleSchema = z.object({
    params : z.object({
        id : z.string().uuid('Geçersiz Kategori Id')

    }),
    body : z.object({
        ad : z.string().min(2).max(50).trim().optional(),
        renk: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Geçerli bir hex renk kodu giriniz")
        .optional(),
        ikon : z.string().max(50).optional(),
        aylikHedef: z.number().nonnegative().optional()
    })
})

export const kategoriSilSchema = z.object({
    params : z.object({
        id : z.string().uuid('Geçersiz kategori ID')
    })
})


export type KategoriOlusturDto = z.infer<typeof kategoriOlusturSchema>["body"];
export type KategoriGuncelleDto = z.infer<typeof kategoriGuncelleSchema>["body"];