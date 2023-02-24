import "@react-keycloak/ssr";
import type { AuthClient } from "@react-keycloak/core";

declare module "@react-keycloak/ssr" {
  export interface SSRAuthClient extends AuthClient {
    /** A boolean indicating if the user is authenticated or not. */
    authenticated?: boolean;
    idTokenParsed?: {
      sub: string;
    };
  }
}
