export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

export function getEnvValidationIssues(overrides: Record<string, string | undefined> = {}) {
  const values = {
    VITE_APP_ID: overrides.VITE_APP_ID ?? process.env.VITE_APP_ID,
    JWT_SECRET: overrides.JWT_SECRET ?? process.env.JWT_SECRET,
    DATABASE_URL: overrides.DATABASE_URL ?? process.env.DATABASE_URL,
    OWNER_OPEN_ID: overrides.OWNER_OPEN_ID ?? process.env.OWNER_OPEN_ID,
  };

  const issues: string[] = [];

  if (!values.VITE_APP_ID) issues.push('VITE_APP_ID');
  if (!values.JWT_SECRET) issues.push('JWT_SECRET');
  if (!values.DATABASE_URL) issues.push('DATABASE_URL');
  if (!values.OWNER_OPEN_ID) issues.push('OWNER_OPEN_ID');

  return issues;
}
