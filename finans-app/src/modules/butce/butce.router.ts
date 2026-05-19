import { Router } from "express";
import { butceController } from "./butce.controller";
import { validate } from "@middleware/validate.middleware";
import { authenticate } from "@middleware/auth.middleware";
import {
  kurulumSchema,
  butceKalemiOlusturSchema,
} from "./butce.schema";

const router = Router();
router.use(authenticate);

router.get("/durum", butceController.durumGetir);
router.get("/oneriler", butceController.onerileriGetir);
router.get("/gunluk-ipucu", butceController.gunlukIpucu);
router.get("/ai-yatirim-onerisi", butceController.aiYatirimOnerisi);
router.post("/kurulum", validate(kurulumSchema), butceController.kurulumTamamla);
router.post("/kalem", validate(butceKalemiOlusturSchema), butceController.kalemiEkle);
router.delete("/kalem/:id", butceController.kalemiSil);

export default router;