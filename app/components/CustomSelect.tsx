'use client'

import { useEffect, useId, useRef, useState } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  className?: string
  id?: string
  ariaLabel?: string
  ariaDescribedBy?: string
  /** 'field' = form input (bottom border); 'filter' = compact filter-bar widget */
  variant?: 'field' | 'filter'
}

const TRIGGER_BASE =
  'flex items-center justify-between w-full text-ink text-left cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-pop-magenta focus-visible:ring-offset-2'
const TRIGGER_FIELD =
  'bg-white border-2 border-black rounded-[6px] text-sm max-[640px]:text-base px-3 py-2 transition-shadow duration-150 focus:shadow-[2px_2px_0px_0px_#000]'
const TRIGGER_FILTER =
  'bg-transparent border-0 uppercase font-semibold tracking-[0.06em] text-sm min-h-[32px] py-1.5 lg:text-[11.5px] lg:min-h-0 lg:py-0'

export default function CustomSelect({
  value,
  onChange,
  options,
  className,
  id,
  ariaLabel,
  ariaDescribedBy,
  variant = 'field',
}: Props) {
  const generatedId = useId()
  const triggerId = id ?? `select-${generatedId}`
  const listboxId = `${triggerId}-listbox`
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])

  const selectedIndex = Math.max(0, options.findIndex(option => option.value === value))
  const label = options[selectedIndex]?.label ?? value

  function focusOption(index: number) {
    if (options.length === 0) return
    const next = (index + options.length) % options.length
    setActiveIndex(next)
    requestAnimationFrame(() => optionRefs.current[next]?.focus())
  }

  function openAt(index: number) {
    setOpen(true)
    focusOption(index)
  }

  function choose(index: number) {
    const option = options[index]
    if (!option) return
    onChange(option.value)
    setOpen(false)
    requestAnimationFrame(() => document.getElementById(triggerId)?.focus())
  }

  useEffect(() => {
    function onDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        document.getElementById(triggerId)?.focus()
      }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [triggerId])

  return (
    <div ref={ref} className={`relative w-full ${open ? 'z-30' : 'z-[1]'}${className ? ` ${className}` : ''}`}>
      <button
        id={triggerId}
        type="button"
        className={`${TRIGGER_BASE} ${variant === 'filter' ? TRIGGER_FILTER : TRIGGER_FIELD}`}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-expanded={open}
        onClick={() => open ? setOpen(false) : openAt(selectedIndex)}
        onKeyDown={event => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            openAt(open ? activeIndex + 1 : selectedIndex)
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            openAt(open ? activeIndex - 1 : selectedIndex)
          } else if (event.key === 'Home' && open) {
            event.preventDefault()
            focusOption(0)
          } else if (event.key === 'End' && open) {
            event.preventDefault()
            focusOption(options.length - 1)
          }
        }}
      >
        <span>{label}</span>
        <svg
          className={`text-muted shrink-0 transition-transform duration-150${open ? ' rotate-180' : ''}`}
          width="10" height="6" viewBox="0 0 10 6" fill="none"
          aria-hidden="true"
        >
          <path d="M0 0l5 6 5-6z" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div
          id={listboxId}
          className={`absolute top-full left-0 right-0 z-[200] mt-1 py-1 list-none bg-white border-2 border-black rounded-[6px] shadow-[4px_4px_0px_0px_#000] max-h-[220px] overflow-y-auto${variant === 'filter' ? ' min-w-[160px]' : ''}`}
          role="listbox"
          aria-labelledby={ariaLabel ? undefined : triggerId}
          aria-label={ariaLabel}
        >
          {options.map((option, index) => (
            <button
              ref={element => { optionRefs.current[index] = element }}
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              tabIndex={index === activeIndex ? 0 : -1}
              className={`block w-full px-[14px] py-3 text-left text-sm lg:py-[9px] lg:text-[13px] font-medium cursor-pointer transition-colors duration-100 hover:bg-paper-2 hover:text-ink focus-visible:outline-3 focus-visible:outline-pop-magenta focus-visible:outline-offset-[-3px] ${option.value === value ? 'text-pop-magenta font-bold' : 'text-ink-2'}`}
              onFocus={() => setActiveIndex(index)}
              onClick={() => choose(index)}
              onKeyDown={event => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault()
                  focusOption(index + 1)
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault()
                  focusOption(index - 1)
                } else if (event.key === 'Home') {
                  event.preventDefault()
                  focusOption(0)
                } else if (event.key === 'End') {
                  event.preventDefault()
                  focusOption(options.length - 1)
                } else if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  choose(index)
                }
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
