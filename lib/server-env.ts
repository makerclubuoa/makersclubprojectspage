import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Read a server setting in both local Next.js and the Cloudflare Worker. */
export function serverEnv(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
  try {
    const { env } = getCloudflareContext();
    return (env as Record<string, string | undefined>)[key];
  } catch {
    return undefined;
  }
}

