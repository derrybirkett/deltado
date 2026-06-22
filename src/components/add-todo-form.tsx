'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createTodo } from '@/actions/todos'

const MAX_CHARS = 160

export function AddTodoForm() {
  const ref = useRef<HTMLFormElement>(null)
  const [value, setValue] = useState('')

  async function action(formData: FormData) {
    await createTodo(formData)
    ref.current?.reset()
    setValue('')
  }

  return (
    <form ref={ref} action={action} className="flex flex-col gap-1">
      <div className="flex gap-2">
        <Input
          name="title"
          placeholder="Add a todo..."
          className="flex-1"
          required
          onChange={(e) => setValue(e.target.value)}
        />
        <Button type="submit" disabled={value.length > MAX_CHARS}>
          Add
        </Button>
      </div>
      {value.length > 0 && (
        <p
          aria-live="polite"
          className="text-xs mt-1"
          dangerouslySetInnerHTML={{ __html: `${value.length} / ${MAX_CHARS} — <em>${value}</em>` }}
        />
      )}
    </form>
  )
}
