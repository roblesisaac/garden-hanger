import { createAuth0 } from '@auth0/auth0-vue';

const auth0Domain = '...';

export const auth0 = createAuth0({
    domain: auth0Domain,
    clientId: '...',
    authorizationParams: {
      redirect_uri: window.location.origin,
      audience: `...`,
      // scope: 'openid profile email offline_access'
    },
    // cacheLocation: 'localstorage',
    // useRefreshTokens: true,
    // httpTimeoutInSeconds: 60
});