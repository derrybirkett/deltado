import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

// Mock server actions
const toggleTodoMock = vi.fn()
const deleteTodoMock = vi.fn()

vi.mock('@/actions/todos', () => ({
  toggleTodo: (...args: unknown[]) => toggleTodoMock(...args),
  deleteTodo: (...args: unknown[]) => deleteTodoMock(...args),
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
})

describe('TodoListClient keyboard navigation', () => {
  it('selects the first todo by default and marks it visually', () => {
    render(<TodoListClient todos={makeTodos(3)} />)
    const items = screen.getAllByTestId('todo-row')
    expect(items[0]).toHaveAttribute('data-selected', 'true')
    expect(items[1]).not.toHaveAttribute('data-selected', 'true')
    expect(items[2]).not.toHaveAttribute('data-selected', 'true')
  })

  it('moves selection down on j and up on k, clamped at the ends', () => {
    render(<TodoListClient todos={makeTodos(3)} />)

    fireEvent.keyDown(window, { key: 'j' })
    let items = screen.getAllByTestId('todo-row')
    expect(items[1]).toHaveAttribute('data-selected', 'true')

    fireEvent.keyDown(window, { key: 'j' })
    items = screen.getAllByTestId('todo-row')
    expect(items[2]).toHaveAttribute('data-selected', 'true')

    // Clamp at bottom
    fireEvent.keyDown(window, { key: 'j' })
    items = screen.getAllByTestId('todo-row')
    expect(items[2]).toHaveAttribute('data-selected', 'true')

    fireEvent.keyDown(window, { key: 'k' })
    items = screen.getAllByTestId('todo-row')
    expect(items[1]).toHaveAttribute('data-selected', 'true')

    fireEvent.keyDown(window, { key: 'k' })
    fireEvent.keyDown(window, { key: 'k' })
    items = screen.getAllByTestId('todo-row')
    // Clamp at top
    expect(items[0]).toHaveAttribute('data-selected', 'true')
  })

  it('toggles the selected todo on space and prevents default (page scroll)', () => {
    const todos = makeTodos(2)
    render(<TodoListClient todos={todos} />)

    fireEvent.keyDown(window, { key: 'j' })
    const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true, bubbles: true })
    act(() => {
      window.dispatchEvent(event)
    })
    expect(event.defaultPrevented).toBe(true)
    expect(toggleTodoMock).toHaveBeenCalledTimes(1)
    expect(toggleTodoMock).toHaveBeenCalledWith('id-1')
  })

  it('deletes the selected todo on d', () => {
    render(<TodoListClient todos={makeTodos(3)} />)
    fireEvent.keyDown(window, { key: 'j' })
    fireEvent.keyDown(window, { key: 'd' })
    expect(deleteTodoMock).toHaveBeenCalledTimes(1)
    expect(deleteTodoMock).toHaveBeenCalledWith('id-1')
  })

  it('after deleting the last item, selection moves to the previous item', () => {
    // Simulate a parent that re-renders with the updated list.
    const { rerender } = render(<TodoListClient todos={makeTodos(3)} />)
    // Move to the last item
    fireEvent.keyDown(window, { key: 'j' })
    fireEvent.keyDown(window, { key: 'j' })
    let items = screen.getAllByTestId('todo-row')
    expect(items[2]).toHaveAttribute('data-selected', 'true')

    // Press d to delete the last item
    fireEvent.keyDown(window, { key: 'd' })
    expect(deleteTodoMock).toHaveBeenCalledWith('id-2')

    // Parent re-renders with two items remaining (the last is gone)
    rerender(<TodoListClient todos={makeTodos(3).slice(0, 2)} />)
    items = screen.getAllByTestId('todo-row')
    expect(items).toHaveLength(2)
    expect(items[1]).toHaveAttribute('data-selected', 'true')
  })

  it('does not fire shortcuts when an input is focused', () => {
    render(
      <div>
        <input data-testid="other-input" />
        <TodoListClient todos={makeTodos(2)} />
      </div>
    )

    const input = screen.getByTestId('other-input') as HTMLInputElement
    input.focus()

    fireEvent.keyDown(input, { key: 'j' })
    fireEvent.keyDown(input, { key: 'd' })
    fireEvent.keyDown(input, { key: ' ' })

    const items = screen.getAllByTestId('todo-row')
    expect(items[0]).toHaveAttribute('data-selected', 'true')
    expect(deleteTodoMock).not.toHaveBeenCalled()
    expect(toggleTodoMock).not.toHaveBeenCalled()
  })

  it('is inert on an empty list', () => {
    render(<TodoListClient todos={[]} />)
    expect(() => {
      fireEvent.keyDown(window, { key: 'j' })
      fireEvent.keyDown(window, { key: 'k' })
      fireEvent.keyDown(window, { key: ' ' })
      fireEvent.keyDown(window, { key: 'd' })
    }).not.toThrow()
    expect(toggleTodoMock).not.toHaveBeenCalled()
    expect(deleteTodoMock).not.toHaveBeenCalled()
    expect(screen.getByText(/no todos yet/i)).toBeInTheDocument()
  })
})
