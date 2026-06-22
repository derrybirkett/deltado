'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'deltado:char-limit'
const DEFAULT_LIMIT = 160

export function useCharLimit() {
  const [charLimit, setCharLimit] = useState(DEFAULT_LIMIT)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setCharLimit(parseInt(stored, 10))
  }, [])

  function updateCharLimit(limit: number) {
    localStorage.setItem(STORAGE_KEY, String(limit))
    setCharLimit(limit)
  }

  return { charLimit, updateCharLimit }
}
