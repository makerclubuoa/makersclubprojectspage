import { createHmac } from 'crypto'
import { serverEnv } from '@/lib/server-env'

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

// Ghost Admin API auth is a short-lived HS256 JWT signed with the hex-decoded
// secret half of GHOST_ADMIN_API_KEY ("<id>:<secret>").
function adminToken(): string {
  const apiKey = serverEnv('GHOST_ADMIN_API_KEY')
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
  const base = serverEnv('NEXT_PUBLIC_GHOST_URL')
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

export interface AdminMemberLabel {
  id?: string;
  name: string;
  slug?: string;
}

export interface AdminMemberNewsletter {
  id: string;
  name?: string;
  status?: string;
}

export interface AdminMember {
  id: string;
  email: string;
  name?: string | null;
  note?: string | null;
  labels?: AdminMemberLabel[];
  newsletters?: AdminMemberNewsletter[];
}

export async function findGhostMember(email: string): Promise<AdminMember | null> {
  const escaped = email.replace(/'/g, "\\'")
  const filter = encodeURIComponent(`email:'${escaped}'`)
  const res = await ghostFetch(`members/?filter=${filter}&limit=1&include=labels,newsletters`)
  if (!res.ok) throw new Error(`Ghost member lookup ${res.status}: ${await res.text()}`)
  const json = (await res.json()) as { members?: AdminMember[] }
  return json.members?.[0] ?? null
}

/** Removes a Ghost member if they exist. Safe to call repeatedly. */
export async function deleteGhostMember(email: string): Promise<boolean> {
  const member = await findGhostMember(email)
  if (!member) return false

  const res = await ghostFetch(`members/${member.id}/`, { method: 'DELETE' })
  if (res.ok || res.status === 404) return true
  throw new Error(`Ghost member delete ${res.status}: ${await res.text()}`)
}

async function findActiveNewsletter(name: string): Promise<AdminMemberNewsletter> {
  const res = await ghostFetch('newsletters/?limit=all')
  if (!res.ok) throw new Error(`Ghost newsletter lookup ${res.status}: ${await res.text()}`)
  const json = (await res.json()) as { newsletters?: AdminMemberNewsletter[] }
  const newsletter = json.newsletters?.find(
    item => item.name === name && item.status === 'active',
  )
  if (!newsletter) throw new Error(`Active Ghost newsletter not found: ${name}`)
  return newsletter
}

export async function getGhostNewsletterSubscription(
  email: string,
  newsletterName: string,
): Promise<{ memberExists: boolean; subscribed: boolean }> {
  const [member, newsletter] = await Promise.all([
    findGhostMember(email),
    findActiveNewsletter(newsletterName),
  ])
  return {
    memberExists: Boolean(member),
    subscribed: Boolean(member?.newsletters?.some(item => item.id === newsletter.id)),
  }
}

export async function setGhostNewsletterSubscription(
  email: string,
  newsletterName: string,
  subscribed: boolean,
): Promise<boolean> {
  const [member, newsletter] = await Promise.all([
    findGhostMember(email),
    findActiveNewsletter(newsletterName),
  ])

  if (!member) {
    if (!subscribed) return false
    const create = await ghostFetch('members/', {
      method: 'POST',
      body: JSON.stringify({
        members: [{ email, newsletters: [{ id: newsletter.id }] }],
      }),
    })
    if (!create.ok) throw new Error(`Ghost member create ${create.status}: ${await create.text()}`)
    return true
  }

  const newsletters = (member.newsletters ?? [])
    .filter(item => item.id !== newsletter.id)
    .map(item => ({ id: item.id }))
  if (subscribed) newsletters.push({ id: newsletter.id })

  const response = await ghostFetch(`members/${member.id}/`, {
    method: 'PUT',
    body: JSON.stringify({ members: [{ newsletters }] }),
  })
  if (!response.ok) {
    throw new Error(`Ghost newsletter update ${response.status}: ${await response.text()}`)
  }
  return subscribed
}

/**
 * Creates or updates the Ghost member while preserving any unrelated labels
 * and newsletter subscriptions they already hold.
 */
export async function upsertGhostMember(input: {
  email: string
  name: string
  note?: string
  label: string
  newsletterName: string
}): Promise<AdminMember> {
  const [existing, newsletter] = await Promise.all([
    findGhostMember(input.email),
    findActiveNewsletter(input.newsletterName),
  ])

  const labels = (existing?.labels ?? []).map(label => ({
    name: label.name,
    ...(label.slug ? { slug: label.slug } : {}),
  }))
  if (!labels.some(label => label.name.toLowerCase() === input.label.toLowerCase())) {
    labels.push({ name: input.label })
  }

  const newsletters = (existing?.newsletters ?? []).map(item => ({ id: item.id }))
  if (!newsletters.some(item => item.id === newsletter.id)) {
    newsletters.push({ id: newsletter.id })
  }

  const member = {
    email: input.email,
    name: input.name,
    note: input.note || null,
    labels,
    newsletters,
  }
  const path = existing ? `members/${existing.id}/` : 'members/'
  const res = await ghostFetch(path, {
    method: existing ? 'PUT' : 'POST',
    body: JSON.stringify({ members: [member] }),
  })
  if (res.ok) {
    const json = (await res.json()) as { members?: AdminMember[] }
    return json.members?.[0] ?? { ...member, id: existing?.id ?? '', note: member.note }
  }

  const text = await res.text()
  // A simultaneous signup/login may win the create race. Fetch the now-existing
  // member and apply the complete update once instead of creating a duplicate.
  if (!existing && res.status === 422 && /already exists/i.test(text)) {
    const raced = await findGhostMember(input.email)
    if (raced) {
      const retry = await ghostFetch(`members/${raced.id}/`, {
        method: 'PUT',
        body: JSON.stringify({ members: [member] }),
      })
      if (retry.ok) {
        const json = (await retry.json()) as { members?: AdminMember[] }
        return json.members?.[0] ?? { ...member, id: raced.id, note: member.note }
      }
      throw new Error(`Ghost member update ${retry.status}: ${await retry.text()}`)
    }
  }
  throw new Error(`Ghost member ${existing ? 'update' : 'create'} ${res.status}: ${text}`)
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
