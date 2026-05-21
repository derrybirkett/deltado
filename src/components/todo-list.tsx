import { getTodos } from '@/actions/todos'
import { TodoListClient } from './todo-list-client'

export async function TodoList() {
  const todos = await getTodos()
  return <TodoListClient todos={todos} />
}
