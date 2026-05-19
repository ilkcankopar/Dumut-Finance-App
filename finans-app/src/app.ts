import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { genel as genelRateLimit } from "@middleware/rateLimit.middleware";
import { errorHandler } from "@middleware/error.middleware";
import { config } from "@config/app.config";

import authRouter from "@modules/auth/auth.router";
import kategoriRouter from "@modules/kategori/kategori.router";
import islemRouter from "@modules/islem/islem.router";
import butceProfilRouter from "@modules/butce-profili/butce-profili.router";
import hedefRouter from "@modules/hedef/hedef.router";
import butceRouter from "@modules/butce/butce.router";
import dilRouter from "@modules/dil/dil.router";
import arkadaslikRouter from "@modules/arkadaslik/arkadaslik.router";
import rozetRouter from "@modules/rozet/rozet.router";
import grupHedefRouter from "@modules/grup-hedef/grup-hedef.router";
import sesliAsistanRouter from "@modules/sesli-asistan/sesli-asistan.router";
import piyasaRouter from "@modules/piyasa/piyasa.router";
import onboardingRouter from "@modules/onboarding/onboarding.router";
import { levelRouter } from "@modules/level/level.router";
import { raporRouter } from "@modules/rapor/rapor.router";
import { mesajRouter } from "@modules/mesaj/mesaj.router";

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
const allowedOrigins = [
  config.frontendUrl,
  "http://localhost:8081",
  "http://localhost:8080",
  "http://localhost:8000",
  "http://localhost:3000",
  "http://localhost:3001",
];

app.use(cors({ 
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || config.env === 'development') {
      return callback(null, true);
    }
    // Also allow any localhost port or local network IP for mobile simulation
    if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:") || origin.startsWith("http://192.168.")) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  }, 
  credentials: true 
}));
app.use(genelRateLimit);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "Sunucu çalışıyor", env: config.env });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/kategori", kategoriRouter);
app.use("/api/v1/islem", islemRouter);
app.use("/api/v1/butce-profili", butceProfilRouter);
app.use("/api/v1/hedef", hedefRouter);
app.use("/api/v1/butce", butceRouter);
app.use("/api/v1/dil", dilRouter);
app.use("/api/v1/arkadaslik", arkadaslikRouter);
app.use("/api/v1/rozet", rozetRouter);
app.use("/api/v1/grup-hedef", grupHedefRouter);
app.use("/api/v1/sesli-asistan", sesliAsistanRouter);
app.use("/api/v1/piyasa", piyasaRouter);
app.use("/api/v1/onboarding", onboardingRouter);
app.use("/api/v1/level", levelRouter);
app.use("/api/v1/rapor", raporRouter);
app.use("/api/v1/mesaj", mesajRouter);

app.use(errorHandler);

export default app;
