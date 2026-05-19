import { Router } from "express";
import { butceProfilController } from "./butce-profili.controller";
import { authenticate } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import { butceProfilOlusturSchema, butceProfilGuncelleSchema } from "./butce-profili.schema";

const router = Router();

router.use(authenticate);

router.get("/", butceProfilController.getir);
router.post("/", validate(butceProfilOlusturSchema), butceProfilController.olusturVeyaGuncelle);
router.patch("/", validate(butceProfilGuncelleSchema), butceProfilController.guncelle);

export default router;
