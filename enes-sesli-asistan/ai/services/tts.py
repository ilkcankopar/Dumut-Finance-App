import re
import io
from functools import lru_cache
from typing import Optional
from num2words import num2words
from gtts import gTTS

class TextToSpeechServisi:
    def __init__(self):
        pass

    @staticmethod
    def _sayi_yaziya_cevir(metin: str) -> str:
        def cevir(match):
            sayi = int(match.group().replace(".", "").replace(",", ""))
            return num2words(sayi, lang="tr")
        return re.sub(r"\d[\d.,]*", cevir, metin)

    async def seslendir(self, metin: str) -> Optional[bytes]:
        metin = self._sayi_yaziya_cevir(metin)
        try:
            tts = gTTS(text=metin, lang="tr")
            buffer = io.BytesIO()
            tts.write_to_fp(buffer)
            return buffer.getvalue()
        except Exception as e:
            print(f"TTS hatası: ({type(e).__name__}) {e}")
            return None

@lru_cache(maxsize=1)
def get_tts_service() -> TextToSpeechServisi:
    return TextToSpeechServisi()
