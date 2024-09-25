import { auth } from 'express-oauth2-jwt-bearer';

const checkJwt = auth({
    audience: 'https://my-domain/api/auth0/test',
    issuerBaseURL: 'url/',
    tokenSigningAlg: 'RS256'
});

export { checkJwt };