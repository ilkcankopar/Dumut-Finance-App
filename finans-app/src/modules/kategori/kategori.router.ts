import { Router } from "express";
import { kategoriController } from "./kategori.controller";
import { validate } from "@middleware/validate.middleware";
import { authenticate } from "@middleware/auth.middleware";
import {
  kategoriOlusturSchema,
  kategoriGuncelleSchema,
  kategoriSilSchema,
} from "./kategori.schema";

const router = Router();

router.use(authenticate); 

router.get("/", kategoriController.tumunuGetir);
router.post("/", validate(kategoriOlusturSchema), kategoriController.olustur);
router.patch("/:id", validate(kategoriGuncelleSchema), kategoriController.guncelle);
router.delete("/:id", validate(kategoriSilSchema), kategoriController.sil);

export default router;