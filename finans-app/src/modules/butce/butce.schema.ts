import {z} from 'zod';

export const butceProfilGuncelleSchema = z.object({
    body : z.object({
        aylikHedefHarcama : z.number().positive().optional(),
        aylikToplamGelir : z.number().positive().optional(),
        paraBirimi : z.enum(['TRY','USD','EUR']).optional()
    })
})

export const butceKalemiOlusturSchema = z.object({
    body : z.object({
        kategoriId : z.string().uuid('Geçersiz Kategori'),
        limitMiktar : z.number({required_error : 'Limit Miktarı Zorunludur'})
        .positive('Limit Sıfırdan buyuk olmalıdır'),
        uyariYuzdesi : z.number().min(10,'En az %10 olmalıdır')
        .max(100).default(80)
    })

})

export const butceKalemiGuncelleSchema = z.object({
    params : z.object({
        id : z.string().uuid()
    }),
    body : z.object({
        limitMiktar : z.number().positive().optional(),
        uyariYuzdesi : z.number().min(10).max(100).optional()
    })
})


export const kurulumSchema = z.object({
    body : z.object({
        aylikHedefHarcama : z.number({required_error : 'Aylık Hedef Harcama zorunludur'})
        .positive(),

        aylikToplamGelir : z.number({required_error : 'Aylık Toplam gelir zorunludur'})
        .positive(),

        paraBirimi : z.enum(['TRY','USD','EUR']).default('TRY'),
        sabitGiderler : z.array(z.object({
            kategoriId : z.string().uuid(),
            baslik : z.string().min(2).max(100),
            miktar : z.number().positive(),
            periyot : z.enum(['HAFTALIK','AYLIK','YILLIK']),
            odemeGunu : z.coerce.number().min(1).max(31).optional(),
        })).optional(),
        butceLimitleri : z.array(z.object({
            kategoriId : z.string().uuid(),
            limitMiktar : z.number().positive(),
            uyariYuzdesi : z.number().min(10).max(100).default(80),

        })).optional(),

    })
})

export type KurulumDto = z.infer<typeof kurulumSchema>['body'];
export type ButceKalemiOlusturDto = z.infer<typeof butceKalemiOlusturSchema>["body"];