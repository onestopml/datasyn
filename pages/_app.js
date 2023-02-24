import "../src/index.css";
import "react-toastify/dist/ReactToastify.css";
import Layout from "../src/components/Layout";
import cookie from "cookie";
import { SSRCookies } from "@react-keycloak/ssr";
import getConfig from "../src/utils/runtime-config";
import axios from "axios";
const { serverRuntimeConfig } = getConfig();
function parseCookies(req) {
  if (!req || !req.headers) {
    return {};
  }
  return cookie.parse(req.headers.cookie || "");
}
export default function MyApp({
  Component,
  pageProps,
  cookies,
  keycloakConfig,
}) {
  const persistor = SSRCookies(cookies);
  return (
    <Layout persistor={persistor} keycloakConfig={keycloakConfig}>
      <Component {...pageProps} />
    </Layout>
  );
}

MyApp.getInitialProps = async (context) => {
  // Extract cookies from AppContext
  const keycloakConfigData = await axios(
    serverRuntimeConfig.ENVIRONMENT_URL + "/info"
  ).then((resp) => resp.data);
  const keycloakConfig = {
    url: keycloakConfigData.KEYKEEPER_AUTH_URL,
    realm: keycloakConfigData.KEYKEEPER_REALM,
    clientId: keycloakConfigData.KEYKEEPER_FRONTEND_CLIENT_ID,
  };
  const cookies = parseCookies(context?.ctx?.req);
  return {
    cookies,
    keycloakConfig,
  };
};
