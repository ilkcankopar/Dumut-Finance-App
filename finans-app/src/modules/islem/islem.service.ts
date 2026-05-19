import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { ApiError } from "@utils/ApiError";
import { finansalUtil } from "@utils/finansal.util";
import {
  IslemOlusturDto,
  IslemGuncelleDto,
  IslemListeQuery,
} from "./islem.schema";
import { levelService, XP_KAZANIMLARI } from "../level/level.service";
import { rozetService } from "../rozet/rozet.service";

interface IslemWithKategori {
  tarih: Date;
  miktar: number;
  tip: string;
  kategoriId: string;
  kategori: {
    id: string;
    ad: string;
    renk: string;
    ikon: string;
  };
}

export const islemService = {

  async islemOlustur(kullaniciId: string, dto: IslemOlusturDto) {
    const kategori = await prisma.kategori.findFirst({
      where: {
        id: dto.kategoriId,
        aktif: true,
        OR: [{ sistemKategorisi: true }, { kullaniciId }],
      },
    });

    if (!kategori) {
      throw ApiError.notFound("Kategori bulunamadı");
    }

    
    if (kategori.tip !== "HER_IKISI" && kategori.tip !== dto.tip) {
      throw ApiError.badRequest(
        `Bu kategori "${
          kategori.tip === "GIDER" ? "gider" : "gelir"
        }" işlemleri için tanımlanmış`
      );
    }

    const islem = await prisma.islem.create({
      data: {
        ...dto,
        kullaniciId,
      },
      include: {
        kategori: {
          select: {
            id: true,
            ad: true,
            renk: true,
            ikon: true,
          },
        },
      },
    });

    if (dto.tip === "GIDER") {
      await this._butceLimitiKontrolEt(kullaniciId, dto.kategoriId);
    }

    // XP kazandır
    const xpMiktari = dto.sesleEklendi 
      ? XP_KAZANIMLARI.ISLEM_SESLE_EKLE 
      : XP_KAZANIMLARI.ISLEM_EKLE;
    
    await levelService.xpEkle(
      kullaniciId, 
      xpMiktari, 
      dto.sesleEklendi ? 'Sesle işlem eklendi' : 'İşlem eklendi'
    );

    // Rozet kontrolü (arka planda)
    rozetService.rozetKontrolEt(kullaniciId).catch(console.error);

    return islem;
  },

  async islemleriGetir(kullaniciId: string, query: IslemListeQuery) {
    const {
      tip,
      kategoriId,
      sabitMi,
      baslangic,
      bitis,
      sayfaBasinaKayit,
      sayfa,
      siralama,
      siralayis,
      aramaMetni,
    } = query;

    const baseFilters: Prisma.IslemWhereInput = {
      kullaniciId,
      ...(tip && { tip }),
      ...(kategoriId && { kategoriId }),
      ...(sabitMi !== undefined && { sabitMi }),
      ...(aramaMetni && {
        baslik: {
          contains: aramaMetni,
          mode: "insensitive" as Prisma.QueryMode,
        },
      }),
    };

    let where: Prisma.IslemWhereInput = baseFilters;

    if (baslangic || bitis) {
      if (sabitMi === false) {
        where = {
          ...baseFilters,
          tarih: {
            ...(baslangic && { gte: baslangic }),
            ...(bitis && { lte: bitis }),
          },
        };
      } else if (sabitMi === true) {
        where = {
          ...baseFilters,
          tarih: { lte: bitis || new Date() },
        };
      } else {
        where = {
          ...baseFilters,
          OR: [
            {
              tarih: {
                ...(baslangic && { gte: baslangic }),
                ...(bitis && { lte: bitis }),
              },
            },
            {
              sabitMi: true,
              tarih: { lte: bitis || new Date() },
            },
          ],
        };
      }
    }


    const [toplam, islemler] = await Promise.all([
      prisma.islem.count({ where }),
      prisma.islem.findMany({
        where,
        include: {
          kategori: {
            select: {
              id: true,
              ad: true,
              renk: true,
              ikon: true,
            },
          },
        },
        orderBy: {
          [siralama]: siralayis,
        },
      
        skip: (sayfa - 1) * sayfaBasinaKayit,
        take: sayfaBasinaKayit,
      }),
    ]);

    return {
      islemler,
      meta: {
        toplam,
        sayfa,
        sayfaBasinaKayit,
        toplamSayfa: Math.ceil(toplam / sayfaBasinaKayit),
      },
    };
  },


  async islemGetir(kullaniciId: string, islemId: string) {
    const islem = await prisma.islem.findUnique({
      where: { id: islemId },
      include: {
        kategori: {
          select: {
            id: true,
            ad: true,
            renk: true,
            ikon: true,
          },
        },
      },
    });

    if (!islem) {
      throw ApiError.notFound("İşlem bulunamadı");
    }

    if (islem.kullaniciId !== kullaniciId) {
      throw ApiError.forbidden("Bu işleme erişim yetkiniz yok");
    }

    return islem;
  },


  async islemGuncelle(
    kullaniciId: string,
    islemId: string,
    data: IslemGuncelleDto
  ) {
    await this.islemGetir(kullaniciId, islemId);

    return prisma.islem.update({
      where: { id: islemId },
      data: {
        ...(data.baslik && { baslik: data.baslik }),
        ...(data.miktar && { miktar: data.miktar }),
        ...(data.kategoriId && { kategoriId: data.kategoriId }),
        ...(data.periyot && { periyot: data.periyot as any }),
        ...(data.sabitMi !== undefined && { sabitMi: data.sabitMi }),
        ...(data.odemeGunu && { odemeGunu: data.odemeGunu }),
        ...(data.odendi !== undefined && { odendi: data.odendi }),
        ...(data.tarih && { tarih: data.tarih }),
        ...(data.notlar !== undefined && { notlar: data.notlar }),
        ...(data.etiketler && { etiketler: data.etiketler }),
        ...(data.fisUrl !== undefined && { fisUrl: data.fisUrl }),
        ...(data.ocrText !== undefined && { ocrText: data.ocrText }),
        ...(data.enlem !== undefined && { enlem: data.enlem }),
        ...(data.boylam !== undefined && { boylam: data.boylam }),
        ...(data.konumAd !== undefined && { konumAd: data.konumAd }),
      },
      include: {
        kategori: {
          select: {
            id: true,
            ad: true,
            renk: true,
            ikon: true,
          },
        },
      },
    });
  },



  async islemSil(kullaniciId: string, islemId: string) {
    await this.islemGetir(kullaniciId, islemId);

    await prisma.islem.delete({ where: { id: islemId } });
    return { mesaj: "İşlem silindi" };
  },


  async ozet(kullaniciId: string, baslangic: Date, bitis: Date) {
    const islemler = await prisma.islem.findMany({
      where: {
        kullaniciId,
        OR: [
          { tarih: { gte: baslangic, lte: bitis } },
          { sabitMi: true, tarih: { lte: bitis } }
        ]
      },
      include: {
        kategori: {
          select: {
            id: true,
            ad: true,
            renk: true,
            ikon: true,
          },
        },
      },
    });

    const gelirler = islemler.filter((i: IslemWithKategori) => i.tip === "GELIR");
    const giderler = islemler.filter((i: IslemWithKategori) => i.tip === "GIDER");

    // Temel hesaplamalar
    const toplamGelir = gelirler.reduce((acc: number, i: IslemWithKategori) => acc + i.miktar, 0);
    const toplamGider = giderler.reduce((acc: number, i: IslemWithKategori) => acc + i.miktar, 0);
    const netTasarruf = toplamGelir - toplamGider;

    const tasarrufOrani =
      toplamGelir > 0
        ? Math.round((netTasarruf / toplamGelir) * 100 * 100) / 100
        : 0;

    const kategoriGrubu = new Map<
      string,
      {
        ad: string;
        renk: string;
        ikon: string;
        toplamGider: number;
        toplamGelir: number;
        islemSayisi: number;
      }
    >();

    islemler.forEach((islem: IslemWithKategori) => {
      const mevcut = kategoriGrubu.get(islem.kategoriId) ?? {
        ad: islem.kategori.ad,
        renk: islem.kategori.renk,
        ikon: islem.kategori.ikon,
        toplamGider: 0,
        toplamGelir: 0,
        islemSayisi: 0,
      };

      if (islem.tip === "GIDER") {
        mevcut.toplamGider += islem.miktar;
      } else {
        mevcut.toplamGelir += islem.miktar;
      }

      mevcut.islemSayisi += 1;
      kategoriGrubu.set(islem.kategoriId, mevcut);
    });

    const kategoriDagilimi = Array.from(kategoriGrubu.entries()).map(
      ([id, veri]) => ({
        id,
        ...veri,
        giderYuzdesi: finansalUtil.butceKullanimHesapla(
          veri.toplamGider,
          toplamGider
        ),
        gelirYuzdesi: finansalUtil.butceKullanimHesapla(
          veri.toplamGelir,
          toplamGelir
        ),
      })
    );

    const enCokHarcanan = [...kategoriDagilimi]
      .sort((a, b) => b.toplamGider - a.toplamGider)
      .slice(0, 5);

    const gunlukTrend = this._gunlukTrendHesapla(islemler, baslangic, bitis);

    const haftalikKarsilastirma = this._haftalikKarsilastirmaHesapla(islemler);

    return {
      donem: {
        baslangic,
        bitis,
      },
      toplamGelir,
      toplamGider,
      netTasarruf,
      tasarrufOrani,
      islemSayisi: islemler.length,
      kategoriDagilimi,
      enCokHarcanan,
      gunlukTrend,
  
      haftalikKarsilastirma,
    };
  },


  _gunlukTrendHesapla(
    islemler: { tarih: Date; miktar: number; tip: string }[],
    baslangic: Date,
    bitis: Date
  ) {
    const gunler: Record<
      string,
      { tarih: string; gelir: number; gider: number; net: number }
    > = {};

    const iterator = new Date(baslangic);
    while (iterator <= bitis) {
      const key = iterator.toISOString().split("T")[0];
      gunler[key] = { tarih: key, gelir: 0, gider: 0, net: 0 };
      iterator.setDate(iterator.getDate() + 1);
    }

    // İşlemleri ilgili günlere ekle
    islemler.forEach((islem) => {
      const key = new Date(islem.tarih).toISOString().split("T")[0];
      if (gunler[key]) {
        if (islem.tip === "GELIR") {
          gunler[key].gelir += islem.miktar;
        } else {
          gunler[key].gider += islem.miktar;
        }
        gunler[key].net = gunler[key].gelir - gunler[key].gider;
      }
    });

    return Object.values(gunler);
  },


  _haftalikKarsilastirmaHesapla(
    islemler: { tarih: Date; miktar: number; tip: string }[]
  ) {
    const haftalar: Record<
      number,
      { hafta: number; gelir: number; gider: number }
    > = {};

    islemler.forEach((islem) => {
      const tarih = new Date(islem.tarih);

      const hafta = this._haftaNumarasiniAl(tarih);

      if (!haftalar[hafta]) {
        haftalar[hafta] = { hafta, gelir: 0, gider: 0 };
      }

      if (islem.tip === "GELIR") {
        haftalar[hafta].gelir += islem.miktar;
      } else {
        haftalar[hafta].gider += islem.miktar;
      }
    });

    return Object.values(haftalar).sort((a, b) => a.hafta - b.hafta);
  },

  // ISO hafta numarası hesapla
  _haftaNumarasiniAl(tarih: Date): number {
    const d = new Date(tarih);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const hafta1 = new Date(d.getFullYear(), 0, 4);
    return (
      1 +
      Math.round(
        ((d.getTime() - hafta1.getTime()) / 86400000 -
          3 +
          ((hafta1.getDay() + 6) % 7)) /
          7
      )
    );
  },


  async _butceLimitiKontrolEt(kullaniciId: string, kategoriId: string) {
  const butceProfili = await prisma.butceProfili.findUnique({
  where: { kullaniciId },
  include: {
  butceKalemleri: {
  where: { kategoriId },
  },
  },
  });
  
  if (!butceProfili?.butceKalemleri[0]) return;
  
  const kalem = butceProfili.butceKalemleri[0];
  
  const ayBaslangic = new Date();
  ayBaslangic.setDate(1);
  ayBaslangic.setHours(0, 0, 0, 0);
  
  const { _sum } = await prisma.islem.aggregate({
  where: {
  kullaniciId,
  kategoriId,
  tip: "GIDER",
  tarih: { gte: ayBaslangic },
  },
  _sum: { miktar: true },
  });
  
  const toplamHarcama = _sum.miktar ?? 0;
  const kullanimYuzdesi = finansalUtil.butceKullanimHesapla(
  toplamHarcama,
  kalem.limitMiktar
  );
  
  if (kullanimYuzdesi >= 100) {
  await prisma.bildirim.create({
  data: {
  kullaniciId,
  baslik: "Bütçe Limiti Aşıldı!",
  mesaj: `Bu kategoride belirlediğiniz ${kalem.limitMiktar.toLocaleString(
  "tr-TR"
  )} TL limitini aştınız. Toplam harcama: ${toplamHarcama.toLocaleString(
  "tr-TR"
  )} TL`,
  tip: "BUTCE_ASIMI",
  yonlendirme: `/butce`,
  },
  });
  } else if (kullanimYuzdesi >= kalem.uyariYuzdesi) {
  await prisma.bildirim.create({
  data: {
  kullaniciId,
  baslik: "Bütçe Uyarısı",
  mesaj: `Bu kategoride limitinizin %${kullanimYuzdesi}'ini kullandınız. Kalan: ${(
  kalem.limitMiktar - toplamHarcama
  ).toLocaleString("tr-TR")} TL`,
  tip: "BUTCE_UYARI",
  yonlendirme: `/butce`,
  },
  });
  }
  },
  
  /** Yakın ödemeleri getir (bu ve önümüzdeki ay) */
  async yakinOdemeleriGetir(kullaniciId: string) {
  const bugun = new Date();
  const ayinSonGunu = new Date(bugun.getFullYear(), bugun.getMonth() + 1, 0);
  
  // Gelecek 60 gün içindeki sabit işlemleri al
  const gelecekTarih = new Date(bugun);
  gelecekTarih.setDate(gelecekTarih.getDate() + 60);
  
  const sabitIslemler = await prisma.islem.findMany({
  where: {
  kullaniciId,
  sabitMi: true,
  },
  include: {
  kategori: {
  select: { id: true, ad: true, renk: true, ikon: true },
  },
  },
  });
  
  // Yakın ödemeleri hesapla
  const yakinOdemeler = sabitIslemler
  .map((islem) => {
  if (!islem.odemeGunu) return null;
  
  // Bu ay için ödeme tarihi
  const buAyTarih = new Date(bugun.getFullYear(), bugun.getMonth(), islem.odemeGunu);
  const gelecekAyTarih = new Date(bugun.getFullYear(), bugun.getMonth() + 1, islem.odemeGunu);
  
  // Ödeme günü geçmiş mi kontrol et
  let odeyecegiTarih: Date | null = null;
  
  if (buAyTarih >= bugun && buAyTarih <= gelecekTarih) {
  odeyecegiTarih = buAyTarih;
  } else if (gelecekAyTarih <= gelecekTarih) {
  odeyecegiTarih = gelecekAyTarih;
  }
  
  if (!odeyecegiTarih) return null;
  
  const gunFarki = Math.ceil((odeyecegiTarih.getTime() - bugun.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
  id: islem.id,
  baslik: islem.baslik,
  miktar: islem.miktar,
  tip: islem.tip,
  odemeGunu: islem.odemeGunu,
  odendi: islem.odendi,
  sonOdemeTarihi: islem.sonOdemeTarihi,
  odeyecegiTarih: odeyecegiTarih.toISOString(),
  gunFarki,
  durum: gunFarki <= 3 ? 'YAKIN' : gunFarki <= 7 ? 'BU_HAFTA' : 'NORMAL',
  kategori: islem.kategori,
  };
  })
  .filter((item): item is NonNullable<typeof item> => item !== null)
  .sort((a, b) => a.gunFarki - b.gunFarki);
  
  // Toplam tutarları hesapla
  const toplamGider = yakinOdemeler
  .filter((o) => o.tip === 'GIDER')
  .reduce((acc, o) => acc + o.miktar, 0);
  
  const toplamGelir = yakinOdemeler
  .filter((o) => o.tip === 'GELIR')
  .reduce((acc, o) => acc + o.miktar, 0);
  
  return {
  odemeler: yakinOdemeler,
  istatistikler: {
  toplamGider,
  toplamGelir,
  net: toplamGelir - toplamGider,
  sayi: yakinOdemeler.length,
  odenecekSayi: yakinOdemeler.filter((o) => !o.odendi && o.tip === 'GIDER').length,
  },
  };
  },
  
  /** Ödeme durumunu güncelle */
  async odemeDurumGuncelle(kullaniciId: string, islemId: string, odendi: boolean) {
  const islem = await prisma.islem.findUnique({
  where: { id: islemId },
  });
  
  if (!islem) {
  throw ApiError.notFound("İşlem bulunamadı");
  }
  
  if (islem.kullaniciId !== kullaniciId) {
  throw ApiError.forbidden("Bu işleme erişim yetkiniz yok");
  }
  
  if (!islem.sabitMi) {
  throw ApiError.badRequest("Sadece sabit işlemler için kullanılabilir");
  }
  
  return prisma.islem.update({
  where: { id: islemId },
  data: {
  odendi,
  sonOdemeTarihi: odendi ? new Date() : null,
  },
  include: {
  kategori: {
  select: { id: true, ad: true, renk: true, ikon: true },
  },
  },
  });
  },

  /** Harcama Coğrafyası (Harita Özeti) */
  async haritaOzeti(kullaniciId: string, baslangic?: Date, bitis?: Date) {
    const where: Prisma.IslemWhereInput = {
      kullaniciId,
      tip: "GIDER",
      konumAd: { not: null },
      enlem: { not: null },
      boylam: { not: null },
    };

    if (baslangic || bitis) {
      where.tarih = {
        ...(baslangic && { gte: baslangic }),
        ...(bitis && { lte: bitis }),
      };
    }

    const islemler = await prisma.islem.findMany({
      where,
      select: {
        id: true,
        miktar: true,
        konumAd: true,
        enlem: true,
        boylam: true,
        tarih: true,
        baslik: true,
        kategori: { select: { ad: true, renk: true, ikon: true } }
      }
    });

    // Group by location
    const locations = new Map<string, {
      konumAd: string;
      enlem: number;
      boylam: number;
      toplamGider: number;
      islemSayisi: number;
      sonIslemTarihi: Date;
      islemler: any[];
    }>();

    islemler.forEach(islem => {
      if (!islem.konumAd) return;
      const existing = locations.get(islem.konumAd) || {
        konumAd: islem.konumAd,
        enlem: islem.enlem!,
        boylam: islem.boylam!,
        toplamGider: 0,
        islemSayisi: 0,
        sonIslemTarihi: islem.tarih,
        islemler: []
      };

      existing.toplamGider += islem.miktar;
      existing.islemSayisi += 1;
      if (islem.tarih > existing.sonIslemTarihi) {
        existing.sonIslemTarihi = islem.tarih;
      }
      
      existing.islemler.push({
        id: islem.id,
        baslik: islem.baslik,
        miktar: islem.miktar,
        tarih: islem.tarih,
        kategori: islem.kategori
      });

      locations.set(islem.konumAd, existing);
    });

    const haritaVerisi = Array.from(locations.values()).sort((a, b) => b.toplamGider - a.toplamGider);
    const enCokHarcananKonum = haritaVerisi.length > 0 ? haritaVerisi[0] : null;

    return {
      haritaVerisi,
      enCokHarcananKonum,
      toplamIslem: islemler.length
    };
  }
};