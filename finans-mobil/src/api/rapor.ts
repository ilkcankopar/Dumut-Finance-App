import { apiClient } from './client';

export interface KategoriHedef {
  id: string;
  kategoriAd: string;
  hedefMiktar: number;
  harcanan: number;
  tasarruf: number;
  durum: 'altinda' | 'ustunde' | 'esit';
}

export interface AlimOnerisi {
  tip: 'hisse' | 'kripto';
  sembol: string;
  ad: string;
  fiyat: number;
  alinabilecekAdet: number;
  toplamTutar: number;
  kategori: string;
  tasarrufMiktari: number;
}

export interface DetayliRapor {
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

export const raporApi = {
  async detayliRaporGetir(baslangic: Date, bitis: Date): Promise<DetayliRapor> {
    const response = await apiClient.get('/rapor/detayli', {
      params: {
        baslangic: baslangic.toISOString(),
        bitis: bitis.toISOString(),
      },
    });
    return response.data.data;
  },

  async aiAnaliziGetir(tip: string, veri: any): Promise<string> {
    const response = await apiClient.post('/rapor/ai-analiz', { tip, veri });
    return response.data.data.analiz;
  },
};
