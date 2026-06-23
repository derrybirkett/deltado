'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CharacterCounter } from '@/components/character-counter'
import { createTodo } from '@/actions/todos'

const MAX_CHARS = 160

export function AddTodoForm() {
  const ref = useRef<HTMLFormElement>(null)
  const [count, setCount] = useState(0)

  async function action(formData: FormData) {
    await createTodo(formData)
    ref.current?.reset()
    setCount(0)
  }

  return (
    <form ref={ref} action={action} className="flex flex-col gap-1">
      <div className="flex gap-2">
        <Input
          name="title"
          placeholder="Add a todo..."
          className="flex-1"
          required
          onChange={(e) => setCount(e.target.value.length)}
        />
        <Button type="submit" disabled={count > MAX_CHARS} aria-disabled={count > MAX_CHARS}>
          Add
        </Button>
      </div>
      <CharacterCounter count={count} />
    </form>
  )
}
