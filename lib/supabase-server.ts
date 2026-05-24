import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getCloudflareContext } from '@opennextjs/cloudflare'

function cfEnv(key: string): string | undefined {
  try {
    const { env } = getCloudflareContext()
    return (env as Record<string, string>)[key]
  } catch {
    return undefined
  }
}

function makeAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? cfEnv('NEXT_PUBLIC_SUPABASE_URL')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? cfEnv('SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url!, key!)
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (makeAdmin() as never)[prop]
  },
})
