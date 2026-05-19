import { prisma } from "@/prisma/client";
import { ApiError } from "@utils/ApiError";
import { finansalUtil } from "@utils/finansal.util";
import { logger } from "@config/logger.config";
import {
  HedefOlusturDto,
  HedefGuncelleDto,
  HedefKatkiDto,
} from "./hedef.schema";
import { levelService, XP_KAZANIMLARI } from "../level/level.service";
import { rozetService } from "../rozet/rozet.service";

export const hedefService = {
  // ─────────────────────────────────────────
  // HEDEF OLUŞTUR
  // ─────────────────────────────────────────
  async hedefOlustur(kullaniciId: string, dto: HedefOlusturDto) {
    // Aynı isimde aktif hedef var mı?
    const mevcutHedef = await prisma.hedef.findFirst({
      where: {
        kullaniciId,
        baslik: { equals: dto.baslik, mode: "insensitive" },
        durum: "DEVAM_EDIYOR",
      },
    });

    if (mevcutHedef) {
      throw ApiError.conflict(
        `"${dto.baslik}" adında devam eden bir hedef zaten var`
      );
    }

    const hedef = await prisma.hedef.create({
      data: { ...dto, kullaniciId },
    });

    // XP ver
    await levelService.xpEkle(kullaniciId, XP_KAZANIMLARI.HEDEF_OLUSTUR, 'Hedef oluşturuldu');
    
    // Rozet kontrolü
    rozetService.rozetKontrolEt(kullaniciId).catch(console.error);

    logger.info(`[Hedef] Oluşturuldu: ${kullaniciId} → ${hedef.baslik}`);
    return hedef;
  },

  // ─────────────────────────────────────────
  // HEDEFLERİ GETİR
  // Progress bar için tüm hesaplamalar dahil
  // ─────────────────────────────────────────
  async hedefleriGetir(kullaniciId: string) {
    const hedefler = await prisma.hedef.findMany({
      where: { kullaniciId },
      include: {
        // Son 5 katkı geçmişi (chart için)
        hedefGecmisi: {
          orderBy: { tarih: "desc" },
          take: 5,
        },
        // Toplam katkı sayısı
        _count: {
          select: { hedefGecmisi: true },
        },
      },
      orderBy: [
        { durum: "asc" },       // Devam edenler önce
        { oncelik: "desc" },    // Yüksek öncelik önce
        { olusturuldu: "desc" },
      ],
    });

    return hedefler.map((hedef) => this._hedefHesapla(hedef));
  },

  // ─────────────────────────────────────────
  // TEK HEDEF GETİR
  // ─────────────────────────────────────────
  async hedefGetir(kullaniciId: string, hedefId: string) {
    const hedef = await prisma.hedef.findUnique({
      where: { id: hedefId },
      include: {
        // Tüm katkı geçmişi (zaman çizelgesi chart için)
        hedefGecmisi: {
          orderBy: { tarih: "asc" },
        },
        _count: {
          select: { hedefGecmisi: true },
        },
      },
    });

    if (!hedef) throw ApiError.notFound("Hedef bulunamadı");

    // Kendi hedefi mi veya arkadaşının paylaştığı mı?
    if (hedef.kullaniciId !== kullaniciId) {
      // Arkadaşın hedefini görme iznini kontrol et
      const arkadas = await prisma.arkadaslik.findFirst({
        where: {
          OR: [
            { gonderenId: kullaniciId, alinanId: hedef.kullaniciId },
            { gonderenId: hedef.kullaniciId, alinanId: kullaniciId },
          ],
          kabul: true,
        },
      });

      if (!arkadas || !hedef.herkesGorsun) {
        throw ApiError.forbidden("Bu hedefe erişim yetkiniz yok");
      }
    }

    return this._hedefHesapla(hedef);
  },

  // ─────────────────────────────────────────
  // HEDEF GÜNCELLE
  // ─────────────────────────────────────────
  async hedefGuncelle(
    kullaniciId: string,
    hedefId: string,
    dto: HedefGuncelleDto
  ) {
    const hedef = await prisma.hedef.findUnique({
      where: { id: hedefId },
    });

    if (!hedef) throw ApiError.notFound("Hedef bulunamadı");
    if (hedef.kullaniciId !== kullaniciId) {
      throw ApiError.forbidden("Bu hedefi düzenleme yetkiniz yok");
    }
    if (hedef.durum === "TAMAMLANDI") {
      throw ApiError.badRequest("Tamamlanan hedef düzenlenemez");
    }

    // Yeni hedef miktarı mevcut birikimden az olamaz
    if (dto.hedefMiktar && dto.hedefMiktar < hedef.mevcutMiktar) {
      throw ApiError.badRequest(
        `Hedef miktar mevcut birikimden (${hedef.mevcutMiktar} TL) az olamaz`
      );
    }

    return prisma.hedef.update({
      where: { id: hedefId },
      data: dto,
    });
  },

  // ─────────────────────────────────────────
  // HEDEFE KATKI YAP
  // Progress bar'ı güncelleyen ana fonksiyon
  // ─────────────────────────────────────────
  async katki(
    kullaniciId: string,
    hedefId: string,
    dto: HedefKatkiDto
  ) {
    const hedef = await prisma.hedef.findUnique({
      where: { id: hedefId },
    });

    if (!hedef) throw ApiError.notFound("Hedef bulunamadı");
    if (hedef.kullaniciId !== kullaniciId) {
      throw ApiError.forbidden("Bu hedefe katkı yapma yetkiniz yok");
    }
    if (hedef.durum !== "DEVAM_EDIYOR") {
      throw ApiError.badRequest("Sadece devam eden hedeflere katkı yapılabilir");
    }

    const yeniMiktar = hedef.mevcutMiktar + dto.miktar;
    const tamamlandi = yeniMiktar >= hedef.hedefMiktar;
    const kesinMiktar = tamamlandi ? hedef.hedefMiktar : yeniMiktar;

    // Transaction: hem hedefi güncelle hem geçmişe ekle
    const [guncelHedef] = await prisma.$transaction([
      // Hedefi güncelle
      prisma.hedef.update({
        where: { id: hedefId },
        data: {
          mevcutMiktar: kesinMiktar,
          durum: tamamlandi ? "TAMAMLANDI" : "DEVAM_EDIYOR",
          guncellendi: new Date(),
        },
      }),
      // Katkıyı geçmişe kaydet
      prisma.hedefGecmisi.create({
        data: {
          hedefId,
          miktar: dto.miktar,
          notlar: dto.notlar,
        },
      }),
    ]);

    // Hedef tamamlandıysa bildirim gönder
    if (tamamlandi) {
      await prisma.bildirim.create({
        data: {
          kullaniciId,
          baslik: "🎉 Hedef Tamamlandı!",
          mesaj: `"${hedef.baslik}" hedefine ulaştınız! Tebrikler!`,
          tip: "HEDEF",
          yonlendirme: `/hedefler/${hedefId}`,
        },
      });

      // XP ver - hedef tamamlama
      await levelService.xpEkle(kullaniciId, XP_KAZANIMLARI.HEDEF_TAMAMLA, 'Hedef tamamlandı');
      
      // Rozet kontrolü
      rozetService.rozetKontrolEt(kullaniciId).catch(console.error);

      // Seri güncelle
      await this._seriGuncelle(kullaniciId);

      logger.info(
        `[Hedef] Tamamlandı: ${kullaniciId} → ${hedef.baslik}`
      );
    } else {
      // Yüzde 50 ve 75'e ulaşınca motivasyon bildirimi
      const yuzde = finansalUtil.hedefYuzdesiHesapla(
        kesinMiktar,
        hedef.hedefMiktar
      );

      if (yuzde >= 75 && hedef.mevcutMiktar / hedef.hedefMiktar < 0.75) {
        await prisma.bildirim.create({
          data: {
            kullaniciId,
            baslik: "💪 Hedefe Yaklaşıyorsun!",
            mesaj: `"${hedef.baslik}" hedefinin %75'ine ulaştın!`,
            tip: "HEDEF",
            yonlendirme: `/hedefler/${hedefId}`,
          },
        });
      } else if (
        yuzde >= 50 &&
        hedef.mevcutMiktar / hedef.hedefMiktar < 0.5
      ) {
        await prisma.bildirim.create({
          data: {
            kullaniciId,
            baslik: "🚀 Yarı Yola Geldin!",
            mesaj: `"${hedef.baslik}" hedefinin yarısına ulaştın!`,
            tip: "HEDEF",
            yonlendirme: `/hedefler/${hedefId}`,
          },
        });
      }
    }

    return {
      hedef: this._hedefHesapla(guncelHedef),
      tamamlandi,
      eklenenMiktar: dto.miktar,
    };
  },

  // ─────────────────────────────────────────
  // HEDEF SİL
  // ─────────────────────────────────────────
  async hedefSil(kullaniciId: string, hedefId: string) {
    const hedef = await prisma.hedef.findUnique({
      where: { id: hedefId },
    });

    if (!hedef) throw ApiError.notFound("Hedef bulunamadı");
    if (hedef.kullaniciId !== kullaniciId) {
      throw ApiError.forbidden("Bu hedefi silme yetkiniz yok");
    }

    // Geçmiş kayıtlarıyla birlikte sil
    await prisma.$transaction([
      prisma.hedefGecmisi.deleteMany({ where: { hedefId } }),
      prisma.hedef.delete({ where: { id: hedefId } }),
    ]);

    return { mesaj: "Hedef silindi" };
  },

  // ─────────────────────────────────────────
  // ARKADAŞIN HEDEFLERİNİ GETİR
  // Sadece herkesGorsun = true olanlar
  // ─────────────────────────────────────────
  async arkadasHedefleriniGetir(
    kullaniciId: string,
    arkadasId: string
  ) {
    // Arkadaşlık var mı kontrol et
    const arkadas = await prisma.arkadaslik.findFirst({
      where: {
        OR: [
          { gonderenId: kullaniciId, alinanId: arkadasId },
          { gonderenId: arkadasId, alinanId: kullaniciId },
        ],
        kabul: true,
      },
    });

    if (!arkadas) {
      throw ApiError.forbidden("Bu kullanıcı arkadaşınız değil");
    }

    const hedefler = await prisma.hedef.findMany({
      where: {
        kullaniciId: arkadasId,
        herkesGorsun: true,
        durum: "DEVAM_EDIYOR",
      },
      include: {
        _count: { select: { hedefGecmisi: true } },
      },
      orderBy: { oncelik: "desc" },
    });

    return hedefler.map((h) => this._hedefHesapla(h));
  },

  // ─────────────────────────────────────────
  // HEDEF GEÇMİŞİ GETİR
  // Chart.js zaman çizelgesi için
  // ─────────────────────────────────────────
  async hedefGecmisiniGetir(kullaniciId: string, hedefId: string) {
    const hedef = await prisma.hedef.findUnique({
      where: { id: hedefId },
    });

    if (!hedef) throw ApiError.notFound("Hedef bulunamadı");
    if (hedef.kullaniciId !== kullaniciId) {
      throw ApiError.forbidden("Bu hedefe erişim yetkiniz yok");
    }

    const gecmis = await prisma.hedefGecmisi.findMany({
      where: { hedefId },
      orderBy: { tarih: "asc" },
    });

    // Kümülatif toplam hesapla (Chart.js line chart için)
    let kumulatif = 0;
    const kumulatifGecmis = gecmis.map((g) => {
      kumulatif += g.miktar;
      return {
        ...g,
        kumulatifMiktar: kumulatif,
        // Hedefin yüzde kaçına ulaşıldı o noktada
        yuzde: finansalUtil.hedefYuzdesiHesapla(
          kumulatif,
          hedef.hedefMiktar
        ),
      };
    });

    return {
      hedef: this._hedefHesapla(hedef),
      gecmis: kumulatifGecmis,
    };
  },

  // ─────────────────────────────────────────
  // HEDEF İSTATİSTİKLERİ
  // Dashboard için özet
  // ─────────────────────────────────────────
  async istatistikler(kullaniciId: string) {
    const [hedefler, tamamlananlar] = await Promise.all([
      prisma.hedef.findMany({
        where: { kullaniciId },
        select: {
          durum: true,
          hedefMiktar: true,
          mevcutMiktar: true,
          oncelik: true,
        },
      }),
      prisma.hedef.count({
        where: { kullaniciId, durum: "TAMAMLANDI" },
      }),
    ]);

    const devamEden = hedefler.filter((h) => h.durum === "DEVAM_EDIYOR");
    const iptalEdilen = 0;

    // Aktif hedeflerin toplam değeri
    const toplamHedefMiktar = devamEden.reduce(
      (acc, h) => acc + h.hedefMiktar,
      0
    );
    const toplamBirikimMiktar = devamEden.reduce(
      (acc, h) => acc + h.mevcutMiktar,
      0
    );

    // En yakın tamamlanacak hedef
    const enYakin = devamEden
      .map((h) => ({
        ...h,
        kalan: h.hedefMiktar - h.mevcutMiktar,
        yuzde: finansalUtil.hedefYuzdesiHesapla(
          h.mevcutMiktar,
          h.hedefMiktar
        ),
      }))
      .sort((a, b) => b.yuzde - a.yuzde)[0];

    return {
      toplamHedef: hedefler.length,
      devamEden: devamEden.length,
      tamamlanan: tamamlananlar,
      iptalEdilen: iptalEdilen,
      toplamHedefMiktar,
      toplamBirikimMiktar,
      genelIlerleme: finansalUtil.hedefYuzdesiHesapla(
        toplamBirikimMiktar,
        toplamHedefMiktar
      ),
      enYakinHedef: enYakin ?? null,
    };
  },

  // ─────────────────────────────────────────
  // YARDIMCI: HEDEF HESAPLA
  // Her hedef için progress bar verisi ekle
  // ─────────────────────────────────────────
  _hedefHesapla(hedef: any) {
    const yuzde = finansalUtil.hedefYuzdesiHesapla(
      hedef.mevcutMiktar,
      hedef.hedefMiktar
    );

    const kalan = Math.max(hedef.hedefMiktar - hedef.mevcutMiktar, 0);

    // Hedefe kaç gün kaldı?
    const kalanGun = hedef.hedefTarihi
      ? Math.ceil(
          (new Date(hedef.hedefTarihi).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    // Günlük birikim gereksinimi
    const gunlukGerekenBirikim =
      kalanGun && kalanGun > 0 ? kalan / kalanGun : null;

    // Süre durumu
    let suruDurumu: "NORMAL" | "YAKLASAN" | "GECIKMIŞ" | "SÜRESIZ" =
      "SÜRESIZ";

    if (kalanGun !== null) {
      if (kalanGun < 0) suruDurumu = "GECIKMIŞ";
      else if (kalanGun <= 7) suruDurumu = "YAKLASAN";
      else suruDurumu = "NORMAL";
    }

    return {
      ...hedef,
      // Progress bar için
      yuzde,
      kalan,
      kalanGun,
      gunlukGerekenBirikim,
      suruDurumu,
      // Öncelik etiketi
      oncelikEtiketi:
        hedef.oncelik === 3
          ? "Yüksek"
          : hedef.oncelik === 2
          ? "Orta"
          : "Düşük",
    };
  },

  // ─────────────────────────────────────────
  // YARDIMCI: SERİ GÜNCELLE
  // Hedef tamamlanınca seriyi kontrol et
  // ─────────────────────────────────────────
  async _seriGuncelle(kullaniciId: string) {
    const seri = await prisma.seri.findFirst({
      where: {
        kullaniciId,
        tip: "GUNLUK_BUTCE_TUTTURMA",
      },
    });

    if (!seri) return;

    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);

    const sonKontrol = seri.sonKontrolTarihi
      ? new Date(seri.sonKontrolTarihi)
      : null;

    // Bugün zaten kontrol edildiyse tekrar güncelleme
    if (sonKontrol && sonKontrol >= bugun) return;

    await prisma.$transaction([
      prisma.seri.update({
        where: { id: seri.id },
        data: {
          mevcutSeri: { increment: 1 },
          enUzunSeri: Math.max(seri.enUzunSeri, seri.mevcutSeri + 1),
          toplamBasariliGun: { increment: 1 },
          sonKontrolTarihi: new Date(),
        },
      }),
      prisma.seriGecmisi.create({
        data: {
          seriId: seri.id,
          tarih: new Date(),
          basarili: true,
        },
      }),
    ]);
  },
};