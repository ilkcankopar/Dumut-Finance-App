import { z } from 'zod';

export const kayitSchema = z.object({
    body: z.object({
        ad: z
            .string({ required_error: "Ad alanı zorunludur" })
            .min(2, 'Ad en az 2 karakter olmalıdır')
            .max(50, 'Ad en fazla 50 karakter olmalıdır')
            .trim(),

        soyad: z
            .string({ required_error: 'Soyad Zorunludur' })
            .min(2, 'Soyad en az 2 karakter olmalıdır')
            .max(50, 'Soyad en fazla 50 karakter olmalıdır')
            .trim(),

        email: z
            .string({ required_error: "Email zorunludur" })
            .email("Geçerli bir email adresi giriniz")
            .toLowerCase()
            .trim(),

        sifre : z
        .string({required_error : 'Şifre Zorunludur'})
        .min(8,'Şifre en az 8 karakter olmalıdır')
        .max(100).regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            "Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir"
          ),

        
          sifreTekrar: z.string({ required_error: 'Şifre Tekrarı zorunludur' }),

        kullaniciTipi: z.enum(['OGRENCI', 'GIRISIMCI', 'BUSINESS'], {
            required_error : 'Kullanici tipi seçilmelidir',
            invalid_type_error : 'Geçersiz Kullanıcı Tipi'
          }),

          dilKodu : z.string().default('tr'),
        
        

        
    }).refine((data) => data.sifre === data.sifreTekrar , {
        message : 'Şifreler eşleşmiyor',
        path : ['sifreTekrar']
    })
})


export const girisSchema = z.object({
    body: z.object({
      email: z
        .string({ required_error: "Email zorunludur" })
        .email("Geçerli bir email giriniz")
        .toLowerCase()
        .trim(),
  
      sifre: z.string({ required_error: "Şifre zorunludur" }),
    }),
  });



  export const tokenYenileSchema = z.object({
    body: z.object({
      refreshToken: z.string({ required_error: "Refresh token zorunludur" }),
    }),
  });

  export const googleGirisSchema = z.object({
    body: z.object({
      idToken: z.string({ required_error: "Google ID token zorunludur" }),
      dilKodu: z.string().optional().default('tr'),
    }),
  });


export type KayitDto = z.infer<typeof kayitSchema>["body"];
export type GirisDto = z.infer<typeof girisSchema>["body"];
export type GoogleGirisDto = z.infer<typeof googleGirisSchema>["body"];