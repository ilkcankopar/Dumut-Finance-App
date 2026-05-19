import { apiClient } from './client';

// Hedef tipi
export interface Hedef {
id: string;
baslik: string;
aciklama?: string;
hedefMiktar: number;
mevcutMiktar: number;
durum: 'DEVAM_EDIYOR' | 'TAMAMLANDI' | 'IPTAL_EDILDI';
hedefTarihi?: string;
oncelik: 1 | 2 | 3;
herkesGorsun: boolean;
renk: string;
ikon?: string;
varlikSembol?: string;
varlikAdet?: number;
varlikTip?: string;
// Hesaplanmış alanlar
yuzde?: number;
kalan?: number;
kalanGun?: number;
gunlukGerekenBirikim?: number;
suruDurumu?: 'NORMAL' | 'YAKLASAN' | 'GECIKMIS' | 'SÜRESIZ';
oncelikEtiketi?: string;
_count?: {
hedefGecmisi: number;
};
hedefGecmisi?: HedefGecmisi[];
}

export interface HedefGecmisi {
id: string;
hedefId: string;
miktar: number;
notlar?: string;
tarih: string;
kumulatifMiktar?: number;
yuzde?: number;
}

export interface HedefOlusturDto {
baslik: string;
aciklama?: string;
hedefMiktar: number;
hedefTarihi?: string;
oncelik?: 1 | 2 | 3;
herkesGorsun?: boolean;
renk?: string;
ikon?: string;
varlikSembol?: string;
varlikAdet?: number;
varlikTip?: string;
}

export interface HedefGuncelleDto {
baslik?: string;
aciklama?: string;
hedefMiktar?: number;
hedefTarihi?: string;
oncelik?: 1 | 2 | 3;
herkesGorsun?: boolean;
renk?: string;
ikon?: string;
varlikSembol?: string;
varlikAdet?: number;
varlikTip?: string;
durum?: 'DEVAM_EDIYOR' | 'TAMAMLANDI' | 'IPTAL_EDILDI';
}

export interface HedefKatkiDto {
miktar: number;
notlar?: string;
}

export interface HedefIstatistikler {
toplamHedef: number;
devamEden: number;
tamamlanan: number;
iptalEdilen: number;
toplamHedefMiktar: number;
toplamBirikimMiktar: number;
genelIlerleme: number;
enYakinHedef: {
baslik: string;
hedefMiktar: number;
mevcutMiktar: number;
kalan: number;
yuzde: number;
} | null;
}

export interface HedefGecmisResponse {
hedef: Hedef;
gecmis: HedefGecmisi[];
}

// Hedef API servisi
export const hedefApi = {
// Tüm hedefleri getir
listele: async (): Promise<Hedef[]> => {
const response = await apiClient.get('/hedef');
return response.data.data;
},

// İstatistikleri getir
istatistikler: async (): Promise<HedefIstatistikler> => {
const response = await apiClient.get('/hedef/istatistikler');
return response.data.data;
},

// Tek hedef getir
getir: async (id: string): Promise<Hedef> => {
const response = await apiClient.get(`/hedef/${id}`);
return response.data.data;
},

// Hedef geçmişini getir
gecmis: async (id: string): Promise<HedefGecmisResponse> => {
const response = await apiClient.get(`/hedef/${id}/gecmis`);
return response.data.data;
},

// Yeni hedef oluştur
olustur: async (data: HedefOlusturDto): Promise<Hedef> => {
const response = await apiClient.post('/hedef', data);
return response.data.data;
},

// Hedef güncelle
guncelle: async (id: string, data: HedefGuncelleDto): Promise<Hedef> => {
const response = await apiClient.patch(`/hedef/${id}`, data);
return response.data.data;
},

// Hedef sil
sil: async (id: string): Promise<void> => {
await apiClient.delete(`/hedef/${id}`);
},

// Hedefe katkı yap
katki: async (id: string, data: HedefKatkiDto): Promise<{ hedef: Hedef; tamamlandi: boolean; eklenenMiktar: number }> => {
const response = await apiClient.post(`/hedef/${id}/katki`, data);
return response.data.data;
},

// Arkadaşın hedeflerini getir
arkadasHedefleriniGetir: async (arkadasId: string): Promise<Hedef[]> => {
const response = await apiClient.get(`/hedef/arkadas/${arkadasId}`);
return response.data.data;
},
};