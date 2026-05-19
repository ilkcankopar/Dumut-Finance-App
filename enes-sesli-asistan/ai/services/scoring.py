# ai/services/score_calculator.py
from datetime import datetime, timedelta
from typing import List, Optional
from ..models.schemas import KullaniciFinansalKontekst
import math

class HedeBaglilikSkorHesaplayici:
    """
    Hedefe Bağlılık Skoru Formülü:
    
    Skor = (
        BütçeUyum       * 0.35 +   # Harcama limitine ne kadar uyan
        Hedefİlerleme   * 0.25 +   # Finansal hedeflere ne kadar yaklaşıyor
        SeriKatkısı     * 0.20 +   # Günlük kayıt serisi
        TasarrufOranı   * 0.15 +   # Net tasarruf / gelir
        TutarlılıkBonus * 0.05     # Uzun vadeli tutarlılık
    ) * 100
    
    Her bileşen 0.0 - 1.0 arasında normalize edilir.
    Maksimum skor: 100
    """

    def hesapla(self, kontekst: KullaniciFinansalKontekst, seri_gecmisi: List[dict]) -> dict:
        butce_uyum = self._butce_uyum_skoru(kontekst)
        hedef_ilerleme = self._hedef_ilerleme_skoru(kontekst)
        seri_katkisi = self._seri_katkisi_skoru(kontekst.guncel_seri)
        tasarruf_orani = self._tasarruf_orani_skoru(kontekst)
        tutarlilik_bonus = self._tutarlilik_bonus(seri_gecmisi)

        ham_skor = (
            butce_uyum * 0.35 +
            hedef_ilerleme * 0.25 +
            seri_katkisi * 0.20 +
            tasarruf_orani * 0.15 +
            tutarlilik_bonus * 0.05
        ) * 100

        # Skor 0-100 arasında sınırla
        final_skor = round(max(0.0, min(100.0, ham_skor)), 2)

        return {
            "toplam_skor": final_skor,
            "bilesenler": {
                "butce_uyum": round(butce_uyum * 100, 1),
                "hedef_ilerleme": round(hedef_ilerleme * 100, 1),
                "seri_katkisi": round(seri_katkisi * 100, 1),
                "tasarruf_orani": round(tasarruf_orani * 100, 1),
                "tutarlilik_bonus": round(tutarlilik_bonus * 100, 1),
            },
            "rozet": self._rozet_belirle(final_skor),
        }

    def _butce_uyum_skoru(self, k: KullaniciFinansalKontekst) -> float:
        """Bütçe limitine uyum oranı"""
        if k.aylik_hedef_harcama <= 0:
            return 0.5  # Bütçe belirlenmemişse nötr

        kullanim_orani = k.bu_ay_toplam_gider / k.aylik_hedef_harcama

        if kullanim_orani <= 0.7:
            return 1.0      # %70'in altı → tam puan (tasarruflu)
        elif kullanim_orani <= 0.9:
            return 0.85     # %70-90 arası → iyi
        elif kullanim_orani <= 1.0:
            return 0.65     # %90-100 → kabul edilebilir
        elif kullanim_orani <= 1.1:
            # %10'a kadar aşım → lineer düşüş
            return max(0.0, 1.0 - (kullanim_orani - 1.0) * 6.5)
        else:
            # %10'dan fazla aşım → ciddi ceza
            return max(0.0, 0.65 - (kullanim_orani - 1.1) * 2.0)

    def _hedef_ilerleme_skoru(self, k: KullaniciFinansalKontekst) -> float:
        """Aktif hedeflere ilerleme skoru"""
        if not k.aktif_hedefler:
            return 0.5  # Hedef yoksa nötr

        skorlar = []
        for hedef in k.aktif_hedefler:
            hedef_miktar = hedef.get("hedef_miktar", 0)
            mevcut_miktar = hedef.get("mevcut_miktar", 0)
            oncelik = hedef.get("oncelik", 1)

            if hedef_miktar <= 0:
                continue

            ilerleme = min(1.0, mevcut_miktar / hedef_miktar)

            # Öncelik ağırlıklandırma (1-5 arası öncelik)
            agirlik = oncelik / 5.0
            skorlar.append((ilerleme, agirlik))

        if not skorlar:
            return 0.5

        # Ağırlıklı ortalama
        toplam_agirlik = sum(a for _, a in skorlar)
        agirlikli_skor = sum(i * a for i, a in skorlar) / toplam_agirlik

        return agirlikli_skor

    def _seri_katkisi_skoru(self, guncel_seri: int) -> float:
        """
        Günlük kayıt serisi skoru.
        Logaritmik büyüme — ilk günler daha değerli, uzun serilerde daha yavaş artar.
        """
        if guncel_seri <= 0:
            return 0.0
        # log(seri + 1) / log(30 + 1) → 30 gün için normalize
        return min(1.0, math.log(guncel_seri + 1) / math.log(31))

    def _tasarruf_orani_skoru(self, k: KullaniciFinansalKontekst) -> float:
        """Net tasarruf / aylık gelir oranı"""
        if k.aylik_gelir <= 0:
            return 0.5

        net_tasarruf = k.bu_ay_toplam_gelir - k.bu_ay_toplam_gider
        oran = net_tasarruf / k.aylik_gelir

        if oran >= 0.3:
            return 1.0   # %30+ tasarruf → mükemmel
        elif oran >= 0.15:
            return 0.8   # %15-30 → iyi
        elif oran >= 0.05:
            return 0.6   # %5-15 → kabul edilebilir
        elif oran >= 0:
            return 0.4   # Pozitif ama düşük
        else:
            return max(0.0, 0.4 + oran * 2)  # Negatif tasarruf → ceza

    def _tutarlilik_bonus(self, seri_gecmisi: List[dict]) -> float:
        """
        Son 30 günün tutarlılığı.
        Kaç günde başarılı kayıt yapılmış?
        """
        if not seri_gecmisi:
            return 0.0

        son_30_gun = [
            g for g in seri_gecmisi
            if (datetime.now() - g["tarih"]).days <= 30
        ]

        if not son_30_gun:
            return 0.0

        basarili_gunler = sum(1 for g in son_30_gun if g["basarili"])
        return min(1.0, basarili_gunler / 30)

    def _rozet_belirle(self, skor: float) -> str:
        if skor >= 90:
            return "💎 Finansal Usta"
        elif skor >= 75:
            return "🥇 Bütçe Şampiyonu"
        elif skor >= 60:
            return "🥈 Tasarruf Yıldızı"
        elif skor >= 45:
            return "🥉 İyi Yolda"
        elif skor >= 30:
            return "📈 Gelişiyor"
        else:
            return "🌱 Başlangıç"