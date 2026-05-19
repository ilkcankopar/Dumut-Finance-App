from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from pydantic.alias_generators import to_camel

# --- ENUMLAR ---

class IslemTipi(str, Enum):
    GIDER = "GIDER"
    GELIR = "GELIR"

class Periyot(str, Enum):
    HAFTALIK = "HAFTALIK"
    AYLIK = "AYLIK"
    YILLIK = "YILLIK"

class KategoriTipi(str, Enum):
    GIDER = "GIDER"
    GELIR = "GELIR"
    HER_IKISI = "HER_IKISI"

class KullaniciTipi(str, Enum):
    OGRENCI = "OGRENCI"
    GIRISIMCI = "GIRISIMCI"
    CALISAN = "CALISAN"

class RaporPeriyotu(str, Enum):
    HAFTALIK = "HAFTALIK"
    AYLIK = "AYLIK"
    YILLIK = "YILLIK"

# --- PYDANTIC MODELLERİ ---
# Pydantic v2'de camelCase dönüşümü için base sınıf tanımlıyoruz
class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )

class CikarilanIslem(CamelModel):
    """LLM'in sesten çıkardığı ham işlem verisi"""
    tip: IslemTipi
    baslik: str
    miktar: float
    # Prisma'da direkt kategori adı yok, kategoriId var. 
    # Ama LLM kategori_adi dönecek, biz bunu db_servisinde kategoriId'ye çevireceğiz.
    kategori_adi: str 
    notlar: Optional[str] = None
    sabit_mi: bool = False
    periyot: Periyot = Periyot.AYLIK
    etiketler: List[str] = Field(default_factory=list)
    guven_skoru: float = Field(ge=0.0, le=1.0) # Sadece backend için, DB'de yok

class SesIslemSonucu(CamelModel):
    """Ses işleme pipeline'ının sonucu (FastAPI'nin döneceği yanıt)"""
    transkript: str
    cikarilan_islem: Optional[CikarilanIslem]
    ai_yaniti: str
    islem_kaydedildi: bool = False
    islem_id: Optional[str] = None
    uyarilar: List[str] = Field(default_factory=list)
    ses_base64: Optional[str] = None

class KullaniciFinansalKontekst(CamelModel):
    """LLM'e verilecek kullanıcı bağlamı (Prisma ButceProfili ve ButceKalemi birleşimi)"""
    kullanici_id: str
    ad: str
    kullanici_tipi: KullaniciTipi
    aylik_gelir: float # Prisma'da ButceProfili.aylikToplamGelir
    aylik_hedef_harcama: float # Prisma'da ButceProfili.aylikHedefHarcama
    bu_ay_toplam_gider: float
    bu_ay_toplam_gelir: float
    aktif_hedefler: List[Dict[str, Any]] # Prisma Hedef modeli verileri
    butce_kalemleri: List[Dict[str, Any]] # Prisma ButceKalemi verileri
    mevcut_kategoriler: List[str] = Field(default_factory=list) # KRİTİK: Kategoriler buraya gelecek
    guncel_seri: int # Prisma Seri modelinden
    hedefe_baglilik_skoru: float

class LeaderboardGirisi(CamelModel):
    kullanici_id: str
    ad: str
    soyad: str
    profil_resmi: Optional[str]
    skor: float
    sira: int
    seri: int
    rozet: Optional[str]

class HaftalikRapor(CamelModel):
    """Prisma'daki Rapor modeline tam uyumlu"""
    kullanici_id: str
    periyot: RaporPeriyotu = RaporPeriyotu.HAFTALIK
    baslangic_tarihi: datetime
    bitis_tarihi: datetime
    toplam_gelir: float
    toplam_gider: float
    net_tasarruf: float
    hedef_harcama: float
    hedef_farki: float
    kategori_dagilimi: Dict[str, float] # JSON
    haftalik_trend: Dict[str, Any] = Field(default_factory=dict) # JSON
    ai_ozeti: str
    oneriler: List[str] = Field(default_factory=list) # Bu Rapor tablosunda yok ama API dönerken lazım