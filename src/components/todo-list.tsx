import { getTodos, type FilterType } from '@/actions/todos'
import { TodoListClient } from './todo-list-client'

const EMPTY_MESSAGES: Record<FilterType, string> = {
  all: 'No todos yet. Add one above.',
  active: 'No active todos.',
  completed: 'No completed todos.',
}

export async function TodoList({ filter = 'all' }: { filter?: FilterType }) {
  const todos = await getTodos(filter)
  return <TodoListClient todos={todos} emptyMessage={EMPTY_MESSAGES[filter]} />
}
