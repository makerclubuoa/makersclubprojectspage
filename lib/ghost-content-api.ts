import "server-only";
import GhostContentAPI, { GhostAPI } from "@tryghost/content-api";
import { serverEnv } from "@/lib/server-env";

let contentApi: undefined | GhostAPI;

export function api() {
  if (!contentApi) {
    const url = serverEnv("NEXT_PUBLIC_GHOST_URL");
    const key = serverEnv("NEXT_PUBLIC_GHOST_CONTENT_API_KEY");
    if (!url || !key) {
      throw new Error("Ghost Content API configuration is missing");
    }
    contentApi = new GhostContentAPI({
      url,
      key,
      version: "v6.0",
    });
  }

  return contentApi;
}
