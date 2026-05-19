import { geminiFlash } from "@config/gemini.config";
import { logger } from "@config/logger.config";

export const ocrService = {
  /**
   * Reads an image buffer and uses Gemini to extract transaction details
   */
  async fisTara(fileBuffer: Buffer, mimeType: string) {
    try {
      const prompt = `
        Sen bir finans ve muhasebe asistanısın. Gönderilen fiş (receipt) veya fatura görselini analiz et.
        Şu bilgileri çıkararak SADECE geçerli bir JSON objesi döndür:
        {
          "baslik": "İşlemin kısa başlığı (ör. 'Migros Market', 'Starbucks', vs.)",
          "miktar": Fişteki toplam tutar (sadece sayısal, ör. 250.50),
          "tarih": "Fiş tarihi varsa YYYY-MM-DD formatında (yoksa null)",
          "kategoriAd": "Şu kategorilerden en uygun olanını seç: YEMEK, MARKET, ULAŞIM, FATURA, GİYİM, EĞİTİM, SAĞLIK, EĞLENCE, DİĞER"
        }
        
        SADECE JSON DÖNDÜR, başına veya sonuna markdown (gibi \`\`\`json) ekleme, saf JSON olsun.
      `;

      const imagePart = {
        inlineData: {
          data: fileBuffer.toString("base64"),
          mimeType,
        },
      };

      const result = await geminiFlash.generateContent([prompt, imagePart]);
      const responseText = result.response.text().trim();
      
      // Clean up markdown block if present just in case
      let cleanedText = responseText;
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.replace(/```json/g, "").replace(/```/g, "").trim();
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/```/g, "").trim();
      }

      const data = JSON.parse(cleanedText);

      return {
        baslik: data.baslik || "Bilinmeyen Fiş",
        miktar: typeof data.miktar === "number" ? data.miktar : parseFloat(data.miktar) || 0,
        tarih: data.tarih || new Date().toISOString(),
        kategoriAd: data.kategoriAd || "DİĞER",
        ocrText: responseText
      };
    } catch (error) {
      logger.error("OCR Tarama Hatası:", error);
      throw new Error("Fiş taranamadı. Lütfen daha net bir görsel yükleyin.");
    }
  }
};
