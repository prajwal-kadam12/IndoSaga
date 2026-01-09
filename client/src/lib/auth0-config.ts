// Auth0 configuration using environment variables
const domain = import.meta.env.VITE_AUTH0_DOMAIN || 'dev-xi31sc33g5dzke7b.us.auth0.com';
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || 'PjevU1GrQZxrQtSxA1osNDAWVvDkxg4R';

export const auth0Config = {
  domain,
  clientId,
  redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/callback` : '',
  audience: domain ? `https://${domain}/api/v2/` : '',
  scope: 'openid profile email'
};

// Check if Auth0 is properly configured
export const isAuth0Configured = () => {
  return auth0Config.domain && 
         auth0Config.clientId &&
         auth0Config.domain !== '' && 
         auth0Config.clientId !== '';
};