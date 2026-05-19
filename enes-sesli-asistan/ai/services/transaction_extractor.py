# Zincir: ChatPromptTemplate | extraction_llm | JsonOutputParser → CikarilanIslem

import json
from typing import Optional

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.runnables import RunnableConfig

from ..config.llm import get_extraction_llm
from ..models.schemas import CikarilanIslem, IslemTipi, Periyot, KullaniciFinansalKontekst

# ---------------------------------------------------------------------------
# 1. ÇIKTI PARSER — LLM yanıtını doğrudan dict'e dönüştürür.
#    Pydantic doğrulaması bir sonraki adımda _parse_yanit içinde yapılır
#    çünkü güven skoru filtresi ve "anlaşılamadı" kontrolü gerekiyor.
# ---------------------------------------------------------------------------
json_parser = JsonOutputParser()

# ---------------------------------------------------------------------------
# 2. PROMPT ŞABLONU
#    Sistem talimatları sabit, değişken kısımlar {transkript} ve {kontekst_str}.
# ---------------------------------------------------------------------------
SISTEM_MESAJI = """
Sen bir finansal asistan uygulaması için geliştirilmiş bir veri çıkarım motorusun.
Kullanıcının sesli konuşmasından finansal işlem bilgilerini çıkarman gerekiyor.

KATEGORİ KURALLARI:
- Öncelikle kullanıcının mevcut kategori listesinden (BAĞLAM kısmında verildi) en uygun olanı seç.
- Eğer mevcut kategoriler arasında çok yakın bir eşleşme yoksa şu standartları kullan:
    - Yiyecek/içecek       → "Yeme-İçme"
    - Market alışverişi    → "Market"
    - Teknik/Elektronik    → "Elektronik" (Kulaklık, telefon, şarj cihazı vb. asla Giyim değildir!)
    - Ulaşım               → "Ulaşım"
    - Faturalar            → "Faturalar"
    - Giyim/aksesuar       → "Giyim"
    - Belirsizse           → "Diğer"

PARA BİRİMİ: Sadece sayı belirtilmişse TRY varsay.
SABİT GİDER: "her ay", "aylık", "abonelik", "kira", "fatura" → sabit_mi: true

KESİN YANIT FORMATI (başka hiçbir şey yazma, sadece JSON):
{{
  "tip": "GIDER" veya "GELIR",
  "baslik": "string",
  "miktar": float,
  "kategori_adi": "string",
  "notlar": "string veya null",
  "sabit_mi": boolean,
  "periyot": "AYLIK" | "HAFTALIK" | "YILLIK",
  "etiketler": ["string"],
  "guven_skoru": float (0.0 - 1.0),
  "anlasılamadi": boolean,
  "anlasılamama_nedeni": "string veya null"
}}
"""

KULLANICI_MESAJI = """
{kontekst_str}

KULLANICI KONUŞMASI:
"{transkript}"
"""

cikarim_promptu = ChatPromptTemplate.from_messages([
    ("system", SISTEM_MESAJI),
    ("human", KULLANICI_MESAJI),
])

# ---------------------------------------------------------------------------
# 3. ZİNCİR — LCEL pipe sözdizimi
# ---------------------------------------------------------------------------
cikarim_zinciri = cikarim_promptu | get_extraction_llm() | json_parser


# ---------------------------------------------------------------------------
# 4. SERVİS SINIFI
# ---------------------------------------------------------------------------
class IslemCikarimServisi:

    async def cikar(
        self,
        transkript: str,
        kontekst: Optional[KullaniciFinansalKontekst] = None,
    ) -> Optional[CikarilanIslem]:

        kontekst_str = self._kontekst_hazirla(kontekst)

        try:
            # .ainvoke() → async çağrı; zincirin tüm adımlarını bekler
            veri: dict = await cikarim_zinciri.ainvoke(
                {"transkript": transkript, "kontekst_str": kontekst_str}
            )
            return self._parse_yanit(veri)

        except Exception as e:
            print(f"İşlem çıkarım hatası: {e}")
            return None

    # -----------------------------------------------------------------------
    def _kontekst_hazirla(self, kontekst: Optional[KullaniciFinansalKontekst]) -> str:
        if not kontekst:
            return ""
        
        # Node.js'den gelen mevcut kategorileri alıyoruz
        mevcut_kategoriler = getattr(kontekst, 'mevcut_kategoriler', [])
        kategori_listesi = ", ".join(mevcut_kategoriler) if mevcut_kategoriler else "Elektronik, Market, Yeme-İçme, Giyim, Ulaşım, Diğer"

        return (
            f"KULLANICI BAĞLAMI:\n"
            f"- Kullanıcı adı: {kontekst.ad}\n"
            f"- Mevcut Kategorileri (Öncelikli Seç): {kategori_listesi}\n"
            f"- Aylık gelir: {kontekst.aylik_gelir} TL\n"
            f"- Bu ay harcama: {kontekst.bu_ay_toplam_gider} TL / {kontekst.aylik_hedef_harcama} TL hedef\n"
            f"Bu bağlamı kullanarak daha doğru kategorizasyon yap."
        )

    def _parse_yanit(self, veri: dict) -> Optional[CikarilanIslem]:

        if veri.get("anlasılamadi", False):
            print(f"LLM anlayamadı: {veri.get('anlasılamama_nedeni')}")
            return None

        if float(veri.get("guven_skoru", 0)) < 0.6:
            print(f"Düşük güven skoru: {veri.get('guven_skoru')}")
            return None

        try:
            return CikarilanIslem(
                tip=IslemTipi(veri["tip"]),
                baslik=veri["baslik"],
                miktar=float(veri["miktar"]),
                kategori_adi=veri["kategori_adi"],
                notlar=veri.get("notlar"),
                sabit_mi=veri.get("sabit_mi") or False,
                periyot=Periyot(veri.get("periyot") or "AYLIK"),
                etiketler=veri.get("etiketler") or [],
                guven_skoru=float(veri.get("guven_skoru", 1.0)),
            )
        except Exception as e:
            print(f"Veri modeline dönüştürme hatası: {e}\nVeri: {veri}")
            return None