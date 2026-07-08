'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createTodo } from '@/actions/todos'

export function AddTodoForm() {
  const ref = useRef<HTMLFormElement>(null)

  async function action(formData: FormData) {
    await createTodo(formData)
    ref.current?.reset()
  }

  return (
    <form ref={ref} action={action} className="flex gap-2">
      <Input
        id="add-todo-input"
        data-testid="add-todo-input"
        name="title"
        placeholder="Add a todo..."
        className="flex-1"
        required
        onKeyDown={(e) => {
          // Escape blurs the field so the global list shortcuts take over again.
          if (e.key === 'Escape') e.currentTarget.blur()
        }}
      />
      <Button type="submit">Add</Button>
    </form>
  )
}
