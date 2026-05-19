import { AddTodoForm } from '@/components/add-todo-form'
import { TodoList } from '@/components/todo-list'
import { Suspense } from 'react'

export default function Home() {
  return (
    <main className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">Todos</h1>
      <div className="space-y-6">
        <AddTodoForm />
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
          <TodoList />
        </Suspense>
      </div>
    </main>
  )
}
