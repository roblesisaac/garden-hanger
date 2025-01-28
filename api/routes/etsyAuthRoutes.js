import express from 'express';
import { initiateAuth, handleCallback, refreshToken, getStatus } from '../controllers/etsyAuthController.js';

const router = express.Router();

router.get('/connect', initiateAuth);
router.get('/callback', handleCallback);
router.post('/refresh', refreshToken);
router.get('/status', getStatus);

export default router; 