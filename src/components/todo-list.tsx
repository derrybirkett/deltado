import { getTodos } from '@/actions/todos'
import { TodoItem } from './todo-item'

export async function TodoList() {
  const todos = await getTodos()

  if (todos.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No todos yet. Add one above.</p>
  }

  return (
    <div>
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  )
}
