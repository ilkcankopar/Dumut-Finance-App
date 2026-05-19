import { prisma } from "@/prisma/client";
import { ApiError } from "@utils/ApiError";
import { logger } from "@config/logger.config";
import { piyasaProvider } from "./piyasa.provider";
import { piyasaCache, CACHE_KEYS } from "./piyasa.cache";

// BİST hisse ikonları (şirket logosu placeholder)
const BIST_ICONLAR: Record<string, string> = {
THYAO: "https://imgroset.mynet.com/api/resize/1000x750/yonlendir.php?img=https://imgroset.mynet.com/galeri/22234/thyssenkrupp.jpg",
ASELS: "https://www.logo.com.tr/image/get?id=123456",
EREGL: "https://www.logo.com.tr/image/get?id=789012",
GARAN: "https://www.logo.com.tr/image/get?id=456789",
SAHOL: "https://www.logo.com.tr/image/get?id=321654",
KCHOL: "https://www.logo.com.tr/image/get?id=654321",
TUPRS: "https://www.logo.com.tr/image/get?id=987654",
ISCTR: "https://www.logo.com.tr/image/get?id=147258",
YKBNK: "https://www.logo.com.tr/image/get?id=258369",
AKBNK: "https://www.logo.com.tr/image/get?id=369147",
// Varsayılan ikon
DEFAULT: "https://img.icons8.com/color/96/currency-exchange.png",
};

export const piyasaService = {
// ─────────────────────────────────────────
// BİST 100 TÜM HİSSELER
// ─────────────────────────────────────────
async bist100Getir() {
const cached = piyasaCache.get<any[]>(CACHE_KEYS.BIST100);
if (cached) {
return { veri: cached, kaynaktan: "cache" };
}

const ham = await piyasaProvider.bist100cek();
if (!ham || !ham.length) {
logger.warn("[Piyasa] BİST 100 verisi yok, boş döndürülüyor");
return { veri: [], kaynaktan: "api" };
}

const normalize = ham.map((h) => {
const sembol = h.code ?? h.text?.split(" ")[0];
return {
sembol,
ad: h.text,
alisFiyati: h.buying ? parseFloat(h.buying.replace(",", ".")) : (h.lastprice || 0),
satisFiyati: h.selling ? parseFloat(h.selling.replace(",", ".")) : (h.lastprice || 0),
degisimYuzde: h.rate || 0,
borsaKodu: "BIST",
paraBirimi: "TRY",
icon: h.icon || BIST_ICONLAR[sembol] || BIST_ICONLAR.DEFAULT,
hacim: h.hacim,
min: h.min,
max: h.max,
time: h.time,
};
});

piyasaCache.set(CACHE_KEYS.BIST100, normalize, 5);
return { veri: normalize, kaynaktan: "api" };
},

// ─────────────────────────────────────────
// TEK HİSSE GETİR
// ─────────────────────────────────────────
async hisseGetir(sembol: string, borsaKodu: "BIST" | "NYSE" | "NASDAQ") {
const cacheKey = CACHE_KEYS.HISSE(sembol);
const cached = piyasaCache.get<any>(cacheKey);
if (cached) return cached;

let veri;

if (borsaKodu === "BIST") {
const ham = await piyasaProvider.bistHisseCek(sembol);
if (!ham) throw ApiError.notFound(`${sembol} hissesi bulunamadı`);

veri = {
sembol: ham.code,
ad: ham.text,
alisFiyati: ham.buying ? parseFloat(ham.buying.replace(",", ".")) : (ham.lastprice || 0),
satisFiyati: ham.selling ? parseFloat(ham.selling.replace(",", ".")) : (ham.lastprice || 0),
degisimYuzde: ham.rate || 0,
borsaKodu: "BIST",
paraBirimi: "TRY",
icon: ham.icon || BIST_ICONLAR[sembol] || BIST_ICONLAR.DEFAULT,
hacim: ham.hacim,
min: ham.min,
max: ham.max,
};
} else {
const ham = await piyasaProvider.yabanciHisseCek(sembol);
if (!ham) throw ApiError.notFound(`${sembol} hissesi bulunamadı`);

veri = {
sembol: ham.sembol,
alisFiyati: ham.alis,
satisFiyati: ham.satis,
kapanis: ham.kapanis,
acilis: ham.acilis,
enYuksek: ham.enYuksek,
enDusuk: ham.enDusuk,
hacim: ham.hacim,
degisimYuzde: ham.degisimYuzde,
borsaKodu,
paraBirimi: "USD",
};
}

piyasaCache.set(cacheKey, veri, 5);
return veri;
},

// ─────────────────────────────────────────
// KRİPTO LİSTESİ
// ─────────────────────────────────────────
async kriptoListesiGetir(limit = 50) {
const cached = piyasaCache.get<any[]>(CACHE_KEYS.KRIPTO_LISTE);
if (cached) return { veri: cached, kaynaktan: "cache" };

const liste = await piyasaProvider.kriptoListesiCek(limit);
if (!liste.length) throw ApiError.internal("Kripto verisi alınamadı");

const normalize = liste.map((k) => ({
geckoId: k.id,
sembol: k.symbol.toUpperCase(),
ad: k.name,
usdFiyat: k.current_price,
degisim24s: k.price_change_percentage_24h,
degisim7g: k.price_change_percentage_7d_in_currency,
piyasaDegeri: k.market_cap,
hacim24s: k.total_volume,
ikon: k.image,
}));

piyasaCache.set(CACHE_KEYS.KRIPTO_LISTE, normalize, 3);
return { veri: normalize, kaynaktan: "api" };
},

// ─────────────────────────────────────────
// DÖVİZ KURLARI
// ─────────────────────────────────────────
async dovizKurlariGetir() {
const cached = piyasaCache.get<any[]>(CACHE_KEYS.DOVIZ);
if (cached) return { veri: cached, kaynaktan: "cache" };

const kurlar = await piyasaProvider.dovizKurlariCek();
if (!kurlar || !kurlar.length) {
return { veri: [], kaynaktan: "api" };
}

const normalize = kurlar.map((k) => ({
kod: k.code,
ad: k.name,
alisKuru: typeof k.buying === 'number' ? k.buying : parseFloat(String(k.buying)?.replace(",", ".") ?? "0"),
satisKuru: typeof k.selling === 'number' ? k.selling : parseFloat(String(k.selling)?.replace(",", ".") ?? "0"),
bazKur: "TRY",
}));

piyasaCache.set(CACHE_KEYS.DOVIZ, normalize, 10);
return { veri: normalize, kaynaktan: "api" };
},

// ─────────────────────────────────────────
// ALTIN VE GÜMÜŞ FİYATLARI
// ─────────────────────────────────────────
async altinGumusGetir() {
  const cached = piyasaCache.get<any[]>(CACHE_KEYS.ALTIN);
  if (cached) return { veri: cached, kaynaktan: "cache" };

  const ham = await piyasaProvider.altinGumuscek();
  if (!ham || !ham.length) {
    return { veri: [], kaynaktan: "api" };
  }

  const normalize = ham.map((h) => ({
    ad: h.name,
    alisFiyati: typeof h.buying === 'number' ? h.buying : parseFloat(String(h.buying)?.replace(/\./g, "").replace(",", ".") || "0"),
    satisFiyati: typeof h.selling === 'number' ? h.selling : parseFloat(String(h.selling)?.replace(/\./g, "").replace(",", ".") || "0"),
    degisimYuzde: h.rate || 0,
    tarih: h.datetime,
  }));

  piyasaCache.set(CACHE_KEYS.ALTIN, normalize, 5);
  return { veri: normalize, kaynaktan: "api" };
},

// ─────────────────────────────────────────
// GÜMÜŞ FİYATLARI (silverPrice)
// ─────────────────────────────────────────
async gumusFiyatlariGetir() {
  const cached = piyasaCache.get<any[]>("GUMUS");
  if (cached) return { veri: cached, kaynaktan: "cache" };

  const ham = await piyasaProvider.gumusFiyatiCek();
  if (!ham || !ham.length) {
    return { veri: [], kaynaktan: "api" };
  }

  const normalize = ham.map((h) => ({
    ad: h.name,
    alisFiyati: typeof h.buying === 'number' ? h.buying : parseFloat(String(h.buying)?.replace(/\./g, "").replace(",", ".") || "0"),
    satisFiyati: typeof h.selling === 'number' ? h.selling : parseFloat(String(h.selling)?.replace(/\./g, "").replace(",", ".") || "0"),
    degisimYuzde: h.rate || 0,
    tarih: h.datetime,
  }));

  piyasaCache.set("GUMUS", normalize, 5);
  return { veri: normalize, kaynaktan: "api" };
},

// ─────────────────────────────────────────
// BİST100 ENDEKS DEĞERİ
// ─────────────────────────────────────────
async bist100EndeksGetir() {
  const cached = piyasaCache.get<any>(CACHE_KEYS.BIST_ENDEKS);
  if (cached) return { veri: cached, kaynaktan: "cache" };

  const ham = await piyasaProvider.bist100EndeksCek();
  if (!ham) {
    return { veri: null, kaynaktan: "api" };
  }

  piyasaCache.set(CACHE_KEYS.BIST_ENDEKS, ham, 5);
  return { veri: ham, kaynaktan: "api" };
},

// ─────────────────────────────────────────
// TÜM PİYASA ÖZETİ (Sesli asistan için)
// ─────────────────────────────────────────
async tumPiyasaOzetiGetir() {
  const [doviz, altin, gumusRes, bist] = await Promise.all([
    this.dovizKurlariGetir().catch(() => ({ veri: [] })),
    this.altinGumusGetir().catch(() => ({ veri: [] })),
    this.gumusFiyatlariGetir().catch(() => ({ veri: [] })),
    this.bist100EndeksGetir().catch(() => ({ veri: null })),
  ]);

  const dolar = doviz.veri.find((d) => d.kod === "USD");
  const euro = doviz.veri.find((d) => d.kod === "EUR");
  const sterlin = doviz.veri.find((d) => d.kod === "GBP");

  const gramAltin = altin.veri.find((a) => a.ad?.toLowerCase().includes("gram"));
  const ceyrekAltin = altin.veri.find((a) => a.ad?.toLowerCase().includes("çeyrek"));
  const yarimAltin = altin.veri.find((a) => a.ad?.toLowerCase().includes("yarım"));
  const tamAltin = altin.veri.find((a) => a.ad?.toLowerCase().includes("tam") || a.ad?.toLowerCase().includes("cumhuriyet"));
  
  // Gümüş - önce silverPrice API'den, yoksa goldPrice'tan
  let gumus = gumusRes.veri[0];
  if (!gumus) {
    gumus = altin.veri.find((a) => a.ad?.toLowerCase().includes("gümüş"));
  }

  return {
    doviz: {
      dolar: dolar ? { alis: dolar.alisKuru, satis: dolar.satisKuru } : null,
      euro: euro ? { alis: euro.alisKuru, satis: euro.satisKuru } : null,
      sterlin: sterlin ? { alis: sterlin.alisKuru, satis: sterlin.satisKuru } : null,
    },
    altin: {
      gram: gramAltin ? { alis: gramAltin.alisFiyati, satis: gramAltin.satisFiyati } : null,
      ceyrek: ceyrekAltin ? { alis: ceyrekAltin.alisFiyati, satis: ceyrekAltin.satisFiyati } : null,
      yarim: yarimAltin ? { alis: yarimAltin.alisFiyati, satis: yarimAltin.satisFiyati } : null,
      tam: tamAltin ? { alis: tamAltin.alisFiyati, satis: tamAltin.satisFiyati } : null,
      gumus: gumus ? { alis: gumus.alisFiyati, satis: gumus.satisFiyati } : null,
    },
    gumus: gumusRes.veri,
    bist100: bist.veri,
    guncellenmeTarihi: new Date().toISOString(),
  };
},

// ─────────────────────────────────────────
// TAKİP LİSTESİ (Gerçek implementasyon)
// ─────────────────────────────────────────
  async takipListesiGetir(kullaniciId: string) {
    try {
      const [hisseTakipler, kriptoTakipler, bist100Res, kriptoRes] = await Promise.all([
        prisma.hisseTakip.findMany({
          where: { kullaniciId },
          include: {
            hisse: {
              include: {
                fiyatlar: {
                  orderBy: { tarih: "desc" },
                  take: 1,
                },
              },
            },
          },
        }),
        prisma.kriptoTakip.findMany({
          where: { kullaniciId },
          include: {
            kripto: {
              include: {
                fiyatlar: {
                  orderBy: { tarih: "desc" },
                  take: 1,
                },
              },
            },
          },
        }),
        piyasaService.bist100Getir().catch(() => ({ veri: [] })),
        piyasaService.kriptoListesiGetir(100).catch(() => ({ veri: [] })),
      ]);

      return {
        hisseTakipler: hisseTakipler.map((t) => {
          const bistHisse = bist100Res.veri.find((h) => h.sembol?.toUpperCase() === t.hisse.sembol?.toUpperCase());
          const guncelFiyat = bistHisse?.satisFiyati || t.hisse.fiyatlar[0]?.satisFiyati || 0;
          const degisimYuzde = bistHisse?.degisimYuzde || t.hisse.fiyatlar[0]?.degisimYuzde || 0;
          return {
            id: t.id,
            hisseId: t.hisseId,
            sembol: t.hisse.sembol,
            ad: t.hisse.ad,
            hedefFiyat: t.hedefFiyat,
            guncelFiyat,
            degisimYuzde,
            icon: `https://cdnydm.com/collectapi/${t.hisse.sembol}.png`,
            ikon: `https://cdnydm.com/collectapi/${t.hisse.sembol}.png`,
          };
        }),
        kriptoTakipler: kriptoTakipler.map((t) => {
          const kriptoVeri = kriptoRes.veri.find((k) => k.geckoId?.toLowerCase() === t.kripto.geckoId?.toLowerCase() || k.sembol?.toUpperCase() === t.kripto.sembol?.toUpperCase());
          const guncelFiyat = kriptoVeri?.usdFiyat || t.kripto.fiyatlar[0]?.usdFiyat || 0;
          const degisim24s = kriptoVeri?.degisim24s || t.kripto.fiyatlar[0]?.degisim24s || 0;
          return {
            id: t.id,
            kriptoId: t.kriptoId,
            geckoId: t.kripto.geckoId,
            sembol: t.kripto.sembol,
            ad: t.kripto.ad,
            hedefFiyat: t.hedefFiyat,
            guncelFiyat,
            usdFiyat: guncelFiyat,
            degisim24s,
            icon: `https://assets.coingecko.com/coins/images/1/small/${t.kripto.geckoId}.png`,
            ikon: `https://assets.coingecko.com/coins/images/1/small/${t.kripto.geckoId}.png`,
          };
        }),
      };
} catch (error) {
logger.error("[Piyasa] Takip listesi hatası:", error);
return { hisseTakipler: [], kriptoTakipler: [] };
}
},

async takibeEkle(
kullaniciId: string,
tip: "HISSE" | "KRIPTO",
sembol: string,
hedefFiyat?: number
) {
try {
if (tip === "HISSE") {
// Önce hisseyi bul veya oluştur
let hisse = await prisma.hisse.findUnique({
where: { sembol: sembol.toUpperCase() },
});
let ham = null;
if (!hisse) {
// CollectAPI'den güncel fiyatı al
ham = await piyasaProvider.bistHisseCek(sembol);
hisse = await prisma.hisse.upsert({
where: { sembol: sembol.toUpperCase() },
update: {},
create: {
sembol: sembol.toUpperCase(),
ad: ham?.text || sembol,
borsaKodu: "BIST",
paraBirimi: "TRY",
},
});
}

// Fiyat kaydı oluştur (varsa)
if (!ham) {
ham = await piyasaProvider.bistHisseCek(sembol);
}
if (ham) {
const fiyat = ham.selling ? parseFloat(ham.selling.replace(",", ".")) : (ham.lastprice || 0);
await prisma.hisseFiyat.create({
data: {
hisseId: hisse.id,
alisFiyati: ham.buying ? parseFloat(ham.buying.replace(",", ".")) : fiyat,
satisFiyati: fiyat,
kapanis: fiyat,
acilis: fiyat,
enDusuk: ham.min || fiyat,
hacim: ham.hacim,
degisimYuzde: ham.rate || 0,
},
});
}

const takip = await prisma.hisseTakip.upsert({
where: { kullaniciId_hisseId: { kullaniciId, hisseId: hisse.id } },
update: { hedefFiyat },
create: { kullaniciId, hisseId: hisse.id, hedefFiyat },
});

return {
mesaj: "Hisse takibe eklendi",
tip: "HISSE",
sembol: hisse.sembol,
hedefFiyat,
};
} else {
// Kripto takip (sembol is actually geckoId from frontend)
let kripto = await prisma.kripto.findUnique({
where: { geckoId: sembol },
});

if (!kripto) {
// CoinGecko'dan ara
const liste = await piyasaProvider.kriptoListesiCek(100);
const bulunan = liste.find(
(k) => k.id.toLowerCase() === sembol.toLowerCase()
);

if (!bulunan) throw ApiError.notFound("Kripto bulunamadı");

kripto = await prisma.kripto.upsert({
where: { sembol: bulunan.symbol.toUpperCase() },
update: {},
create: {
sembol: bulunan.symbol.toUpperCase(),
ad: bulunan.name,
geckoId: bulunan.id,
},
});
}

const takip = await prisma.kriptoTakip.upsert({
where: { kullaniciId_kriptoId: { kullaniciId, kriptoId: kripto.id } },
update: { hedefFiyat },
create: { kullaniciId, kriptoId: kripto.id, hedefFiyat },
});

return {
mesaj: "Kripto takibe eklendi",
tip: "KRIPTO",
sembol: kripto.sembol,
hedefFiyat,
};
}
} catch (error) {
logger.error("[Piyasa] Takibe ekleme hatası:", error);
throw ApiError.internal("Takip eklenemedi");
}
},

async takiptenCikar(
kullaniciId: string,
tip: "HISSE" | "KRIPTO",
id: string
) {
try {
if (tip === "HISSE") {
const hisse = await prisma.hisse.findUnique({ where: { sembol: id.toUpperCase() } });
if (hisse) {
await prisma.hisseTakip.deleteMany({
where: { kullaniciId, hisseId: hisse.id },
});
}
} else {
const kripto = await prisma.kripto.findUnique({ where: { geckoId: id } });
if (kripto) {
await prisma.kriptoTakip.deleteMany({
where: { kullaniciId, kriptoId: kripto.id },
});
}
}
return { mesaj: "Takipten çıkarıldı" };
} catch (error) {
logger.error("[Piyasa] Takipten çıkarma hatası:", error);
throw ApiError.internal("Takip kaldırılamadı");
}
},

// ─────────────────────────────────────────
// YATIRIM ÖNERİSİ
// ─────────────────────────────────────────
async yatirimOnerisiGetir(kullaniciId: string) {
const butce = await prisma.butceProfili.findUnique({
where: { kullaniciId },
});

if (!butce) throw ApiError.notFound("Bütçe profili bulunamadı");

const aylikTasarruf = butce.aylikToplamGelir - butce.aylikHedefHarcama;

// Kullanıcının mevcut takiplerini al
const takipler = await this.takipListesiGetir(kullaniciId);

// BİST 100'den popüler hisseleri al
const bist100 = await this.bist100Getir();
const popülerHisseler = bist100.veri.slice(0, 5);

// Kripto'dan popülerleri al
const kripto = await this.kriptoListesiGetir(10);
const bitcoin = kripto.veri.find((k) => k.sembol === "BTC");
const ethereum = kripto.veri.find((k) => k.sembol === "ETH");

const usdRate = 30; // Varsayılan USD/TL

const oneriler: any[] = [];

// Aylık tasarruf varsa yatırım önerileri ekle
if (aylikTasarruf > 0) {
// Döviz önerisi
if (aylikTasarruf >= 100) {
oneriler.push({
tip: "DOVIZ",
baslik: "USD Döviz",
aciklama: `Aylık ${aylikTasarruf.toFixed(0)} TL ile USD alabilirsin`,
miktar: (aylikTasarruf / usdRate).toFixed(2),
birim: "USD",
guncelFiyat: usdRate,
risk: "DUSUK",
yatirimMiktari: aylikTasarruf,
});
}

// BİST önerileri
if (aylikTasarruf >= 500) {
for (const hisse of popülerHisseler) {
const alinabilecekAdet = Math.floor(aylikTasarruf / hisse.satisFiyati);
if (alinabilecekAdet > 0) {
oneriler.push({
tip: "BIST",
baslik: hisse.ad || hisse.sembol,
sembol: hisse.sembol,
aciklama: `${alinabilecekAdet} adet alabilirsin`,
miktar: alinabilecekAdet.toString(),
birim: "Adet",
guncelFiyat: hisse.satisFiyati,
degisimYuzde: hisse.degisimYuzde,
risk: "ORTA",
yatirimMiktari: alinabilecekAdet * hisse.satisFiyati,
icon: hisse.icon,
});
}
}
}

// Kripto önerileri
if (bitcoin) {
const btcTlFiyat = bitcoin.usdFiyat * usdRate;
const alinabilecekBtc = aylikTasarruf / btcTlFiyat;
oneriler.push({
tip: "KRIPTO",
baslik: "Bitcoin",
sembol: "BTC",
aciklama: `${alinabilecekBtc.toFixed(6)} BTC alabilirsin`,
miktar: alinabilecekBtc.toFixed(6),
birim: "BTC",
guncelFiyat: btcTlFiyat,
degisim24s: bitcoin.degisim24s,
risk: "YUKSEK",
yatirimMiktari: aylikTasarruf,
icon: bitcoin.ikon,
});
}

if (ethereum) {
const ethTlFiyat = ethereum.usdFiyat * usdRate;
const alinabilecekEth = aylikTasarruf / ethTlFiyat;
oneriler.push({
tip: "KRIPTO",
baslik: "Ethereum",
sembol: "ETH",
aciklama: `${alinabilecekEth.toFixed(4)} ETH alabilirsin`,
miktar: alinabilecekEth.toFixed(4),
birim: "ETH",
guncelFiyat: ethTlFiyat,
degisim24s: ethereum.degisim24s,
risk: "YUKSEK",
yatirimMiktari: aylikTasarruf,
icon: ethereum.ikon,
});
}
}

return {
aylikTasarruf,
takipEdilenHisseler: takipler.hisseTakipler,
takipEdilenKriptolar: takipler.kriptoTakipler,
oneriler,
};
},
};