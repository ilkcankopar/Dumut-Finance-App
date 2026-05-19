import { Router } from "express";
import { islemController } from "./islem.controller";
import { validate } from "@middleware/validate.middleware";
import { authenticate } from "@middleware/auth.middleware";
import { upload } from "@middleware/upload.middleware";
import {
islemOlusturSchema,
islemGuncelleSchema,
islemListeSchema,
} from "./islem.schema";

const router = Router();
router.use(authenticate);

router.get("/", validate(islemListeSchema), islemController.listele);
router.get("/ozet", islemController.ozet);
router.get("/harita-ozeti", islemController.haritaOzeti);
router.get("/yakin-odemeler", islemController.yakinOdemeler);
router.patch("/:id/odeme-durumu", islemController.odemeDurumuGuncelle);
router.post("/ocr-tara", upload.single('fisGorseli'), islemController.ocrTara);
router.get("/:id", islemController.getir);
router.post("/", validate(islemOlusturSchema), islemController.olustur);
router.patch("/:id", validate(islemGuncelleSchema), islemController.guncelle);
router.delete("/:id", islemController.sil);

export default router;