import GhostContentAPI, { GhostAPI } from "@tryghost/content-api";

let contentApi: undefined | GhostAPI;

export function api() {
  if (!contentApi) {
    contentApi = new GhostContentAPI({
      url: process.env.GHOST_URL!,
      key: process.env.GHOST_CONTENT_API_KEY!,
      version: "v6.0",
    });
  }

  return contentApi;
}
