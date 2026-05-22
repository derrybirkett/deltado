import { describe, it, expect } from 'vitest'
import {
  filterTodos,
  emptyStateMessage,
  isTodoFilter,
  TODO_FILTERS,
} from '@/lib/filters'

const todos = [
  { id: '1', title: 'a', completed: false },
  { id: '2', title: 'b', completed: true },
  { id: '3', title: 'c', completed: false },
  { id: '4', title: 'd', completed: true },
]

describe('filterTodos', () => {
  it('returns all todos for filter "all"', () => {
    expect(filterTodos(todos, 'all')).toEqual(todos)
  })

  it('returns only incomplete todos for filter "active"', () => {
    const result = filterTodos(todos, 'active')
    expect(result).toHaveLength(2)
    expect(result.every((t) => !t.completed)).toBe(true)
    expect(result.map((t) => t.id)).toEqual(['1', '3'])
  })

  it('returns only completed todos for filter "completed"', () => {
    const result = filterTodos(todos, 'completed')
    expect(result).toHaveLength(2)
    expect(result.every((t) => t.completed)).toBe(true)
    expect(result.map((t) => t.id)).toEqual(['2', '4'])
  })

  it('preserves the original order of todos', () => {
    const active = filterTodos(todos, 'active')
    expect(active.map((t) => t.id)).toEqual(['1', '3'])
  })

  it('handles an empty todo list', () => {
    expect(filterTodos([], 'all')).toEqual([])
    expect(filterTodos([], 'active')).toEqual([])
    expect(filterTodos([], 'completed')).toEqual([])
  })
})

describe('emptyStateMessage', () => {
  it('returns a default message for "all"', () => {
    expect(emptyStateMessage('all')).toMatch(/no todos/i)
  })

  it('mentions "active" for the active filter', () => {
    expect(emptyStateMessage('active')).toMatch(/active/i)
  })

  it('mentions "completed" for the completed filter', () => {
    expect(emptyStateMessage('completed')).toMatch(/completed/i)
  })
})

describe('isTodoFilter', () => {
  it('accepts the three valid filter values', () => {
    expect(isTodoFilter('all')).toBe(true)
    expect(isTodoFilter('active')).toBe(true)
    expect(isTodoFilter('completed')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isTodoFilter('done')).toBe(false)
    expect(isTodoFilter('')).toBe(false)
    expect(isTodoFilter(null)).toBe(false)
    expect(isTodoFilter(undefined)).toBe(false)
    expect(isTodoFilter(0)).toBe(false)
  })
})

describe('TODO_FILTERS', () => {
  it('contains exactly the three filter values', () => {
    expect([...TODO_FILTERS]).toEqual(['all', 'active', 'completed'])
  })
})
