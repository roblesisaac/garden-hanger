import { createAuth0 } from '@auth0/auth0-vue';
import { auth0_domain, auth0_client_id } from './config';

export const auth0 = createAuth0({
    domain: auth0_domain,
    clientId: auth0_client_id,
    authorizationParams: {
      redirect_uri: window.location.origin,
      audience: `${window.location.origin}/api/auth0/test`,
    },
    cacheLocation: 'localstorage',
    useRefreshTokens: true,
});