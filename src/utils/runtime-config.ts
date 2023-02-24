export default function getConfig() {
  return {
    serverRuntimeConfig: {
      DATABASE_URL: `postgresql://${process.env.DB_USER}:${
        process.env.DB_PASSWORD
      }@${process.env.DB_HOST}:${process.env.DB_PORT}/${
        process.env.DB_NAME || "renex"
      }?schema=datasyn`,
      ENVIRONMENT_URL:
        process.env.NODE_ENV == "production" && process.env.ENVIRONMENT_URL
          ? process.env.ENVIRONMENT_URL.replace("localhost", "10.111.194.18")
          : process.env.ENVIRONMENT_URL,
    },
  };
}
