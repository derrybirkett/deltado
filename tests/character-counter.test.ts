import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CharacterCounter } from '@/components/character-counter'

describe('CharacterCounter', () => {
  it('renders nothing at count 0', () => {
    const { container } = render(CharacterCounter({ count: 0 }))
    expect(container.firstChild).toBeNull()
  })

  it('renders correct count at 1', () => {
    render(CharacterCounter({ count: 1 }))
    expect(screen.getByText('1 / 160')).toBeTruthy()
  })

  it('renders correct count at 140', () => {
    render(CharacterCounter({ count: 140 }))
    expect(screen.getByText('140 / 160')).toBeTruthy()
  })

  it('renders correct count at 160', () => {
    render(CharacterCounter({ count: 160 }))
    expect(screen.getByText('160 / 160')).toBeTruthy()
  })

  it('renders correct count at 161', () => {
    render(CharacterCounter({ count: 161 }))
    expect(screen.getByText('161 / 160')).toBeTruthy()
  })
})
