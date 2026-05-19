import { apiClient } from './client';

export interface Rozet {
  id: string;
  ad: string;
  aciklama: string;
  ikon: string;
  renk: string;
  kosul: {
    tip: string;
    deger: number | string;
  };
  kazanildi?: string | null;
  durum: 'kazanildi' | 'kilitli';
}

export interface RozetlerResponse {
  kazanilan: Rozet[];
  kazanilmayan: Rozet[];
  toplam: number;
  kazanilanSayisi: number;
}

export interface RozetKontrolResponse {
  yeniRozetler: Rozet[];
  kazanilanSayisi: number;
}

export const rozetApi = {
  async tumRozetleriGetir(): Promise<Rozet[]> {
    const res = await apiClient.get('/rozet');
    return res.data?.data;
  },

  async kullaniciRozetleriGetir(): Promise<RozetlerResponse> {
    const res = await apiClient.get('/rozet/benim');
    return res.data?.data;
  },

  async rozetKontrolEt(): Promise<RozetKontrolResponse> {
    const res = await apiClient.post('/rozet/kontrol');
    return res.data?.data;
  },
};
