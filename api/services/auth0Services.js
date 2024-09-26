import { auth } from 'express-oauth2-jwt-bearer';

const checkJwt = auth({
    audience: '...',
    issuerBaseURL: '...',
    tokenSigningAlg: 'RS256'
});

export { checkJwt };