// Piyasa API servisi

import { apiClient } from './client';

// ─────────────────────────────────────────
// TİPLER
// ─────────────────────────────────────────

export interface BistHisse {
sembol: string;
ad: string;
alisFiyati: number;
satisFiyati: number;
degisimYuzde: number;
borsaKodu: string;
paraBirimi: string;
icon?: string;
hacim?: number;
min?: number;
max?: number;
time?: string;
}

export interface HisseDetay extends BistHisse {
kapanis?: number;
acilis?: number;
enYuksek?: number;
enDusuk?: number;
hacim?: number;
}

export interface KriptoVeri {
geckoId: string;
sembol: string;
ad: string;
usdFiyat: number;
degisim24s: number;
degisim7g: number;
piyasaDegeri: number;
hacim24s: number;
ikon: string;
}

export interface DovizKur {
kod: string;
ad: string;
alisKuru: number;
satisKuru: number;
bazKur: string;
}

export interface HisseTakip {
id: string;
hisseId: string;
sembol: string;
ad: string;
hedefFiyat?: number;
guncelFiyat: number;
degisimYuzde: number;
icon?: string;
ikon?: string;
}

export interface KriptoTakip {
id: string;
kriptoId: string;
sembol: string;
ad: string;
hedefFiyat?: number;
usdFiyat: number;
degisim24s: number;
icon?: string;
ikon?: string;
}

export interface YatirimOneri {
tip: 'DOVIZ' | 'KRIPTO' | 'BIST';
baslik: string;
aciklama: string;
miktar?: string;
birim?: string;
guncelFiyat?: number;
degisim24s?: number;
risk: 'DUSUK' | 'ORTA' | 'YUKSEK';
}

export interface YatirimOnerisiResponse {
aylikTasarruf: number;
mesaj?: string;
oneriler: YatirimOneri[];
}

// ─────────────────────────────────────────
// API SERVİSİ
// ─────────────────────────────────────────

export const piyasaApi = {
// BİST 100 tüm hisseleri getir
bist100: async (): Promise<{ veri: BistHisse[]; kaynaktan: string }> => {
const response = await apiClient.get('/piyasa/bist100');
return response.data.data;
},

// Hisse detay getir
hisseGetir: async (sembol: string, borsa: 'BIST' | 'NYSE' | 'NASDAQ' = 'BIST'): Promise<HisseDetay> => {
const response = await apiClient.get(`/piyasa/hisse/${sembol}?borsa=${borsa}`);
return response.data.data;
},

// Kripto listesi getir
kriptoListesi: async (limit = 50): Promise<{ veri: KriptoVeri[]; kaynaktan: string }> => {
const response = await apiClient.get(`/piyasa/kripto?limit=${limit}`);
return response.data.data;
},

// Döviz kurlarını getir
doviz: async (): Promise<{ veri: DovizKur[]; kaynaktan: string }> => {
const response = await apiClient.get('/piyasa/doviz');
return response.data.data;
},

// Takip listesini getir
takipListesi: async (): Promise<{ hisseTakipler: HisseTakip[]; kriptoTakipler: KriptoTakip[] }> => {
const response = await apiClient.get('/piyasa/takip');
return response.data.data;
},

// Takibe ekle
takibeEkle: async (tip: 'HISSE' | 'KRIPTO', id: string, hedefFiyat?: number): Promise<any> => {
const response = await apiClient.post('/piyasa/takip', { tip, id, hedefFiyat });
return response.data.data;
},

// Takipten çıkar
takiptenCikar: async (tip: 'HISSE' | 'KRIPTO', id: string): Promise<{ mesaj: string }> => {
const response = await apiClient.delete(`/piyasa/takip/${tip}/${id}`);
return response.data.data;
},

// Yatırım önerisi getir
yatirimOnerisi: async (): Promise<YatirimOnerisiResponse> => {
const response = await apiClient.get('/piyasa/yatirim-onerisi');
return response.data.data;
},

// Altın fiyatları getir
altin: async (): Promise<{ veri: AltinFiyat[]; kaynaktan: string }> => {
const response = await apiClient.get('/piyasa/altin');
return response.data.data;
},

// Gümüş fiyatları getir
gumus: async (): Promise<{ veri: AltinFiyat[]; kaynaktan: string }> => {
const response = await apiClient.get('/piyasa/gumus');
return response.data.data;
},

// Piyasa özeti getir
ozet: async (): Promise<PiyasaOzeti> => {
const response = await apiClient.get('/piyasa/ozet');
return response.data.data;
},
};

export interface AltinFiyat {
ad: string;
alisFiyati: number;
satisFiyati: number;
degisimYuzde: number;
tarih?: string;
}

export interface PiyasaOzeti {
doviz: {
dolar: { alis: number; satis: number } | null;
euro: { alis: number; satis: number } | null;
sterlin: { alis: number; satis: number } | null;
};
altin: {
gram: { alis: number; satis: number } | null;
ceyrek: { alis: number; satis: number } | null;
yarim: { alis: number; satis: number } | null;
tam: { alis: number; satis: number } | null;
gumus: { alis: number; satis: number } | null;
};
gumus: AltinFiyat[];
bist100: any;
guncellenmeTarihi: string;
}