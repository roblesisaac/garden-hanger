import { Router } from 'express';
import auth0Controllers from '../controllers/auth0Controllers.js';
import { checkJwt } from '../services/auth0Services.js';

const router = Router();

router.get('/auth0/test', checkJwt, auth0Controllers.test);

export default router;