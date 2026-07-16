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
  'flex items-center justify-between w-full text-ink text-left cursor-pointer outline-none'
const TRIGGER_FIELD =
  'bg-white border-2 border-black rounded-[6px] text-sm px-3 py-2 transition-shadow duration-150 focus:shadow-[2px_2px_0px_0px_#000]'
const TRIGGER_FILTER = 'bg-transparent border-0 uppercase font-semibold tracking-[0.06em]'

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
          className={`absolute top-full left-0 right-0 z-[200] mt-1 py-1 list-none bg-white border-2 border-black rounded-[6px] shadow-[4px_4px_0px_0px_#000] max-h-[220px] overflow-y-auto${variant === 'filter' ? ' min-w-[160px]' : ''}`}
          role="listbox"
        >
          {options.map(o => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={`px-[14px] py-[9px] text-[13px] font-medium cursor-pointer transition-colors duration-100 hover:bg-paper-2 hover:text-ink ${o.value === value ? 'text-pop-magenta font-bold' : 'text-ink-2'}`}
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
