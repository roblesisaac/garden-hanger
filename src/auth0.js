import { createAuth0 } from '@auth0/auth0-vue';
import { vite_auth0_domain, vite_auth0_client_id } from './config';

export const auth0 = createAuth0({
    domain: vite_auth0_domain,
    clientId: vite_auth0_client_id,
    authorizationParams: {
      redirect_uri: window.location.origin,
      audience: `${window.location.origin}/api/auth0/test`,
      // scope: 'openid profile email offline_access'
    },
    cacheLocation: 'localstorage',
    useRefreshTokens: true,
    // httpTimeoutInSeconds: 60
});