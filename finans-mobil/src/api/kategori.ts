import apiClient from './client';
import { ApiResponse, Kategori, KategoriTipi } from '../types';

export interface KategoriOlusturDto {
  ad: string;
  tip: KategoriTipi;
  renk: string;
  ikon: string;
}

export const kategoriApi = {
  listele: async (): Promise<ApiResponse<Kategori[]>> => {
    const response = await apiClient.get('/kategori');
    return response.data;
  },

  olustur: async (data: KategoriOlusturDto): Promise<ApiResponse<Kategori>> => {
    const response = await apiClient.post('/kategori', data);
    return response.data;
  },

  guncelle: async (id: string, data: Partial<KategoriOlusturDto>): Promise<ApiResponse<Kategori>> => {
    const response = await apiClient.patch(`/kategori/${id}`, data);
    return response.data;
  },

  sil: async (id: string): Promise<ApiResponse<{ mesaj: string }>> => {
    const response = await apiClient.delete(`/kategori/${id}`);
    return response.data;
  },
};
