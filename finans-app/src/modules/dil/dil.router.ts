import { Router } from "express";
import { dilController } from "./dil.controller";

const router = Router();

router.get("/", dilController.tumDilleriGetir);

router.get("/:kod", dilController.dilDetayGetir);

router.get("/:kod/ceviriler", dilController.cevirileriGetir);

export default router;
