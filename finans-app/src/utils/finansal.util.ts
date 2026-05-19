export const finansalUtil = {
    ayligaCevir(miktar: number, periyot: 'HAFTALIK' | 'AYLIK' | 'YILLIK'): number {
        switch (periyot) {
            case "HAFTALIK": return miktar * 4.3;
            case "AYLIK": return miktar;
            case "YILLIK": return miktar / 12;
            default:
                throw new Error(`Geçersiz periyot: ${periyot}`);
        }
    },

    butceKullanimHesapla(harcanan: number, limit: number): number {
        if (limit === 0) return 0;
        const yuzde = (harcanan / limit) * 100;
        return Math.round(yuzde * 100) / 100;
    },

    hedefYuzdesiHesapla(mevcut: number, hedef: number): number {
        if (hedef === 0) return 0;
        const yuzde = (mevcut / hedef) * 100;
        return Math.min(Math.round(yuzde * 100) / 100, 100);
    },

    tasarrufPotansiyeliHesapla(
        mevcutHarcama: number,
        hedefHarcama: number
    ): number {
        return Math.max(mevcutHarcama - hedefHarcama, 0)
    },


    kategoriDagilimiHesapla(
        islemler: { kategoriAdi: string; miktar: number }[]
    ): { kategoriAdi: string; miktar: number; yuzde: number }[] {
        const toplam = islemler.reduce((acc, i) => acc + i.miktar, 0);
        return islemler.map((i) => ({
            ...i,
            yuzde: Math.round((i.miktar / toplam) * 100 * 100) / 100,
        }));
    },

    formatla(miktar: number, paraBirimi = "TRY"): string {
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: paraBirimi,
        }).format(miktar);
    },

    gunlukHarcamaHesapla(
        aylikHarcama: number,

    ) {
        return Math.round(aylikHarcama / 30 * 100) / 100
    }
}