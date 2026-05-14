'use client'

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
    <div className="pagination">
      <button className="pagination__btn" onClick={() => onChange(page - 1)} disabled={page === 1}>←</button>
      {pages(page, totalPages).map((p, i) =>
        p === '…'
          ? <span key={`e${i}`} className="pagination__ellipsis">…</span>
          : <button
              key={p}
              className={`pagination__btn${p === page ? ' pagination__btn--active' : ''}`}
              onClick={() => onChange(p as number)}
            >{p}</button>
      )}
      <button className="pagination__btn" onClick={() => onChange(page + 1)} disabled={page === totalPages}>→</button>
    </div>
  )
}
