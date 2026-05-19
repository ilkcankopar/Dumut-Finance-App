import { apiClient } from './client';

export interface Mesaj {
  id: string;
  gonderenId: string;
  aliciId: string;
  icerik: string;
  mesajTipi: 'METIN' | 'PAYLASIM';
  paylasimTipi?: 'HEDEF' | 'BUTCE' | 'ISLEM' | 'ROZET';
  paylasimVerisi?: any;
  okunduMu: boolean;
  olusturuldu: string;
  gonderen: {
    id: string;
    ad: string;
    soyad: string;
    profilResmi?: string;
  };
}

export interface Konusma {
  kullanici: {
    id: string;
    ad: string;
    soyad: string;
    profilResmi?: string;
    level: number;
  };
  sonMesaj: Mesaj;
  okunmamisSayisi: number;
}

export const mesajApi = {
  async konusmalar(): Promise<Konusma[]> {
    const response = await apiClient.get('/mesaj/konusmalar');
    return response.data.data;
  },

  async mesajlariGetir(kullaniciId: string, sayfa = 1): Promise<Mesaj[]> {
    const response = await apiClient.get(`/mesaj/${kullaniciId}`, { params: { sayfa } });
    return response.data.data;
  },

  async mesajGonder(aliciId: string, icerik: string): Promise<Mesaj> {
    const response = await apiClient.post('/mesaj/gonder', { aliciId, icerik });
    return response.data.data;
  },

  async hedefPaylas(aliciId: string, hedefId: string): Promise<Mesaj> {
    const response = await apiClient.post('/mesaj/hedef-paylas', { aliciId, hedefId });
    return response.data.data;
  },

  async butcePaylas(aliciId: string): Promise<Mesaj> {
    const response = await apiClient.post('/mesaj/butce-paylas', { aliciId });
    return response.data.data;
  },

  async rozetPaylas(aliciId: string, rozetId: string): Promise<Mesaj> {
    const response = await apiClient.post('/mesaj/rozet-paylas', { aliciId, rozetId });
    return response.data.data;
  },

  async okunmamisSayisi(): Promise<number> {
    const response = await apiClient.get('/mesaj/okunmamis-sayisi');
    return response.data.data.sayi;
  },
};
