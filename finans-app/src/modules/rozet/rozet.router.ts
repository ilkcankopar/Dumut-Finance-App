import { Router } from "express";
import { rozetController } from "./rozet.controller";
import { auth } from "@middleware/auth.middleware";

const router = Router();

router.get("/", rozetController.tumRozetleriGetir);

router.get("/benim", auth, rozetController.kullaniciRozetleriGetir);

router.post("/kontrol", auth, rozetController.rozetKontrolEt);

export default router;
