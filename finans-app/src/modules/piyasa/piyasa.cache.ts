// Piyasa verisi sürekli API çağrısı yapmamak için
// belleğe alıyoruz. 5 dakikada bir güncelleniyor.
// Redis olmadan basit in-memory cache.

interface CacheItem<T> {
  veri: T;
  sonGuncelleme: Date;
  gecerlilikDakika: number;
}

class PiyasaCache {
  private store = new Map<string, CacheItem<unknown>>();

  set<T>(anahtar: string, veri: T, gecerlilikDakika = 5): void {
    this.store.set(anahtar, {
      veri,
      sonGuncelleme: new Date(),
      gecerlilikDakika,
    });
  }

  get<T>(anahtar: string): T | null {
    const item = this.store.get(anahtar);
    if (!item) return null;

    const dakikaFark =
      (new Date().getTime() - item.sonGuncelleme.getTime()) / 1000 / 60;

    if (dakikaFark > item.gecerlilikDakika) {
      this.store.delete(anahtar);
      return null;
    }

    return item.veri as T;
  }

  temizle(anahtar: string): void {
    this.store.delete(anahtar);
  }

  tumunuTemizle(): void {
    this.store.clear();
  }
}

export const piyasaCache = new PiyasaCache();

// Cache anahtarları
export const CACHE_KEYS = {
  BIST100: "bist100",
  BIST_ENDEKS: "bist100_endeks",
  KRIPTO_LISTE: "kripto_liste",
  DOVIZ: "doviz_kurlari",
  ALTIN: "altin_gumus",
  HISSE: (sembol: string) => `hisse_${sembol}`,
  KRIPTO: (geckoId: string) => `kripto_${geckoId}`,
} as const;