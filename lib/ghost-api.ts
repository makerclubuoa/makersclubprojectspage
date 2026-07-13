import GhostAdminAPI from "@tryghost/admin-api";

let adminApi: any;

export function api() {
  if (!adminApi) {
    adminApi = new GhostAdminAPI({
      url: process.env.GHOST_URL!,
      key: process.env.GHOST_ADMIN_API_KEY!,
      version: "v6.0",
    });
  }
  return adminApi;
}
