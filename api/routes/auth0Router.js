import { Router } from 'express';
import auth0Controllers from '../controllers/auth0Controllers';
import { checkJwt } from '../services/auth0Services';

const router = Router();

router.get('/auth0/profile', checkJwt, auth0Controllers.test);

export default router;