import { Router } from 'express';
import { levelController } from './level.controller';
import { auth } from '@middleware/auth.middleware';

const router = Router();

router.use(auth);

router.get('/durum', levelController.durumGetir);
router.get('/siralama', levelController.globalSiralama);
router.get('/siralama/arkadaslar', levelController.arkadasSiralama);
router.get('/siralama/lig', levelController.ligSiralama);
router.get('/istatistikler', levelController.istatistikler);
router.get('/profil/:id', levelController.kullaniciProfil);

export { router as levelRouter };
