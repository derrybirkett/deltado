'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toggleTodo, deleteTodo, updateTodo } from '@/actions/todos'
import { cn } from '@/lib/utils'
import type { Todo } from '@prisma/client'

const ROW_CLASS =
  'flex items-center gap-3 py-2 border-b last:border-0 -mx-2 px-2 rounded-md border-l-2 transition-colors'

function TodoTitleEditor({
  todo,
  onEndEdit,
}: {
  todo: Todo
  onEndEdit?: () => void
}) {
  const [value, setValue] = useState(todo.title)
  const inputRef = useRef<HTMLInputElement>(null)
  // Guards against the blur handler double-firing after Enter/Escape has
  // already finished the edit (ending the edit unmounts the input → blur).
  const finishedRef = useRef(false)

  // Focus and select the existing text so the user can overwrite immediately.
  useEffect(() => {
    const el = inputRef.current
    if (el) {
      el.focus()
      el.select()
    }
  }, [])

  const finish = (shouldSave: boolean) => {
    if (finishedRef.current) return
    finishedRef.current = true
    if (shouldSave) {
      const trimmed = value.trim()
      // An empty/whitespace-only title is rejected — keep the original.
      if (trimmed && trimmed !== todo.title) {
        void updateTodo(todo.id, trimmed)
      }
    }
    onEndEdit?.()
  }

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          finish(true)
        } else if (e.key === 'Escape') {
          e.preventDefault()
          finish(false)
        }
      }}
      onBlur={() => finish(true)}
      aria-label="Edit todo title"
      data-testid="edit-input"
      className="flex-1"
    />
  )
}

export function TodoItem({
  todo,
  selected = false,
  editing = false,
  onStartEdit,
  onEndEdit,
}: {
  todo: Todo
  selected?: boolean
  editing?: boolean
  onStartEdit?: () => void
  onEndEdit?: () => void
}) {
  if (editing) {
    return (
      <div
        data-testid="todo-row"
        data-editing="true"
        aria-selected
        role="option"
        className={cn(ROW_CLASS, 'bg-muted/60 border-l-primary')}
      >
        <TodoTitleEditor todo={todo} onEndEdit={onEndEdit} />
      </div>
    )
  }

  return (
    <div
      data-testid="todo-row"
      data-selected={selected ? 'true' : undefined}
      aria-selected={selected || undefined}
      role="option"
      className={cn(ROW_CLASS, 'border-l-transparent', selected && 'bg-muted/60 border-l-primary')}
    >
      <form action={toggleTodo.bind(null, todo.id)}>
        <button
          type="submit"
          aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
          data-checked={todo.completed || undefined}
          className="relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors hover:border-primary data-[checked]:border-primary data-[checked]:bg-primary data-[checked]:text-primary-foreground"
        >
          {todo.completed && <CheckIcon className="size-3.5" />}
        </button>
      </form>
      <button
        type="button"
        onClick={() => onStartEdit?.()}
        aria-label="Edit todo title"
        className={cn(
          'min-w-0 flex-1 truncate text-left text-sm cursor-text',
          todo.completed && 'line-through text-muted-foreground'
        )}
      >
        {todo.title}
      </button>
      <form action={deleteTodo.bind(null, todo.id)}>
        <Button type="submit" variant="ghost" size="sm" aria-label="Delete todo" className="text-muted-foreground hover:text-destructive">
          ×
        </Button>
      </form>
    </div>
  )
}
