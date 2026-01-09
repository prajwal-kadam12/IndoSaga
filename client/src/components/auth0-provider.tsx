import { Auth0Provider } from '@auth0/auth0-react';
import { auth0Config } from '@/lib/auth0-config';

interface Auth0ProviderWrapperProps {
  children: React.ReactNode;
}

export default function Auth0ProviderWrapper({ children }: Auth0ProviderWrapperProps) {
  return (
    <Auth0Provider
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={{
        redirect_uri: auth0Config.redirectUri,
        audience: auth0Config.audience,
        scope: auth0Config.scope
      }}
      cacheLocation="localstorage"
    >
      {children}
    </Auth0Provider>
  );
}