from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import json
from typing import Optional

from .services.stt import get_stt_service, SpeechToTextServisi
from .services.tts import get_tts_service, TextToSpeechServisi
from .services.ai_advisor import AIAsistanServisi
from .models.schemas import SesIslemSonucu, KullaniciFinansalKontekst
from .services.transaction_extractor import IslemCikarimServisi

app = FastAPI(
    title="Finansal Asistan AI Mikroservisi",
    description="Sesten finansal işlem çıkaran ve AI yorumu ekleyen servis",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

cikarim_servisi = IslemCikarimServisi()
ai_asistan = AIAsistanServisi()


@app.post("/api/v1/ses-isle", response_model=SesIslemSonucu)
async def ses_isle(
    ses_dosyasi: UploadFile = File(...),
    kontekst_json: str = Form(None), 
    dil_kodu: str = Form("tr-TR"),
    stt_servisi: SpeechToTextServisi = Depends(get_stt_service),
    tts_servisi: TextToSpeechServisi = Depends(get_tts_service)
):
    """
    Mikroservis Endpointi: Ses -> Transkript -> LLM İşlem Çıkarımı -> AI Yorum -> JSON Dönüş
    """
    # 1. Ses dosyasını oku
    ses_verisi = await ses_dosyasi.read()
    if len(ses_verisi) == 0:
        raise HTTPException(status_code=400, detail="Ses dosyası boş")

    # 2. Kontekst'i (JSON'dan Pydantic modeline) çevir
    kontekst = None
    if kontekst_json:
        try:
            kontekst_dict = json.loads(kontekst_json)
            kontekst = KullaniciFinansalKontekst(**kontekst_dict)
        except Exception as e:
            print(f"Kontekst parse hatası: {e}")
            # Hata fırlatmıyoruz, kontekst olmadan da işlem çıkarımı yapabilmeli

    # 3. Speech-to-Text (Whisper ile)
    transkript = await stt_servisi.transkript_et(
        ses_verisi,
        dil_kodu,
        mime_turu=ses_dosyasi.content_type or "audio/webm", 
    )
    if not transkript:
        ai_yaniti = "Sesi anlayamadım, gürültüsüz bir ortamda tekrar deneyebilir misin?"
        import base64
        ses_base64 = None
        try:
            ses_bytes = await tts_servisi.seslendir(ai_yaniti)
            if ses_bytes:
                ses_base64 = base64.b64encode(ses_bytes).decode("utf-8")
        except Exception:
            pass
        return SesIslemSonucu(
            transkript="",
            cikarilan_islem=None,
            ai_yaniti=ai_yaniti,
            uyarilar=["Transkript başarısız"],
            ses_base64=ses_base64
        )

    try:
        # 4. LLM ile JSON formatında işlem çıkar
        cikarilan_islem = await cikarim_servisi.cikar(transkript, kontekst)

        if not cikarilan_islem:
            ai_yaniti = f'"{transkript}" — bunu net bir finansal işlem olarak anlayamadım. Miktar ve açıklama belirterek tekrar söyler misin?'
            import base64
            ses_base64 = None
            try:
                ses_bytes = await tts_servisi.seslendir(ai_yaniti)
                if ses_bytes:
                    ses_base64 = base64.b64encode(ses_bytes).decode("utf-8")
            except Exception:
                pass
            return SesIslemSonucu(
                transkript=transkript,
                cikarilan_islem=None,
                ai_yaniti=ai_yaniti,
                uyarilar=["İşlem çıkarılamadı"],
                ses_base64=ses_base64
            )

        # 5. İşlem Sonrası AI Yorumu ve Bütçe Kontrolü (Eğer kontekst gönderilmişse)
        ai_yaniti = "İşlemin kaydedildi!"
        uyarilar = []
        
        if kontekst:
            # Yapay zekaya yorum yaptır
            ai_yaniti = await ai_asistan.islem_sonrasi_yorum(cikarilan_islem, kontekst)
            
            # Yerel bütçe aşım uyarısı kontrolü (DB'ye bağlanmadan, gelen verilere bakarak)
            butce_kalemi = next(
                (k for k in kontekst.butce_kalemleri if k["kategori"] == cikarilan_islem.kategori_adi),
                None
            )
            
            if butce_kalemi:
                limit = butce_kalemi.get("limitMiktar", 0)
                harcanan = butce_kalemi.get("harcanan", 0) # Frontend'in hesaplayıp gönderdiğini varsayıyoruz
                yeni_toplam = harcanan + cikarilan_islem.miktar
                
                if cikarilan_islem.tip.value == "GIDER" and yeni_toplam > limit:
                    uyari_mesaji = await ai_asistan.butce_asimi_uyarisi(
                        cikarilan_islem.kategori_adi, limit, yeni_toplam, kontekst.ad
                    )
                    uyarilar.append(uyari_mesaji)

        # AI yanıtını seslendir
        import base64
        ses_base64 = None
        if ai_yaniti:
            try:
                ses_bytes = await tts_servisi.seslendir(ai_yaniti)
                if ses_bytes:
                    ses_base64 = base64.b64encode(ses_bytes).decode("utf-8")
            except Exception as tts_err:
                print(f"TTS seslendirme hatası: {tts_err}")

        # 6. Sonucu ana backend'e dön (Ana backend bunu alıp DB'ye Prisma ile kaydedecek)
        return SesIslemSonucu(
            transkript=transkript,
            cikarilan_islem=cikarilan_islem,
            ai_yaniti=ai_yaniti,
            islem_kaydedildi=False, # DB'ye henüz yazılmadı, frontend/ana backend yazacak
            islem_id=None,
            uyarilar=uyarilar,
            ses_base64=ses_base64
        )
    except Exception as e:
        print(f"❌ İşlem akışı sırasında beklenmeyen hata: {str(e)}")
        ai_yaniti = "İşleminizi şu anda yorumlayamıyoruz, lütfen tekrar deneyin."
        import base64
        ses_base64 = None
        try:
            ses_bytes = await tts_servisi.seslendir(ai_yaniti)
            if ses_bytes:
                ses_base64 = base64.b64encode(ses_bytes).decode("utf-8")
        except Exception:
            pass
        return SesIslemSonucu(
            transkript="",
            cikarilan_islem=None,
            ai_yaniti=ai_yaniti,
            uyarilar=[f"Hata: {str(e)}"],
            ses_base64=ses_base64
        )

@app.post("/api/v1/metin-isle", response_model=SesIslemSonucu)
async def metin_isle(
    metin: str = Form(...),
    kontekst_json: Optional[str] = Form(None),
    dil_kodu: Optional[str] = Form("tr-TR"),
    tts_servisi: TextToSpeechServisi = Depends(get_tts_service)
):
    """
    Mikroservis Endpointi: Metin -> LLM İşlem Çıkarımı -> AI Yorum -> JSON Dönüş
    """
    kontekst = None
    if kontekst_json:
        try:
            kontekst_dict = json.loads(kontekst_json)
            kontekst = KullaniciFinansalKontekst(**kontekst_dict)
        except Exception as e:
            print(f"Kontekst parse hatası: {e}")

    try:
        # LLM ile JSON formatında işlem çıkar
        cikarilan_islem = await cikarim_servisi.cikar(metin, kontekst)

        if not cikarilan_islem:
            ai_yaniti = f'"{metin}" — bunu net bir finansal işlem olarak anlayamadım. Miktar ve açıklama belirterek tekrar söyler misin?'
            import base64
            ses_base64 = None
            try:
                ses_bytes = await tts_servisi.seslendir(ai_yaniti)
                if ses_bytes:
                    ses_base64 = base64.b64encode(ses_bytes).decode("utf-8")
            except Exception:
                pass
            return SesIslemSonucu(
                transkript=metin,
                cikarilan_islem=None,
                ai_yaniti=ai_yaniti,
                uyarilar=["İşlem çıkarılamadı"],
                ses_base64=ses_base64
            )

        ai_yaniti = "İşlemin kaydedildi!"
        uyarilar = []
        
        if kontekst:
            # Yapay zekaya yorum yaptır
            ai_yaniti = await ai_asistan.islem_sonrasi_yorum(cikarilan_islem, kontekst)
            
            # Yerel bütçe aşım uyarısı kontrolü
            butce_kalemi = next(
                (k for k in kontekst.butce_kalemleri if k["kategori"] == cikarilan_islem.kategori_adi),
                None
            )
            
            if butce_kalemi:
                limit = butce_kalemi.get("limitMiktar", 0)
                harcanan = butce_kalemi.get("harcanan", 0)
                yeni_toplam = harcanan + cikarilan_islem.miktar
                
                if cikarilan_islem.tip.value == "GIDER" and yeni_toplam > limit:
                    uyari_mesaji = await ai_asistan.butce_asimi_uyarisi(
                        cikarilan_islem.kategori_adi, limit, yeni_toplam, kontekst.ad
                    )
                    uyarilar.append(uyari_mesaji)

        # AI yanıtını seslendir
        import base64
        ses_base64 = None
        if ai_yaniti:
            try:
                ses_bytes = await tts_servisi.seslendir(ai_yaniti)
                if ses_bytes:
                    ses_base64 = base64.b64encode(ses_bytes).decode("utf-8")
            except Exception as tts_err:
                print(f"TTS seslendirme hatası: {tts_err}")

        return SesIslemSonucu(
            transkript=metin,
            cikarilan_islem=cikarilan_islem,
            ai_yaniti=ai_yaniti,
            islem_kaydedildi=False,
            islem_id=None,
            uyarilar=uyarilar,
            ses_base64=ses_base64,
        )
    except Exception as e:
        print(f"❌ İşlem akışı sırasında beklenmeyen hata: {str(e)}")
        ai_yaniti = "İşleminizi şu anda yorumlayamıyoruz, lütfen tekrar deneyin."
        import base64
        ses_base64 = None
        try:
            ses_bytes = await tts_servisi.seslendir(ai_yaniti)
            if ses_bytes:
                ses_base64 = base64.b64encode(ses_bytes).decode("utf-8")
        except Exception:
            pass
        return SesIslemSonucu(
            transkript=metin,
            cikarilan_islem=None,
            ai_yaniti=ai_yaniti,
            uyarilar=[f"Hata: {str(e)}"],
            ses_base64=ses_base64
        )

from fastapi.responses import Response

@app.post("/api/v1/seslendir")
async def seslendir_endpoint(
    request_data: dict,
    tts_servisi: TextToSpeechServisi = Depends(get_tts_service)
):
    metin = request_data.get("metin")
    if not metin:
        raise HTTPException(status_code=400, detail="Metin boş olamaz")
    
    ses_bytes = await tts_servisi.seslendir(metin)
    if not ses_bytes:
        raise HTTPException(status_code=500, detail="Seslendirme başarısız")
        
    return Response(content=ses_bytes, media_type="audio/mpeg")