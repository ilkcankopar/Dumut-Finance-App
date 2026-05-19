import { prisma } from '../../prisma/client';
import { ApiError } from '@utils/ApiError';

export const dilService = {
  async tumDilleriGetir() {
    const diller = await prisma.dil.findMany({
      where: { aktif: true },
      orderBy: { ad: 'asc' },
    });
    return diller;
  },

  async dilDetayGetir(kod: string) {
    const dil = await prisma.dil.findUnique({
      where: { kod },
    });

    if (!dil) {
      throw ApiError.notFound('Dil bulunamadı');
    }

    return dil;
  },

  async cevirileriGetir(dilKodu: string) {
    const dil = await prisma.dil.findUnique({
      where: { kod: dilKodu },
    });

    if (!dil) {
      throw ApiError.notFound('Dil bulunamadı');
    }

    const ceviriler = await prisma.ceviri.findMany({
      where: { dilKodu },
    });

    const ceviriObjesi: Record<string, string> = {};
    ceviriler.forEach((c) => {
      ceviriObjesi[c.anahtar] = c.deger;
    });

    return {
      dil,
      ceviriler: ceviriObjesi,
    };
  },

  async kullaniciDiliniGuncelle(kullaniciId: string, dilKodu: string) {
    const dil = await prisma.dil.findUnique({
      where: { kod: dilKodu },
    });

    if (!dil || !dil.aktif) {
      throw ApiError.badRequest('Geçersiz dil kodu');
    }

    const kullanici = await prisma.kullanici.update({
      where: { id: kullaniciId },
      data: { dilKodu },
      select: {
        id: true,
        email: true,
        ad: true,
        soyad: true,
        dilKodu: true,
      },
    });

    return kullanici;
  },
};
