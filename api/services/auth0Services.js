import { auth } from 'express-oauth2-jwt-bearer';

const checkJwt = auth({
    audience: 'url-here',
    issuerBaseURL: 'url-here',
    tokenSigningAlg: 'RS256'
});

export { checkJwt };