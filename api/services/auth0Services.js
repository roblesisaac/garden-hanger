import { auth } from 'express-oauth2-jwt-bearer';

const checkJwt = auth({
    audience: 'my-audience',
    issuerBaseURL: 'base-url',
    tokenSigningAlg: 'RS256'
});

export { checkJwt };