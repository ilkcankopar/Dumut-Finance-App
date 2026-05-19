import { Router } from "express";
import { hedefController } from "./hedef.controller";
import { validate } from "@middleware/validate.middleware";
import { authenticate } from "@middleware/auth.middleware";
import {
  hedefOlusturSchema,
  hedefGuncelleSchema,
  hedefKatkiSchema,
  hedefIdSchema,
} from "./hedef.schema";

const router = Router();
router.use(authenticate);

// CRUD
router.get("/", hedefController.listele);
router.get("/istatistikler", hedefController.istatistikler);
router.get("/:id", validate(hedefIdSchema), hedefController.getir);
router.get("/:id/gecmis", validate(hedefIdSchema), hedefController.gecmis);
router.post("/", validate(hedefOlusturSchema), hedefController.olustur);
router.patch("/:id", validate(hedefGuncelleSchema), hedefController.guncelle);
router.delete("/:id", validate(hedefIdSchema), hedefController.sil);

// Katkı yap
router.post(
  "/:id/katki",
  validate(hedefKatkiSchema),
  hedefController.katki
);

// Arkadaş hedefleri
router.get(
  "/arkadas/:arkadasId",
  hedefController.arkadasHedefiniGetir
);

export default router;