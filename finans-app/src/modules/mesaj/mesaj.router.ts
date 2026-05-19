import { Router } from 'express';
import { mesajController } from './mesaj.controller';
import { auth } from '@middleware/auth.middleware';

const router = Router();

router.use(auth);

router.get('/konusmalar', mesajController.konusmalar);
router.get('/okunmamis-sayisi', mesajController.okunmamisSayisi);
router.get('/:kullaniciId', mesajController.mesajlariGetir);

router.post('/gonder', mesajController.mesajGonder);
router.post('/hedef-paylas', mesajController.hedefPaylas);
router.post('/butce-paylas', mesajController.butcePaylas);
router.post('/rozet-paylas', mesajController.rozetPaylas);

export { router as mesajRouter };
