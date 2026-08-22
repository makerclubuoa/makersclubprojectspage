'use client'

const BTN =
  'min-w-[34px] h-[34px] px-2 border-2 border-black rounded-full text-[11px] font-bold tracking-[0.05em] transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-default'
const BTN_IDLE = 'bg-white text-ink enabled:hover:bg-paper-2'
const BTN_ACTIVE = 'bg-pop-pink text-white shadow-[2px_2px_0px_0px_#000]'

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
      <button aria-label="Previous page" className={`${BTN} ${BTN_IDLE}`} onClick={() => onChange(Math.max(1, page - 1))} disabled={page <= 1}>←</button>
      {pages(page, totalPages).map((p, i) =>
        p === '…'
          ? <span key={`e${i}`} className="px-1 text-white text-xs font-bold leading-[34px] [text-shadow:1px_1px_0_#000]">…</span>
          : <button
              key={p}
              className={`${BTN} ${p === page ? BTN_ACTIVE : BTN_IDLE}`}
              onClick={() => onChange(p as number)}
              aria-current={p === page ? 'page' : undefined}
              aria-label={`Page ${p}`}
            >{p}</button>
      )}
      <button aria-label="Next page" className={`${BTN} ${BTN_IDLE}`} onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>→</button>
    </div>
  )
}
