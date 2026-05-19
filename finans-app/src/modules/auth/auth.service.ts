import { Prisma, KullaniciTipi } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../../prisma/client';
import { hashUtil } from '@utils/hash.util';
import { tokenUtil } from '@utils/token.util';
import { ApiError } from '@utils/ApiError';
import { KayitDto, GirisDto, GoogleGirisDto } from './auth.schema';
import { config } from '@config/app.config';

type TransactionClient = Prisma.TransactionClient;

const googleClient = new OAuth2Client(config.googleClientId);

const SISTEM_KATEGORILERI = {
    GIDER: [
        { ad: 'Market', renk: '#4CAF50', ikon: 'shoppingCart' },
        { ad: 'Ulaşım', renk: '#2196F3', ikon: 'car' },
        { ad: 'Yemek', renk: '#FF9800', ikon: 'utensils' },
        { ad: 'Kira/Fatura', renk: '#9C27B0', ikon: 'home' },
        { ad: 'Giyim', renk: '#E91E63', ikon: 'tshirt' },
        { ad: 'Eğlence', renk: '#00BCD4', ikon: 'gamepad' },
        { ad: 'Sağlık', renk: '#F44336', ikon: 'heartbeat' },
        { ad: 'Eğitim', renk: '#3F51B5', ikon: 'book' },
        { ad: 'Elektronik', renk: '#607D8B', ikon: 'laptop' },
        { ad: 'Abonelikler', renk: '#795548', ikon: 'play' },
        { ad: 'Diğer', renk: '#9E9E9E', ikon: 'wallet' },
    ],
    GELIR: [
        { ad: 'Maaş', renk: '#4CAF50', ikon: 'briefcase' },
        { ad: 'Ek Gelir', renk: '#8BC34A', ikon: 'moneyBill' },
        { ad: 'Freelance', renk: '#CDDC39', ikon: 'laptop' },
        { ad: 'Kira Geliri', renk: '#FFC107', ikon: 'home' },
        { ad: 'Yatırım Geliri', renk: '#FF9800', ikon: 'chartLine' },
    ],
    HER_IKISI: [
        { ad: 'Yatırım', renk: '#673AB7', ikon: 'chartLine' },
    ]
};

async function sistemKategorileriOlustur(tx: TransactionClient, kullaniciId: string) {
    const kategoriler: any[] = [];
    
    for (const [tip, liste] of Object.entries(SISTEM_KATEGORILERI)) {
        for (const kat of liste) {
            kategoriler.push({
                kullaniciId,
                ad: kat.ad,
                tip: tip as any,
                renk: kat.renk,
                ikon: kat.ikon,
                sistemKategorisi: false,
                aktif: true,
            });
        }
    }
    
    await tx.kategori.createMany({ data: kategoriler });
}

export const authService = {
    async kayitOl(dto: KayitDto) {
        const mevcutKullanici = await prisma.kullanici.findUnique({
            where: { email: dto.email }
        });

        if (mevcutKullanici) {
            throw ApiError.conflict('Bu email adresi zaten kullanılıyor');
        }

        const sifreHash = await hashUtil.sifrele(dto.sifre);

        const kullanici = await prisma.$transaction(async (tx: TransactionClient) => {
            const yeniKullanici = await tx.kullanici.create({
                data: {
                    ad: dto.ad,
                    soyad: dto.soyad,
                    email: dto.email,
                    sifreHash,
                    kullaniciTipi: dto.kullaniciTipi,
                    dilKodu: dto.dilKodu
                },
                select: {
                    id: true,
                    ad: true,
                    soyad: true,
                    email: true,
                    kullaniciTipi: true,
                    dilKodu: true,
                    olusturuldu: true,
                }
            });

            await tx.butceProfili.create({
                data: {
                    kullaniciId: yeniKullanici.id,
                    aylikHedefHarcama: 0,
                    aylikToplamGelir: 0,
                    kurulumTamamlandi: false,
                    paraBirimi: 'TRY',
                    olusturuldu: new Date(),
                    guncellendi: new Date(),
                }
            });

            await tx.widget.createMany({
                data: [
                    { kullaniciId: yeniKullanici.id, tip: 'BUTCE_OZETI', sira: 1 },
                    { kullaniciId: yeniKullanici.id, tip: 'HEDEF_BARI', sira: 2 },
                    { kullaniciId: yeniKullanici.id, tip: 'SERI_TAKIP', sira: 3 },
                    { kullaniciId: yeniKullanici.id, tip: 'KATEGORI_DAGILIMI', sira: 4 },
                ]
            });

            await tx.seri.create({
                data: {
                    kullaniciId: yeniKullanici.id,
                    tip: 'GUNLUK_BUTCE_TUTTURMA',
                },
            });

            await sistemKategorileriOlustur(tx, yeniKullanici.id);

            return yeniKullanici;
        });

        const tokenler = tokenUtil.tokenCiftiOlustur({
            kullaniciId: kullanici.id,
            email: kullanici.email,
            kullaniciTipi: kullanici.kullaniciTipi,
        });
        return { kullanici, ...tokenler };
    },

    async girisYap(dto: GirisDto) {
        const kullanici = await prisma.kullanici.findUnique({
            where: { email: dto.email }
        });

        if (!kullanici) {
            throw ApiError.unauthorized('Email veya şifre hatalı');
        }

        if (!kullanici.sifreHash) {
            throw ApiError.unauthorized('Bu hesap Google ile oluşturulmuş. Lütfen Google ile giriş yapın.');
        }

        const sifreGecerli = await hashUtil.karsilastir(dto.sifre, kullanici.sifreHash);
        if (!sifreGecerli) {
            throw ApiError.unauthorized('Email veya şifre hatalı');
        }

        const tokenler = tokenUtil.tokenCiftiOlustur({
            kullaniciId: kullanici.id,
            email: kullanici.email,
            kullaniciTipi: kullanici.kullaniciTipi,
        });
        const { sifreHash: _, ...kullaniciVerisi } = kullanici;
        return { kullanici: kullaniciVerisi, ...tokenler };
    },

    async tokenYenile(refreshToken: string) {
        const payload = tokenUtil.refreshTokenDogrula(refreshToken);

        const kullanici = await prisma.kullanici.findUnique({
            where: { id: payload.kullaniciId },
            select: { id: true, email: true, kullaniciTipi: true }
        });

        if (!kullanici) {
            throw ApiError.unauthorized('Kullanıcı Bulunamadı');
        }

        return tokenUtil.tokenCiftiOlustur({
            kullaniciId: kullanici.id,
            email: kullanici.email,
            kullaniciTipi: kullanici.kullaniciTipi,
        });
    },

    async googleIleGiris(dto: GoogleGirisDto) {
        let payload;
        
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: dto.idToken,
                audience: config.googleClientId,
            });
            payload = ticket.getPayload();
        } catch (error) {
            throw ApiError.unauthorized('Geçersiz Google token');
        }

        if (!payload || !payload.email) {
            throw ApiError.unauthorized('Google hesabından email alınamadı');
        }

        const { sub: googleId, email, given_name, family_name, picture } = payload;

        let kullanici = await prisma.kullanici.findFirst({
            where: {
                OR: [
                    { googleId },
                    { email }
                ]
            }
        });

        if (kullanici) {
            if (!kullanici.googleId) {
                kullanici = await prisma.kullanici.update({
                    where: { id: kullanici.id },
                    data: {
                        googleId,
                        girisYontemi: 'GOOGLE',
                        profilResmi: picture || kullanici.profilResmi,
                    }
                });
            }
        } else {
            kullanici = await prisma.$transaction(async (tx: TransactionClient) => {
                const yeniKullanici = await tx.kullanici.create({
                    data: {
                        email,
                        googleId,
                        girisYontemi: 'GOOGLE',
                        ad: given_name || 'Kullanıcı',
                        soyad: family_name || '',
                        kullaniciTipi: 'BUSINESS',
                        profilResmi: picture,
                        dilKodu: dto.dilKodu || 'tr',
                    }
                });

                await tx.butceProfili.create({
                    data: {
                        kullaniciId: yeniKullanici.id,
                        aylikHedefHarcama: 0,
                        aylikToplamGelir: 0,
                        kurulumTamamlandi: false,
                        paraBirimi: 'TRY',
                    }
                });

                await tx.widget.createMany({
                    data: [
                        { kullaniciId: yeniKullanici.id, tip: 'BUTCE_OZETI', sira: 1 },
                        { kullaniciId: yeniKullanici.id, tip: 'HEDEF_BARI', sira: 2 },
                        { kullaniciId: yeniKullanici.id, tip: 'SERI_TAKIP', sira: 3 },
                        { kullaniciId: yeniKullanici.id, tip: 'KATEGORI_DAGILIMI', sira: 4 },
                    ]
                });

                await tx.seri.create({
                    data: {
                        kullaniciId: yeniKullanici.id,
                        tip: 'GUNLUK_BUTCE_TUTTURMA',
                    },
                });

                await sistemKategorileriOlustur(tx, yeniKullanici.id);

                return yeniKullanici;
            });
        }

        const tokenler = tokenUtil.tokenCiftiOlustur({
            kullaniciId: kullanici.id,
            email: kullanici.email,
            kullaniciTipi: kullanici.kullaniciTipi,
        });

        const { sifreHash: _, ...kullaniciVerisi } = kullanici;
        return { kullanici: kullaniciVerisi, ...tokenler };
    }
};
