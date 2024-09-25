import { auth } from 'express-oauth2-jwt-bearer';

const checkJwt = auth({
    audience: 'audience',
    issuerBaseURL: 'url',
    tokenSigningAlg: 'RS256'
});

export { checkJwt };