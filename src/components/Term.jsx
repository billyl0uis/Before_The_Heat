import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { GLOSSARY } from '../content/glossary'

// A shop word with its meaning one tap away, right where it's used. The
// word stays readable in the sentence; a dotted underline says there's
// more. Tap, click or Enter opens it; Esc, a second tap or tapping
// elsewhere closes it.
export function Term({ id, children, align = 'start' }) {
  const entry = GLOSSARY[id]
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const panelRef = useRef(null)
  const [nudge, setNudge] = useState(0)
  const panelId = useId()

  // Keep the definition on screen: near an edge of a phone, slide it back
  // in rather than letting it hang off the side.
  useLayoutEffect(() => {
    if (!open || !panelRef.current) return
    const rect = panelRef.current.getBoundingClientRect()
    const margin = 8
    const left = rect.left - nudge
    const right = rect.right - nudge
    let shift = 0
    if (right > window.innerWidth - margin) shift = window.innerWidth - margin - right
    if (left + shift < margin) shift = margin - left
    setNudge(shift)
    // Measured once per opening; the nudge itself mustn't re-trigger it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onPointer = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!entry) return children

  return (
    <span ref={wrapRef} className="relative inline">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        // Inherits the label's lettering (a button wouldn't), and its tap
        // area reaches 44px tall without moving the text around it.
        className="relative cursor-help underline decoration-current/50 decoration-dotted underline-offset-[3px] [text-transform:inherit] after:absolute after:-inset-x-1 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-[''] hover:decoration-current"
      >
        {children ?? entry.term}
      </button>
      {open && (
        <span
          ref={panelRef}
          id={panelId}
          role="note"
          style={{ marginLeft: nudge }}
          className={`absolute top-full z-40 ${align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0'} mt-1.5 block w-[min(18rem,80vw)] rounded-lg border border-line bg-raise p-3 text-left text-sm leading-relaxed font-normal tracking-normal whitespace-normal text-ink-soft normal-case shadow-[0_12px_32px_rgb(0_0_0/0.45)]`}
        >
          <span className="block font-semibold text-ink">{entry.term}</span>
          {entry.definition}
        </span>
      )}
    </span>
  )
}

// Words in running copy that have a glossary entry, each linked the first
// time it appears in a passage.
const TERM_PATTERNS = [
  [/\b(strik(?:e|es|ing)|struck)\b/i, 'strike'],
  [/\b(devitrif\w*)\b/i, 'devitrification'],
  [/\b(COE)\b/, 'coe'],
  [/\b(moil)\b/i, 'moil'],
  [/\b(marver(?:ing|ed)?)\b/i, 'marver'],
  [/\b(casing)\b/i, 'casing'],
]

export function TermText({ children }) {
  if (typeof children !== 'string') return children
  const found = []
  for (const [pattern, id] of TERM_PATTERNS) {
    const match = pattern.exec(children)
    if (match && !found.some((f) => match.index < f.end && match.index + match[0].length > f.start)) {
      found.push({ start: match.index, end: match.index + match[0].length, id, word: match[0] })
    }
  }
  if (!found.length) return children
  found.sort((a, b) => a.start - b.start)
  const parts = []
  let at = 0
  for (const f of found) {
    parts.push(children.slice(at, f.start))
    parts.push(
      <Term key={f.start} id={f.id}>
        {f.word}
      </Term>,
    )
    at = f.end
  }
  parts.push(children.slice(at))
  return parts
}
