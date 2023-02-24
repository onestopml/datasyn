/**
 * @type {import('next').NextConfig}
 */
(
  module.exports = {
    basePath: "/datasyn",
    assetPrefix: "/datasyn",
    output: "standalone",
    webpack: (
      config,
      { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack, actions }
    ) => {
      config.externals = config.externals || [];
      config.externals = config.externals.concat(["canvas"]);
      // Important: return the modified config
      return config;
    },
    async redirects() {
      return [
        {
          source: "/",
          destination: "/datasyn",
          basePath: false,
          permanent: false,
        },
      ];
    },
  }
);
