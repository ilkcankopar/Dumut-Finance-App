import { prisma } from '../../prisma/client';
import { ApiError } from '@utils/ApiError';
import { ArkadaslikIstekGonderDto, ArkadaslikGuncelleDto, KullaniciAraDto } from './arkadaslik.schema';
import { levelService, XP_KAZANIMLARI } from '../level/level.service';
import { rozetService } from '../rozet/rozet.service';

export const arkadaslikService = {
  async istekGonder(gonderenId: string, dto: ArkadaslikIstekGonderDto) {
    if (gonderenId === dto.alinanId) {
      throw ApiError.badRequest('Kendinize arkadaşlık isteği gönderemezsiniz');
    }

    const alinan = await prisma.kullanici.findUnique({
      where: { id: dto.alinanId },
    });

    if (!alinan) {
      throw ApiError.notFound('Kullanıcı bulunamadı');
    }

    const mevcutIstek = await prisma.arkadaslik.findFirst({
      where: {
        OR: [
          { gonderenId, alinanId: dto.alinanId },
          { gonderenId: dto.alinanId, alinanId: gonderenId },
        ],
      },
    });

    if (mevcutIstek) {
      if (mevcutIstek.kabul) {
        throw ApiError.conflict('Zaten arkadaşsınız');
      }
      throw ApiError.conflict('Zaten bekleyen bir istek var');
    }

    const arkadaslik = await prisma.arkadaslik.create({
      data: {
        gonderenId,
        alinanId: dto.alinanId,
        kabul: false,
      },
      include: {
        alinan: {
          select: { id: true, ad: true, soyad: true, profilResmi: true },
        },
        gonderen: {
          select: { id: true, ad: true, soyad: true, profilResmi: true },
        },
      },
    });

    await prisma.bildirim.create({
      data: {
        kullaniciId: dto.alinanId,
        baslik: 'Yeni Arkadaşlık İsteği',
        mesaj: `${arkadaslik.gonderen?.ad || 'Bir kullanıcı'} size arkadaşlık isteği gönderdi`,
        okundu: false,
        tip: 'ARKADASLIK',
      },
    });

    return arkadaslik;
  },

  async istekKabulEt(kullaniciId: string, arkadaslikId: string) {
    const arkadaslik = await prisma.arkadaslik.findFirst({
      where: {
        id: arkadaslikId,
        alinanId: kullaniciId,
        kabul: false,
      },
    });

    if (!arkadaslik) {
      throw ApiError.notFound('Arkadaşlık isteği bulunamadı');
    }

    const guncellenmis = await prisma.arkadaslik.update({
      where: { id: arkadaslikId },
      data: { kabul: true },
      include: {
        gonderen: {
          select: { id: true, ad: true, soyad: true, profilResmi: true },
        },
        alinan: {
          select: { id: true, ad: true, soyad: true, profilResmi: true },
        },
      },
    });

    await prisma.bildirim.create({
      data: {
        kullaniciId: arkadaslik.gonderenId,
        baslik: 'Arkadaşlık İsteği Kabul Edildi',
        mesaj: `${guncellenmis.alinan?.ad || 'Bir kullanıcı'} arkadaşlık isteğinizi kabul etti`,
        okundu: false,
        tip: 'ARKADASLIK',
      },
    });

    // Her iki kullanıcıya da XP ver
    await Promise.all([
      levelService.xpEkle(kullaniciId, XP_KAZANIMLARI.ARKADAS_EKLE, 'Arkadaş eklendi'),
      levelService.xpEkle(arkadaslik.gonderenId, XP_KAZANIMLARI.ARKADAS_EKLE, 'Arkadaş eklendi'),
    ]);

    // Rozet kontrolü
    rozetService.rozetKontrolEt(kullaniciId).catch(console.error);
    rozetService.rozetKontrolEt(arkadaslik.gonderenId).catch(console.error);

    return guncellenmis;
  },

  async istekReddet(kullaniciId: string, arkadaslikId: string) {
    const arkadaslik = await prisma.arkadaslik.findFirst({
      where: {
        id: arkadaslikId,
        alinanId: kullaniciId,
        kabul: false,
      },
    });

    if (!arkadaslik) {
      throw ApiError.notFound('Arkadaşlık isteği bulunamadı');
    }

    await prisma.arkadaslik.delete({
      where: { id: arkadaslikId },
    });

    return { message: 'İstek reddedildi' };
  },

  async arkadasiSil(kullaniciId: string, arkadaslikId: string) {
    const arkadaslik = await prisma.arkadaslik.findFirst({
      where: {
        id: arkadaslikId,
        OR: [
          { gonderenId: kullaniciId },
          { alinanId: kullaniciId },
        ],
      },
    });

    if (!arkadaslik) {
      throw ApiError.notFound('Arkadaşlık bulunamadı');
    }

    await prisma.arkadaslik.delete({
      where: { id: arkadaslikId },
    });

    return { message: 'Arkadaş silindi' };
  },

  async arkadaslariGetir(kullaniciId: string) {
    const arkadasliklar = await prisma.arkadaslik.findMany({
      where: {
        kabul: true,
        OR: [
          { gonderenId: kullaniciId },
          { alinanId: kullaniciId },
        ],
      },
      include: {
        gonderen: {
          select: { id: true, ad: true, soyad: true, profilResmi: true, email: true },
        },
        alinan: {
          select: { id: true, ad: true, soyad: true, profilResmi: true, email: true },
        },
      },
      orderBy: { olusturuldu: 'desc' },
    });

    return arkadasliklar.map((a) => {
      const arkadas = a.gonderenId === kullaniciId ? a.alinan : a.gonderen;
      return {
        id: a.id,
        arkadas,
        hedefGoster: a.hedefGoster,
        raporGoster: a.raporGoster,
        olusturuldu: a.olusturuldu,
      };
    });
  },

  async bekleyenIstekleriGetir(kullaniciId: string) {
    const gelenIstekler = await prisma.arkadaslik.findMany({
      where: {
        alinanId: kullaniciId,
        kabul: false,
      },
      include: {
        gonderen: {
          select: { id: true, ad: true, soyad: true, profilResmi: true },
        },
      },
      orderBy: { olusturuldu: 'desc' },
    });

    const gidenIstekler = await prisma.arkadaslik.findMany({
      where: {
        gonderenId: kullaniciId,
        kabul: false,
      },
      include: {
        alinan: {
          select: { id: true, ad: true, soyad: true, profilResmi: true },
        },
      },
      orderBy: { olusturuldu: 'desc' },
    });

    return {
      gelenIstekler: gelenIstekler.map((i) => ({
        id: i.id,
        kullanici: i.gonderen,
        olusturuldu: i.olusturuldu,
      })),
      gidenIstekler: gidenIstekler.map((i) => ({
        id: i.id,
        kullanici: i.alinan,
        olusturuldu: i.olusturuldu,
      })),
    };
  },

  async ayarlariGuncelle(kullaniciId: string, arkadaslikId: string, dto: ArkadaslikGuncelleDto) {
    const arkadaslik = await prisma.arkadaslik.findFirst({
      where: {
        id: arkadaslikId,
        kabul: true,
        OR: [
          { gonderenId: kullaniciId },
          { alinanId: kullaniciId },
        ],
      },
    });

    if (!arkadaslik) {
      throw ApiError.notFound('Arkadaşlık bulunamadı');
    }

    return prisma.arkadaslik.update({
      where: { id: arkadaslikId },
      data: dto,
    });
  },

  async kullaniciAra(kullaniciId: string, dto: KullaniciAraDto) {
    const sayfa = parseInt(dto.sayfa || '1', 10);
    const limit = parseInt(dto.limit || '20', 10);
    const skip = (sayfa - 1) * limit;

    const where = {
      id: { not: kullaniciId },
      ...(dto.arama && {
        OR: [
          { ad: { contains: dto.arama, mode: 'insensitive' as const } },
          { soyad: { contains: dto.arama, mode: 'insensitive' as const } },
          { email: { contains: dto.arama, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [kullanicilar, toplam] = await Promise.all([
      prisma.kullanici.findMany({
        where,
        select: {
          id: true,
          ad: true,
          soyad: true,
          profilResmi: true,
          email: true,
        },
        skip,
        take: limit,
        orderBy: { ad: 'asc' },
      }),
      prisma.kullanici.count({ where }),
    ]);

    const mevcutArkadasliklar = await prisma.arkadaslik.findMany({
      where: {
        OR: [
          { gonderenId: kullaniciId },
          { alinanId: kullaniciId },
        ],
      },
      select: {
        gonderenId: true,
        alinanId: true,
        kabul: true,
      },
    });

    const arkadaslikDurumu = new Map<string, string>();
    mevcutArkadasliklar.forEach((a) => {
      const digerKullaniciId = a.gonderenId === kullaniciId ? a.alinanId : a.gonderenId;
      arkadaslikDurumu.set(digerKullaniciId, a.kabul ? 'arkadas' : 'beklemede');
    });

    const sonuc = kullanicilar.map((k) => ({
      ...k,
      arkadaslikDurumu: arkadaslikDurumu.get(k.id) || 'yok',
    }));

    return {
      kullanicilar: sonuc,
      meta: {
        toplam,
        sayfa,
        limit,
        toplamSayfa: Math.ceil(toplam / limit),
      },
    };
  },

  async siralamaGetir(kullaniciId: string) {
    const arkadaslar = await this.arkadaslariGetir(kullaniciId);
    const arkadasIdler = arkadaslar.map((a) => a.arkadas.id);
    arkadasIdler.push(kullaniciId);

    const buAy = new Date();
    buAy.setDate(1);
    buAy.setHours(0, 0, 0, 0);

    const siralama = await prisma.kullanici.findMany({
      where: {
        id: { in: arkadasIdler },
      },
      select: {
        id: true,
        ad: true,
        soyad: true,
        profilResmi: true,
        butceProfili: {
          select: { aylikHedefHarcama: true },
        },
        islemler: {
          where: {
            tarih: { gte: buAy },
            tip: 'GIDER',
          },
          select: { miktar: true },
        },
        hedefler: {
          where: { durum: 'TAMAMLANDI' },
          select: { id: true },
        },
      },
    });

    const siralamaVerisi = siralama.map((k) => {
      const toplamHarcama = k.islemler.reduce((t, i) => t + i.miktar, 0);
      const hedefHarcama = k.butceProfili?.aylikHedefHarcama || 0;
      const butceUyumu = hedefHarcama > 0 
        ? Math.max(0, 100 - ((toplamHarcama / hedefHarcama) * 100 - 100))
        : 100;

      return {
        kullanici: {
          id: k.id,
          ad: k.ad,
          soyad: k.soyad,
          profilResmi: k.profilResmi,
        },
        toplamHarcama,
        hedefHarcama,
        butceUyumu: Math.round(butceUyumu),
        tamamlananHedef: k.hedefler.length,
        benMi: k.id === kullaniciId,
      };
    });

    siralamaVerisi.sort((a, b) => {
      if (b.butceUyumu !== a.butceUyumu) return b.butceUyumu - a.butceUyumu;
      return b.tamamlananHedef - a.tamamlananHedef;
    });

    return siralamaVerisi.map((v, i) => ({ ...v, sira: i + 1 }));
  },
};
