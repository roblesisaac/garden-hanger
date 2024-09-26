import { auth } from 'express-oauth2-jwt-bearer';

const checkJwt = auth({
    audience: 'https://url/api/auth0/test',
    issuerBaseURL: 'https://url.com/',
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