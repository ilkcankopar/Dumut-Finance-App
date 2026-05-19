import { prisma } from '../../prisma/client';
import { ApiError } from '@utils/ApiError';
import { finansalUtil } from '@utils/finansal.util';
import { KurulumDto, ButceKalemiOlusturDto } from './butce.schema';
import { geminiFlash } from '@config/gemini.config';
import { piyasaService } from '../piyasa/piyasa.service';

export const butceService = {
  async kurulumTamamla(kullaniciId: string, dto: KurulumDto) {
    const profil = await prisma.butceProfili.findUnique({
      where: { kullaniciId },
    });

    if (!profil) throw ApiError.notFound('Bütçe profili bulunamadı');
    if (profil.kurulumTamamlandi)
      throw ApiError.conflict('Kurulum zaten tamamlanmış');

    await prisma.$transaction(async (tx) => {
      await tx.butceProfili.update({
        where: { kullaniciId },
        data: {
          aylikHedefHarcama: dto.aylikHedefHarcama,
          aylikToplamGelir: dto.aylikToplamGelir,
          paraBirimi: dto.paraBirimi,
          kurulumTamamlandi: true,
        },
      });

      if (dto.sabitGiderler?.length) {
        await tx.islem.createMany({
          data: dto.sabitGiderler.map((g) => {
            const islemTarihi = new Date();
            if (g.odemeGunu) {
              islemTarihi.setDate(g.odemeGunu);
            }
            return {
              kullaniciId,
              kategoriId: g.kategoriId,
              tip: 'GIDER' as const,
              baslik: g.baslik,
              miktar: g.miktar,
              periyot: g.periyot,
              sabitMi: true,
              tarih: islemTarihi,
            };
          }),
        });
      }

      if (dto.butceLimitleri?.length) {
        const profilId = profil.id;
        await tx.butceKalemi.createMany({
          data: dto.butceLimitleri.map((l) => ({
            kullaniciId,
            butceProfilId: profilId,
            kategoriId: l.kategoriId,
            limitMiktar: l.limitMiktar,
            uyariYuzdesi: l.uyariYuzdesi,
          })),
          skipDuplicates: true,
        });
      }
    });

    return { mesaj: 'Kurulum tamamlandı' };
  },

  async butceDurumunuGetir(kullaniciId: string) {
    const ayBaslangic = new Date();
    ayBaslangic.setDate(1);
    ayBaslangic.setHours(0, 0, 0, 0);

    const ayBitis = new Date(
      ayBaslangic.getFullYear(),
      ayBaslangic.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const [profil, islemler] = await Promise.all([
      prisma.butceProfili.findUnique({
        where: { kullaniciId },
        include: {
          butceKalemleri: {
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
          },
        },
      }),

      prisma.islem.findMany({
        where: {
          kullaniciId,
          OR: [
            { tarih: { gte: ayBaslangic, lte: ayBitis } },
            { sabitMi: true, tarih: { lte: ayBitis } }
          ]
        },
        select: { kategoriId: true, miktar: true, tip: true },
      }),
    ]);

    if (!profil) throw ApiError.notFound('Bütçe profili bulunamadı');

    const kategoriHarcamalari = new Map<string, number>();
    islemler.forEach((islem) => {
      if (islem.tip === 'GIDER') {
        const mevcut = kategoriHarcamalari.get(islem.kategoriId) ?? 0;
        kategoriHarcamalari.set(islem.kategoriId, mevcut + islem.miktar);
      }
    });

    const toplamGider = Array.from(kategoriHarcamalari.values()).reduce(
      (acc, val) => acc + val,
      0
    );
    const toplamGelir = islemler
      .filter((i) => i.tip === 'GELIR')
      .reduce((acc, i) => acc + i.miktar, 0);

    const kalemiDurumu = profil.butceKalemleri.map((kalem) => {
      const harcanan = kategoriHarcamalari.get(kalem.kategoriId) ?? 0;
      const kullanimYuzdesi = finansalUtil.butceKullanimHesapla(
        harcanan,
        kalem.limitMiktar
      );

      const kalan = Math.max(kalem.limitMiktar - harcanan, 0);
      const durum =
        kullanimYuzdesi >= 100
          ? 'ASIMI'
          : kullanimYuzdesi >= kalem.uyariYuzdesi
          ? 'UYARI'
          : 'NORMAL';

      return {
        ...kalem,
        harcanan,
        kalan,
        kullanimYuzdesi,
        durum,
      };
    });

    const tasarrufPotansiyeli = finansalUtil.tasarrufPotansiyeliHesapla(
      toplamGider,
      profil.aylikHedefHarcama
    );
    const hedefKullanim = finansalUtil.butceKullanimHesapla(
      toplamGider,
      profil.aylikHedefHarcama
    );

    // Ay içinde kalan gün hesabı
    const bugun = new Date();
    const ayinSonGunu = new Date(bugun.getFullYear(), bugun.getMonth() + 1, 0).getDate();
    const kalanGun = ayinSonGunu - bugun.getDate() + 1; // bugün dahil
    const gecenGun = bugun.getDate();

    // Kalan bütçe
    const kalanButce = Math.max(profil.aylikHedefHarcama - toplamGider, 0);

    // Günlük ve haftalık harcama limitleri
    const gunlukHarcamaLimiti = kalanGun > 0 ? kalanButce / kalanGun : 0;
    const haftalikHarcamaLimiti = gunlukHarcamaLimiti * 7;

    // Ortalama günlük harcama (şu ana kadar)
    const ortalamaGunlukHarcama = gecenGun > 0 ? toplamGider / gecenGun : 0;

    return {
      profil: {
        aylikHedefHarcama: profil.aylikHedefHarcama,
        aylikToplamGelir: profil.aylikToplamGelir,
        paraBirimi: profil.paraBirimi,
      },
      donemOzeti: {
        toplamGelir,
        toplamGider,
        netTasarruf: toplamGelir - toplamGider,
        hedefKullanimYuzdesi: hedefKullanim,
        tasarrufPotansiyeli,
        kalanButce,
        kalanGun,
        gunlukHarcamaLimiti: Math.round(gunlukHarcamaLimiti * 100) / 100,
        haftalikHarcamaLimiti: Math.round(haftalikHarcamaLimiti * 100) / 100,
        ortalamaGunlukHarcama: Math.round(ortalamaGunlukHarcama * 100) / 100,
        durum:
          hedefKullanim >= 100
            ? 'ASIMI'
            : hedefKullanim >= 80
            ? 'UYARI'
            : 'NORMAL',
      },
      kalemiDurumu,
    };
  },

  async kalemiEkle(kullaniciId: string, dto: ButceKalemiOlusturDto) {
    const profil = await prisma.butceProfili.findUnique({
      where: { kullaniciId },
    });

    if (!profil) throw ApiError.notFound('Bütçe profili bulunamadı');

    const mevcutKalem = await prisma.butceKalemi.findFirst({
      where: { butceProfilId: profil.id, kategoriId: dto.kategoriId },
    });
    if (mevcutKalem) {
      throw ApiError.conflict('Bu kategori için zaten bir limit tanımlanmış');
    }

    return prisma.butceKalemi.create({
      data: {
        kullaniciId,
        butceProfilId: profil.id,
        ...dto,
      },
      include: {
        kategori: {
          select: { id: true, ad: true, renk: true, ikon: true },
        },
      },
    });
  },

  async kalemiSil(kullaniciId: string, kalemiId: string) {
    const kalem = await prisma.butceKalemi.findUnique({
      where: { id: kalemiId },
    });

    if (!kalem) throw ApiError.notFound('Bütçe kalemi bulunamadı');
    if (kalem.kullaniciId !== kullaniciId) {
      throw ApiError.forbidden('Bu kalemi silme yetkiniz yok');
    }

    await prisma.butceKalemi.delete({ where: { id: kalemiId } });
    return { mesaj: 'Bütçe kalemi silindi' };
  },

  async aiIcinVeriHazirla(kullaniciId: string) {
    const sonUcAy = new Date();
    sonUcAy.setMonth(sonUcAy.getMonth() - 3);

    const [profil, islemler, hedefler] = await Promise.all([
      prisma.butceProfili.findUnique({
        where: { kullaniciId },
        include: { butceKalemleri: { include: { kategori: true } } },
      }),
      prisma.islem.findMany({
        where: {
          kullaniciId,
          OR: [
            { tarih: { gte: sonUcAy } },
            { sabitMi: true, tarih: { lte: new Date() } }
          ]
        },
        include: { kategori: { select: { ad: true } } },
        orderBy: { tarih: 'desc' },
      }),
      prisma.hedef.findMany({
        where: { kullaniciId, durum: 'DEVAM_EDIYOR' },
      }),
    ]);

    const gelirler = islemler.filter((i) => i.tip === 'GELIR');
    const giderler = islemler.filter((i) => i.tip === 'GIDER');

    const toplamGelir = gelirler.reduce((acc, i) => acc + i.miktar, 0);
    const toplamGider = giderler.reduce((acc, i) => acc + i.miktar, 0);

    const kategoriOzeti: Record<string, number> = {};
    giderler.forEach((g) => {
      kategoriOzeti[g.kategori.ad] =
        (kategoriOzeti[g.kategori.ad] ?? 0) + g.miktar;
    });

    return {
      aylikHedefHarcama: profil?.aylikHedefHarcama ?? 0,
      aylikToplamGelir: profil?.aylikToplamGelir ?? 0,
      sonUcAyToplamGelir: toplamGelir,
      sonUcAyToplamGider: toplamGider,
      ortalamAylikGider: toplamGider / 3,
      tasarrufPotansiyeli: Math.max(
        toplamGider / 3 - (profil?.aylikHedefHarcama ?? 0),
        0
      ),
      kategoriOzeti,
      aktifHedefler: hedefler.map((h) => ({
        baslik: h.baslik,
        hedefMiktar: h.hedefMiktar,
        mevcutMiktar: h.mevcutMiktar,
        yuzde: finansalUtil.hedefYuzdesiHesapla(h.mevcutMiktar, h.hedefMiktar),
      })),
      butceLimitleri: profil?.butceKalemleri.map((k) => ({
        kategori: k.kategori.ad,
        limit: k.limitMiktar,
      })),
    };
  },

  /** Kural tabanlı akıllı öneriler (AI veri paketi + bütçe durumu) */
  async onerileriGetir(kullaniciId: string) {
    const [durum, aiVeri] = await Promise.all([
      this.butceDurumunuGetir(kullaniciId),
      this.aiIcinVeriHazirla(kullaniciId),
    ]);

    type OneriTipi = 'BUTCE' | 'HEDEF' | 'KATEGORI' | 'GENEL' | 'TASARRUF';
    const oneriler: Array<{
      id: string;
      tip: OneriTipi;
      baslik: string;
      icerik: string;
      kategoriAd?: string;
      oncelik?: 'yuksek' | 'orta' | 'dusuk';
    }> = [];

    let idx = 0;
    const push = (
      tip: OneriTipi,
      baslik: string,
      icerik: string,
      kategoriAd?: string,
      oncelik: 'yuksek' | 'orta' | 'dusuk' = 'orta'
    ) => {
      idx += 1;
      oneriler.push({
        id: `oneri-${idx}`,
        tip,
        baslik,
        icerik,
        oncelik,
        ...(kategoriAd ? { kategoriAd } : {}),
      });
    };

    const hedef = durum.donemOzeti.hedefKullanimYuzdesi;
    if (hedef >= 100) {
      push(
        'BUTCE',
        'Aylık bütçeni aştın',
        'Bu ay hedeflediğin tutarı geçtin. Kalan günlerde sadece zorunlu harcamalar yaparak durumu kontrol altında tut.',
        undefined,
        'yuksek'
      );
    } else if (hedef >= 80) {
      push(
        'BUTCE',
        'Bütçe limitine yaklaşıyorsun',
        `Harcamaların hedefinin %${Math.round(hedef)}'ine ulaştı. Günlük ${durum.donemOzeti.gunlukHarcamaLimiti?.toLocaleString('tr-TR') || '?'} TL ile sınırla.`,
        undefined,
        'orta'
      );
    }

    for (const k of durum.kalemiDurumu) {
      const ad = k.kategori?.ad ?? 'Kategori';
      if (k.durum === 'ASIMI') {
        push(
          'KATEGORI',
          `${ad} limitini aştın`,
          `Bu kategoride fazla harcama var. Gelecek ay için limiti gözden geçir veya harcamayı azalt.`,
          ad,
          'yuksek'
        );
      } else if (k.durum === 'UYARI') {
        push(
          'KATEGORI',
          `${ad} bütçesine dikkat`,
          `Limit dolmak üzere. Ay sonuna kadar bu kategoriden harcama yapmamaya çalış.`,
          ad,
          'orta'
        );
      }
    }

    const entries = Object.entries(aiVeri.kategoriOzeti).sort(
      (a, b) => b[1] - a[1]
    );
    const enBuyuk = entries[0];
    const ikinciEnBuyuk = entries[1];
    
    if (enBuyuk && enBuyuk[1] > 0) {
      const yuzde = aiVeri.sonUcAyToplamGider > 0 
        ? Math.round((enBuyuk[1] / aiVeri.sonUcAyToplamGider) * 100) 
        : 0;
      push(
        'KATEGORI',
        `En çok harcaman: ${enBuyuk[0]}`,
        `Harcamalarının %${yuzde}'i bu kategoride. ${yuzde > 40 ? 'Bu oran yüksek, alternatifler düşün.' : 'Takip etmeye devam et.'}`,
        enBuyuk[0],
        yuzde > 40 ? 'orta' : 'dusuk'
      );
    }

    // Tasarruf önerileri
    const tasarrufPotansiyeli = durum.donemOzeti.tasarrufPotansiyeli || 0;
    if (tasarrufPotansiyeli > 0) {
      push(
        'TASARRUF',
        'Tasarruf fırsatı',
        `Bu ay ${tasarrufPotansiyeli.toLocaleString('tr-TR')} TL tasarruf edebilirsin. Hedeflerine aktar!`,
        undefined,
        'orta'
      );
    }

    if (aiVeri.aktifHedefler?.length) {
      const dusuk = aiVeri.aktifHedefler.filter((h) => h.yuzde < 35);
      if (dusuk.length) {
        const h = dusuk[0];
        push(
          'HEDEF',
          `"${h.baslik}" hedefin yavaş ilerliyor`,
          `Sadece %${h.yuzde} tamamlandı. Haftalık küçük aktarımlar ilerlemeyi hızlandırır.`,
          undefined,
          'orta'
        );
      }
      const yuksek = aiVeri.aktifHedefler.filter((h) => h.yuzde >= 85 && h.yuzde < 100);
      if (yuksek.length) {
        const h = yuksek[0];
        push(
          'HEDEF',
          `"${h.baslik}" bitmek üzere!`,
          `%${h.yuzde} tamamlandı. Küçük bir aktarımla hedefe ulaşabilirsin.`,
          undefined,
          'dusuk'
        );
      }
    }

    // Günlük ipucu
    const gunlukIpuclari = [
      'Kahve alışkanlığını azaltmak ayda 300-500 TL tasarruf sağlar.',
      'Alışverişe çıkmadan önce liste yap, anlık kararlardan kaçın.',
      'Aboneliklerini gözden geçir, kullanmadıklarını iptal et.',
      'Yemek siparişi yerine evde pişirmek bütçeyi rahatlatır.',
      'İkinci el ürünler yeni kadar iyi olabilir, değerlendir.',
    ];
    const gunIndex = new Date().getDate() % gunlukIpuclari.length;
    push(
      'GENEL',
      'Günün ipucu',
      gunlukIpuclari[gunIndex],
      undefined,
      'dusuk'
    );

    return { oneriler };
  },

  /** Dashboard için günlük AI ipucu */
  async gunlukIpucuGetir(kullaniciId: string) {
    const aiVeri = await this.aiIcinVeriHazirla(kullaniciId);
    
    const ipucuSablonlari = [
      aiVeri.sonUcAyToplamGider > aiVeri.aylikToplamGelir * 0.8 
        ? 'Harcamaların gelirine yaklaştı. Bu hafta dikkatli ol!'
        : 'Bütçen dengeli görünüyor, böyle devam et!',
      aiVeri.ortalamAylikGider > aiVeri.aylikToplamGelir * 0.5
        ? 'Aylık giderlerin yüksek. Harcamaları gözden geçir.'
        : 'Harcamalar kontrol altında.',
      Object.keys(aiVeri.kategoriOzeti).length < 3
        ? 'Harcamalarını kategorilendirmek daha iyi takip sağlar.'
        : 'Kategorilerin çeşitli, analiz için veri yeterli.',
    ];

    const gunIndex = new Date().getDay();
    return {
      ipucu: ipucuSablonlari[gunIndex % ipucuSablonlari.length],
      tarih: new Date().toISOString(),
    };
  },

  /** Gemini AI ile Bütçe ve Yatırım Önerisi Getir */
  async aiYatirimOnerisiGetir(kullaniciId: string) {
    const [durum, aiVeri, takipListesi, sonIslemler, sabitIslemler] = await Promise.all([
      this.butceDurumunuGetir(kullaniciId),
      this.aiIcinVeriHazirla(kullaniciId),
      piyasaService.takipListesiGetir(kullaniciId).catch(() => ({ hisseTakipler: [], kriptoTakipler: [] })),
      prisma.islem.findMany({
        where: { kullaniciId },
        include: { kategori: { select: { ad: true } } },
        orderBy: { tarih: 'desc' },
        take: 10,
      }),
      prisma.islem.findMany({
        where: { kullaniciId, sabitMi: true },
        include: { kategori: { select: { ad: true } } },
        orderBy: { miktar: 'desc' },
      }),
    ]);

    const toplamGelir = durum.donemOzeti?.toplamGelir || 0;
    const toplamGider = durum.donemOzeti?.toplamGider || 0;
    const netKalan = durum.donemOzeti?.netTasarruf || (toplamGelir - toplamGider);

    const kalemlerBilgisi = durum.kalemiDurumu
      ?.map((k) => `* ${k.kategori?.ad}: Limit ${k.limitMiktar} TL, Harcanan ${k.harcanan} TL`)
      .join('\n') || 'Kategori bilgisi yok';

    const hedeflerBilgisi = aiVeri.aktifHedefler
      ?.map((h) => `* ${h.baslik}: Hedef ${h.hedefMiktar} TL, Mevcut ${h.mevcutMiktar} TL, Kalan Açık ${h.hedefMiktar - h.mevcutMiktar} TL (%${h.yuzde} tamamlandı)`)
      .join('\n') || 'Aktif hedef yok';

    const hisselerStr = takipListesi.hisseTakipler.length > 0
      ? takipListesi.hisseTakipler.map(h => `* BIST100 Hisse: ${h.sembol} (Güncel: ${h.guncelFiyat} TL, Hedef: ${h.hedefFiyat || 'Belirtilmedi'} TL)`).join('\n')
      : 'Takip edilen BIST100 hissesi yok.';

    const kriptolarStr = takipListesi.kriptoTakipler.length > 0
      ? takipListesi.kriptoTakipler.map(k => `* Kripto: ${k.sembol?.toUpperCase()} (Güncel: $${k.guncelFiyat}, Hedef: $${k.hedefFiyat || 'Belirtilmedi'})`).join('\n')
      : 'Takip edilen kripto varlığı yok.';

    const sonIslemlerStr = sonIslemler.length > 0
      ? sonIslemler.map(i => `* [${new Date(i.tarih).toLocaleDateString('tr-TR')}] ${i.baslik} - ${i.miktar} TL (${i.tip === 'GIDER' ? 'Gider' : 'Gelir'}, Kategori: ${i.kategori?.ad || 'Genel'})`).join('\n')
      : 'Son işlem kaydı yok.';

    const sabitIslemlerStr = sabitIslemler.length > 0
      ? sabitIslemler.map(i => `* ${i.baslik}: ${i.miktar} TL / ${i.periyot} (${i.tip === 'GIDER' ? 'Düzenli Gider' : 'Düzenli Gelir'})`).join('\n')
      : 'Düzenli (sabit) gelir/gider tanımlanmamış.';

    const prompt = `Sen profesyonel ve uzman bir Akıllı Finans Danışmanısın. Kullanıcının tüm finansal profili ve geçmiş bilgileri aşağıdadır:

1. AYLIK BÜTÇE DURUMU:
- Toplam Gelir: ${toplamGelir} TL
- Toplam Harcama: ${toplamGider} TL
- Net Kalan (Tasarruf/Yatırım Bütçesi): ${netKalan} TL

2. KATEGORİ LİMİTLERİ VE HARCAMALAR:
${kalemlerBilgisi}

3. DÜZENLİ (SABİT) GELİR VE GİDERLER:
${sabitIslemlerStr}

4. SON İŞLEM HAREKETLERİ (Son 10 Hareket):
${sonIslemlerStr}

5. FİNANSAL HEDEFLERİ (Ev, Araba, Tatil vb.):
${hedeflerBilgisi}

6. YATIRIM TAKİP LİSTESİ:
${hisselerStr}
${kriptolarStr}

Lütfen yukarıdaki tüm bilgileri sentezleyerek kullanıcıya özel, somut ve nokta atışı bir finansal eylem planı sun.
ÖZELLİKLE ŞUNLARA DİKKAT ET:
- Kategori limitleri ve harcamaları (Abonelik, Market vb.) analiz et. Örneğin "Abonelikte 1500 TL bütçenizin 1000 TL'sini harcamışsınız, kalan 500 TL ile hedeflerinizi tamamlayabilir veya takip ettiğiniz hisselere yatırım yapabilirsiniz" şeklinde doğrudan matematiğe ve hedeflere dayalı öneriler ver.
- Kullanıcının net kalanı (${netKalan} TL) varsa, takip listesindeki varlıklar (BIST100, Kripto) veya aktif hedefleri (açık kalan miktar) arasında bu tutarı nasıl paylaştırabileceğini GÜNCEL VERİLERLE matematiksel bağlar kurarak açıkla.
- Eğer harcamalar limitleri aşıyorsa (veya giderler yüksekse), hangi işlemlerde hata yapıldığını "Son İşlem Hareketleri" veya "Sabit Giderler"e bakarak nokta atışı uyar.
- Kesinlikle "yapay zeka", "Gemini", "AI" kelimelerini kullanma.
- Çıktın doğrudan kullanıcıya hitap eden, samimi, güven verici ve 3-4 paragraflık/maddelik akıcı bir metin olsun.`;

    try {
      const result = await geminiFlash.generateContent(prompt);
      const cevapMetni = result.response.text();
      return { oneri: cevapMetni, tarih: new Date().toISOString() };
    } catch (error) {
      return { 
        oneri: "Mevcut bütçeniz, düzenli harcamalarınız ve takip listesindeki varlıklarınız değerlendirildi. Tasarruf oranınızı artırmak için sabit giderlerinizi gözden geçirip, kalan bütçenizi BIST100 hisseleri veya aktif hedefleriniz arasında paylaştırabilirsiniz.", 
        tarih: new Date().toISOString() 
      };
    }
  },
};
