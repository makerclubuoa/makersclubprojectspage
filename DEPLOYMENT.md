# Production deployment and Ghost cutover

This runbook moves the public site at `makeuoa.nz` from the Ghost theme to
this Next.js app on Cloudflare Workers **without turning off Ghost**. Ghost
continues to run in CapRover as the content, newsletter, and membership backend.

Use a Cloudflare **Worker Route** for the first cutover. It is deliberately
reversible: remove the route and traffic immediately returns to the Ghost site
in CapRover.

## What changes, and what does not

| Component | After cutover |
| --- | --- |
| `https://makeuoa.nz` | This Cloudflare Worker / Next.js app |
| Ghost in CapRover | Stays online; provides content, newsletters, members, and its Admin API |
| Supabase | Same project, database, Auth users, RLS policies, and Storage buckets |
| Resend | Same account and verified sending domain |
| Stripe / vending service | Same accounts and service; the app creates checkout URLs on the new domain |

Do **not** delete the CapRover app, Ghost database, Ghost theme, or origin DNS
record during the first rollout.

## Before you start

You need access to:

- the Cloudflare account and the `makeuoa.nz` zone;
- the CapRover Ghost application;
- the Supabase project;
- Resend, Stripe, and the Turnstile widget;
- the Ghost Admin dashboard and API keys;
- the Cloudflare account that owns the Worker.

Create backups before touching DNS or Ghost:

1. Export Ghost content and back up its persistent CapRover volumes/database.
2. Export/download the current Ghost theme and `routes.yaml` if one is used.
3. Record the existing Cloudflare DNS records and Worker routes.
4. Keep a browser tab open to the existing site so the rollback can be checked
   immediately.

## 1. Give Ghost a backend hostname

The app currently reads Ghost through `NEXT_PUBLIC_GHOST_URL`. It must not
keep using `https://makeuoa.nz` once the Worker owns that hostname, otherwise
the app will call itself instead of Ghost.

Recommended hostname: `ghost.makeuoa.nz`.

1. In Cloudflare DNS, add a proxied CNAME for `ghost.makeuoa.nz` pointing to
   the same CapRover application hostname used by the existing Ghost site.
2. In the `maker-club-prod-website` CapRover app's HTTP settings, connect
   `ghost.makeuoa.nz` and enable HTTPS.
3. Set the Ghost app environment variable `url=https://ghost.makeuoa.nz`, then
   restart/redeploy the app. Ghost Admin remains at
   `https://ghost.makeuoa.nz/ghost/`.
4. Confirm all of these work before continuing:

   ```text
   https://ghost.makeuoa.nz/
   https://ghost.makeuoa.nz/ghost/
   https://ghost.makeuoa.nz/ghost/api/content/
   ```

### Important: Ghost-generated links

Changing Ghost's canonical URL means Ghost-generated post/newsletter links
will point at `ghost.makeuoa.nz`. That is functional, but exposes the old
Ghost theme. Decide before launch whether that is acceptable. If newsletters
are a key public surface, plan a separate redirect/proxy strategy for public
Ghost post URLs after the initial cutover.

## 2. Configure production values for the Worker

`wrangler.jsonc` is the development/staging configuration for
`projects.makeuoa.nz`. `wrangler.production.jsonc` is the production
configuration and is deliberately used only by `npm.cmd run deploy:production`.
Update the non-secret values in both files before deployment:

```jsonc
"vars": {
  "NEXT_PUBLIC_GHOST_URL": "https://ghost.makeuoa.nz",
  "NEXT_PUBLIC_BASE_URL": "https://makeuoa.nz",
  "RESEND_FROM": "MAKE_UOA <noreply@makeuoa.nz>",
  "NEXT_PUBLIC_GHOST_CONTENT_API_KEY": "<existing content API key>",
  "NEXT_PUBLIC_SUPABASE_URL": "<your Supabase URL>",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY": "<your Supabase anon key>",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY": "<your Turnstile site key>",
  "NEXT_PUBLIC_SHOW_AUTH": "true",
  "NEXT_PUBLIC_ADMIN_EMAILS": "makerclubuoa@gmail.com"
}
```

Do not put private keys in `wrangler.jsonc` or commit them. Add each secret to
the Worker instead. Run these commands from the repository root; Wrangler
will prompt for each value:

```powershell
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put GHOST_ADMIN_API_KEY
npx wrangler secret put GHOST_WEBHOOK_SECRET
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put VENDING_LEGACY_URL
npx wrangler secret put DISCORD_COMMUNITY_WEBHOOK
```

Set `GHOST_NEWSLETTER_NAME` as a Worker variable or secret if the Ghost
newsletter is not named `UoA Maker Club`.

### Required configuration inventory

| Value | Where | Required for |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Worker variable | browser authentication and project data |
| `SUPABASE_SERVICE_ROLE_KEY` | Worker secret | server-side profiles, membership, moderation |
| `NEXT_PUBLIC_GHOST_URL`, Content API key | Worker variable | homepage/events content |
| `GHOST_ADMIN_API_KEY`, `GHOST_WEBHOOK_SECRET` | Worker secret | membership sync and Ghost webhook |
| `NEXT_PUBLIC_BASE_URL` | Worker variable | links in notification emails |
| Turnstile site key and secret | variable + secret | join form protection |
| Resend API key and sender | secret + variable | notifications and engagement email |
| `STRIPE_SECRET_KEY` | Worker secret | vending and Stripe checkout |
| `VENDING_LEGACY_URL` | Worker variable/secret | free vends and physical machine queue |

### Stripe note

`lib/stripe.ts` currently reads `STRIPE_SECRET_KEY` directly from
`process.env` rather than through the Worker-aware `serverEnv` helper. Test
the vending page and a Stripe test checkout on the deployed Worker before the
DNS cutover. If it reports `STRIPE_SECRET_KEY is missing`, update that module
to use the same Worker-aware environment lookup as the rest of the app.

## 3. Configure external services

### Supabase

In **Authentication → URL Configuration**:

1. Set **Site URL** to `https://makeuoa.nz`.
2. Add these redirect URLs:

   ```text
   https://makeuoa.nz/**
   https://projects.makeuoa.nz/**        # retain during staging
   http://localhost:3000/**              # local development
   ```

3. Inspect the Auth email templates. If custom templates hard-code
   `{{ .SiteURL }}`, make sure magic-link/confirmation templates honour the
   redirect destination (`{{ .RedirectTo }}` where suitable).
4. If any social OAuth providers are later enabled, add the new production
   callback URL to each provider as well.

No Supabase data migration is needed. Do not change Storage bucket names,
RLS policies, or the project URL/key pair as part of this switch.

### Resend

1. Confirm `makeuoa.nz` is still **Verified** in Resend.
2. Keep every existing Resend DNS record when editing Cloudflare DNS, including
   SPF, DKIM, and MX/return-path records.
3. Confirm the `RESEND_FROM` address uses the verified domain.
4. Send a test project-status or report email after deployment.

There is no Resend webhook in this repository to repoint.

### Cloudflare Turnstile

1. Open the configured Turnstile widget.
2. Add `makeuoa.nz` to its allowed hostnames.
3. Keep `projects.makeuoa.nz` until staging is complete.
4. Confirm the deployed Worker uses the matching public site key and private
   secret key.
5. Submit the join form once on production and verify server-side validation
   succeeds.

### Ghost

1. Update Ghost's member webhook destination to:

   ```text
   https://makeuoa.nz/api/ghost-webhook
   ```

2. Keep the signing secret identical to `GHOST_WEBHOOK_SECRET` on the Worker.
3. Confirm Ghost Content API and Admin API keys still work against
   `ghost.makeuoa.nz`.
4. Create or update one test Ghost member and confirm the matching Supabase
   profile synchronizes.

### Stripe and vending

1. Keep `STRIPE_SECRET_KEY` in the Worker secret store.
2. The code creates `success_url` and `cancel_url` from the current request
   host, so no Stripe Checkout URL allow-list update is required for this
   app.
3. Update Stripe Dashboard business/website details if they still show the old
   site.
4. Verify the legacy vending endpoint remains available. The physical machine
   and free-item flow still depend on it.
5. Perform one Stripe test-mode checkout and one free-item test, if safe to do
   so.

## 4. Deploy to a staging Worker URL

Install dependencies and upload a non-live staging version from the repository
root:

```powershell
npm.cmd install
npm.cmd run lint
npm.cmd run deploy:staging
```

Open the resulting version preview URL. Do not redirect public traffic yet.
For magic-link testing, add that exact Workers hostname to Supabase Auth's
Redirect URLs first; `projects.makeuoa.nz` remains the normal development URL.

### Staging acceptance checklist

- [ ] Home page loads and displays Ghost-driven content.
- [ ] Events list and an event detail page load.
- [ ] Projects page loads, filters, and opens a project.
- [ ] Magic-link sign-in arrives and returns to the Worker URL.
- [ ] Joining creates/synchronizes the expected Supabase and Ghost records.
- [ ] Turnstile accepts a real submission.
- [ ] An authenticated user can upload a project image.
- [ ] Admin/project notification email arrives with a working link.
- [ ] A Ghost member webhook returns a successful response.
- [ ] Vending loads; Stripe test checkout returns to the expected success page.
- [ ] Mobile menu, homepage, and primary navigation work on a phone.

If staging exposes a hostname-specific Auth or Turnstile failure, add the
staging hostname to the corresponding allow-list before retrying.

## 5. Cut over `makeuoa.nz`

### Use a Worker Route first

Ensure `makeuoa.nz` is an active Cloudflare zone and its existing DNS record
is proxied (orange cloud). The production route is already isolated in
`wrangler.production.jsonc`:

```jsonc
"routes": [
  {
    "pattern": "makeuoa.nz/*",
    "zone_name": "makeuoa.nz"
  }
]
```

If `www.makeuoa.nz` is used publicly, decide on one canonical hostname and
add either a matching Worker route or a Cloudflare redirect rule. Do not leave
both hostname variants inconsistent.

Deploy again:

```powershell
npm.cmd run deploy:production
```

Cloudflare executes the Worker before requests reach the CNAME origin.

### Immediately after cutover

Run the staging acceptance checklist again against `https://makeuoa.nz`, then
check Cloudflare Worker logs/analytics, Ghost logs, Supabase Auth logs, and
Resend delivery status for at least the first day.

## Rollback

If the public site fails:

1. Roll the Worker back to the last known-good version in Cloudflare. Keep the
   `makeuoa.nz/*` route active.
2. Leave Ghost, Supabase, Resend, and Stripe data intact.
3. Use Worker logs and the failed acceptance-checklist item to fix the issue.
4. Upload a staging version and retest before deploying it to production.

Do not remove the Worker Route unless `makeuoa.nz` has also been connected to
the CapRover Ghost app. At present, removing the route exposes CapRover's
default page rather than the old Ghost theme.

Do not roll back by deleting the Worker, changing Supabase keys, or deleting
DNS records; those actions are slower and make recovery harder.

## After the rollout is stable

After several days of successful production use:

- remove the temporary `projects.makeuoa.nz` Auth/Turnstile allow-list entries
  only when they are no longer needed;
- decide whether Ghost public URLs should redirect to the new app;
- document access to CapRover, Ghost backups, and the Cloudflare account;
- consider moving the Worker to a Cloudflare Custom Domain if you no longer
  need the route-based rollback path;
- keep Ghost patched and backed up, because it remains a production backend.

## Useful references

- [Cloudflare Worker routes and custom domains](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)
- [Supabase Auth redirect URL configuration](https://supabase.com/docs/guides/auth/redirect-urls)
- [Ghost configuration](https://docs.ghost.org/config)
- [Resend domain verification](https://resend.com/docs/dashboard/domains/introduction)
- [Cloudflare Turnstile widget configuration](https://developers.cloudflare.com/turnstile/concepts/widget/)
