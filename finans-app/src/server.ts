import app from "./app";
import { config } from "@config/app.config";
import { logger } from "@config/logger.config";
import { prisma } from "./prisma/client";

async function baslat() {
  try {
    await prisma.$connect();
    logger.info("Veritabanı bağlantısı başarılı");

    app.listen(config.port, () => {
      logger.info(`Sunucu ${config.port} portunda çalışıyor`);
      logger.info(`Ortam: ${config.env}`);
    });
  } catch (error) {
    logger.error("Sunucu başlatılamadı:", error);
    process.exit(1);
  }
}

process.on("SIGTERM", async () => {
  logger.info("SIGTERM alındı, sunucu kapatılıyor...");
  await prisma.$disconnect();
  process.exit(0);
});

baslat();