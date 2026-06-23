'use client'

const DEFAULT_MAX_CHARS = 160
const WARN_THRESHOLD = 0.875

interface CharacterCounterProps {
  count: number
  maxChars?: number
}

export function CharacterCounter({ count, maxChars = DEFAULT_MAX_CHARS }: CharacterCounterProps) {
  if (count === 0) return null

  const isOver = count > maxChars
  const isWarning = count > maxChars * WARN_THRESHOLD

  return (
    <p
      aria-live="polite"
      className={`text-xs mt-1 ${isOver || isWarning ? 'text-destructive' : 'text-muted-foreground'}`}
    >
      {count} / {maxChars}
    </p>
  )
}
