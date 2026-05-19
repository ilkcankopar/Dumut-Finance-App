import { Request, Response } from "express";
import { asyncHandler } from "@utils/asyncHandler";
import { ApiResponse } from "@utils/ApiResponse";
import { sesliAsistanService } from "./sesli-asistan.service";
import axios from "axios";

export const sesliAsistanController = {
  // Metin komutu → AI analiz → cevap
  metinKomutu: asyncHandler(async (req: Request, res: Response) => {
    const { metin } = req.body;
    const sonuc = await sesliAsistanService.metinKomutIsle(
      metin,
      req.kullanici!.id
    );
    ApiResponse.success(res, sonuc, "Komut işlendi");
  }),

  // Uygulama açılışı karşılama
  karsilama: asyncHandler(async (req: Request, res: Response) => {
    const sonuc = await sesliAsistanService.karsilamaYap(req.kullanici!.id);
    ApiResponse.success(res, sonuc, "Hoş geldiniz");
  }),

  // Sesli komut (Base64 upload)
  sesliKomut: asyncHandler(async (req: Request, res: Response) => {
    const { ses_dosyasi_base64, uzanti } = req.body;

    if (!ses_dosyasi_base64) {
      ApiResponse.error(res, "Ses verisi bulunamadı (Base64 bekleniyor)", 400);
      return;
    }

    // Base64 -> Buffer
    const buffer = Buffer.from(ses_dosyasi_base64, 'base64');
    const mimeType = uzanti === 'webm' ? 'audio/webm' : 'audio/m4a';
    
    try {
      const sonuc = await sesliAsistanService.mikroservisIleIsle(
        buffer,
        req.kullanici!.id,
        true,
        mimeType
      );
      ApiResponse.success(res, sonuc, "Ses işlendi");
    } catch (error: any) {
      console.error("❌ Mikroservis İşleme Hatası:", error.response?.data || error.message);
      ApiResponse.error(res, error.response?.data?.detail || error.message || "Ses işlenirken mikroservis hatası oluştu", 500);
    }
  }),

  // Metni sese çevir (TTS) - ElevenLabs
  seslendir: asyncHandler(async (req: Request, res: Response) => {
    const { metin } = req.body;
    if (!metin) {
      ApiResponse.error(res, "Metin gerekli", 400);
      return;
    }

    const ELEVENLABS_API_KEY = "sk_7e95d933045a7c7f44b2288091ab8f5e79c86eae120787af";
    const VOICE_ID = "hy7OAv1nH3Eqqj96Aude";

    try {
      console.log("[TTS] ElevenLabs isteği gönderiliyor...");
      
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          text: metin,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        },
        {
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg"
          },
          responseType: "arraybuffer",
          timeout: 30000
        }
      );
      
      console.log("[TTS] ElevenLabs ses üretildi!");
      res.set("Content-Type", "audio/mpeg");
      res.send(Buffer.from(response.data));
    } catch (error: any) {
      // Hata detayını parse et
      let errorDetail = "Bilinmeyen hata";
      if (error.response?.data) {
        try {
          const errorJson = JSON.parse(Buffer.from(error.response.data).toString());
          errorDetail = errorJson.detail?.message || errorJson.detail?.type || JSON.stringify(errorJson);
          console.error("❌ ElevenLabs Hata Detayı:", errorDetail);
        } catch {
          console.error("❌ ElevenLabs Ham Hata:", error.response.data);
        }
      } else {
        console.error("❌ ElevenLabs Hata:", error.message);
      }
      
      // Fallback: Google TTS
      console.log("[TTS] Fallback: Google TTS deneniyor...");
      try {
        const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(metin)}&tl=tr&client=tw-ob`;
        const fallbackResponse = await axios.get(googleTtsUrl, {
          responseType: "arraybuffer",
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        res.set("Content-Type", "audio/mpeg");
        res.send(Buffer.from(fallbackResponse.data));
      } catch {
        ApiResponse.error(res, "Seslendirme servisi şu an kullanılamıyor", 500);
      }
    }
  }),

  // Kullanıcı işlemi onayladı
  islemOnayla: asyncHandler(async (req: Request, res: Response) => {
    const sonuc = await sesliAsistanService.islemKaydet(
      req.kullanici!.id,
      req.body
    );
    ApiResponse.created(res, sonuc, "İşlem kaydedildi");
  }),
};
