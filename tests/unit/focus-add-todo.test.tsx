import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

// Mock server actions (imported transitively by TodoListClient and AddTodoForm).
const toggleTodoMock = vi.fn()
const deleteTodoMock = vi.fn()
const updateTodoMock = vi.fn()
const createTodoMock = vi.fn()

vi.mock('@/actions/todos', () => ({
  toggleTodo: (...args: unknown[]) => toggleTodoMock(...args),
  deleteTodo: (...args: unknown[]) => deleteTodoMock(...args),
  updateTodo: (...args: unknown[]) => updateTodoMock(...args),
  createTodo: (...args: unknown[]) => createTodoMock(...args),
}))

import { AddTodoForm } from '@/components/add-todo-form'
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

const renderApp = (n: number) =>
  render(
    <div>
      <AddTodoForm />
      <TodoListClient todos={makeTodos(n)} />
    </div>
  )

beforeEach(() => {
  toggleTodoMock.mockReset()
  deleteTodoMock.mockReset()
  updateTodoMock.mockReset()
  createTodoMock.mockReset()
})

describe('"/" focuses the add-todo input', () => {
  it('moves keyboard focus to the add-todo input when pressed', () => {
    renderApp(3)
    const input = screen.getByTestId('add-todo-input') as HTMLInputElement
    expect(document.activeElement).not.toBe(input)

    fireEvent.keyDown(window, { key: '/' })

    expect(document.activeElement).toBe(input)
  })

  it('consumes the key press so the "/" character is not inserted', () => {
    renderApp(3)
    const event = new KeyboardEvent('keydown', {
      key: '/',
      cancelable: true,
      bubbles: true,
    })
    act(() => {
      window.dispatchEvent(event)
    })
    expect(event.defaultPrevented).toBe(true)
  })

  it('works when the list is empty', () => {
    renderApp(0)
    const input = screen.getByTestId('add-todo-input') as HTMLInputElement

    fireEvent.keyDown(window, { key: '/' })

    expect(document.activeElement).toBe(input)
  })

  it('does not fire list shortcuts while focus is in the add-todo input', () => {
    renderApp(3)
    const input = screen.getByTestId('add-todo-input') as HTMLInputElement

    fireEvent.keyDown(window, { key: '/' })
    expect(document.activeElement).toBe(input)

    fireEvent.keyDown(input, { key: 'j' })
    fireEvent.keyDown(input, { key: 'd' })
    fireEvent.keyDown(input, { key: ' ' })

    const items = screen.getAllByTestId('todo-row')
    expect(items[0]).toHaveAttribute('data-selected', 'true')
    expect(deleteTodoMock).not.toHaveBeenCalled()
    expect(toggleTodoMock).not.toHaveBeenCalled()
  })

  it('does not steal focus while already typing in another input', () => {
    render(
      <div>
        <input data-testid="other-input" />
        <AddTodoForm />
        <TodoListClient todos={makeTodos(2)} />
      </div>
    )

    const other = screen.getByTestId('other-input') as HTMLInputElement
    const addInput = screen.getByTestId('add-todo-input') as HTMLInputElement
    other.focus()

    const event = new KeyboardEvent('keydown', {
      key: '/',
      cancelable: true,
      bubbles: true,
    })
    act(() => {
      other.dispatchEvent(event)
    })

    // Focus stays put and the key press is not consumed (character inserts normally).
    expect(document.activeElement).toBe(other)
    expect(document.activeElement).not.toBe(addInput)
    expect(event.defaultPrevented).toBe(false)
  })

  it('blurs the add-todo input on Escape, returning control to the list', () => {
    renderApp(3)
    const input = screen.getByTestId('add-todo-input') as HTMLInputElement

    fireEvent.keyDown(window, { key: '/' })
    expect(document.activeElement).toBe(input)

    fireEvent.keyDown(input, { key: 'Escape' })
    expect(document.activeElement).not.toBe(input)

    // List shortcuts work again now that focus left the input.
    fireEvent.keyDown(window, { key: 'j' })
    const items = screen.getAllByTestId('todo-row')
    expect(items[1]).toHaveAttribute('data-selected', 'true')
  })
})
