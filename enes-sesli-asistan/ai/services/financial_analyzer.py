# İki zincir: ozet_zinciri (StrOutputParser) + oneri_zinciri (JsonOutputParser)

import json
from typing import List

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser

from ..config.llm import get_advisor_llm, get_extraction_llm
from ..models.schemas import KullaniciFinansalKontekst

# ---------------------------------------------------------------------------
# 1. AI ÖZETİ ZİNCİRİ — Haftalık/aylık rapor için serbest metin özet
# ---------------------------------------------------------------------------
ozet_promptu = ChatPromptTemplate.from_messages([
    (
        "system",
        (
            "Sen bir finansal koçsun. Kullanıcıya dönem özetini samimi, "
            "motive edici ve kısa (3-4 cümle) bir dille anlat. "
            "Rakamları vurgula ama jargondan kaçın."
        ),
    ),
    (
        "human",
        """DÖNEM RAPORU

Kullanıcı      : {kullanici_adi} ({kullanici_tipi})
Gelir          : {gelir:.0f} TL
Gider          : {gider:.0f} TL
Net Tasarruf   : {net:.0f} TL
Hedef Harcama  : {hedef_harcama:.0f} TL

En Büyük 3 Harcama Kategorisi:
{en_buyuk_kategoriler}

Kısa ve samimi özet yaz:""",
    ),
])

ozet_zinciri = ozet_promptu | get_advisor_llm() | StrOutputParser()

# ---------------------------------------------------------------------------
# 2. ÖNERİ ZİNCİRİ — JSON listesi döndürür
# ---------------------------------------------------------------------------
oneri_promptu = ChatPromptTemplate.from_messages([
    (
        "system",
        (
            "Sen bir finansal danışmansın. "
            "Kullanıcının işlem geçmişine bakarak somut, uygulanabilir öneriler üret. "
            "SADECE geçerli JSON döndür, başka hiçbir şey yazma."
        ),
    ),
    (
        "human",
        """Kullanıcı Profili:
{kullanici_profili}

Son İşlemler:
{son_islemler}

Aşağıdaki formatta TAM OLARAK 3 öneri döndür (JSON dizi):
[
  {{
    "baslik": "string",
    "aciklama": "string",
    "oncelik": "yüksek" | "orta" | "düşük",
    "tahmini_tasarruf": float
  }}
]""",
    ),
])

oneri_zinciri = oneri_promptu | get_extraction_llm() | JsonOutputParser()


# ---------------------------------------------------------------------------
# 3. SERVİS SINIFI
# ---------------------------------------------------------------------------
class FinansalAnalizci:

    async def ai_ozeti_olustur(
        self,
        kontekst: KullaniciFinansalKontekst,
        kategori_dagilimi: dict,
        gelir: float,
        gider: float,
        net: float,
    ) -> str:
        en_buyuk = sorted(
            kategori_dagilimi.items(), key=lambda x: x[1], reverse=True
        )[:3]
        en_buyuk_str = "\n".join(
            f"  - {kat}: {miktar:.0f} TL" for kat, miktar in en_buyuk
        )

        yanit: str = await ozet_zinciri.ainvoke({
            "kullanici_adi":      kontekst.ad,
            "kullanici_tipi":     kontekst.kullanici_tipi,
            "gelir":              gelir,
            "gider":              gider,
            "net":                net,
            "hedef_harcama":      kontekst.aylik_hedef_harcama,
            "en_buyuk_kategoriler": en_buyuk_str,
        })
        return yanit.strip()

    async def ai_oneri_olustur(
        self,
        kontekst: KullaniciFinansalKontekst,
        son_islemler: List[dict],
    ) -> List[dict]:
        kullanici_profili = (
            f"Tip: {kontekst.kullanici_tipi}, "
            f"Aylık Gelir: {kontekst.aylik_gelir:.0f} TL, "
            f"Bu Ay Gider: {kontekst.bu_ay_toplam_gider:.0f} TL, "
            f"Hedef: {kontekst.aylik_hedef_harcama:.0f} TL"
        )
        son_islemler_str = json.dumps(son_islemler[:10], ensure_ascii=False, indent=2)

        try:
            oneriler: list = await oneri_zinciri.ainvoke({
                "kullanici_profili": kullanici_profili,
                "son_islemler":      son_islemler_str,
            })
            return oneriler
        except Exception as e:
            print(f"Öneri oluşturma hatası: {e}")
            return []