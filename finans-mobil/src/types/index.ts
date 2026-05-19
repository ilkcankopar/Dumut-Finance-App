export type KullaniciTipi = 'OGRENCI' | 'GIRISIMCI' | 'BUSINESS';

export type IslemTipi = 'GELIR' | 'GIDER';

export type Periyot = 'HAFTALIK' | 'AYLIK' | 'YILLIK';

export type KategoriTipi = 'GELIR' | 'GIDER' | 'HER_IKISI';

export interface Kullanici {
  id: string;
  email: string;
  ad: string;
  soyad: string;
  kullaniciTipi: KullaniciTipi;
  dilKodu: string;
  profilResmi?: string;
  olusturuldu: string;
}

export interface Kategori {
  id: string;
  ad: string;
  tip: KategoriTipi;
  renk: string;
  ikon: string;
  sistemKategorisi: boolean;
  _count?: {
    islemler: number;
  };
}

export interface Islem {
  id: string;
  kullaniciId: string;
  kategoriId: string;
  tip: IslemTipi;
  baslik: string;
  miktar: number;
  periyot: Periyot;
  sabitMi: boolean;
  tarih: string;
  notlar?: string;
  etiketler: string[];
  kategori: {
    id: string;
    ad: string;
    renk: string;
    ikon: string;
  };
}

export interface ButceProfili {
  id: string;
  kullaniciId: string;
  aylikHedefHarcama: number;
  aylikToplamGelir: number;
  kurulumTamamlandi: boolean;
  paraBirimi: string;
}

export interface Hedef {
  id: string;
  baslik: string;
  aciklama?: string;
  hedefMiktar: number;
  mevcutMiktar: number;
  durum: 'DEVAM_EDIYOR' | 'TAMAMLANDI';
  oncelik: number;
  renk: string;
  ikon?: string;
}

export interface AuthResponse {
  kullanici: Kullanici;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    toplam: number;
    sayfa: number;
    sayfaBasinaKayit: number;
    toplamSayfa: number;
  };
}

export interface OzetResponse {
  donem: {
    baslangic: string;
    bitis: string;
  };
  toplamGelir: number;
  toplamGider: number;
  netTasarruf: number;
  tasarrufOrani: number;
  islemSayisi: number;
  kategoriDagilimi: KategoriDagilim[];
  enCokHarcanan: KategoriDagilim[];
  gunlukTrend: GunlukTrend[];
  haftalikKarsilastirma: HaftalikKarsilastirma[];
}

export interface KategoriDagilim {
  id: string;
  ad: string;
  renk: string;
  ikon: string;
  toplamGider: number;
  toplamGelir: number;
  islemSayisi: number;
  giderYuzdesi: number;
  gelirYuzdesi: number;
}

export interface GunlukTrend {
  tarih: string;
  gelir: number;
  gider: number;
  net: number;
}

export interface HaftalikKarsilastirma {
  hafta: number;
  gelir: number;
  gider: number;
}
