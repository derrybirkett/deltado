'use client'

const MAX_CHARS = 160
const WARN_THRESHOLD = 140

interface CharacterCounterProps {
  count: number
}

export function CharacterCounter({ count }: CharacterCounterProps) {
  if (count === 0) return null

  const isOver = count > MAX_CHARS
  const isWarning = count > WARN_THRESHOLD

  return (
    <p
      aria-live="polite"
      className={`text-xs mt-1 ${isOver || isWarning ? 'text-destructive' : 'text-muted-foreground'}`}
    >
      {count} / {MAX_CHARS}
    </p>
  )
}
