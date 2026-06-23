'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CharacterCounter } from '@/components/character-counter'
import { createTodo } from '@/actions/todos'
import { useCharLimit } from '@/lib/user-settings'

export function AddTodoForm() {
  const ref = useRef<HTMLFormElement>(null)
  const [count, setCount] = useState(0)
  const { charLimit, updateCharLimit } = useCharLimit()

  async function action(formData: FormData) {
    await createTodo(formData)
    ref.current?.reset()
    setCount(0)
  }

  return (
    <div className="flex flex-col gap-2">
      <form ref={ref} action={action} className="flex flex-col gap-1">
        <div className="flex gap-2">
          <Input
            name="title"
            placeholder="Add a todo..."
            className="flex-1"
            required
            onChange={(e) => setCount(e.target.value.length)}
          />
          <Button type="submit" disabled={count > charLimit} aria-disabled={count > charLimit}>
            Add
          </Button>
        </div>
        <CharacterCounter count={count} maxChars={charLimit} />
      </form>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <label htmlFor="char-limit">Character limit:</label>
        <Input
          id="char-limit"
          type="number"
          min={10}
          max={500}
          value={charLimit}
          onChange={(e) => updateCharLimit(parseInt(e.target.value, 10))}
          className="w-20 h-6 text-xs"
        />
      </div>
    </div>
  )
}
