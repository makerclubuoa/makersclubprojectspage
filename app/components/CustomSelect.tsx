'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  className?: string
  /** 'field' = form input (bottom border); 'filter' = compact filter-bar widget */
  variant?: 'field' | 'filter'
}

const TRIGGER_BASE =
  'flex items-center justify-between w-full bg-transparent text-ink text-left cursor-pointer outline-none'
const TRIGGER_FIELD =
  'border-0 border-b border-rule text-[13.5px] py-2 pr-1 transition-[border-color] duration-200 focus:border-ink'
const TRIGGER_FILTER = 'border-0 uppercase tracking-[0.06em]'

export default function CustomSelect({ value, onChange, options, className, variant = 'field' }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const label = options.find(o => o.value === value)?.label ?? value

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div ref={ref} className={`relative w-full ${open ? 'z-30' : 'z-[1]'}${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        className={`${TRIGGER_BASE} ${variant === 'filter' ? TRIGGER_FILTER : TRIGGER_FIELD}`}
        onClick={() => setOpen(o => !o)}
      >
        <span>{label}</span>
        <svg
          className={`text-muted shrink-0 transition-transform duration-150${open ? ' rotate-180' : ''}`}
          width="10" height="6" viewBox="0 0 10 6" fill="none"
        >
          <path d="M0 0l5 6 5-6z" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <ul
          className={`absolute top-full left-0 right-0 z-[200] mt-0.5 py-1 list-none bg-paper-2 border border-rule rounded-base shadow-[0_8px_24px_rgba(0,0,0,0.18)] max-h-[220px] overflow-y-auto${variant === 'filter' ? ' min-w-[160px]' : ''}`}
          role="listbox"
        >
          {options.map(o => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={`px-[14px] py-[9px] text-[13px] cursor-pointer transition-colors duration-100 hover:bg-paper-3 hover:text-ink ${o.value === value ? 'text-ink font-semibold' : 'text-ink-2'}`}
              onMouseDown={() => { onChange(o.value); setOpen(false) }}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
