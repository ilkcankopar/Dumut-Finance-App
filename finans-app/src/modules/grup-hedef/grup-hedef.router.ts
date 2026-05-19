import { Router } from "express";
import { grupHedefController } from "./grup-hedef.controller";
import { validate } from "@middleware/validate.middleware";
import { auth } from "@middleware/auth.middleware";
import { 
  grupHedefOlusturSchema, 
  grupHedefGuncelleSchema,
  katkiEkleSchema,
  uyeEkleSchema 
} from "./grup-hedef.schema";

const router = Router();

router.use(auth);

router.get("/", grupHedefController.benimHedeflerim);

router.post("/", validate(grupHedefOlusturSchema), grupHedefController.olustur);

router.get("/:id", grupHedefController.detayGetir);

router.patch("/:id", validate(grupHedefGuncelleSchema), grupHedefController.guncelle);

router.delete("/:id", grupHedefController.sil);

router.post("/:id/katki", validate(katkiEkleSchema), grupHedefController.katkiEkle);

router.post("/:id/uye", validate(uyeEkleSchema), grupHedefController.uyeEkle);

router.delete("/:id/uye/:uyeId", grupHedefController.uyeCikar);

router.post("/:id/ayril", grupHedefController.ayril);

export default router;
