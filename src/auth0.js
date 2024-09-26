import { createAuth0 } from '@auth0/auth0-vue';

const auth0Domain = 'auth0.com';

export const auth0 = createAuth0({
    domain: auth0Domain,
    clientId: 'clientId',
    authorizationParams: {
      redirect_uri: window.location.origin,
      audience: `https://auth0/api/auth0/test`,
      // scope: 'openid profile email offline_access'
    },
    cacheLocation: 'localstorage',
    useRefreshTokens: true,
    // httpTimeoutInSeconds: 60
});