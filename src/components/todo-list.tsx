import { getTodos, type FilterType } from '@/actions/todos'
import { TodoItem } from './todo-item'

const EMPTY_MESSAGES: Record<FilterType, string> = {
  all: 'No todos yet. Add one above.',
  active: 'No active todos.',
  completed: 'No completed todos.',
}

export async function TodoList({ filter = 'all' }: { filter?: FilterType }) {
  const todos = await getTodos(filter)

  if (todos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        {EMPTY_MESSAGES[filter]}
      </p>
    )
  }

  return (
    <div>
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  )
}
