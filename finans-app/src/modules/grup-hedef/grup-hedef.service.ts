import { prisma } from '../../prisma/client';
import { ApiError } from '@utils/ApiError';
import { GrupHedefOlusturDto, GrupHedefGuncelleDto, KatkiEkleDto, UyeEkleDto } from './grup-hedef.schema';

export const grupHedefService = {
  async olustur(olusturanId: string, dto: GrupHedefOlusturDto) {
    const grupHedef = await prisma.grupHedef.create({
      data: {
        ad: dto.ad,
        aciklama: dto.aciklama,
        hedefMiktar: dto.hedefMiktar,
        bitisTarihi: dto.bitisTarihi ? new Date(dto.bitisTarihi) : null,
        renk: dto.renk || '#4CAF50',
        ikon: dto.ikon,
        olusturanId,
        uyeler: {
          create: {
            kullaniciId: olusturanId,
            katki: 0,
          },
        },
      },
      include: {
        uyeler: {
          include: {
            kullanici: {
              select: { id: true, ad: true, soyad: true, profilResmi: true },
            },
          },
        },
      },
    });

    if (dto.uyeIdleri && dto.uyeIdleri.length > 0) {
      const arkadaslar = await prisma.arkadaslik.findMany({
        where: {
          kabul: true,
          OR: [
            { gonderenId: olusturanId, alinanId: { in: dto.uyeIdleri } },
            { alinanId: olusturanId, gonderenId: { in: dto.uyeIdleri } },
          ],
        },
      });

      const gecerliUyeler = arkadaslar.map((a) => 
        a.gonderenId === olusturanId ? a.alinanId : a.gonderenId
      );

      if (gecerliUyeler.length > 0) {
        await prisma.grupHedefUye.createMany({
          data: gecerliUyeler.map((id) => ({
            grupHedefId: grupHedef.id,
            kullaniciId: id,
            katki: 0,
          })),
        });

        for (const uyeId of gecerliUyeler) {
          await prisma.bildirim.create({
            data: {
              kullaniciId: uyeId,
              baslik: 'Grup Hedefine Davet',
              mesaj: `"${grupHedef.ad}" grup hedefine eklendiniz`,
              okundu: false,
              tip: 'GRUP_HEDEF',
            },
          });
        }
      }
    }

    return this.detayGetir(grupHedef.id);
  },

  async benimHedeflerim(kullaniciId: string) {
    const hedefler = await prisma.grupHedef.findMany({
      where: {
        uyeler: {
          some: { kullaniciId },
        },
      },
      include: {
        uyeler: {
          include: {
            kullanici: {
              select: { id: true, ad: true, soyad: true, profilResmi: true },
            },
          },
          orderBy: { katki: 'desc' },
        },
      },
      orderBy: { olusturuldu: 'desc' },
    });

    return hedefler.map((h) => ({
      ...h,
      ilerlemeYuzdesi: Math.min(100, (h.mevcutMiktar / h.hedefMiktar) * 100),
      benimKatkim: h.uyeler.find((u) => u.kullaniciId === kullaniciId)?.katki || 0,
    }));
  },

  async detayGetir(hedefId: string) {
    const hedef = await prisma.grupHedef.findUnique({
      where: { id: hedefId },
      include: {
        uyeler: {
          include: {
            kullanici: {
              select: { id: true, ad: true, soyad: true, profilResmi: true },
            },
          },
          orderBy: { katki: 'desc' },
        },
      },
    });

    if (!hedef) {
      throw ApiError.notFound('Grup hedef bulunamadı');
    }

    return {
      ...hedef,
      ilerlemeYuzdesi: Math.min(100, (hedef.mevcutMiktar / hedef.hedefMiktar) * 100),
    };
  },

  async guncelle(kullaniciId: string, hedefId: string, dto: GrupHedefGuncelleDto) {
    const hedef = await prisma.grupHedef.findFirst({
      where: {
        id: hedefId,
        olusturanId: kullaniciId,
      },
    });

    if (!hedef) {
      throw ApiError.notFound('Grup hedef bulunamadı veya yetkiniz yok');
    }

    return prisma.grupHedef.update({
      where: { id: hedefId },
      data: {
        ...dto,
        bitisTarihi: dto.bitisTarihi ? new Date(dto.bitisTarihi) : dto.bitisTarihi,
      },
      include: {
        uyeler: {
          include: {
            kullanici: {
              select: { id: true, ad: true, soyad: true, profilResmi: true },
            },
          },
        },
      },
    });
  },

  async sil(kullaniciId: string, hedefId: string) {
    const hedef = await prisma.grupHedef.findFirst({
      where: {
        id: hedefId,
        olusturanId: kullaniciId,
      },
    });

    if (!hedef) {
      throw ApiError.notFound('Grup hedef bulunamadı veya yetkiniz yok');
    }

    await prisma.grupHedef.delete({
      where: { id: hedefId },
    });

    return { message: 'Grup hedef silindi' };
  },

  async katkiEkle(kullaniciId: string, hedefId: string, dto: KatkiEkleDto) {
    const uyelik = await prisma.grupHedefUye.findFirst({
      where: {
        grupHedefId: hedefId,
        kullaniciId,
      },
    });

    if (!uyelik) {
      throw ApiError.notFound('Bu grup hedefin üyesi değilsiniz');
    }

    const [_, hedef] = await prisma.$transaction([
      prisma.grupHedefUye.update({
        where: { id: uyelik.id },
        data: {
          katki: { increment: dto.miktar },
        },
      }),
      prisma.grupHedef.update({
        where: { id: hedefId },
        data: {
          mevcutMiktar: { increment: dto.miktar },
        },
        include: {
          uyeler: {
            include: {
              kullanici: {
                select: { id: true, ad: true, soyad: true, profilResmi: true },
              },
            },
          },
        },
      }),
    ]);

    if (hedef.mevcutMiktar >= hedef.hedefMiktar) {
      for (const uye of hedef.uyeler) {
        await prisma.bildirim.create({
          data: {
            kullaniciId: uye.kullaniciId,
            baslik: 'Grup Hedef Tamamlandı!',
            mesaj: `"${hedef.ad}" grup hedefiniz tamamlandı!`,
            okundu: false,
            tip: 'GRUP_HEDEF',
          },
        });
      }
    }

    return this.detayGetir(hedefId);
  },

  async uyeEkle(kullaniciId: string, hedefId: string, dto: UyeEkleDto) {
    const hedef = await prisma.grupHedef.findFirst({
      where: {
        id: hedefId,
        olusturanId: kullaniciId,
      },
    });

    if (!hedef) {
      throw ApiError.notFound('Grup hedef bulunamadı veya yetkiniz yok');
    }

    const arkadas = await prisma.arkadaslik.findFirst({
      where: {
        kabul: true,
        OR: [
          { gonderenId: kullaniciId, alinanId: dto.kullaniciId },
          { alinanId: kullaniciId, gonderenId: dto.kullaniciId },
        ],
      },
    });

    if (!arkadas) {
      throw ApiError.badRequest('Bu kullanıcı arkadaşınız değil');
    }

    const mevcutUye = await prisma.grupHedefUye.findFirst({
      where: {
        grupHedefId: hedefId,
        kullaniciId: dto.kullaniciId,
      },
    });

    if (mevcutUye) {
      throw ApiError.conflict('Bu kullanıcı zaten üye');
    }

    await prisma.grupHedefUye.create({
      data: {
        grupHedefId: hedefId,
        kullaniciId: dto.kullaniciId,
        katki: 0,
      },
    });

    await prisma.bildirim.create({
      data: {
        kullaniciId: dto.kullaniciId,
        baslik: 'Grup Hedefine Davet',
        mesaj: `"${hedef.ad}" grup hedefine eklendiniz`,
        okundu: false,
        tip: 'GRUP_HEDEF',
      },
    });

    return this.detayGetir(hedefId);
  },

  async uyeCikar(kullaniciId: string, hedefId: string, cikarilacakId: string) {
    const hedef = await prisma.grupHedef.findFirst({
      where: {
        id: hedefId,
        olusturanId: kullaniciId,
      },
    });

    if (!hedef) {
      throw ApiError.notFound('Grup hedef bulunamadı veya yetkiniz yok');
    }

    if (cikarilacakId === kullaniciId) {
      throw ApiError.badRequest('Kendinizi gruptan çıkaramazsınız');
    }

    const uyelik = await prisma.grupHedefUye.findFirst({
      where: {
        grupHedefId: hedefId,
        kullaniciId: cikarilacakId,
      },
    });

    if (!uyelik) {
      throw ApiError.notFound('Üye bulunamadı');
    }

    await prisma.grupHedef.update({
      where: { id: hedefId },
      data: {
        mevcutMiktar: { decrement: uyelik.katki },
      },
    });

    await prisma.grupHedefUye.delete({
      where: { id: uyelik.id },
    });

    return this.detayGetir(hedefId);
  },

  async ayril(kullaniciId: string, hedefId: string) {
    const hedef = await prisma.grupHedef.findUnique({
      where: { id: hedefId },
    });

    if (!hedef) {
      throw ApiError.notFound('Grup hedef bulunamadı');
    }

    if (hedef.olusturanId === kullaniciId) {
      throw ApiError.badRequest('Grup sahibi olarak ayrılamazsınız. Grubu silebilirsiniz.');
    }

    const uyelik = await prisma.grupHedefUye.findFirst({
      where: {
        grupHedefId: hedefId,
        kullaniciId,
      },
    });

    if (!uyelik) {
      throw ApiError.notFound('Bu grubun üyesi değilsiniz');
    }

    await prisma.grupHedef.update({
      where: { id: hedefId },
      data: {
        mevcutMiktar: { decrement: uyelik.katki },
      },
    });

    await prisma.grupHedefUye.delete({
      where: { id: uyelik.id },
    });

    return { message: 'Gruptan ayrıldınız' };
  },
};
