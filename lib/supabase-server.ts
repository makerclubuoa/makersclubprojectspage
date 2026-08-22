import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { serverEnv } from '@/lib/server-env'

function makeAdmin(): SupabaseClient {
  const url = serverEnv('NEXT_PUBLIC_SUPABASE_URL')
  const key = serverEnv('SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url!, key!)
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = makeAdmin()
    const val = (client as never)[prop]
    return typeof val === 'function' ? (val as Function).bind(client) : val
  },
})
