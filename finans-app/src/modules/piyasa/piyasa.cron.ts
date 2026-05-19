import cron from "node-cron";
import { piyasaService } from "./piyasa.service";
import { piyasaCache } from "./piyasa.cache";
import { logger } from "@config/logger.config";


export const piyasaCronlariBaslat = () => {
  cron.schedule(
    "*/5 10-18 * * 1-5",
    async () => {
      try {
        piyasaCache.temizle("bist100");
        await piyasaService.bist100Getir();
        logger.info("[Cron] BİST 100 güncellendi");
      } catch (error) {
        logger.error("[Cron] BİST 100 güncelleme hatası:", error);
      }
    },
    { timezone: "Europe/Istanbul" }
  );

  cron.schedule("*/3 * * * *", async () => {
    try {
      piyasaCache.temizle("kripto_liste");
      await piyasaService.kriptoListesiGetir();
      logger.info("[Cron] Kripto fiyatları güncellendi");
    } catch (error) {
      logger.error("[Cron] Kripto güncelleme hatası:", error);
    }
  });

  cron.schedule("*/10 * * * *", async () => {
    try {
      piyasaCache.temizle("doviz_kurlari");
      await piyasaService.dovizKurlariGetir();
      logger.info("[Cron] Döviz kurları güncellendi");
    } catch (error) {
      logger.error("[Cron] Döviz güncelleme hatası:", error);
    }
  });

  logger.info(" Piyasa cron görevleri başlatıldı");
};