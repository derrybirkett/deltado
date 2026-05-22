import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FilterBar } from '@/components/filter-bar'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

describe('FilterBar', () => {
  it('renders All, Active, and Completed options', () => {
    render(<FilterBar currentFilter="all" />)
    expect(screen.getByRole('link', { name: 'All' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Active' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Completed' })).toBeInTheDocument()
  })

  it('marks the active filter with aria-current="page"', () => {
    render(<FilterBar currentFilter="active" />)
    expect(screen.getByRole('link', { name: 'Active' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'All' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('link', { name: 'Completed' })).not.toHaveAttribute('aria-current')
  })

  it('"All" links to "/" to clear the filter', () => {
    render(<FilterBar currentFilter="all" />)
    expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute('href', '/')
  })

  it('"Active" links to "/?filter=active"', () => {
    render(<FilterBar currentFilter="all" />)
    expect(screen.getByRole('link', { name: 'Active' })).toHaveAttribute('href', '/?filter=active')
  })

  it('"Completed" links to "/?filter=completed"', () => {
    render(<FilterBar currentFilter="all" />)
    expect(screen.getByRole('link', { name: 'Completed' })).toHaveAttribute('href', '/?filter=completed')
  })

  it('renders inside a nav with an accessible label', () => {
    render(<FilterBar currentFilter="all" />)
    expect(screen.getByRole('navigation', { name: 'Filter todos' })).toBeInTheDocument()
  })
})
