import GhostContentAPI, { GhostAPI } from "@tryghost/content-api";

let contentApi: undefined | GhostAPI;

export function api() {
  if (!contentApi) {
    contentApi = new GhostContentAPI({
      url: process.env.NEXT_PUBLIC_GHOST_URL!,
      key: process.env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY!,
      version: "v6.0",
    });
  }

  return contentApi;
}
