import { Router } from 'express';
import { raporController } from './rapor.controller';
import { auth } from '@middleware/auth.middleware';

const router = Router();

router.get('/detayli', auth, raporController.detayliRaporGetir);
router.post('/ai-analiz', auth, raporController.aiAnaliziGetir);

export { router as raporRouter };
