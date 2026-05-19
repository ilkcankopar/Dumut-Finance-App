import { Router } from "express";
import { sesliAsistanController } from "./sesli-asistan.controller";
import { authenticate } from "@middleware/auth.middleware";
import { sesliAsistan as sesliAsistanRateLimit } from "@middleware/rateLimit.middleware";
import { validate } from "@middleware/validate.middleware";
import { metindenIslemSchema, sesliIslemOnaySchema } from "./sesli-asistan.schema";

import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);
router.use(sesliAsistanRateLimit);

// Sesli komut (Audio upload)
router.post("/ses", upload.any(), sesliAsistanController.sesliKomut);

// Metin komutu gönder → niyet anla → cevap dön
router.post("/metin", validate(metindenIslemSchema), sesliAsistanController.metinKomutu);

// Metni sese çevir (TTS)
router.post("/seslendir", sesliAsistanController.seslendir);

// Uygulama açılışında karşılama
router.get("/karsilama", sesliAsistanController.karsilama);

// Kullanıcı işlemi onayladı, kaydet
router.post("/onayla", validate(sesliIslemOnaySchema), sesliAsistanController.islemOnayla);

export default router;
