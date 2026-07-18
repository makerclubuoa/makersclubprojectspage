import { createHmac } from 'crypto'
import { getCloudflareContext } from '@opennextjs/cloudflare'

function env(key: string): string | undefined {
  if (process.env[key]) return process.env[key]
  try {
    const { env } = getCloudflareContext()
    return (env as Record<string, string>)[key]
  } catch {
    return undefined
  }
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

// Ghost Admin API auth is a short-lived HS256 JWT signed with the hex-decoded
// secret half of GHOST_ADMIN_API_KEY ("<id>:<secret>").
function adminToken(): string {
  const apiKey = env('GHOST_ADMIN_API_KEY')
  if (!apiKey) throw new Error('GHOST_ADMIN_API_KEY is not set')
  const [id, secret] = apiKey.split(':')
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: id }))
  const payload = b64url(JSON.stringify({ iat: now, exp: now + 300, aud: '/admin/' }))
  const data = `${header}.${payload}`
  const sig = createHmac('sha256', Buffer.from(secret, 'hex')).update(data).digest()
  return `${data}.${b64url(sig)}`
}

async function ghostFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = env('NEXT_PUBLIC_GHOST_URL')
  if (!base) throw new Error('NEXT_PUBLIC_GHOST_URL is not set')
  return fetch(`${base}/ghost/api/admin/${path}`, {
    ...init,
    headers: {
      Authorization: `Ghost ${adminToken()}`,
      'Accept-Version': 'v5.0',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
}

export interface AdminPost {
  title?: string
  slug?: string
  html?: string | null
  lexical?: string | null
  feature_image?: string | null
}

// Browse posts via the Admin API (sees drafts, unlike the Content API).
// The @tryghost/admin-api SDK cannot be used here: its axios layer sends GET
// requests with a body, which fetch() on the Workers runtime rejects.
export async function adminBrowsePosts(query: string): Promise<AdminPost[]> {
  const res = await ghostFetch(`posts/?${query}`)
  if (!res.ok) throw new Error(`Ghost admin posts browse ${res.status}: ${await res.text()}`)
  const json = (await res.json()) as { posts?: AdminPost[] }
  return json.posts ?? []
}

export async function ghostMemberExists(email: string): Promise<boolean> {
  const filter = encodeURIComponent(`email:'${email}'`)
  const res = await ghostFetch(`members/?filter=${filter}&limit=1`)
  if (!res.ok) throw new Error(`Ghost member lookup ${res.status}: ${await res.text()}`)
  const json = (await res.json()) as { members?: unknown[] }
  return (json.members?.length ?? 0) > 0
}

export async function createGhostMember(email: string, name?: string): Promise<void> {
  const res = await ghostFetch('members/', {
    method: 'POST',
    body: JSON.stringify({ members: [{ email, name: name || undefined }] }),
  })
  if (res.ok) return
  // 422 with "already exists" can happen on a race — treat as success (idempotent).
  const text = await res.text()
  if (res.status === 422 && /already exists/i.test(text)) return
  throw new Error(`Ghost member create ${res.status}: ${text}`)
}
