import { prisma } from '../../prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) 
  : null;

interface KategoriHedef {
  id: string;
  kategoriAd: string;
  hedefMiktar: number;
  harcanan: number;
  tasarruf: number;
  durum: 'altinda' | 'ustunde' | 'esit';
}

interface AlimOnerisi {
  tip: 'hisse' | 'kripto';
  sembol: string;
  ad: string;
  fiyat: number;
  alinabilecekAdet: number;
  toplamTutar: number;
  kategori: string;
  tasarrufMiktari: number;
}

interface DetayliRapor {
  ozet: {
    toplamGelir: number;
    toplamGider: number;
    netTasarruf: number;
    tasarrufOrani: number;
    islemSayisi: number;
    ortalamaGunlukHarcama: number;
  };
  gunAnalizi: {
    enCokHarcananGun: { gun: string; tarih: string; miktar: number } | null;
    enAzHarcananGun: { gun: string; tarih: string; miktar: number } | null;
    enCokIslemYapilanGun: { gun: string; sayi: number } | null;
    haftaninGunleri: Array<{ gun: string; ortalama: number }>;
  };
  hedefRaporu: {
    toplamHedef: number;
    tamamlanan: number;
    devamEden: number;
    basariOrani: number;
    enAktifHedefGunu: { gun: string; katki: number } | null;
    hedefler: Array<{
      id: string;
      ad: string;
      hedefMiktar: number;
      mevcutMiktar: number;
      ilerleme: number;
      durum: string;
    }>;
  };
  kategoriRaporu: {
    kategoriler: Array<{
      id: string;
      ad: string;
      renk: string;
      toplamGider: number;
      toplamGelir: number;
      islemSayisi: number;
      giderYuzdesi: number;
      ortalamaIslem: number;
      trend: 'yukseliyor' | 'dusuyor' | 'stabil';
      hedef?: number;
      tasarruf?: number;
    }>;
    enCokHarcanan: string;
    enAzHarcanan: string;
    kategoriHedefleri: KategoriHedef[];
  };
  trendler: {
    gunluk: Array<{ tarih: string; gelir: number; gider: number; net: number }>;
    haftalik: Array<{ hafta: number; gelir: number; gider: number }>;
  };
  yatirimOnerileri: AlimOnerisi[];
}

const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

export const raporService = {
  async detayliRaporGetir(kullaniciId: string, baslangic: Date, bitis: Date): Promise<DetayliRapor> {
    console.log('Rapor isteği:', { kullaniciId, baslangic, bitis });
    
    const islemler = await prisma.islem.findMany({
      where: {
        kullaniciId,
        tarih: { gte: baslangic, lte: bitis },
      },
      include: { kategori: true },
      orderBy: { tarih: 'asc' },
    });
    
    console.log('Bulunan işlem sayısı:', islemler.length);

    const hedefler = await prisma.hedef.findMany({
      where: { kullaniciId },
      include: {
        hedefGecmisi: {
          where: { tarih: { gte: baslangic, lte: bitis } },
        },
      },
    });

    // Özet hesapla
    const toplamGelir = islemler.filter(i => i.tip === 'GELIR').reduce((t, i) => t + Number(i.miktar), 0);
    const toplamGider = islemler.filter(i => i.tip === 'GIDER').reduce((t, i) => t + Number(i.miktar), 0);
    const netTasarruf = toplamGelir - toplamGider;
    const tasarrufOrani = toplamGelir > 0 ? (netTasarruf / toplamGelir) * 100 : 0;
    const gunSayisi = Math.max(1, Math.ceil((bitis.getTime() - baslangic.getTime()) / (1000 * 60 * 60 * 24)));

    // Gün analizi
    const gunlukHarcamalar = new Map<string, { miktar: number; sayi: number; tarih: Date }>();
    
    islemler.filter(i => i.tip === 'GIDER').forEach(islem => {
      const tarihStr = islem.tarih.toISOString().split('T')[0];
      const mevcut = gunlukHarcamalar.get(tarihStr) || { miktar: 0, sayi: 0, tarih: islem.tarih };
      mevcut.miktar += Number(islem.miktar);
      mevcut.sayi += 1;
      gunlukHarcamalar.set(tarihStr, mevcut);
    });

    const gunlukArray = Array.from(gunlukHarcamalar.entries()).map(([tarih, data]) => ({
      tarih,
      ...data,
      gun: GUNLER[data.tarih.getDay()],
    }));

    const enCokHarcananGun = gunlukArray.length > 0
      ? gunlukArray.reduce((max, g) => g.miktar > max.miktar ? g : max)
      : null;

    const enAzHarcananGun = gunlukArray.length > 0
      ? gunlukArray.reduce((min, g) => g.miktar < min.miktar ? g : min)
      : null;

    // Hafta günleri ortalaması
    const haftaGunToplam = new Map<number, { toplam: number; sayi: number }>();
    gunlukArray.forEach(g => {
      const gunIndex = new Date(g.tarih).getDay();
      const mevcut = haftaGunToplam.get(gunIndex) || { toplam: 0, sayi: 0 };
      mevcut.toplam += g.miktar;
      mevcut.sayi += 1;
      haftaGunToplam.set(gunIndex, mevcut);
    });

    const haftaninGunleri = GUNLER.map((gun, index) => {
      const data = haftaGunToplam.get(index);
      return { gun, ortalama: data ? data.toplam / data.sayi : 0 };
    });

    // Hedef raporu
    const tamamlananHedef = hedefler.filter(h => h.durum === 'TAMAMLANDI').length;
    const devamEdenHedef = hedefler.filter(h => h.durum === 'DEVAM_EDIYOR').length;

    // Hedef katkı günleri
    const hedefKatkiGunleri = new Map<string, number>();
    hedefler.forEach(h => {
      (h.hedefGecmisi || []).forEach((k: any) => {
        const gun = GUNLER[k.tarih.getDay()];
        hedefKatkiGunleri.set(gun, (hedefKatkiGunleri.get(gun) || 0) + Number(k.miktar));
      });
    });

    const enAktifHedefGunu = hedefKatkiGunleri.size > 0
      ? Array.from(hedefKatkiGunleri.entries())
          .map(([gun, katki]) => ({ gun, katki }))
          .reduce((max, g) => g.katki > max.katki ? g : max)
      : null;

    // Kategori raporu
    const kategoriMap = new Map<string, {
      id: string;
      ad: string;
      renk: string;
      toplamGider: number;
      toplamGelir: number;
      islemSayisi: number;
      oncekiGider: number;
    }>();

    islemler.forEach(islem => {
      if (!islem.kategori) return;
      const kat = kategoriMap.get(islem.kategori.id) || {
        id: islem.kategori.id,
        ad: islem.kategori.ad,
        renk: islem.kategori.renk || '#6B7280',
        toplamGider: 0,
        toplamGelir: 0,
        islemSayisi: 0,
        oncekiGider: 0,
      };
      if (islem.tip === 'GIDER') {
        kat.toplamGider += Number(islem.miktar);
      } else {
        kat.toplamGelir += Number(islem.miktar);
      }
      kat.islemSayisi += 1;
      kategoriMap.set(islem.kategori.id, kat);
    });

    const kategoriler = Array.from(kategoriMap.values())
      .map(k => ({
        ...k,
        giderYuzdesi: toplamGider > 0 ? (k.toplamGider / toplamGider) * 100 : 0,
        ortalamaIslem: k.islemSayisi > 0 ? (k.toplamGider + k.toplamGelir) / k.islemSayisi : 0,
        trend: 'stabil' as const,
      }))
      .sort((a, b) => b.toplamGider - a.toplamGider);

    // Günlük trend
    const gunlukTrend = new Map<string, { gelir: number; gider: number }>();
    islemler.forEach(islem => {
      const tarih = islem.tarih.toISOString().split('T')[0];
      const mevcut = gunlukTrend.get(tarih) || { gelir: 0, gider: 0 };
      if (islem.tip === 'GELIR') {
        mevcut.gelir += Number(islem.miktar);
      } else {
        mevcut.gider += Number(islem.miktar);
      }
      gunlukTrend.set(tarih, mevcut);
    });

    const gunlukTrendArray = Array.from(gunlukTrend.entries())
      .map(([tarih, data]) => ({
        tarih,
        ...data,
        net: data.gelir - data.gider,
      }))
      .sort((a, b) => a.tarih.localeCompare(b.tarih));

    // Haftalık karşılaştırma
    const haftalikMap = new Map<number, { gelir: number; gider: number }>();
    islemler.forEach(islem => {
      const haftaNo = getWeekNumber(islem.tarih);
      const mevcut = haftalikMap.get(haftaNo) || { gelir: 0, gider: 0 };
      if (islem.tip === 'GELIR') {
        mevcut.gelir += Number(islem.miktar);
      } else {
        mevcut.gider += Number(islem.miktar);
      }
      haftalikMap.set(haftaNo, mevcut);
    });

    const haftalik = Array.from(haftalikMap.entries())
      .map(([hafta, data]) => ({ hafta, ...data }))
      .sort((a, b) => a.hafta - b.hafta);

    // Kategori hedefleri (bütçe profili üzerinden)
    const butceProfili = await prisma.butceProfili.findUnique({
      where: { kullaniciId },
      include: { butceKalemleri: { include: { kategori: true } } },
    });

    const kategoriHedefleri: KategoriHedef[] = [];
    if (butceProfili?.butceKalemleri) {
      for (const kalem of butceProfili.butceKalemleri) {
        const kategoriHarcama = kategoriMap.get(kalem.kategoriId);
        const harcanan = kategoriHarcama?.toplamGider || 0;
        const hedef = Number(kalem.miktar);
        const tasarruf = hedef - harcanan;
        
        kategoriHedefleri.push({
          id: kalem.kategoriId,
          kategoriAd: kalem.kategori.ad,
          hedefMiktar: hedef,
          harcanan,
          tasarruf,
          durum: tasarruf > 0 ? 'altinda' : tasarruf < 0 ? 'ustunde' : 'esit',
        });
      }
    }

    // Kategorilere hedef bilgisi ekle
    const kategorilerWithHedef = kategoriler.map(k => {
      const hedefBilgi = kategoriHedefleri.find(h => h.id === k.id);
      return {
        ...k,
        hedef: hedefBilgi?.hedefMiktar,
        tasarruf: hedefBilgi?.tasarruf,
      };
    });

    // Yatırım önerileri - takip edilen hisse ve kriptolardan
    const yatirimOnerileri: AlimOnerisi[] = [];
    const toplamTasarruf = kategoriHedefleri
      .filter(k => k.tasarruf > 0)
      .reduce((t, k) => t + k.tasarruf, 0);

    if (toplamTasarruf > 0) {
      // Takip edilen hisseler
      const hisseler = await prisma.hisseTakip.findMany({
        where: { kullaniciId },
        take: 5,
      });

      for (const hisse of hisseler) {
        const fiyat = Number(hisse.sonFiyat) || 100;
        if (fiyat > 0 && toplamTasarruf >= fiyat) {
          const adet = Math.floor(toplamTasarruf / fiyat);
          if (adet > 0) {
            yatirimOnerileri.push({
              tip: 'hisse',
              sembol: hisse.sembol,
              ad: hisse.sembol,
              fiyat,
              alinabilecekAdet: adet,
              toplamTutar: adet * fiyat,
              kategori: 'Toplam Tasarruf',
              tasarrufMiktari: toplamTasarruf,
            });
          }
        }
      }

      // Takip edilen kriptolar
      const kriptolar = await prisma.kriptoTakip.findMany({
        where: { kullaniciId },
        take: 5,
      });

      for (const kripto of kriptolar) {
        const fiyat = Number(kripto.sonFiyat) || 1;
        if (fiyat > 0) {
          const adet = toplamTasarruf / fiyat;
          if (adet >= 0.0001) {
            yatirimOnerileri.push({
              tip: 'kripto',
              sembol: kripto.sembol,
              ad: kripto.sembol,
              fiyat,
              alinabilecekAdet: parseFloat(adet.toFixed(4)),
              toplamTutar: toplamTasarruf,
              kategori: 'Toplam Tasarruf',
              tasarrufMiktari: toplamTasarruf,
            });
          }
        }
      }
    }

    return {
      ozet: {
        toplamGelir,
        toplamGider,
        netTasarruf,
        tasarrufOrani,
        islemSayisi: islemler.length,
        ortalamaGunlukHarcama: toplamGider / gunSayisi,
      },
      gunAnalizi: {
        enCokHarcananGun: enCokHarcananGun ? {
          gun: enCokHarcananGun.gun,
          tarih: enCokHarcananGun.tarih,
          miktar: enCokHarcananGun.miktar,
        } : null,
        enAzHarcananGun: enAzHarcananGun ? {
          gun: enAzHarcananGun.gun,
          tarih: enAzHarcananGun.tarih,
          miktar: enAzHarcananGun.miktar,
        } : null,
        enCokIslemYapilanGun: gunlukArray.length > 0
          ? { gun: gunlukArray.reduce((max, g) => g.sayi > max.sayi ? g : max).gun, sayi: Math.max(...gunlukArray.map(g => g.sayi)) }
          : null,
        haftaninGunleri,
      },
      hedefRaporu: {
        toplamHedef: hedefler.length,
        tamamlanan: tamamlananHedef,
        devamEden: devamEdenHedef,
        basariOrani: hedefler.length > 0 ? (tamamlananHedef / hedefler.length) * 100 : 0,
        enAktifHedefGunu,
        hedefler: hedefler.map(h => ({
          id: h.id,
          ad: h.ad,
          hedefMiktar: Number(h.hedefMiktar),
          mevcutMiktar: Number(h.mevcutMiktar),
          ilerleme: Number(h.hedefMiktar) > 0 ? (Number(h.mevcutMiktar) / Number(h.hedefMiktar)) * 100 : 0,
          durum: h.durum,
        })),
      },
      kategoriRaporu: {
        kategoriler: kategorilerWithHedef,
        enCokHarcanan: kategoriler[0]?.ad || '-',
        enAzHarcanan: kategoriler[kategoriler.length - 1]?.ad || '-',
        kategoriHedefleri,
      },
      trendler: {
        gunluk: gunlukTrendArray,
        haftalik,
      },
      yatirimOnerileri,
    };
  },

  async aiAnaliziGetir(kullaniciId: string, raporTipi: string, veri: any): Promise<string> {
    if (!genAI) {
      return 'AI analizi için Gemini API anahtarı yapılandırılmamış.';
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

      let prompt = '';
      
      switch (raporTipi) {
        case 'gunluk':
          prompt = `Sen bir finansal danışmansın. Kullanıcının günlük harcama verilerini analiz et ve kısa, öz öneriler sun.

Veriler:
- En çok harcama yapılan gün: ${veri.enCokHarcananGun?.gun || 'Veri yok'} (${veri.enCokHarcananGun?.miktar?.toLocaleString('tr-TR') || 0} TL)
- En az harcama yapılan gün: ${veri.enAzHarcananGun?.gun || 'Veri yok'} (${veri.enAzHarcananGun?.miktar?.toLocaleString('tr-TR') || 0} TL)
- Hafta içi vs hafta sonu harcama farkı

Maksimum 2-3 cümle ile pratik bir öneri ver. Türkçe yaz.`;
          break;

        case 'hedef':
          prompt = `Sen bir finansal danışmansın. Kullanıcının hedef verilerini analiz et.

Veriler:
- Toplam hedef: ${veri.toplamHedef}
- Tamamlanan: ${veri.tamamlanan}
- Başarı oranı: %${veri.basariOrani?.toFixed(1) || 0}
- En aktif gün: ${veri.enAktifHedefGunu?.gun || 'Veri yok'}

Maksimum 2-3 cümle ile motivasyon ve öneri ver. Türkçe yaz.`;
          break;

        case 'kategori':
          prompt = `Sen bir finansal danışmansın. Kullanıcının kategori harcamalarını analiz et.

Veriler:
- En çok harcanan kategori: ${veri.enCokHarcanan}
- En az harcanan kategori: ${veri.enAzHarcanan}
- Kategori sayısı: ${veri.kategoriler?.length || 0}

Maksimum 2-3 cümle ile bütçe optimizasyonu önerisi ver. Türkçe yaz.`;
          break;

        default:
          prompt = `Kullanıcının genel finansal durumu hakkında kısa bir yorum yap. Türkçe, 2-3 cümle.`;
      }

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      console.log('AI analizi hatası:', error?.message || error);
      console.log('Hata detayı:', JSON.stringify(error, null, 2));
      return `Öneri şu an alınamıyor. Hata: ${error?.message || 'Bilinmeyen hata'}`;
    }
  },
};

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
