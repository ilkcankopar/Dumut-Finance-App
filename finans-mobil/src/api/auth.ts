import apiClient from './client';
import { ApiResponse, AuthResponse, KullaniciTipi } from '../types';

export interface KayitDto {
  ad: string;
  soyad: string;
  email: string;
  sifre: string;
  sifreTekrar: string;
  kullaniciTipi: KullaniciTipi;
  dilKodu?: string;
}

export interface GirisDto {
  email: string;
  sifre: string;
}

export interface GoogleGirisDto {
  idToken: string;
  dilKodu?: string;
}

export const authApi = {
  kayitOl: async (data: KayitDto): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post('/auth/kayit', data);
    return response.data;
  },

  girisYap: async (data: GirisDto): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post('/auth/giris', data);
    return response.data;
  },

  googleIleGiris: async (data: GoogleGirisDto): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post('/auth/google', data);
    return response.data;
  },

  tokenYenile: async (refreshToken: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> => {
    const response = await apiClient.post('/auth/token-yenile', { refreshToken });
    return response.data;
  },
};
