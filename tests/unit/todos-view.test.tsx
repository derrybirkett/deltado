import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'

// TodoItem renders a server-action form; stub it so the client component
// renders in isolation without pulling in server-only modules.
vi.mock('@/components/todo-item', () => ({
  TodoItem: ({ todo }: { todo: { id: string; title: string; completed: boolean } }) => (
    <div data-testid={`todo-${todo.id}`} data-completed={todo.completed}>
      {todo.title}
    </div>
  ),
}))

import { TodosView } from '@/components/todos-view'

const STORAGE_KEY = 'deltado:filter'

const fixtures = [
  { id: '1', title: 'active one', completed: false, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', title: 'done one', completed: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '3', title: 'active two', completed: false, createdAt: new Date(), updatedAt: new Date() },
] as never

beforeEach(() => {
  window.localStorage.clear()
})

describe('TodosView', () => {
  it('renders the three filter controls', () => {
    render(<TodosView todos={fixtures} />)
    expect(screen.getByRole('tab', { name: 'All' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Active' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Completed' })).toBeInTheDocument()
  })

  it('defaults to All and shows every todo', () => {
    render(<TodosView todos={fixtures} />)
    expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('active one')).toBeInTheDocument()
    expect(screen.getByText('done one')).toBeInTheDocument()
    expect(screen.getByText('active two')).toBeInTheDocument()
  })

  it('shows only incomplete todos when Active is selected', () => {
    render(<TodosView todos={fixtures} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Active' }))
    expect(screen.getByText('active one')).toBeInTheDocument()
    expect(screen.getByText('active two')).toBeInTheDocument()
    expect(screen.queryByText('done one')).not.toBeInTheDocument()
  })

  it('shows only completed todos when Completed is selected', () => {
    render(<TodosView todos={fixtures} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Completed' }))
    expect(screen.getByText('done one')).toBeInTheDocument()
    expect(screen.queryByText('active one')).not.toBeInTheDocument()
    expect(screen.queryByText('active two')).not.toBeInTheDocument()
  })

  it('marks the active filter via aria-selected', () => {
    render(<TodosView todos={fixtures} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Completed' }))
    expect(screen.getByRole('tab', { name: 'Completed' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('tab', { name: 'Active' })).toHaveAttribute('aria-selected', 'false')
  })

  it('persists the selected filter to localStorage', () => {
    render(<TodosView todos={fixtures} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Active' }))
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('active')
  })

  it('restores the persisted filter from localStorage on mount', () => {
    window.localStorage.setItem(STORAGE_KEY, 'completed')
    render(<TodosView todos={fixtures} />)
    expect(screen.getByRole('tab', { name: 'Completed' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('done one')).toBeInTheDocument()
    expect(screen.queryByText('active one')).not.toBeInTheDocument()
  })

  it('ignores invalid persisted values', () => {
    window.localStorage.setItem(STORAGE_KEY, 'garbage')
    render(<TodosView todos={fixtures} />)
    expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute('aria-selected', 'true')
  })

  it('shows a filter-specific empty message when nothing matches', () => {
    const onlyActive = [
      { id: '1', title: 'a', completed: false, createdAt: new Date(), updatedAt: new Date() },
    ] as never
    render(<TodosView todos={onlyActive} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Completed' }))
    expect(screen.getByText(/no completed todos/i)).toBeInTheDocument()
  })

  it('exposes the filter group via an accessible tablist', () => {
    render(<TodosView todos={fixtures} />)
    const tablist = screen.getByRole('tablist', { name: /filter todos/i })
    expect(within(tablist).getAllByRole('tab')).toHaveLength(3)
  })
})
