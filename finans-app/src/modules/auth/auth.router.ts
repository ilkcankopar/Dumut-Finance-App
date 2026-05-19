import { Router } from "express";
import { authController } from "./auth.controller";
import { validate } from "@middleware/validate.middleware";
import { auth as authRateLimit } from "@middleware/rateLimit.middleware";
import { kayitSchema, girisSchema, tokenYenileSchema, googleGirisSchema } from "./auth.schema";

const router = Router();

router.post(
  "/kayit",
  authRateLimit,
  validate(kayitSchema),
  authController.kayitOl
);

router.post(
  "/giris",
  authRateLimit,
  validate(girisSchema),
  authController.girisYap
);

router.post(
  "/google",
  authRateLimit,
  validate(googleGirisSchema),
  authController.googleIleGiris
);

router.post(
  "/token-yenile",
  validate(tokenYenileSchema),
  authController.tokenYenile
);

export default router;