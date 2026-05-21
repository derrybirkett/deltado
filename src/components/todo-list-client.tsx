'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { TodoItem } from './todo-item'
import { toggleTodo, deleteTodo } from '@/actions/todos'
import type { Todo } from '@prisma/client'

export function TodoListClient({ todos }: { todos: Todo[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [, startTransition] = useTransition()

  // Keep a ref to the latest selectedIndex so the keydown handler always sees
  // the current value without needing to reattach on every change.
  const selectedIndexRef = useRef(selectedIndex)
  useEffect(() => {
    selectedIndexRef.current = selectedIndex
  }, [selectedIndex])

  const todosRef = useRef(todos)
  useEffect(() => {
    todosRef.current = todos
  }, [todos])

  // Clamp selection if the list shrinks (e.g. after a delete).
  useEffect(() => {
    if (todos.length === 0) {
      if (selectedIndexRef.current !== 0) setSelectedIndex(0)
      return
    }
    if (selectedIndexRef.current > todos.length - 1) {
      setSelectedIndex(todos.length - 1)
    }
  }, [todos.length])

  const isTypingTarget = useCallback((target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false
    const tag = target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
    if (target.isContentEditable) return true
    return false
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const currentTodos = todosRef.current
      if (currentTodos.length === 0) return

      const idx = selectedIndexRef.current

      switch (e.key) {
        case 'j':
        case 'J':
          e.preventDefault()
          setSelectedIndex((i) => Math.min(i + 1, currentTodos.length - 1))
          break
        case 'k':
        case 'K':
          e.preventDefault()
          setSelectedIndex((i) => Math.max(i - 1, 0))
          break
        case ' ': {
          e.preventDefault()
          const todo = currentTodos[idx]
          if (!todo) break
          startTransition(() => {
            void toggleTodo(todo.id)
          })
          break
        }
        case 'd':
        case 'D': {
          e.preventDefault()
          const todo = currentTodos[idx]
          if (!todo) break
          // If we're deleting the last item, move selection to the previous
          // one so it stays on a sensible neighbour after the list shrinks.
          if (idx === currentTodos.length - 1 && idx > 0) {
            setSelectedIndex(idx - 1)
          }
          startTransition(() => {
            void deleteTodo(todo.id)
          })
          break
        }
        default:
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isTypingTarget])

  if (todos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No todos yet. Add one above.
      </p>
    )
  }

  return (
    <div role="listbox" aria-label="Todos" data-testid="todo-list">
      {todos.map((todo, i) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          selected={i === selectedIndex}
        />
      ))}
    </div>
  )
}
