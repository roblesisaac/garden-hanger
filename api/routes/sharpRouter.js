import { Router } from 'express';
import sharpControllers from '../controllers/sharpControllers';

const router = Router();

router.get('/image/:size/:fileName', sharpControllers.sharpImage);

export default router;