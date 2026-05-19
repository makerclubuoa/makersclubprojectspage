/**
 * One-time migration: imports Ghost members from a CSV export into Supabase.
 *
 * 1. In Ghost Admin → Members → Export → download the CSV
 * 2. Save it as scripts/members.csv (or pass a path as the first argument)
 * 3. Run: npx tsx scripts/migrate-ghost-members.ts
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (read from .env.local)
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local
try {
  const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/)
    if (m) process.env[m[1].trim()] ??= m[2].trim()
  }
} catch { /* rely on shell env */ }

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const csvPath = process.argv[2] ?? resolve(process.cwd(), 'scripts/members.csv')

let csvContent: string
try {
  csvContent = readFileSync(csvPath, 'utf8')
} catch {
  console.error(`Could not read CSV at: ${csvPath}`)
  console.error('Export from Ghost Admin → Members → Export, save as scripts/members.csv')
  process.exit(1)
}

// Parse CSV (handles quoted fields with commas inside)
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean)
  const headers = splitCsvLine(lines[0]).map(h => h.trim().toLowerCase())
  return lines.slice(1).map(line => {
    const values = splitCsvLine(line)
    return Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? '').trim()]))
  })
}

function splitCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; continue }
    if (ch === '"') { inQuotes = !inQuotes; continue }
    if (ch === ',' && !inQuotes) { result.push(current); current = ''; continue }
    current += ch
  }
  result.push(current)
  return result
}

const rows = parseCsv(csvContent)
console.log(`Parsed ${rows.length} rows from CSV`)
console.log(`Columns: ${Object.keys(rows[0] ?? {}).join(', ')}`)

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE)

async function main() {
  let created = 0, updated = 0, failed = 0

  for (const row of rows) {
    // Only use these three fields from the CSV — everything else is ignored
    const email        = (row.email      ?? '').toLowerCase().trim()
    const display_name = (row.name       ?? '').trim() || email.split('@')[0]
    const joined_at    = (row.created_at ?? '').trim() || new Date().toISOString()

    if (!email) continue

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name })
        .eq('id', existing.id)
      if (error) console.error(`  ✗ update ${email}: ${error.message}`)
      else console.log(`  ~ ${email} → ${display_name}`)
      updated++
      continue
    }

    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      created_at: joined_at,
      user_metadata: { display_name },
    })

    if (error) {
      console.error(`  ✗ ${email}: ${error.message}`)
      failed++
    } else if (user) {
      const { error: insErr } = await supabase
        .from('profiles')
        .insert({ id: user.id, email, display_name })
      if (insErr) console.error(`  ✗ profile insert ${email}: ${insErr.message}`)
      else console.log(`  ✓ ${email} → ${display_name}`)
      created++
    }

    await new Promise(r => setTimeout(r, 120))
  }

  console.log(`\nDone: ${created} created, ${updated} updated, ${failed} failed`)
}

main().catch(err => { console.error(err); process.exit(1) })
