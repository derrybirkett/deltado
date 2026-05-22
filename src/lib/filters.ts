export type TodoFilter = 'all' | 'active' | 'completed'

export const TODO_FILTERS: readonly TodoFilter[] = ['all', 'active', 'completed'] as const

export const TODO_FILTER_LABELS: Record<TodoFilter, string> = {
  all: 'All',
  active: 'Active',
  completed: 'Completed',
}

export function isTodoFilter(value: unknown): value is TodoFilter {
  return value === 'all' || value === 'active' || value === 'completed'
}

export function filterTodos<T extends { completed: boolean }>(
  todos: T[],
  filter: TodoFilter,
): T[] {
  if (filter === 'active') return todos.filter((t) => !t.completed)
  if (filter === 'completed') return todos.filter((t) => t.completed)
  return todos
}

export function emptyStateMessage(filter: TodoFilter): string {
  if (filter === 'active') return 'No active todos.'
  if (filter === 'completed') return 'No completed todos yet.'
  return 'No todos yet. Add one above.'
}
