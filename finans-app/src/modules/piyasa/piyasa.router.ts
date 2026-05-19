import { Router } from "express";
import { piyasaController } from "./piyasa.controller";
import { authenticate } from "@middleware/auth.middleware";
import { genel as genelRateLimit } from "@middleware/rateLimit.middleware";

const router = Router();
router.use(genelRateLimit);

// Public endpointler (giriş gerekmez)
router.get("/bist100", piyasaController.bist100);
router.get("/hisse/:sembol", piyasaController.hisseGetir);
router.get("/kripto", piyasaController.kriptoListesi);
router.get("/doviz", piyasaController.dovizKurlari);
router.get("/altin", piyasaController.altinFiyatlari);
router.get("/gumus", piyasaController.gumusFiyatlari);
router.get("/ozet", piyasaController.piyasaOzeti);

// Korumalı endpointler
router.use(authenticate);
router.get("/takip", piyasaController.takipListesi);
router.post("/takip", piyasaController.takibeEkle);
router.delete("/takip/:tip/:id", piyasaController.takiptenCikar);
router.get("/yatirim-onerisi", piyasaController.yatirimOnerisi);

export default router;