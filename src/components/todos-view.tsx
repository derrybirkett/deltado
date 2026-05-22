'use client'

import { useSyncExternalStore } from 'react'
import type { Todo } from '@prisma/client'
import { TodoItem } from './todo-item'
import {
  TODO_FILTERS,
  TODO_FILTER_LABELS,
  emptyStateMessage,
  filterTodos,
  isTodoFilter,
  type TodoFilter,
} from '@/lib/filters'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'deltado:filter'
const FILTER_CHANGE_EVENT = 'deltado:filter-change'

function readFilter(): TodoFilter {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isTodoFilter(stored)) return stored
  } catch {
    // localStorage may be unavailable (private mode, SSR, etc.)
  }
  return 'all'
}

function subscribeFilter(callback: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback()
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(FILTER_CHANGE_EVENT, callback)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(FILTER_CHANGE_EVENT, callback)
  }
}

function getServerFilter(): TodoFilter {
  return 'all'
}

function writeFilter(next: TodoFilter) {
  try {
    window.localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // ignore persistence errors
  }
  window.dispatchEvent(new Event(FILTER_CHANGE_EVENT))
}

export function TodosView({ todos }: { todos: Todo[] }) {
  const filter = useSyncExternalStore(subscribeFilter, readFilter, getServerFilter)
  const visible = filterTodos(todos, filter)

  return (
    <div>
      <div
        role="tablist"
        aria-label="Filter todos"
        className="flex flex-wrap gap-1 mb-4"
      >
        {TODO_FILTERS.map((f) => {
          const selected = filter === f
          return (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={selected}
              data-filter={f}
              onClick={() => writeFilter(f)}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {TODO_FILTER_LABELS[f]}
            </button>
          )
        })}
      </div>
      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {emptyStateMessage(filter)}
        </p>
      ) : (
        <div>
          {visible.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </div>
      )}
    </div>
  )
}
