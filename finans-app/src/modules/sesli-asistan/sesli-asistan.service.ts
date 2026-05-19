import { prisma } from "@/prisma/client";
import { geminiFlash } from "@config/gemini.config";
import { ApiError } from "@utils/ApiError";
import { promptlar } from "./asistan.prompt";
import { SesliIslemOnayDto } from "./sesli-asistan.schema";
import { logger } from "@config/logger.config";
import { piyasaService } from "../piyasa/piyasa.service";

export const sesliAsistanService = {
  // Mikroservis Ayarları
  MIKROSERVIS_URL: process.env.AI_MICROSERVICE_URL || "https://web-production-2ea90.up.railway.app",

  // ─────────────────────────────────────────
  // SES -> METİN (Gemini Pro ile)
  // ─────────────────────────────────────────
  async mikroservisIleIsle(buffer: Buffer, kullaniciId: string, sesliYanit: boolean = true, mimeType: string = 'audio/m4a') {
    logger.info(`[SesliAsistan] Ses dosyası alındı: ${buffer.length} bytes, ${mimeType}`);

    try {
      const base64Audio = buffer.toString('base64');
      const prompt = `Bu bir ses kaydı. Ses kaydındaki Türkçe konuşmayı yazıya dök. Sadece söyleneni yaz, başka bir şey ekleme.`;
      
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Audio
          }
        }
      ]);

      const transcript = result.response.text().trim();
      logger.info(`[SesliAsistan] Ses transkripti: "${transcript}"`);

      if (!transcript || transcript.length < 2) {
        return {
          anlasilanMetin: '',
          niyet: 'BELIRSIZ',
          cevapMetni: 'Sesi anlayamadım, tekrar dene.',
          data: { metin: '' }
        };
      }

      const sonuc = await this.metinKomutIsle(transcript, kullaniciId);
      return {
        ...sonuc,
        data: {
          ...sonuc.data,
          metin: transcript
        }
      };

    } catch (error: any) {
      logger.error(`[SesliAsistan] Ses işleme hatası: ${error.message}`);
      return {
        anlasilanMetin: '',
        niyet: 'HATA',
        cevapMetni: 'Ses işlenirken bir hata oluştu.',
        data: { metin: '' }
      };
    }
  },

  // ─────────────────────────────────────────
  // METİN KOMUTU İŞLE (HIZLI - DİREKT GEMİNİ)
  // ─────────────────────────────────────────
  async metinKomutIsle(metin: string, kullaniciId: string) {
    const baslangic = Date.now();
    logger.info(`[SesliAsistan] Metin: "${metin}"`);

    try {
      // 1. Kategorileri al
      const kategoriler = await prisma.kategori.findMany({
        where: { aktif: true, OR: [{ sistemKategorisi: true }, { kullaniciId }] },
        select: { id: true, ad: true, tip: true }
      });
      const kategoriListesi = kategoriler.map(k => k.ad).join(', ');

      // 2. Niyet analizi - ÖNCE KEYWORD BAZLI (hızlı ve güvenilir)
      const metinKucuk = metin.toLowerCase();
      let niyet = this._keywordNiyetBul(metinKucuk);
      
      // Keyword ile bulunamadıysa Gemini'ye sor
      if (niyet === 'BELIRSIZ') {
        try {
          const niyetPrompt = promptlar.niyetAnla(metin);
          const niyetResult = await geminiFlash.generateContent(niyetPrompt);
          const niyetText = niyetResult.response.text().trim();
          
          try {
            const niyetJson = JSON.parse(niyetText.replace(/```json\n?|\n?```/g, ''));
            niyet = niyetJson.niyet || 'SOHBET';
          } catch {
            if (niyetText.includes('HEDEF_EKLE')) niyet = 'HEDEF_EKLE';
            else if (niyetText.includes('HEDEF_SORGULA')) niyet = 'HEDEF_SORGULA';
            else if (niyetText.includes('ISLEM_EKLE')) niyet = 'ISLEM_EKLE';
            else if (niyetText.includes('OZET_GETIR')) niyet = 'OZET_GETIR';
            else if (niyetText.includes('ANALIZ_YAP')) niyet = 'ANALIZ_YAP';
            else if (niyetText.includes('ONERI_ISTE')) niyet = 'ONERI_ISTE';
            else niyet = 'SOHBET';
          }
        } catch (geminiErr: any) {
          logger.error(`[SesliAsistan] Gemini hatası: ${geminiErr.message}`);
          niyet = 'SOHBET';
        }
      }

      logger.info(`[SesliAsistan] Niyet: ${niyet} (${Date.now() - baslangic}ms)`);

      // 3. Niyete göre işlem
      if (niyet === 'ISLEM_EKLE') {
        return await this._islemEkle(metin, kategoriListesi, kategoriler, kullaniciId, baslangic);
      } else if (niyet === 'DETAYLI_RAPOR') {
        return await this._detayliRapor(kullaniciId, baslangic);
      } else if (niyet === 'OZET_GETIR' || niyet === 'ANALIZ_YAP') {
        return await this._analizGetir(metin, kullaniciId, baslangic);
      } else if (niyet === 'HEDEF_EKLE') {
        return await this._hedefEkle(metin, kullaniciId, baslangic);
      } else if (niyet === 'HEDEF_SORGULA') {
        return await this._hedefSorgula(kullaniciId, baslangic);
      } else if (niyet === 'ONERI_ISTE') {
        return await this._tasarrufOnerisi(kullaniciId, baslangic);
      } else if (niyet === 'PIYASA_SORGULA') {
        return await this._piyasaSorgula(metin, baslangic);
      } else {
        return await this._sohbet(metin, kullaniciId, baslangic);
      }

    } catch (error: any) {
      logger.error(`[SesliAsistan] Hata: ${error.message}`);
      return {
        anlasilanMetin: metin,
        niyet: 'SOHBET',
        cevapMetni: 'Bir hata oluştu, tekrar deneyin.',
        data: null
      };
    }
  },

  // ─────────────────────────────────────────
  // İŞLEM EKLE
  // ─────────────────────────────────────────
  async _islemEkle(metin: string, kategoriListesi: string, kategoriler: any[], kullaniciId: string, baslangic: number) {
    const parsePrompt = promptlar.islemParse(metin, kategoriListesi);
    const parseResult = await geminiFlash.generateContent(parsePrompt);
    const parseText = parseResult.response.text().trim().replace(/```json\n?|\n?```/g, '');
    
    logger.info(`[SesliAsistan] Parse sonuç: ${parseText}`);

    let islem: any;
    try {
      islem = JSON.parse(parseText);
    } catch {
      return {
        anlasilanMetin: metin,
        niyet: 'ISLEM_EKLE',
        cevapMetni: 'Komutu anlayamadım. "100 TL kahve" gibi söyleyin.',
        data: null
      };
    }

    // Kategori eşleştir
    const kategoriAdi = islem.kategoriAdi || islem.kategori_adi || islem.kategori || 'Diğer';
    const bulunanKategori = this._kategoriEslestir(kategoriAdi, kategoriler, islem.tip);
    
    const islemData = {
      tip: (islem.tip || 'GIDER').toUpperCase(),
      miktar: parseFloat(islem.miktar) || 0,
      baslik: islem.baslik || metin.substring(0, 30),
      kategoriId: bulunanKategori?.id,
      kategori_adi: bulunanKategori?.ad || kategoriAdi
    };

    logger.info(`[SesliAsistan] İşlem hazır: ${JSON.stringify(islemData)} (${Date.now() - baslangic}ms)`);

    const cevap = `${islemData.miktar} TL ${islemData.kategori_adi} ${islemData.tip === 'GELIR' ? 'geliri' : 'gideri'} eklensin mi?`;

    return {
      anlasilanMetin: metin,
      niyet: 'ISLEM_EKLE',
      cevapMetni: cevap,
      data: {
        tip: 'ONAY_BEKLIYOR',
        islem: islemData
      }
    };
  },

  // ─────────────────────────────────────────
  // DETAYLI RAPOR (Grafikli, Kapsamlı)
  // ─────────────────────────────────────────
  async _detayliRapor(kullaniciId: string, baslangic: number) {
    const bugun = new Date();
    const ayBaslangic = new Date(bugun.getFullYear(), bugun.getMonth(), 1);
    const gecenAyBaslangic = new Date(bugun.getFullYear(), bugun.getMonth() - 1, 1);
    const gecenAyBitis = new Date(bugun.getFullYear(), bugun.getMonth(), 0);

    // Tüm verileri paralel çek
    const [buAyIslemler, gecenAyIslemler, butce, hedefler, kullanici] = await Promise.all([
      prisma.islem.findMany({
        where: { kullaniciId, tarih: { gte: ayBaslangic } },
        include: { kategori: { select: { ad: true, renk: true, tip: true } } },
        orderBy: { tarih: 'desc' }
      }),
      prisma.islem.findMany({
        where: { kullaniciId, tarih: { gte: gecenAyBaslangic, lte: gecenAyBitis } },
        include: { kategori: { select: { ad: true } } }
      }),
      prisma.butceProfili.findUnique({ where: { kullaniciId } }),
      prisma.hedef.findMany({ 
        where: { kullaniciId, durum: 'DEVAM_EDIYOR' },
        select: { baslik: true, hedefMiktar: true, mevcutMiktar: true, renk: true }
      }),
      prisma.kullanici.findUnique({ where: { id: kullaniciId }, select: { ad: true } })
    ]);

    // Bu ay hesaplamalar
    let toplamGider = 0, toplamGelir = 0;
    const kategoriHarcama: Record<string, { miktar: number; renk: string; islemSayisi: number }> = {};
    const gunlukHarcama: Record<string, number> = {};
    const haftaGunleri = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const haftaHarcama: number[] = [0, 0, 0, 0, 0, 0, 0];

    buAyIslemler.forEach(i => {
      const gun = new Date(i.tarih).toISOString().split('T')[0];
      const haftaGunu = new Date(i.tarih).getDay();
      
      if (i.tip === 'GIDER') {
        toplamGider += i.miktar;
        
        // Kategori bazlı
        const kat = i.kategori?.ad || 'Diğer';
        if (!kategoriHarcama[kat]) {
          kategoriHarcama[kat] = { miktar: 0, renk: i.kategori?.renk || '#8B5CF6', islemSayisi: 0 };
        }
        kategoriHarcama[kat].miktar += i.miktar;
        kategoriHarcama[kat].islemSayisi++;
        
        // Günlük
        gunlukHarcama[gun] = (gunlukHarcama[gun] || 0) + i.miktar;
        
        // Hafta günü
        haftaHarcama[haftaGunu] += i.miktar;
      } else {
        toplamGelir += i.miktar;
      }
    });

    // Geçen ay hesapla
    const gecenAyGider = gecenAyIslemler.filter(i => i.tip === 'GIDER').reduce((s, i) => s + i.miktar, 0);
    const gecenAyGelir = gecenAyIslemler.filter(i => i.tip === 'GELIR').reduce((s, i) => s + i.miktar, 0);

    // Kategori dağılımı (sıralı)
    const siraliKategoriler = Object.entries(kategoriHarcama)
      .sort(([,a], [,b]) => b.miktar - a.miktar);

    // Haftalık trend (son 4 hafta)
    const haftalikTrend: { hafta: string; tutar: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const haftaBaslangic = new Date(bugun);
      haftaBaslangic.setDate(bugun.getDate() - (i * 7) - bugun.getDay());
      const haftaBitis = new Date(haftaBaslangic);
      haftaBitis.setDate(haftaBaslangic.getDate() + 6);
      
      const haftaIslemleri = buAyIslemler.filter(isl => {
        const tarih = new Date(isl.tarih);
        return isl.tip === 'GIDER' && tarih >= haftaBaslangic && tarih <= haftaBitis;
      });
      
      const toplam = haftaIslemleri.reduce((s, isl) => s + isl.miktar, 0);
      haftalikTrend.push({
        hafta: `${haftaBaslangic.getDate()}-${haftaBitis.getDate()}`,
        tutar: toplam
      });
    }

    // İstatistikler
    const gunSayisi = Math.max(1, bugun.getDate());
    const gunlukOrtalama = toplamGider / gunSayisi;
    const tahminiAylikGider = gunlukOrtalama * new Date(bugun.getFullYear(), bugun.getMonth() + 1, 0).getDate();
    const tasarrufOrani = toplamGelir > 0 ? Math.round(((toplamGelir - toplamGider) / toplamGelir) * 100) : 0;
    const trendYuzde = gecenAyGider > 0 ? Math.round(((toplamGider - gecenAyGider) / gecenAyGider) * 100) : 0;
    
    // Bütçe
    const butceHedef = butce?.aylikHedefHarcama || 0;
    const butceKullanim = butceHedef > 0 ? Math.round((toplamGider / butceHedef) * 100) : 0;
    const butceKalan = Math.max(0, butceHedef - toplamGider);

    // En yüksek harcama günü
    const enYuksekGun = Object.entries(gunlukHarcama).sort(([,a], [,b]) => b - a)[0];
    
    // En çok harcama yapılan gün (hafta içi)
    const enCokHarcananGunIndex = haftaHarcama.indexOf(Math.max(...haftaHarcama));
    const enCokHarcananGun = haftaGunleri[enCokHarcananGunIndex];

    // Hedef özeti
    const hedefOzet = hedefler.map(h => ({
      baslik: h.baslik,
      ilerleme: Math.round((h.mevcutMiktar / h.hedefMiktar) * 100),
      kalan: h.hedefMiktar - h.mevcutMiktar,
      renk: h.renk
    }));

    // Son 5 işlem
    const sonIslemler = buAyIslemler.slice(0, 5).map(i => ({
      baslik: i.baslik,
      miktar: i.miktar,
      tip: i.tip,
      kategori: i.kategori?.ad,
      tarih: i.tarih
    }));

    // Sesli rapor metni oluştur
    let cevap = `${kullanici?.ad || 'Dostum'}, işte bu ayın detaylı raporu. `;
    cevap += `Toplam ${toplamGider.toLocaleString('tr-TR')} TL harcamışsın, ${toplamGelir.toLocaleString('tr-TR')} TL gelir elde etmişsin. `;
    
    if (siraliKategoriler.length > 0) {
      const [enCokKat, enCokVal] = siraliKategoriler[0];
      cevap += `En çok ${enCokKat} kategorisine ${enCokVal.miktar.toLocaleString('tr-TR')} TL harcamışsın. `;
    }
    
    if (trendYuzde !== 0) {
      cevap += trendYuzde > 0 
        ? `Geçen aya göre yüzde ${trendYuzde} fazla harcıyorsun, dikkatli ol! `
        : `Geçen aya göre yüzde ${Math.abs(trendYuzde)} az harcamışsın, harika gidiyorsun! `;
    }

    if (butceHedef > 0) {
      cevap += `Bütçenin yüzde ${butceKullanim}'ini kullandın, ${butceKalan.toLocaleString('tr-TR')} TL'n kaldı. `;
    }

    if (tasarrufOrani > 0) {
      cevap += `Tasarruf oranın yüzde ${tasarrufOrani}. `;
    }

    cevap += `Günlük ortalama harcaman ${Math.round(gunlukOrtalama).toLocaleString('tr-TR')} TL. `;
    cevap += `En çok ${enCokHarcananGun} günleri harcama yapıyorsun.`;

    logger.info(`[SesliAsistan] Detaylı rapor hazır (${Date.now() - baslangic}ms)`);

    return {
      anlasilanMetin: 'Detaylı rapor',
      niyet: 'DETAYLI_RAPOR',
      cevapMetni: cevap,
      data: {
        tip: 'DETAYLI_RAPOR',
        rapor: {
          // Özet Kartlar
          ozet: {
            toplamGider,
            toplamGelir,
            netDurum: toplamGelir - toplamGider,
            tasarrufOrani,
            islemSayisi: buAyIslemler.length,
            gunlukOrtalama: Math.round(gunlukOrtalama),
            tahminiAylikGider: Math.round(tahminiAylikGider),
          },
          
          // Karşılaştırma
          karsilastirma: {
            gecenAyGider,
            gecenAyGelir,
            trendYuzde,
            farkTutar: toplamGider - gecenAyGider,
          },
          
          // Bütçe
          butce: {
            hedef: butceHedef,
            kullanilan: toplamGider,
            kalan: butceKalan,
            kullanimYuzde: butceKullanim,
          },
          
          // Kategori Dağılımı (Pie Chart)
          kategoriDagilimi: siraliKategoriler.slice(0, 6).map(([ad, v]) => ({
            ad,
            miktar: v.miktar,
            renk: v.renk,
            yuzde: Math.round((v.miktar / toplamGider) * 100) || 0,
            islemSayisi: v.islemSayisi,
          })),
          
          // Haftalık Trend (Line Chart)
          haftalikTrend,
          
          // Hafta Günleri Dağılımı (Bar Chart)
          haftaGunleriDagilimi: haftaGunleri.map((gun, i) => ({
            gun,
            tutar: haftaHarcama[i],
          })),
          
          // En Yüksek Harcama Günü
          enYuksekGun: enYuksekGun ? {
            tarih: enYuksekGun[0],
            tutar: enYuksekGun[1],
          } : null,
          
          // Hedefler
          hedefler: hedefOzet,
          
          // Son İşlemler
          sonIslemler,
        }
      }
    };
  },

  // ─────────────────────────────────────────
  // ANALİZ GETİR (GRAFİKLİ)
  // ─────────────────────────────────────────
  async _analizGetir(metin: string, kullaniciId: string, baslangic: number) {
    const ayBaslangic = new Date();
    ayBaslangic.setDate(1);
    ayBaslangic.setHours(0, 0, 0, 0);

    // Geçen ay başlangıcı
    const gecenAyBaslangic = new Date(ayBaslangic);
    gecenAyBaslangic.setMonth(gecenAyBaslangic.getMonth() - 1);

    const [buAyIslemler, gecenAyIslemler, butce] = await Promise.all([
      prisma.islem.findMany({
        where: { kullaniciId, tarih: { gte: ayBaslangic } },
        include: { kategori: { select: { ad: true, renk: true } } }
      }),
      prisma.islem.findMany({
        where: { kullaniciId, tarih: { gte: gecenAyBaslangic, lt: ayBaslangic } },
        include: { kategori: { select: { ad: true } } }
      }),
      prisma.butceProfili.findUnique({ where: { kullaniciId } })
    ]);

    // Bu ay hesapla
    let toplamGider = 0, toplamGelir = 0;
    const kategoriHarcama: Record<string, { miktar: number; renk: string }> = {};

    buAyIslemler.forEach(i => {
      if (i.tip === 'GIDER') {
        toplamGider += i.miktar;
        const kat = i.kategori?.ad || 'Diğer';
        if (!kategoriHarcama[kat]) {
          kategoriHarcama[kat] = { miktar: 0, renk: i.kategori?.renk || '#8B5CF6' };
        }
        kategoriHarcama[kat].miktar += i.miktar;
      } else {
        toplamGelir += i.miktar;
      }
    });

    // Geçen ay toplam
    const gecenAyGider = gecenAyIslemler
      .filter(i => i.tip === 'GIDER')
      .reduce((sum, i) => sum + i.miktar, 0);

    // Kategori dağılımı (sıralı)
    const siraliKategoriler = Object.entries(kategoriHarcama)
      .sort(([,a], [,b]) => b.miktar - a.miktar);

    // Grafik verileri
    const pieChart = {
      labels: siraliKategoriler.slice(0, 6).map(([ad]) => ad),
      data: siraliKategoriler.slice(0, 6).map(([, v]) => v.miktar),
      colors: siraliKategoriler.slice(0, 6).map(([, v]) => v.renk)
    };

    // Haftalık trend (son 4 hafta)
    const haftalikTrend: number[] = [];
    for (let i = 3; i >= 0; i--) {
      const haftaBaslangic = new Date();
      haftaBaslangic.setDate(haftaBaslangic.getDate() - (i * 7) - 7);
      const haftaBitis = new Date();
      haftaBitis.setDate(haftaBitis.getDate() - (i * 7));
      
      const haftaHarcama = buAyIslemler
        .filter(isl => isl.tip === 'GIDER' && new Date(isl.tarih) >= haftaBaslangic && new Date(isl.tarih) < haftaBitis)
        .reduce((sum, isl) => sum + isl.miktar, 0);
      haftalikTrend.push(haftaHarcama);
    }

    // Bütçe
    const butceHedef = butce?.aylikHedefHarcama || 0;
    const butceKullanim = butceHedef > 0 ? Math.round((toplamGider / butceHedef) * 100) : 0;

    // Trend karşılaştırma
    const trendYuzde = gecenAyGider > 0 
      ? Math.round(((toplamGider - gecenAyGider) / gecenAyGider) * 100)
      : 0;

    // Cevap metni
    let cevap = `Bu ay toplam ${toplamGider.toLocaleString('tr-TR')} TL harcamışsın.`;
    
    if (siraliKategoriler.length > 0) {
      const [enCokKat, enCokVal] = siraliKategoriler[0];
      const yuzde = Math.round((enCokVal.miktar / toplamGider) * 100);
      cevap += ` En çok ${enCokKat}'e ${enCokVal.miktar.toLocaleString('tr-TR')} TL gitmiş, bu toplam harcamanın yüzde ${yuzde}'i.`;
    }
    
    if (trendYuzde !== 0) {
      cevap += trendYuzde > 0 
        ? ` Geçen aya göre yüzde ${trendYuzde} fazla harcamışsın.`
        : ` Geçen aya göre yüzde ${Math.abs(trendYuzde)} az harcamışsın, aferin!`;
    }

    if (butceHedef > 0) {
      cevap += butceKullanim > 80 
        ? ` Dikkat! Bütçenin yüzde ${butceKullanim}'ini kullandın.`
        : ` Bütçenin yüzde ${butceKullanim}'ini kullandın.`;
    }

    logger.info(`[SesliAsistan] Analiz hazır (${Date.now() - baslangic}ms)`);

    return {
      anlasilanMetin: metin,
      niyet: 'ANALIZ_YAP',
      cevapMetni: cevap,
      data: {
        tip: 'ANALIZ',
        analiz: {
          toplamGider,
          toplamGelir,
          netDurum: toplamGelir - toplamGider,
          butceHedef,
          butceKullanim,
          gecenAyGider,
          trendYuzde,
          pieChart,
          haftalikTrend,
          kategoriDetay: siraliKategoriler.map(([ad, v]) => ({
            ad,
            miktar: v.miktar,
            renk: v.renk,
            yuzde: Math.round((v.miktar / toplamGider) * 100)
          }))
        }
      }
    };
  },

  // ─────────────────────────────────────────
  // TASARRUF ÖNERİSİ
  // ─────────────────────────────────────────
  async _tasarrufOnerisi(kullaniciId: string, baslangic: number) {
    const ayBaslangic = new Date();
    ayBaslangic.setDate(1);

    const islemler = await prisma.islem.findMany({
      where: { kullaniciId, tip: 'GIDER', tarih: { gte: ayBaslangic } },
      include: { kategori: { select: { ad: true } } }
    });

    const kategoriHarcama: Record<string, number> = {};
    islemler.forEach(i => {
      const kat = i.kategori?.ad || 'Diğer';
      kategoriHarcama[kat] = (kategoriHarcama[kat] || 0) + i.miktar;
    });

    const sirali = Object.entries(kategoriHarcama).sort(([,a], [,b]) => b - a);
    
    let cevap = 'Tasarruf önerim: ';
    if (sirali.length > 0) {
      const [kat, tutar] = sirali[0];
      cevap += `${kat} kategorisinde ${tutar.toLocaleString('tr-TR')} TL harcamışsın. Burayı biraz kısabilirsin.`;
    } else {
      cevap += 'Henüz yeterli harcama verisi yok.';
    }

    logger.info(`[SesliAsistan] Öneri hazır (${Date.now() - baslangic}ms)`);

    return {
      anlasilanMetin: 'Tasarruf önerisi',
      niyet: 'ONERI_ISTE',
      cevapMetni: cevap,
      data: null
    };
  },

  // ─────────────────────────────────────────
  // HEDEF EKLE (Para ekle)
  // ─────────────────────────────────────────
  async _hedefEkle(metin: string, kullaniciId: string, baslangic: number) {
    // Hedefleri al
    const hedefler = await prisma.hedef.findMany({
      where: { kullaniciId, durum: 'DEVAM_EDIYOR' },
      select: { id: true, baslik: true, hedefMiktar: true, mevcutMiktar: true, renk: true }
    });

    if (hedefler.length === 0) {
      return {
        anlasilanMetin: metin,
        niyet: 'HEDEF_EKLE',
        cevapMetni: 'Henüz aktif bir hedefin yok. Önce hedef oluşturmalısın.',
        data: null
      };
    }

    // Hedef adı ve miktarı parse et
    const parsePrompt = `
Kullanıcı mesajı: "${metin}"
Mevcut hedefler: ${hedefler.map(h => h.baslik).join(', ')}

Hangi hedefe ne kadar para eklemek istiyor? JSON döndür:
{"hedefAdi":"hedef adı","miktar":500}

Eğer hedef adı belli değilse, miktarı al ve hedefAdi'yi null yap.
Sadece JSON döndür, başka bir şey yazma.
`.trim();

    const parseResult = await geminiFlash.generateContent(parsePrompt);
    const parseText = parseResult.response.text().trim().replace(/```json\n?|\n?```/g, '');
    
    let parsed: any;
    try {
      parsed = JSON.parse(parseText);
    } catch {
      return {
        anlasilanMetin: metin,
        niyet: 'HEDEF_EKLE',
        cevapMetni: 'Anlayamadım. Örnek: "Tatil hedefine 500 lira ekle"',
        data: null
      };
    }

    // Hedef bul
    let hedef = hedefler[0]; // Varsayılan ilk hedef
    if (parsed.hedefAdi) {
      const bulunan = hedefler.find(h => 
        h.baslik.toLowerCase().includes(parsed.hedefAdi.toLowerCase()) ||
        parsed.hedefAdi.toLowerCase().includes(h.baslik.toLowerCase())
      );
      if (bulunan) hedef = bulunan;
    }

    const miktar = parsed.miktar || 0;
    if (miktar <= 0) {
      return {
        anlasilanMetin: metin,
        niyet: 'HEDEF_EKLE',
        cevapMetni: 'Ne kadar eklemek istediğini anlayamadım.',
        data: null
      };
    }

    const yeniMiktar = hedef.mevcutMiktar + miktar;
    const ilerleme = Math.round((yeniMiktar / hedef.hedefMiktar) * 100);

    logger.info(`[SesliAsistan] Hedef ekleme: ${hedef.baslik} +${miktar} (${Date.now() - baslangic}ms)`);

    return {
      anlasilanMetin: metin,
      niyet: 'HEDEF_EKLE',
      cevapMetni: `${hedef.baslik} hedefine ${miktar.toLocaleString('tr-TR')} TL eklensin mi? Toplam ${yeniMiktar.toLocaleString('tr-TR')} TL olacak, yüzde ${ilerleme} tamamlanmış olacak.`,
      data: {
        tip: 'HEDEF_ONAY',
        hedef: {
          id: hedef.id,
          baslik: hedef.baslik,
          miktar,
          yeniMiktar,
          hedefMiktar: hedef.hedefMiktar,
          ilerleme,
          renk: hedef.renk
        }
      }
    };
  },

  // ─────────────────────────────────────────
  // HEDEF SORGULA (Analiz)
  // ─────────────────────────────────────────
  async _hedefSorgula(kullaniciId: string, baslangic: number) {
    const hedefler = await prisma.hedef.findMany({
      where: { kullaniciId },
      select: { 
        id: true, baslik: true, hedefMiktar: true, mevcutMiktar: true, 
        durum: true, renk: true, hedefTarihi: true 
      },
      orderBy: { durum: 'asc' }
    });

    if (hedefler.length === 0) {
      return {
        anlasilanMetin: 'Hedef sorgulama',
        niyet: 'HEDEF_SORGULA',
        cevapMetni: 'Henüz bir hedefin yok. Hedefler ekranından yeni hedef oluşturabilirsin.',
        data: null
      };
    }

    const aktifHedefler = hedefler.filter(h => h.durum === 'DEVAM_EDIYOR');
    const tamamlananlar = hedefler.filter(h => h.durum === 'TAMAMLANDI');

    let cevap = '';
    if (aktifHedefler.length > 0) {
      const toplamHedef = aktifHedefler.reduce((s, h) => s + h.hedefMiktar, 0);
      const toplamMevcut = aktifHedefler.reduce((s, h) => s + h.mevcutMiktar, 0);
      const genelIlerleme = Math.round((toplamMevcut / toplamHedef) * 100);
      
      cevap = `${aktifHedefler.length} aktif hedefin var. Toplam yüzde ${genelIlerleme} ilerleme kaydetmişsin.`;
      
      // En yakın hedefe ne kadar kaldı
      const enYakin = aktifHedefler.reduce((min, h) => {
        const kalan = h.hedefMiktar - h.mevcutMiktar;
        return kalan < (min.hedefMiktar - min.mevcutMiktar) ? h : min;
      });
      const kalanMiktar = enYakin.hedefMiktar - enYakin.mevcutMiktar;
      cevap += ` ${enYakin.baslik} hedefine ${kalanMiktar.toLocaleString('tr-TR')} TL kaldı.`;
    }

    if (tamamlananlar.length > 0) {
      cevap += ` ${tamamlananlar.length} hedefini tamamlamışsın, tebrikler!`;
    }

    const hedefData = hedefler.map(h => ({
      id: h.id,
      baslik: h.baslik,
      hedefMiktar: h.hedefMiktar,
      mevcutMiktar: h.mevcutMiktar,
      ilerleme: Math.round((h.mevcutMiktar / h.hedefMiktar) * 100),
      durum: h.durum,
      renk: h.renk || '#8B5CF6',
      kalan: h.hedefMiktar - h.mevcutMiktar
    }));

    logger.info(`[SesliAsistan] Hedef sorgu hazır (${Date.now() - baslangic}ms)`);

    return {
      anlasilanMetin: 'Hedef sorgulama',
      niyet: 'HEDEF_SORGULA',
      cevapMetni: cevap,
      data: {
        tip: 'HEDEF_ANALIZ',
        hedefler: hedefData,
        ozet: {
          aktif: aktifHedefler.length,
          tamamlanan: tamamlananlar.length,
          toplamHedef: hedefler.reduce((s, h) => s + h.hedefMiktar, 0),
          toplamMevcut: hedefler.reduce((s, h) => s + h.mevcutMiktar, 0)
        }
      }
    };
  },

  // ─────────────────────────────────────────
  // PİYASA SORGULA (Döviz, Altın, BIST100)
  // ─────────────────────────────────────────
  async _piyasaSorgula(metin: string, baslangic: number) {
    const metinKucuk = metin.toLowerCase();
    
    try {
      const piyasaOzeti = await piyasaService.tumPiyasaOzetiGetir();
      
      let cevap = '';
      let tip = 'PIYASA_GENEL';
      
      // Dolar sorgusu
      if (metinKucuk.includes('dolar') || metinKucuk.includes('usd')) {
        const dolar = piyasaOzeti.doviz.dolar;
        if (dolar) {
          cevap = `Dolar şu an alışta ${dolar.alis?.toFixed(2)} TL, satışta ${dolar.satis?.toFixed(2)} TL.`;
          tip = 'DOVIZ';
        } else {
          cevap = 'Dolar kuru bilgisi şu an alınamadı.';
        }
      }
      // Euro sorgusu
      else if (metinKucuk.includes('euro') || metinKucuk.includes('eur')) {
        const euro = piyasaOzeti.doviz.euro;
        if (euro) {
          cevap = `Euro şu an alışta ${euro.alis?.toFixed(2)} TL, satışta ${euro.satis?.toFixed(2)} TL.`;
          tip = 'DOVIZ';
        } else {
          cevap = 'Euro kuru bilgisi şu an alınamadı.';
        }
      }
      // Sterlin sorgusu
      else if (metinKucuk.includes('sterlin') || metinKucuk.includes('gbp') || metinKucuk.includes('pound')) {
        const sterlin = piyasaOzeti.doviz.sterlin;
        if (sterlin) {
          cevap = `İngiliz Sterlini şu an alışta ${sterlin.alis?.toFixed(2)} TL, satışta ${sterlin.satis?.toFixed(2)} TL.`;
          tip = 'DOVIZ';
        } else {
          cevap = 'Sterlin kuru bilgisi şu an alınamadı.';
        }
      }
      // Gram Altın sorgusu
      else if (metinKucuk.includes('gram altın') || metinKucuk.includes('altın kaç') || metinKucuk.includes('altın ne kadar')) {
        const altin = piyasaOzeti.altin.gram;
        if (altin) {
          cevap = `Gram altın şu an alışta ${altin.alis?.toLocaleString('tr-TR')} TL, satışta ${altin.satis?.toLocaleString('tr-TR')} TL.`;
          tip = 'ALTIN';
        } else {
          cevap = 'Altın fiyat bilgisi şu an alınamadı.';
        }
      }
      // Çeyrek Altın sorgusu
      else if (metinKucuk.includes('çeyrek')) {
        const ceyrek = piyasaOzeti.altin.ceyrek;
        if (ceyrek) {
          cevap = `Çeyrek altın şu an alışta ${ceyrek.alis?.toLocaleString('tr-TR')} TL, satışta ${ceyrek.satis?.toLocaleString('tr-TR')} TL.`;
          tip = 'ALTIN';
        } else {
          cevap = 'Çeyrek altın fiyat bilgisi şu an alınamadı.';
        }
      }
      // Gümüş sorgusu
      else if (metinKucuk.includes('gümüş')) {
        const gumus = piyasaOzeti.altin.gumus;
        if (gumus) {
          cevap = `Gümüş şu an alışta ${gumus.alis?.toLocaleString('tr-TR')} TL, satışta ${gumus.satis?.toLocaleString('tr-TR')} TL.`;
          tip = 'GUMUS';
        } else {
          cevap = 'Gümüş fiyat bilgisi şu an alınamadı.';
        }
      }
      // Altın genel sorgusu
      else if (metinKucuk.includes('altın')) {
        const gram = piyasaOzeti.altin.gram;
        const ceyrek = piyasaOzeti.altin.ceyrek;
        if (gram && ceyrek) {
          cevap = `Gram altın ${gram.satis?.toLocaleString('tr-TR')} TL, çeyrek altın ${ceyrek.satis?.toLocaleString('tr-TR')} TL.`;
          tip = 'ALTIN';
        } else if (gram) {
          cevap = `Gram altın şu an ${gram.satis?.toLocaleString('tr-TR')} TL.`;
          tip = 'ALTIN';
        } else {
          cevap = 'Altın fiyat bilgisi şu an alınamadı.';
        }
      }
      // BIST100 sorgusu
      else if (metinKucuk.includes('bist') || metinKucuk.includes('borsa') || metinKucuk.includes('xu100') || metinKucuk.includes('endeks')) {
        const bist = piyasaOzeti.bist100;
        if (bist) {
          const durum = bist.degisimYuzde >= 0 ? 'yükselişte' : 'düşüşte';
          const degisim = Math.abs(bist.degisimYuzde || 0).toFixed(2);
          cevap = `BİST 100 endeksi ${bist.deger?.toLocaleString('tr-TR')} puan, bugün yüzde ${degisim} ${durum}.`;
          tip = 'BIST100';
        } else {
          cevap = 'BİST 100 endeks bilgisi şu an alınamadı.';
        }
      }
      // Genel piyasa özeti
      else {
        const dolar = piyasaOzeti.doviz.dolar;
        const euro = piyasaOzeti.doviz.euro;
        const gram = piyasaOzeti.altin.gram;
        
        const parts: string[] = [];
        if (dolar) parts.push(`Dolar ${dolar.satis?.toFixed(2)} TL`);
        if (euro) parts.push(`Euro ${euro.satis?.toFixed(2)} TL`);
        if (gram) parts.push(`Gram altın ${gram.satis?.toLocaleString('tr-TR')} TL`);
        
        if (parts.length > 0) {
          cevap = `Güncel piyasa: ${parts.join(', ')}.`;
        } else {
          cevap = 'Piyasa verileri şu an alınamadı, biraz sonra tekrar dene.';
        }
      }

      logger.info(`[SesliAsistan] Piyasa sorgusu: ${tip} (${Date.now() - baslangic}ms)`);

      return {
        anlasilanMetin: metin,
        niyet: 'PIYASA_SORGULA',
        cevapMetni: cevap,
        data: {
          tip,
          piyasa: piyasaOzeti
        }
      };
    } catch (error: any) {
      logger.error(`[SesliAsistan] Piyasa sorgu hatası: ${error.message}`);
      return {
        anlasilanMetin: metin,
        niyet: 'PIYASA_SORGULA',
        cevapMetni: 'Piyasa verilerine şu an ulaşamadım, biraz sonra tekrar dene.',
        data: null
      };
    }
  },

  // ─────────────────────────────────────────
  // SOHBET
  // ─────────────────────────────────────────
  async _sohbet(metin: string, kullaniciId: string, baslangic: number) {
    const kullanici = await prisma.kullanici.findUnique({ 
      where: { id: kullaniciId }, 
      select: { ad: true } 
    });

    const prompt = promptlar.genelSohbet(metin, kullanici?.ad || 'Kullanıcı');
    const result = await geminiFlash.generateContent(prompt);
    const cevap = result.response.text().trim();

    logger.info(`[SesliAsistan] Sohbet cevabı hazır (${Date.now() - baslangic}ms)`);

    return {
      anlasilanMetin: metin,
      niyet: 'SOHBET',
      cevapMetni: cevap,
      data: null
    };
  },

  // ─────────────────────────────────────────
  // İŞLEM KAYDET
  // ─────────────────────────────────────────
  async islemKaydet(kullaniciId: string, dto: SesliIslemOnayDto) {
    return await prisma.islem.create({
      data: { ...dto, kullaniciId, sesleEklendi: true },
      include: { kategori: true }
    });
  },

  // ─────────────────────────────────────────
  // KEYWORD BAZLI NİYET BUL (HIZLI)
  // ─────────────────────────────────────────
  _keywordNiyetBul(metin: string): string {
    // Detaylı Rapor (EN ÖNCE KONTROL ET!)
    if (metin.includes('detaylı rapor') || metin.includes('detayli rapor')) {
      return 'DETAYLI_RAPOR';
    }
    if (metin.includes('rapor ver') || metin.includes('rapor iste') || metin.includes('tam rapor')) {
      return 'DETAYLI_RAPOR';
    }
    if (metin.includes('finansal rapor') || metin.includes('aylık rapor') || metin.includes('harcama raporu')) {
      return 'DETAYLI_RAPOR';
    }

    // Hedefe para ekleme
    if (metin.includes('hedefe') && (metin.includes('ekle') || metin.includes('koy') || metin.includes('at'))) {
      return 'HEDEF_EKLE';
    }
    if (/\d+.*hedefe|hedefe.*\d+/.test(metin) || /hedef.*ekle|ekle.*hedef/.test(metin)) {
      return 'HEDEF_EKLE';
    }

    // Hedef sorgulama
    if (metin.includes('hedef') && (metin.includes('nasıl') || metin.includes('durum') || metin.includes('ne kadar kaldı'))) {
      return 'HEDEF_SORGULA';
    }
    if (metin === 'hedeflerim' || metin === 'hedeflerim nasıl' || metin.includes('hedeflerim ne')) {
      return 'HEDEF_SORGULA';
    }

    // İşlem ekleme - rakam + fiil
    if (/\d+\s*(tl|lira|₺)?\s*(kahve|çay|yemek|market|taksi|benzin|fatura|kira|alışveriş)/i.test(metin)) {
      return 'ISLEM_EKLE';
    }
    if (/\d+\s*(tl|lira|₺)?\s*(içtim|yedim|aldım|ödedim|harcadım|verdim)/i.test(metin)) {
      return 'ISLEM_EKLE';
    }
    if (/(kahve|çay|yemek|market|taksi)\s*\d+/i.test(metin)) {
      return 'ISLEM_EKLE';
    }

    // Analiz
    if (metin.includes('analiz') || metin.includes('kategori dağılımı') || metin.includes('grafik')) {
      return 'ANALIZ_YAP';
    }

    // Özet
    if (metin.includes('bu ay') || metin.includes('ne harcadım') || metin.includes('ne kadar harcadım')) {
      return 'OZET_GETIR';
    }
    if (metin.includes('özet') || metin.includes('harcamalarım')) {
      return 'OZET_GETIR';
    }
    if (metin.includes('nasıl gitti') || metin.includes('nasıl geçti') || metin.includes('durum ne')) {
      return 'OZET_GETIR';
    }

    // Öneri
    if (metin.includes('öneri') || metin.includes('tasarruf') || metin.includes('ne yapmalıyım') || metin.includes('nasıl tasarruf')) {
      return 'ONERI_ISTE';
    }

    // Piyasa sorgusu (Döviz, Altın, BIST)
    if (metin.includes('dolar') || metin.includes('euro') || metin.includes('sterlin')) {
      return 'PIYASA_SORGULA';
    }
    if (metin.includes('altın') || metin.includes('gümüş') || metin.includes('çeyrek')) {
      return 'PIYASA_SORGULA';
    }
    if (metin.includes('bist') || metin.includes('borsa') || metin.includes('endeks') || metin.includes('xu100')) {
      return 'PIYASA_SORGULA';
    }
    if (metin.includes('piyasa') || metin.includes('kur') || metin.includes('döviz')) {
      return 'PIYASA_SORGULA';
    }

    // Sohbet (basit selamlaşmalar)
    if (/^(merhaba|selam|naber|hey|nasılsın|günaydın|iyi akşamlar)$/i.test(metin.trim())) {
      return 'SOHBET';
    }

    return 'BELIRSIZ';
  },

  // ─────────────────────────────────────────
  // KATEGORİ EŞLEŞTİR (Akıllı eşleştirme)
  // ─────────────────────────────────────────
  _kategoriEslestir(onerilenAd: string, kategoriler: any[], islemTipi: string) {
    if (!onerilenAd) return kategoriler.find(k => k.tip === islemTipi) || kategoriler[0];
    const kucuk = onerilenAd.toLowerCase().trim();
    
    // Akıllı eşleştirme haritası
    const eslestirmeHaritasi: Record<string, string[]> = {
      'Yeme & İçme': ['kahve', 'çay', 'yemek', 'restoran', 'döner', 'pizza', 'burger', 'kebap', 'lokanta', 'cafe', 'kafe', 'içecek', 'su', 'starbucks', 'kahvaltı', 'öğle', 'akşam', 'yedim', 'içtim', 'fast food', 'tost', 'sandviç'],
      'Market': ['market', 'migros', 'bim', 'a101', 'şok', 'carrefour', 'bakkal', 'manav', 'kasap', 'fırın'],
      'Ulaşım': ['taksi', 'otobüs', 'metro', 'metrobüs', 'dolmuş', 'uber', 'bitaksi', 'akbil', 'istanbulkart', 'marmaray', 'tren', 'vapur'],
      'Yakıt': ['benzin', 'mazot', 'lpg', 'yakıt', 'akaryakıt'],
      'Abonelikler': ['netflix', 'spotify', 'youtube', 'disney', 'amazon', 'prime', 'apple', 'hbo', 'exxen', 'gain', 'blutv', 'premium'],
      'Eğlence': ['sinema', 'konser', 'oyun', 'playstation', 'xbox', 'steam', 'bar', 'pub', 'gece', 'parti', 'eğlence', 'lunapark'],
      'Giyim': ['kıyafet', 'giysi', 'ayakkabı', 'mont', 'pantolon', 'tişört', 'gömlek', 'etek', 'elbise', 'zara', 'h&m', 'lcw', 'koton'],
      'Sağlık': ['doktor', 'hastane', 'muayene', 'ameliyat', 'tedavi'],
      'Eczane': ['ilaç', 'eczane', 'vitamin', 'aspirin'],
      'Spor & Fitness': ['spor', 'salon', 'gym', 'fitness', 'pilates', 'yoga', 'yüzme', 'koşu'],
      'Eğitim': ['ders', 'kurs', 'udemy', 'okul', 'üniversite', 'sınav', 'dershane'],
      'Kitap & Kırtasiye': ['kitap', 'kırtasiye', 'kalem', 'defter', 'not defteri'],
      'Fotokopi & Baskı': ['fotokopi', 'baskı', 'print', 'çıktı'],
      'Teknoloji': ['telefon', 'laptop', 'bilgisayar', 'kulaklık', 'tablet', 'elektronik', 'şarj', 'kablo'],
      'Kişisel Bakım': ['kuaför', 'berber', 'saç', 'makyaj', 'kozmetik', 'parfüm', 'cilt'],
      'İnternet': ['internet', 'wifi', 'fiber'],
      'Telefon': ['hat', 'kontör', 'fatura', 'turkcell', 'vodafone', 'türk telekom'],
      'Hediye': ['hediye', 'doğum günü', 'yılbaşı'],
      'Seyahat': ['otel', 'uçak', 'tatil', 'gezi', 'tur', 'bilet'],
      // Gelir kategorileri
      'Maaş': ['maaş', 'ücret', 'aylık'],
      'Burs': ['burs', 'kredi yurtlar kurumu', 'kyk'],
      'Harçlık': ['harçlık', 'aile', 'anne', 'baba', 'cep harçlığı'],
      'Part-time İş': ['part-time', 'yarı zamanlı', 'parttime'],
      'Freelance': ['freelance', 'serbest', 'proje'],
      'Ek Gelir': ['ek gelir', 'ekstra', 'bonus', 'prim'],
    };

    // 1. Önce akıllı eşleştirme dene
    for (const [kategoriAdi, keywords] of Object.entries(eslestirmeHaritasi)) {
      if (keywords.some(keyword => kucuk.includes(keyword))) {
        const match = kategoriler.find(k => k.ad.toLowerCase() === kategoriAdi.toLowerCase());
        if (match) return match;
      }
    }

    // 2. Tam eşleşme
    let match = kategoriler.find(k => k.ad.toLowerCase() === kucuk);
    if (match) return match;
    
    // 3. Kısmi eşleşme
    match = kategoriler.find(k => 
      k.ad.toLowerCase().includes(kucuk) || kucuk.includes(k.ad.toLowerCase())
    );
    if (match) return match;
    
    // 4. Tip uyumu ile varsayılan
    const tipUyumlu = kategoriler.filter(k => k.tip === islemTipi);
    if (tipUyumlu.length > 0) {
      // En popüler kategoriye yönlendir
      const populer = tipUyumlu.find(k => 
        k.ad === 'Yeme & İçme' || k.ad === 'Market' || k.ad === 'Ulaşım' || k.ad === 'Ek Gelir'
      );
      return populer || tipUyumlu[0];
    }
    
    return kategoriler.find(k => k.ad.includes('Diğer')) || kategoriler[0];
  },

  // ─────────────────────────────────────────
  // KARŞILAMA
  // ─────────────────────────────────────────
  async karsilamaYap(kullaniciId: string) {
    const kullanici = await prisma.kullanici.findUnique({ 
      where: { id: kullaniciId }, 
      select: { ad: true } 
    });
    return { cevapMetni: `Merhaba ${kullanici?.ad || ''}! Sana nasıl yardımcı olabilirim?` };
  }
};
