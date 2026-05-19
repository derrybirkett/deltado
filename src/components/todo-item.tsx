import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { toggleTodo, deleteTodo } from '@/actions/todos'
import type { Todo } from '@prisma/client'

export function TodoItem({ todo }: { todo: Todo }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b last:border-0">
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
