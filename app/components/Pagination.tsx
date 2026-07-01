'use client'

const BTN =
  'min-w-[34px] h-[34px] px-2 border rounded-[4px] text-[11px] tracking-[0.05em] transition-colors duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-default'
const BTN_IDLE =
  'text-ink-2 border-rule enabled:hover:border-ink enabled:hover:text-ink enabled:hover:bg-paper-2'
const BTN_ACTIVE = 'bg-ink text-paper border-ink'

function pages(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const set = new Set<number>()
  ;[1, 2, current - 1, current, current + 1, total - 1, total].forEach(p => {
    if (p >= 1 && p <= total) set.add(p)
  })
  const sorted = [...set].sort((a, b) => a - b)
  const result: (number | '…')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push('…')
    result.push(p)
  })
  return result
}

export default function Pagination({ page, totalPages, onChange }: {
  page: number
  totalPages: number
  onChange: (p: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex flex-wrap items-center justify-center gap-1 mt-10 mb-2">
      <button className={`${BTN} ${BTN_IDLE}`} onClick={() => onChange(page - 1)} disabled={page === 1}>←</button>
      {pages(page, totalPages).map((p, i) =>
        p === '…'
          ? <span key={`e${i}`} className="px-1 text-muted text-xs leading-[34px]">…</span>
          : <button
              key={p}
              className={`${BTN} ${p === page ? BTN_ACTIVE : BTN_IDLE}`}
              onClick={() => onChange(p as number)}
            >{p}</button>
      )}
      <button className={`${BTN} ${BTN_IDLE}`} onClick={() => onChange(page + 1)} disabled={page === totalPages}>→</button>
    </div>
  )
}
