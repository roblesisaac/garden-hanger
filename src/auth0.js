import { createAuth0 } from '@auth0/auth0-vue';

const auth0Domain = 'my-domain';

export const auth0 = createAuth0({
    domain: auth0Domain,
    clientId: 'client-id',
    authorizationParams: {
      redirect_uri: window.location.origin,
      audience: `${auth0Domain}/api/v2/`,
      scope: 'openid profile email offline_access'
    },
    cacheLocation: 'memory',
    useRefreshTokens: true,
    httpTimeoutInSeconds: 60
});