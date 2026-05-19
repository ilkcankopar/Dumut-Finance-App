import { apiClient } from './client';

export interface LevelDurum {
  id: string;
  ad: string;
  soyad: string;
  profilResmi?: string;
  level: number;
  xp: number;
  toplamXP: number;
  unvan: string;
  lig: string;
  sonrakiLevelXP: number;
  mevcutLevelXP: number;
  ilerlemeYuzdesi: number;
  kalanXP: number;
}

export interface SiralamaKullanici {
  id: string;
  ad: string;
  soyad: string;
  profilResmi?: string;
  level: number;
  toplamXP: number;
  unvan: string;
  lig: string;
  sira: number;
  benMi: boolean;
  arkadas?: boolean;
}

export interface GlobalSiralama {
  kullanicilar: SiralamaKullanici[];
  benimSiram: number;
  meta: {
    toplam: number;
    sayfa: number;
    limit: number;
    toplamSayfa: number;
  };
}

export interface LigSiralama {
  lig: string;
  kullanicilar: SiralamaKullanici[];
}

export interface LevelIstatistik {
  level: number;
  xp: number;
  toplamXP: number;
  unvan: string;
  lig: string;
  gunlukOrtalamaXP: number;
  toplamIslem: number;
  toplamHedef: number;
  tamamlananHedef: number;
  toplamRozet: number;
  toplamArkadas: number;
  uyeGunSayisi: number;
}

export interface KullaniciProfil {
  id: string;
  ad: string;
  soyad: string;
  avatar: string;
  profilResmi?: string;
  level: number;
  toplamXP: number;
  unvan: string;
  lig: string;
  globalSira: number;
  istatistikler: {
    toplamIslem: number;
    toplamHedef: number;
    tamamlananHedef: number;
    toplamRozet: number;
    toplamArkadas: number;
    uyeGunSayisi: number;
  };
  sonRozetler: Array<{
    id: string;
    ad: string;
    ikon: string;
    renk: string;
    kazanildi: string;
  }>;
  arkadaslikDurum: 'arkadas' | 'bekliyor' | 'degil';
  benMi: boolean;
}

export const levelApi = {
  async durumGetir(): Promise<LevelDurum> {
    const res = await apiClient.get('/level/durum');
    return res.data?.data;
  },

  async globalSiralama(sayfa = 1, limit = 50): Promise<GlobalSiralama> {
    const res = await apiClient.get('/level/siralama', { params: { sayfa, limit } });
    return res.data?.data;
  },

  async arkadasSiralama(): Promise<SiralamaKullanici[]> {
    const res = await apiClient.get('/level/siralama/arkadaslar');
    return res.data?.data;
  },

  async ligSiralama(lig?: string): Promise<LigSiralama> {
    const res = await apiClient.get('/level/siralama/lig', { params: { lig } });
    return res.data?.data;
  },

  async istatistikler(): Promise<LevelIstatistik> {
    const res = await apiClient.get('/level/istatistikler');
    return res.data?.data;
  },

  async kullaniciProfil(kullaniciId: string): Promise<KullaniciProfil> {
    const res = await apiClient.get(`/level/profil/${kullaniciId}`);
    return res.data?.data;
  },
};
