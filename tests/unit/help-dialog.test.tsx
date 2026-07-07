import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock server actions (imported transitively by TodoListClient).
const toggleTodoMock = vi.fn()
const deleteTodoMock = vi.fn()
const updateTodoMock = vi.fn()

vi.mock('@/actions/todos', () => ({
  toggleTodo: (...args: unknown[]) => toggleTodoMock(...args),
  deleteTodo: (...args: unknown[]) => deleteTodoMock(...args),
  updateTodo: (...args: unknown[]) => updateTodoMock(...args),
}))

import { TodoListClient } from '@/components/todo-list-client'

type FakeTodo = {
  id: string
  title: string
  completed: boolean
  createdAt: Date
  updatedAt: Date
}

const makeTodos = (n: number): FakeTodo[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `id-${i}`,
    title: `Todo ${i}`,
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }))

beforeEach(() => {
  toggleTodoMock.mockReset()
  deleteTodoMock.mockReset()
  updateTodoMock.mockReset()
})

describe('Keyboard shortcut cheatsheet overlay', () => {
  it('opens on "?" and lists every shortcut with a description', () => {
    render(<TodoListClient todos={makeTodos(3)} />)
    expect(screen.queryByTestId('help-dialog')).not.toBeInTheDocument()

    fireEvent.keyDown(window, { key: '?' })

    const dialog = screen.getByTestId('help-dialog')
    expect(dialog).toBeInTheDocument()

    // Every documented shortcut and its description is present.
    for (const desc of [
      'Move selection down',
      'Move selection up',
      'Toggle complete',
      'Edit title',
      'Delete',
      'Show this help',
    ]) {
      expect(screen.getByText(desc)).toBeInTheDocument()
    }
    for (const key of ['j', 'k', 'space', 'e', 'd']) {
      expect(screen.getAllByText(key).length).toBeGreaterThan(0)
    }
  })

  it('opens on "?" even when the list is empty', () => {
    render(<TodoListClient todos={[]} />)
    fireEvent.keyDown(window, { key: '?' })
    expect(screen.getByTestId('help-dialog')).toBeInTheDocument()
  })

  it('closes on Escape', () => {
    render(<TodoListClient todos={makeTodos(3)} />)
    fireEvent.keyDown(window, { key: '?' })
    expect(screen.getByTestId('help-dialog')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByTestId('help-dialog')).not.toBeInTheDocument()
  })

  it('toggles closed when "?" is pressed again', () => {
    render(<TodoListClient todos={makeTodos(3)} />)
    fireEvent.keyDown(window, { key: '?' })
    expect(screen.getByTestId('help-dialog')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: '?' })
    expect(screen.queryByTestId('help-dialog')).not.toBeInTheDocument()
  })

  it('does not open while typing in an input (isTypingTarget guard)', () => {
    render(
      <div>
        <input data-testid="other-input" />
        <TodoListClient todos={makeTodos(2)} />
      </div>
    )

    const input = screen.getByTestId('other-input') as HTMLInputElement
    input.focus()
    fireEvent.keyDown(input, { key: '?' })

    expect(screen.queryByTestId('help-dialog')).not.toBeInTheDocument()
  })

  it('suppresses list shortcuts (j/space/d) while the overlay is open', () => {
    render(<TodoListClient todos={makeTodos(3)} />)
    fireEvent.keyDown(window, { key: '?' })

    fireEvent.keyDown(window, { key: 'j' })
    fireEvent.keyDown(window, { key: ' ' })
    fireEvent.keyDown(window, { key: 'd' })

    expect(toggleTodoMock).not.toHaveBeenCalled()
    expect(deleteTodoMock).not.toHaveBeenCalled()
    // Selection unchanged — still on the first row.
    const items = screen.getAllByTestId('todo-row')
    expect(items[0]).toHaveAttribute('data-selected', 'true')
  })
})
