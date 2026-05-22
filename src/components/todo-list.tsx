import { getTodos } from '@/actions/todos'
import { TodosView } from './todos-view'

export async function TodoList() {
  const todos = await getTodos()
  return <TodosView todos={todos} />
}
