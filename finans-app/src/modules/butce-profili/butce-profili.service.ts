import { prisma } from "../../prisma/client";
import { ApiError } from "@utils/ApiError";
import { ButceProfilOlusturDto, ButceProfilGuncelleDto } from "./butce-profili.schema";

export const butceProfilService = {
  async getir(kullaniciId: string) {
    const profil = await prisma.butceProfili.findUnique({
      where: { kullaniciId },
      include: {
        butceKalemleri: {
          include: {
            kategori: true,
          },
        },
      },
    });

    return profil;
  },

  async olusturVeyaGuncelle(kullaniciId: string, dto: ButceProfilOlusturDto) {
    const mevcutProfil = await prisma.butceProfili.findUnique({
      where: { kullaniciId },
    });

    if (mevcutProfil) {
      return prisma.butceProfili.update({
        where: { kullaniciId },
        data: {
          aylikToplamGelir: dto.aylikToplamGelir,
          aylikHedefHarcama: dto.aylikHedefHarcama,
          paraBirimi: dto.paraBirimi,
        },
      });
    }

    return prisma.butceProfili.create({
      data: {
        kullaniciId,
        aylikToplamGelir: dto.aylikToplamGelir,
        aylikHedefHarcama: dto.aylikHedefHarcama,
        paraBirimi: dto.paraBirimi || "TRY",
      },
    });
  },

  async guncelle(kullaniciId: string, dto: ButceProfilGuncelleDto) {
    const profil = await prisma.butceProfili.findUnique({
      where: { kullaniciId },
    });

    if (!profil) {
      return prisma.butceProfili.create({
        data: {
          kullaniciId,
          aylikToplamGelir: dto.aylikToplamGelir || 0,
          aylikHedefHarcama: dto.aylikHedefHarcama || 0,
          paraBirimi: dto.paraBirimi || "TRY",
          kurulumTamamlandi: dto.kurulumTamamlandi || false,
        },
      });
    }

    return prisma.butceProfili.update({
      where: { kullaniciId },
      data: dto,
    });
  },
};
