import { Router } from "express";
import { arkadaslikController } from "./arkadaslik.controller";
import { validate } from "@middleware/validate.middleware";
import { auth } from "@middleware/auth.middleware";
import { 
  arkadaslikIstekGonderSchema, 
  arkadaslikGuncelleSchema,
  kullaniciAraSchema 
} from "./arkadaslik.schema";

const router = Router();

router.use(auth);

router.get("/", arkadaslikController.arkadaslariGetir);

router.get("/istekler", arkadaslikController.bekleyenIstekleriGetir);

router.get("/siralama", arkadaslikController.siralamaGetir);

router.get("/ara", validate(kullaniciAraSchema), arkadaslikController.kullaniciAra);

router.post("/istek", validate(arkadaslikIstekGonderSchema), arkadaslikController.istekGonder);

router.post("/kabul/:id", arkadaslikController.istekKabulEt);

router.post("/reddet/:id", arkadaslikController.istekReddet);

router.patch("/:id", validate(arkadaslikGuncelleSchema), arkadaslikController.ayarlariGuncelle);

router.delete("/:id", arkadaslikController.arkadasiSil);

export default router;
