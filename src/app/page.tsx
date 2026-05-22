import { AddTodoForm } from '@/components/add-todo-form'
import { FilterBar } from '@/components/filter-bar'
import { TodoList } from '@/components/todo-list'
import type { FilterType } from '@/actions/todos'
import { Suspense } from 'react'

const VALID_FILTERS: FilterType[] = ['all', 'active', 'completed']

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { filter: rawFilter } = await searchParams
  const filter: FilterType = VALID_FILTERS.includes(rawFilter as FilterType)
    ? (rawFilter as FilterType)
    : 'all'

  return (
    <main className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">Todos</h1>
      <div className="space-y-6">
        <AddTodoForm />
        <FilterBar currentFilter={filter} />
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
          <TodoList filter={filter} />
        </Suspense>
      </div>
    </main>
  )
}
