import apiClient from './client';
import { ApiResponse, PaginatedResponse, Islem, IslemTipi, Periyot, OzetResponse } from '../types';

export interface IslemOlusturDto {
  kategoriId: string;
  tip: IslemTipi;
  baslik: string;
  miktar: number;
  periyot?: Periyot;
  sabitMi?: boolean;
  tarih?: string;
  notlar?: string;
  etiketler?: string[];
}

export interface IslemListeQuery {
  tip?: IslemTipi;
  kategoriId?: string;
  baslangic?: string;
  bitis?: string;
  sayfa?: number;
  sayfaBasinaKayit?: number;
  siralama?: string;
  siralayis?: 'asc' | 'desc';
  aramaMetni?: string;
}

export const islemApi = {
  listele: async (query?: IslemListeQuery): Promise<PaginatedResponse<Islem>> => {
    const response = await apiClient.get('/islem', { params: query });
    return response.data;
  },

  getir: async (id: string): Promise<ApiResponse<Islem>> => {
    const response = await apiClient.get(`/islem/${id}`);
    return response.data;
  },

  olustur: async (data: IslemOlusturDto): Promise<ApiResponse<Islem>> => {
    const response = await apiClient.post('/islem', data);
    return response.data;
  },

  guncelle: async (id: string, data: Partial<IslemOlusturDto>): Promise<ApiResponse<Islem>> => {
    const response = await apiClient.patch(`/islem/${id}`, data);
    return response.data;
  },

  sil: async (id: string): Promise<ApiResponse<{ mesaj: string }>> => {
    const response = await apiClient.delete(`/islem/${id}`);
    return response.data;
  },

  ozet: async (baslangic: string, bitis: string): Promise<ApiResponse<OzetResponse>> => {
    const response = await apiClient.get('/islem/ozet', {
      params: { baslangic, bitis },
    });
    return response.data;
  },
};
