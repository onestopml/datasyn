import { createTheme, ThemeProvider } from "@mui/material/styles";

import { SSRKeycloakProvider } from "@react-keycloak/ssr";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useCallback, useMemo } from "react";
import type {
  AuthClientEvent,
  AuthClientInitOptions,
  AuthClientTokens,
} from "@react-keycloak/core/lib/types";
import Cookies from "js-cookie";
const theme = createTheme({
  palette: {
    primary: {
      // Purple and green play nicely together.
      main: "#00796b",
    },
    secondary: {
      // This is green.A700 as hex.
      main: "#ffffff",
    },
  },
});
interface IComponentProps {
  persistor: any;
  keycloakConfig: any;
  // cookies: any;
}
const Layout = (props: PropsWithChildren<IComponentProps>) => {
  const queryClient = new QueryClient();

  const onKeycloakTokens = useCallback((keycloak: AuthClientTokens) => {
    //   // setKeycloakAccessToken(keycloak.token);
    //   if (keycloak.token) {
    //     Cookies.set("kcAccessToken", keycloak.token, {
    //       sameSite: "Strict",
    //     });
    //   } else {
    //     Cookies.remove("kcAccessToken");
    //   }
    //   if (keycloak.idToken) {
    //     Cookies.set("kcIdToken", keycloak.idToken, {
    //       sameSite: "Strict",
    //     });
    //   } else {
    //     Cookies.remove("kcIdToken");
    //   }
    //   if (keycloak.refreshToken) {
    //     Cookies.set("kcRefreshToken", keycloak.refreshToken, {
    //       sameSite: "Strict",
    //     });
    //   } else {
    //     Cookies.remove("kcRefreshToken");
    //   }
  }, []);
  const onEventHandler = useCallback((event: AuthClientEvent) => {
    if (
      [
        "onInitError",
        "onAuthError",
        "onAuthRefreshError",
        "onTokenExpired",
      ].includes(event)
    ) {
      // keycloakClient.login();
    }
  }, []);

  const initOptions: AuthClientInitOptions = useMemo(
    () => ({
      onLoad: "login-required",
      checkLoginIframe: false,
      // token: Cookies.get("kcAccessToken"),
      // idToken: Cookies.get("kcIdToken"),
      // refreshToken: Cookies.get("kcRefreshToken"),
    }),
    []
  );
  return (
    // @ts-ignore
    <SSRKeycloakProvider
      keycloakConfig={props.keycloakConfig}
      persistor={props.persistor}
      // onEvent={eventLogger}
      // onTokens={tokenLogger}
      onTokens={onKeycloakTokens}
      LoadingComponent={<div>loading</div>}
      onEvent={onEventHandler}
      initOptions={initOptions}
      autoRefreshToken={true}
    >
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          {props.children}
        </QueryClientProvider>
      </ThemeProvider>
    </SSRKeycloakProvider>
  );
};
export default Layout;
