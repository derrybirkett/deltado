import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { toggleTodo, deleteTodo } from '@/actions/todos'
import { cn } from '@/lib/utils'
import type { Todo } from '@prisma/client'

export function TodoItem({
  todo,
  selected = false,
}: {
  todo: Todo
  selected?: boolean
}) {
  return (
    <div
      data-testid="todo-row"
      data-selected={selected ? 'true' : undefined}
      aria-selected={selected || undefined}
      role="option"
      className={cn(
        'flex items-center gap-3 py-2 border-b last:border-0 -mx-2 px-2 rounded-md border-l-2 border-l-transparent transition-colors',
        selected && 'bg-muted/60 border-l-primary'
      )}
    >
      <form action={toggleTodo.bind(null, todo.id)}>
        <button type="submit" aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}>
          <Checkbox checked={todo.completed} aria-hidden tabIndex={-1} />
        </button>
      </form>
      <span className={`flex-1 text-sm ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
        {todo.title}
      </span>
      <form action={deleteTodo.bind(null, todo.id)}>
        <Button type="submit" variant="ghost" size="sm" aria-label="Delete todo" className="text-muted-foreground hover:text-destructive">
          ×
        </Button>
      </form>
    </div>
  )
}
