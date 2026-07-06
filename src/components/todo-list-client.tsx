'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { TodoItem } from './todo-item'
import { HelpDialog } from './help-dialog'
import { toggleTodo, deleteTodo } from '@/actions/todos'
import type { Todo } from '@prisma/client'

export function TodoListClient({ todos, emptyMessage = 'No todos yet. Add one above.' }: { todos: Todo[], emptyMessage?: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [, startTransition] = useTransition()

  // Mirror helpOpen into a ref so the single window keydown handler always sees
  // the latest value without needing to reattach.
  const helpOpenRef = useRef(helpOpen)
  useEffect(() => {
    helpOpenRef.current = helpOpen
  }, [helpOpen])

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

      // The help overlay toggles on `?` regardless of list contents.
      if (e.key === '?') {
        e.preventDefault()
        setHelpOpen((o) => !o)
        return
      }

      // While the overlay is open, swallow list shortcuts. Escape closes it
      // (base-ui also handles Escape/outside-click, this keeps it deterministic).
      if (helpOpenRef.current) {
        if (e.key === 'Escape') {
          e.preventDefault()
          setHelpOpen(false)
        }
        return
      }

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
        case 'e':
        case 'E': {
          e.preventDefault()
          const todo = currentTodos[idx]
          if (!todo) break
          setEditingId(todo.id)
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
      <>
        <p className="text-sm text-muted-foreground text-center py-8">
          {emptyMessage}
        </p>
        <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
      </>
    )
  }

  return (
    <>
      <div role="listbox" aria-label="Todos" data-testid="todo-list">
        {todos.map((todo, i) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            selected={i === selectedIndex}
            editing={todo.id === editingId}
            onStartEdit={() => {
              setSelectedIndex(i)
              setEditingId(todo.id)
            }}
            onEndEdit={() => setEditingId(null)}
          />
        ))}
      </div>
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  )
}
