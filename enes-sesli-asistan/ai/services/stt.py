import os
import tempfile
import asyncio
from functools import lru_cache
from typing import Optional
from groq import AsyncGroq

MAX_DOSYA_BOYUTU_MB = 25
GROQ_STT_MODEL = "whisper-large-v3-turbo"

MIME_TO_UZANTI = {
    "audio/webm": ".webm",
    "audio/wav": ".wav",
    "audio/mp3": ".mp3",
    "audio/flac": ".flac",
    "audio/mp4": ".m4a",
    "audio/m4a": ".m4a",
    "audio/x-m4a": ".m4a",
    "audio/ogg": ".ogg",
    "audio/mpga": ".mpga",
    "audio/mpeg": ".mp3",  
}

FINANSAL_PROMPT = (
    "Türkçe finansal konuşma. "
    "Para birimleri: TL, lira, kuruş, euro, dolar. "
    "Finansal terimler: harcama, gider, gelir, maaş, "
    "fatura, market, kira, ulaşım, yemek, alışveriş."
)

from google import genai
from google.genai import types

class SpeechToTextServisi:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise EnvironmentError("GROQ_API_KEY çevre değişkeni tanımlanmalı.")
        self.client = AsyncGroq(api_key=api_key)
        print(f"GROQ STT Servisi başlatıldı. Model: {GROQ_STT_MODEL}")
        
    async def transkript_et(
        self,
        ses_verisi: bytes,
        dil_kodu: str = "tr-TR" ,
        mime_turu: str = "audio/webm"
    ) -> Optional[str]:
        """Ses verisini metne dönüştürür.

        Args:
            ses_verisi (bytes): Ses verisi.
            dil_kodu (str, optional): Sesin dili. Defaults to "tr-TR".

        Raises:
            ValueError: Geçersiz ses verisi.

        Returns:
            Optional[str]: Dönüştürülmüş metin.

        Raises:
            ValueError: _description_

        Returns:
            Optional[str]: _description_
        """
        
        boyut_mb = len(ses_verisi) / (1024 * 1024)
        if boyut_mb > MAX_DOSYA_BOYUTU_MB:
            raise ValueError(
                f"Ses dosyası çok büyük: {boyut_mb:.2f} MB." 
                f"Limit: {MAX_DOSYA_BOYUTU_MB} MB."
            )
        
        uzanti = MIME_TO_UZANTI.get(mime_turu)
        if uzanti is None:
            print(f"Uyarı: Bilinmeyen MIME tipi '{mime_turu}', .webm olarak deneniyor.")
            uzanti = ".webm"          
            mime_turu = "audio/webm"
            
        dil = dil_kodu.split("-")[0].lower()
        dosya_adi = f"audio{uzanti}"
        
        # ARTIK DİSKE YAZMIYORUZ! Doğrudan byte olarak işliyoruz.
        try:
            # Groq API'si dosyayı bir isim ve byte dizisi olarak kabul eder
            yanit = await self.client.audio.transcriptions.create(
                file=(dosya_adi, ses_verisi, mime_turu), # ses_verisi zaten bytes
                model=GROQ_STT_MODEL,
                prompt=FINANSAL_PROMPT,
                response_format="text",
                language=dil,
                temperature=0.0
            )
            transkript = yanit.strip() if isinstance(yanit, str) else yanit.text.strip()
            transkript = transkript.strip(".,\n")
            return transkript if transkript else None
        
        except ValueError:
            raise
        except Exception as e:
            print(f"STT hatası: ({type(e).__name__}): {e}")
            return None
        
        finally:
            pass
                
    async def transkript_et_dosyadan(self, dosya_yolu: str) -> Optional[str]:
        if not os.path.exists(dosya_yolu):
            raise FileNotFoundError(f"Dosya bulunamadı: {dosya_yolu}")
        with open(dosya_yolu, "rb") as f:
            return await self.transkript_et(f.read())
        
@lru_cache(maxsize=1)
def get_stt_service() -> SpeechToTextServisi:
    """STT servisini döndürür.

    Returns:
        SpeechToTextServisi: Sesli yanıt servisi.
    """
    return SpeechToTextServisi()