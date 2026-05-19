import { prisma } from '../../prisma/client';

// Unvan sistemi - level aralıklarına göre
const UNVANLAR = [
  { minLevel: 1, maxLevel: 5, unvan: 'Çaylak' },
  { minLevel: 6, maxLevel: 10, unvan: 'Acemi Tasarrufçu' },
  { minLevel: 11, maxLevel: 20, unvan: 'Birikimci' },
  { minLevel: 21, maxLevel: 30, unvan: 'Bütçe Ustası' },
  { minLevel: 31, maxLevel: 40, unvan: 'Finans Danışmanı' },
  { minLevel: 41, maxLevel: 50, unvan: 'Para Sihirbazı' },
  { minLevel: 51, maxLevel: 60, unvan: 'Tasarruf Kahramanı' },
  { minLevel: 61, maxLevel: 70, unvan: 'Ekonomi Uzmanı' },
  { minLevel: 71, maxLevel: 80, unvan: 'Finans Gurusu' },
  { minLevel: 81, maxLevel: 90, unvan: 'Para Efsanesi' },
  { minLevel: 91, maxLevel: 100, unvan: 'Finans Tanrısı' },
];

// Lig sistemi
const LIGLER = [
  { minLevel: 1, maxLevel: 20, lig: 'Bronz', renk: '#CD7F32' },
  { minLevel: 21, maxLevel: 40, lig: 'Gümüş', renk: '#C0C0C0' },
  { minLevel: 41, maxLevel: 60, lig: 'Altın', renk: '#FFD700' },
  { minLevel: 61, maxLevel: 80, lig: 'Elmas', renk: '#00CED1' },
  { minLevel: 81, maxLevel: 100, lig: 'Şampiyon', renk: '#9C27B0' },
];

// XP kazanma sebepleri ve miktarları
export const XP_KAZANIMLARI = {
  ISLEM_EKLE: 10,
  ISLEM_SESLE_EKLE: 15,
  HEDEF_OLUSTUR: 20,
  HEDEF_TAMAMLA: 100,
  HEDEF_ILERLEME: 5, // Her %10 ilerleme
  BUTCE_ALTI: 50, // Ay sonu bütçe altında kalma
  SERI_7_GUN: 75,
  SERI_30_GUN: 250,
  ARKADAS_EKLE: 25,
  ROZET_KAZAN: 50,
  GUNLUK_GIRIS: 5,
  RAPOR_INCELE: 10,
  KATEGORI_OLUSTUR: 15,
};

// Level için gereken XP hesaplama (exponential growth)
const hesaplaGerekliXP = (level: number): number => {
  return Math.floor(100 * Math.pow(1.15, level - 1));
};

// Level'e göre unvan bul
const unvanBul = (level: number): string => {
  const unvanObj = UNVANLAR.find(u => level >= u.minLevel && level <= u.maxLevel);
  return unvanObj?.unvan || 'Çaylak';
};

// Level'e göre lig bul
const ligBul = (level: number): string => {
  const ligObj = LIGLER.find(l => level >= l.minLevel && level <= l.maxLevel);
  return ligObj?.lig || 'Bronz';
};

export const levelService = {
  // Kullanıcı bilgilerini getir
  async durumGetir(kullaniciId: string) {
    const kullanici = await prisma.kullanici.findUnique({
      where: { id: kullaniciId },
      select: {
        id: true,
        ad: true,
        soyad: true,
        profilResmi: true,
        level: true,
        xp: true,
        toplamXP: true,
        unvan: true,
        lig: true,
      },
    });

    if (!kullanici) return null;

    const sonrakiLevelXP = hesaplaGerekliXP(kullanici.level + 1);
    const mevcutLevelXP = hesaplaGerekliXP(kullanici.level);
    const ilerlemePuani = kullanici.xp - mevcutLevelXP;
    const ilerlemeYuzdesi = kullanici.level >= 100 
      ? 100 
      : Math.floor((ilerlemePuani / (sonrakiLevelXP - mevcutLevelXP)) * 100);

    return {
      ...kullanici,
      sonrakiLevelXP,
      mevcutLevelXP,
      ilerlemeYuzdesi: Math.max(0, Math.min(100, ilerlemeYuzdesi)),
      kalanXP: Math.max(0, sonrakiLevelXP - kullanici.xp),
      ligler: LIGLER,
      unvanlar: UNVANLAR,
    };
  },

  // XP ekle ve level kontrolü yap
  async xpEkle(kullaniciId: string, miktar: number, sebep: string) {
    const kullanici = await prisma.kullanici.findUnique({
      where: { id: kullaniciId },
      select: { level: true, xp: true, toplamXP: true, unvan: true, lig: true },
    });

    if (!kullanici) return null;

    const yeniXP = kullanici.xp + miktar;
    const yeniToplamXP = kullanici.toplamXP + miktar;
    
    // Level atlama kontrolü
    let yeniLevel = kullanici.level;
    let tempXP = yeniXP;
    
    while (yeniLevel < 100 && tempXP >= hesaplaGerekliXP(yeniLevel + 1)) {
      yeniLevel++;
    }

    const levelAtladi = yeniLevel > kullanici.level;
    const yeniUnvan = unvanBul(yeniLevel);
    const yeniLig = ligBul(yeniLevel);
    const unvanDegisti = yeniUnvan !== kullanici.unvan;
    const ligDegisti = yeniLig !== kullanici.lig;

    // Veritabanını güncelle
    const guncellenen = await prisma.kullanici.update({
      where: { id: kullaniciId },
      data: {
        xp: yeniXP,
        toplamXP: yeniToplamXP,
        level: yeniLevel,
        unvan: yeniUnvan,
        lig: yeniLig,
      },
      select: {
        id: true,
        level: true,
        xp: true,
        toplamXP: true,
        unvan: true,
        lig: true,
      },
    });

    // Level atladıysa bildirim oluştur
    if (levelAtladi) {
      await prisma.bildirim.create({
        data: {
          kullaniciId,
          baslik: `Level ${yeniLevel}!`,
          mesaj: `Tebrikler! Level ${yeniLevel}'e ulaştın. ${unvanDegisti ? `Yeni unvanın: ${yeniUnvan}` : ''}`,
          okundu: false,
          tip: 'LEVEL',
        },
      });
    }

    // Lig değiştiyse bildirim
    if (ligDegisti) {
      await prisma.bildirim.create({
        data: {
          kullaniciId,
          baslik: `${yeniLig} Lig!`,
          mesaj: `Tebrikler! ${yeniLig} Lig'e yükseldin!`,
          okundu: false,
          tip: 'LIG',
        },
      });
    }

    return {
      ...guncellenen,
      kazanilanXP: miktar,
      sebep,
      levelAtladi,
      eskiLevel: kullanici.level,
      unvanDegisti,
      eskiUnvan: kullanici.unvan,
      ligDegisti,
      eskiLig: kullanici.lig,
    };
  },

  // Global liderlik sıralaması
  async globalSiralama(kullaniciId: string, sayfa: number = 1, limit: number = 50) {
    const skip = (sayfa - 1) * limit;

    const [kullanicilar, toplam, benimSiram] = await Promise.all([
      prisma.kullanici.findMany({
        orderBy: { toplamXP: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          ad: true,
          soyad: true,
          profilResmi: true,
          level: true,
          toplamXP: true,
          unvan: true,
          lig: true,
        },
      }),
      prisma.kullanici.count(),
      prisma.kullanici.count({
        where: {
          toplamXP: {
            gt: (await prisma.kullanici.findUnique({
              where: { id: kullaniciId },
              select: { toplamXP: true },
            }))?.toplamXP || 0,
          },
        },
      }),
    ]);

    return {
      kullanicilar: kullanicilar.map((k, i) => ({
        ...k,
        sira: skip + i + 1,
        benMi: k.id === kullaniciId,
      })),
      benimSiram: benimSiram + 1,
      meta: {
        toplam,
        sayfa,
        limit,
        toplamSayfa: Math.ceil(toplam / limit),
      },
    };
  },

  // Arkadaşlar arası sıralama
  async arkadasSiralamaXP(kullaniciId: string) {
    // Önce arkadaşları bul
    const arkadasliklar = await prisma.arkadaslik.findMany({
      where: {
        kabul: true,
        OR: [
          { gonderenId: kullaniciId },
          { alinanId: kullaniciId },
        ],
      },
      select: {
        gonderenId: true,
        alinanId: true,
      },
    });

    const arkadasIdler = arkadasliklar.map(a => 
      a.gonderenId === kullaniciId ? a.alinanId : a.gonderenId
    );
    arkadasIdler.push(kullaniciId); // Kendini de ekle

    const siralama = await prisma.kullanici.findMany({
      where: {
        id: { in: arkadasIdler },
      },
      orderBy: { toplamXP: 'desc' },
      select: {
        id: true,
        ad: true,
        soyad: true,
        profilResmi: true,
        level: true,
        toplamXP: true,
        unvan: true,
        lig: true,
      },
    });

    return siralama.map((k, i) => ({
      ...k,
      sira: i + 1,
      benMi: k.id === kullaniciId,
      arkadas: k.id !== kullaniciId,
    }));
  },

  // Lig bazlı sıralama
  async ligSiralamaXP(kullaniciId: string, ligAdi?: string) {
    const kullanici = await prisma.kullanici.findUnique({
      where: { id: kullaniciId },
      select: { lig: true },
    });

    const hedefLig = ligAdi || kullanici?.lig || 'Bronz';

    const siralama = await prisma.kullanici.findMany({
      where: { lig: hedefLig },
      orderBy: { toplamXP: 'desc' },
      take: 100,
      select: {
        id: true,
        ad: true,
        soyad: true,
        profilResmi: true,
        level: true,
        toplamXP: true,
        unvan: true,
        lig: true,
      },
    });

    return {
      lig: hedefLig,
      kullanicilar: siralama.map((k, i) => ({
        ...k,
        sira: i + 1,
        benMi: k.id === kullaniciId,
      })),
    };
  },

  // Level istatistikleri
  async istatistikler(kullaniciId: string) {
    const kullanici = await prisma.kullanici.findUnique({
      where: { id: kullaniciId },
      select: {
        level: true,
        xp: true,
        toplamXP: true,
        unvan: true,
        lig: true,
        olusturuldu: true,
        _count: {
          select: {
            islemler: true,
            hedefler: true,
            rozetler: true,
            gonderenArkadaslik: { where: { kabul: true } },
            alinanArkadaslik: { where: { kabul: true } },
          },
        },
      },
    });

    if (!kullanici) return null;

    const tamamlananHedefler = await prisma.hedef.count({
      where: { kullaniciId, durum: 'TAMAMLANDI' },
    });

    const gunSayisi = Math.floor(
      (Date.now() - kullanici.olusturuldu.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    return {
      level: kullanici.level,
      xp: kullanici.xp,
      toplamXP: kullanici.toplamXP,
      unvan: kullanici.unvan,
      lig: kullanici.lig,
      gunlukOrtalamaXP: Math.floor(kullanici.toplamXP / gunSayisi),
      toplamIslem: kullanici._count.islemler,
      toplamHedef: kullanici._count.hedefler,
      tamamlananHedef: tamamlananHedefler,
      toplamRozet: kullanici._count.rozetler,
      toplamArkadas: kullanici._count.gonderenArkadaslik + kullanici._count.alinanArkadaslik,
      uyeGunSayisi: gunSayisi,
    };
  },

  // Kullanıcı public profili
  async kullaniciProfilGetir(hedefKullaniciId: string, isteyenKullaniciId: string) {
    const kullanici = await prisma.kullanici.findUnique({
      where: { id: hedefKullaniciId },
      select: {
        id: true,
        ad: true,
        soyad: true,
        profilResmi: true,
        level: true,
        toplamXP: true,
        unvan: true,
        lig: true,
        olusturuldu: true,
        _count: {
          select: {
            islemler: true,
            hedefler: true,
            rozetler: true,
            gonderenArkadaslik: { where: { kabul: true } },
            alinanArkadaslik: { where: { kabul: true } },
          },
        },
        rozetler: {
          include: { rozet: true },
          orderBy: { kazanildi: 'desc' },
          take: 6,
        },
      },
    });

    if (!kullanici) return null;

    // Arkadaşlık durumunu kontrol et
    const arkadaslik = await prisma.arkadaslik.findFirst({
      where: {
        OR: [
          { gonderenId: isteyenKullaniciId, alinanId: hedefKullaniciId },
          { gonderenId: hedefKullaniciId, alinanId: isteyenKullaniciId },
        ],
      },
    });

    // Global sıralamadaki yeri
    const siralama = await prisma.kullanici.count({
      where: { toplamXP: { gt: kullanici.toplamXP } },
    }) + 1;

    const tamamlananHedef = await prisma.hedef.count({
      where: { kullaniciId: hedefKullaniciId, durum: 'TAMAMLANDI' },
    });

    const gunSayisi = Math.floor(
      (Date.now() - kullanici.olusturuldu.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    return {
      id: kullanici.id,
      ad: kullanici.ad,
      soyad: kullanici.soyad,
      avatar: `${kullanici.ad[0]}${kullanici.soyad[0]}`,
      profilResmi: kullanici.profilResmi,
      level: kullanici.level,
      toplamXP: kullanici.toplamXP,
      unvan: kullanici.unvan,
      lig: kullanici.lig,
      globalSira: siralama,
      istatistikler: {
        toplamIslem: kullanici._count.islemler,
        toplamHedef: kullanici._count.hedefler,
        tamamlananHedef,
        toplamRozet: kullanici._count.rozetler,
        toplamArkadas: kullanici._count.gonderenArkadaslik + kullanici._count.alinanArkadaslik,
        uyeGunSayisi: gunSayisi,
      },
      sonRozetler: kullanici.rozetler.map(r => ({
        id: r.rozet.id,
        ad: r.rozet.ad,
        ikon: r.rozet.ikon,
        renk: r.rozet.renk,
        kazanildi: r.kazanildi,
      })),
      arkadaslikDurum: arkadaslik ? (arkadaslik.kabul ? 'arkadas' : 'bekliyor') : 'degil',
      benMi: hedefKullaniciId === isteyenKullaniciId,
    };
  },
};
