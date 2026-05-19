import { Router } from 'express';
import { onboardingController } from './onboarding.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/kurulum-verileri', onboardingController.getKurulumVerileri);
router.post('/kurulum-tamamla', authenticate, onboardingController.kurulumTamamla);

export default router;
