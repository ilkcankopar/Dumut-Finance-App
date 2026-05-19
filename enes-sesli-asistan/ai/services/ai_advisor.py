# İki zincir: islem_sonrasi_zinciri + butce_asimi_zinciri

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from ..config.llm import get_advisor_llm, get_extraction_llm
from ..models.schemas import KullaniciFinansalKontekst, CikarilanIslem

# ---------------------------------------------------------------------------
# 1. ÇIKTI PARSER — Serbest metin yanıtı için StrOutputParser yeterli
# ---------------------------------------------------------------------------
str_parser = StrOutputParser()

# ---------------------------------------------------------------------------
# 2. İŞLEM SONRASI YORUM ZİNCİRİ
# ---------------------------------------------------------------------------
islem_sonrasi_promptu = ChatPromptTemplate.from_messages([
    (
        "system",
        (
            "Sen samimi, kısa ve kişisel finansal yorumlar yapan bir asistansın. "
            "Robota benzeme. Bazen teşvik et, bazen nazikçe uyar. "
            "Yanıtın en fazla 2 cümle olsun."
        ),
    ),
    (
        "human",
        """Kullanıcı sesli asistanla bir işlem ekledi.

DİKKAT: "BU AY HARCANAN" verisi yeni eklenen işlemi İÇERMEMEKTEDİR.
Hesaplarken (Harcanan + Yeni İşlem) şeklinde düşün.

İŞLEM    : {baslik} — {miktar:.0f} TL ({tip})
KATEGORİ : {kategori_adi}
KULLANICI: {kullanici_adi}
AYLIK HEDEF          : {aylik_hedef:.0f} TL
BU AY HARCANAN (ÖNCEKİ): {bu_ay_gider:.0f} TL
{butce_durumu}

Kısa yorumunu yaz:""",
    ),
])

# ---------------------------------------------------------------------------
# 3. BÜTÇE ASIMI UYARI ZİNCİRİ
# ---------------------------------------------------------------------------
butce_asimi_promptu = ChatPromptTemplate.from_messages([
    (
        "system",
        (
            "Sen kullanıcıya bütçe aşımı bildiren kısa ve dostane bir uyarı asistanısın. "
            "Türkçe, en fazla 2 cümle, sert değil ama net ol."
        ),
    ),
    (
        "human",
        (
            "{kullanici_adi}, {kategori} kategorisinde bütçesini "
            "%{asim_yuzdesi:.0f} aştı.\n"
            "Limit: {limit:.0f} TL — Harcanan: {harcanan:.0f} TL.\n"
            "Uyarı mesajını yaz:"
        ),
    ),
])


# ---------------------------------------------------------------------------
# 4. SERVİS SINIFI
# ---------------------------------------------------------------------------
class AIAsistanServisi:
    
    def __init__(self):
        llm = get_advisor_llm()  
        self.islem_sonrasi_zinciri = islem_sonrasi_promptu | llm | str_parser
        self.butce_asimi_zinciri = butce_asimi_promptu | llm | str_parser

    async def islem_sonrasi_yorum(
        self,
        islem: CikarilanIslem,
        kontekst: KullaniciFinansalKontekst,
    ) -> str:
        butce_durumu = self._butce_durumu_hesapla(islem, kontekst)

        yanit: str = await self.islem_sonrasi_zinciri.ainvoke({
            "baslik":         islem.baslik,
            "miktar":         islem.miktar,
            "tip":            islem.tip,
            "kategori_adi":   islem.kategori_adi,
            "kullanici_adi":  kontekst.ad,
            "aylik_hedef":    kontekst.aylik_hedef_harcama,
            "bu_ay_gider":    kontekst.bu_ay_toplam_gider,
            "butce_durumu":   butce_durumu,
        })
        return yanit.strip()

    async def butce_asimi_uyarisi(
        self,
        kategori: str,
        limit: float,
        harcanan: float,
        kullanici_adi: str,
    ) -> str:
        asim_yuzdesi = (harcanan / max(limit, 1) - 1) * 100

        yanit: str = await self.butce_asimi_zinciri.ainvoke({
            "kullanici_adi": kullanici_adi,
            "kategori":      kategori,
            "asim_yuzdesi":  asim_yuzdesi,
            "limit":         limit,
            "harcanan":      harcanan,
        })
        return yanit.strip()

    # -----------------------------------------------------------------------
    @staticmethod
    def _butce_durumu_hesapla(
        islem: CikarilanIslem,
        kontekst: KullaniciFinansalKontekst,
    ) -> str:
        """Prompt'a eklenecek bütçe kullanım bilgisini hazırlar."""
        butce_kalemi = next(
            (k for k in kontekst.butce_kalemleri if k.get("kategori") == islem.kategori_adi),
            None,
        )
        if not butce_kalemi:
            return ""

        kullanim = (
            butce_kalemi.get("harcanan", 0)
            / max(butce_kalemi.get("limitMiktar", 1), 1)
            * 100
        )
        return f"Bu kategoride limitin %{kullanim:.0f}'ini kullandın."