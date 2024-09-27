import { auth } from 'express-oauth2-jwt-bearer';
import config from '../config/environment';

const { AUTH0_ISSUER_BASE_URL, AUTH0_AUDIENCE } = config;

const checkJwt = auth({
    audience: AUTH0_AUDIENCE,
    issuerBaseURL: AUTH0_ISSUER_BASE_URL,
    tokenSigningAlg: 'RS256'
});

const middleware = (req, res, next) => {
    checkJwt(req, res, (err) => {
        if (err) {
            return res.status(401).json({ 
                success: false,
                error: err.message
            });
        }
        next();
    });
};

export { middleware as checkJwt };