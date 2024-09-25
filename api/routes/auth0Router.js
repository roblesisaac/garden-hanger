import { Router } from 'express';
import { checkJwt } from '../services/auth0Services.js';
import auth0Controllers from '../controllers/auth0Controllers.js'

const router = Router();

router.get('/auth0/profile', auth0Controllers.test);

export default router;