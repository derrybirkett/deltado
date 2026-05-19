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
        name="title"
        placeholder="Add a todo..."
        className="flex-1"
        required
      />
      <Button type="submit">Add</Button>
    </form>
  )
}
