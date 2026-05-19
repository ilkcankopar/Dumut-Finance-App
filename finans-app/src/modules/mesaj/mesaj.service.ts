import { prisma } from '../../prisma/client';

export const mesajService = {
  async mesajGonder(
    gonderenId: string,
    aliciId: string,
    icerik: string,
    mesajTipi: 'METIN' | 'PAYLASIM' = 'METIN',
    paylasimTipi?: 'HEDEF' | 'BUTCE' | 'ISLEM' | 'ROZET',
    paylasimVerisi?: any
  ) {
    // Arkadaş olup olmadığını kontrol et
    const arkadaslik = await prisma.arkadaslik.findFirst({
      where: {
        OR: [
          { gonderenId, alinanId: aliciId, kabul: true },
          { gonderenId: aliciId, alinanId: gonderenId, kabul: true },
        ],
      },
    });

    if (!arkadaslik) {
      throw new Error('Bu kullanıcıyla mesajlaşmak için arkadaş olmalısınız');
    }

    const mesaj = await prisma.mesaj.create({
      data: {
        gonderenId,
        aliciId,
        icerik,
        mesajTipi,
        paylasimTipi,
        paylasimVerisi,
      },
      include: {
        gonderen: { select: { id: true, ad: true, soyad: true, profilResmi: true } },
        alici: { select: { id: true, ad: true, soyad: true, profilResmi: true } },
      },
    });

    return mesaj;
  },

  async konusmalar(kullaniciId: string) {
    // Son mesajları olan benzersiz konuşmaları getir
    const mesajlar = await prisma.mesaj.findMany({
      where: {
        OR: [{ gonderenId: kullaniciId }, { aliciId: kullaniciId }],
      },
      include: {
        gonderen: { select: { id: true, ad: true, soyad: true, profilResmi: true, level: true } },
        alici: { select: { id: true, ad: true, soyad: true, profilResmi: true, level: true } },
      },
      orderBy: { olusturuldu: 'desc' },
    });

    // Benzersiz konuşmaları grupla
    const konusmaMap = new Map<string, any>();

    for (const mesaj of mesajlar) {
      const digerKullaniciId = mesaj.gonderenId === kullaniciId ? mesaj.aliciId : mesaj.gonderenId;
      
      if (!konusmaMap.has(digerKullaniciId)) {
        const digerKullanici = mesaj.gonderenId === kullaniciId ? mesaj.alici : mesaj.gonderen;
        
        // Okunmamış mesaj sayısı
        const okunmamisSayisi = await prisma.mesaj.count({
          where: {
            gonderenId: digerKullaniciId,
            aliciId: kullaniciId,
            okunduMu: false,
          },
        });

        konusmaMap.set(digerKullaniciId, {
          kullanici: digerKullanici,
          sonMesaj: mesaj,
          okunmamisSayisi,
        });
      }
    }

    return Array.from(konusmaMap.values());
  },

  async mesajlariGetir(kullaniciId: string, digerKullaniciId: string, sayfa = 1, limit = 50) {
    const mesajlar = await prisma.mesaj.findMany({
      where: {
        OR: [
          { gonderenId: kullaniciId, aliciId: digerKullaniciId },
          { gonderenId: digerKullaniciId, aliciId: kullaniciId },
        ],
      },
      include: {
        gonderen: { select: { id: true, ad: true, soyad: true, profilResmi: true } },
      },
      orderBy: { olusturuldu: 'desc' },
      skip: (sayfa - 1) * limit,
      take: limit,
    });

    // Alınan mesajları okundu olarak işaretle
    await prisma.mesaj.updateMany({
      where: {
        gonderenId: digerKullaniciId,
        aliciId: kullaniciId,
        okunduMu: false,
      },
      data: { okunduMu: true },
    });

    return mesajlar.reverse();
  },

  async hedefPaylas(gonderenId: string, aliciId: string, hedefId: string) {
    const hedef = await prisma.hedef.findFirst({
      where: { id: hedefId, kullaniciId: gonderenId },
    });

    if (!hedef) {
      throw new Error('Hedef bulunamadı');
    }

    const ilerleme = hedef.hedefMiktar > 0 
      ? Math.round((hedef.mevcutMiktar / hedef.hedefMiktar) * 100) 
      : 0;

    return this.mesajGonder(
      gonderenId,
      aliciId,
      `Hedefimi seninle paylasiyorum: ${hedef.baslik}`,
      'PAYLASIM',
      'HEDEF',
      {
        hedefId: hedef.id,
        baslik: hedef.baslik,
        hedefMiktar: hedef.hedefMiktar,
        mevcutMiktar: hedef.mevcutMiktar,
        ilerleme,
        renk: hedef.renk,
      }
    );
  },

  async butcePaylas(gonderenId: string, aliciId: string) {
    const butceProfili = await prisma.butceProfili.findUnique({
      where: { kullaniciId: gonderenId },
    });

    if (!butceProfili) {
      throw new Error('Bütçe profili bulunamadı');
    }

    // Bu ayın işlemlerini hesapla
    const buAyBaslangic = new Date();
    buAyBaslangic.setDate(1);
    buAyBaslangic.setHours(0, 0, 0, 0);

    const islemler = await prisma.islem.findMany({
      where: {
        kullaniciId: gonderenId,
        tarih: { gte: buAyBaslangic },
      },
    });

    const toplamGelir = islemler.filter(i => i.tip === 'GELIR').reduce((t, i) => t + Number(i.miktar), 0);
    const toplamGider = islemler.filter(i => i.tip === 'GIDER').reduce((t, i) => t + Number(i.miktar), 0);
    const tasarruf = toplamGelir - toplamGider;

    return this.mesajGonder(
      gonderenId,
      aliciId,
      `Bu ayki butce durumum`,
      'PAYLASIM',
      'BUTCE',
      {
        aylikHedef: butceProfili.aylikHedefHarcama,
        toplamGelir,
        toplamGider,
        tasarruf,
        paraBirimi: butceProfili.paraBirimi,
      }
    );
  },

  async rozetPaylas(gonderenId: string, aliciId: string, rozetId: string) {
    const kullaniciRozet = await prisma.kullaniciRozet.findFirst({
      where: { kullaniciId: gonderenId, rozetId },
      include: { rozet: true },
    });

    if (!kullaniciRozet) {
      throw new Error('Rozet bulunamadı');
    }

    return this.mesajGonder(
      gonderenId,
      aliciId,
      `Yeni bir rozet kazandim: ${kullaniciRozet.rozet.ad}`,
      'PAYLASIM',
      'ROZET',
      {
        rozetId: kullaniciRozet.rozet.id,
        ad: kullaniciRozet.rozet.ad,
        aciklama: kullaniciRozet.rozet.aciklama,
        ikon: kullaniciRozet.rozet.ikon,
        kazanildi: kullaniciRozet.kazanildi,
      }
    );
  },

  async okunmamisSayisi(kullaniciId: string) {
    return prisma.mesaj.count({
      where: {
        aliciId: kullaniciId,
        okunduMu: false,
      },
    });
  },
};
