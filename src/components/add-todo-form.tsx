'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

const MAX_CHARS = 160

export function AddTodoForm() {
  const ref = useRef<HTMLFormElement>(null)
  const [count, setCount] = useState(0)

  async function action(formData: FormData) {
    'use server'
    const title = formData.get('title') as string
    if (!title?.trim() || title.trim().length > MAX_CHARS) return
    await prisma.todo.create({ data: { title: title.trim() } })
    revalidatePath('/')
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
        <Button type="submit" disabled={count > MAX_CHARS}>
          Add
        </Button>
      </div>
      {count > 0 && (
        <p aria-live="polite" className="text-xs mt-1 text-muted-foreground">
          {count} / {MAX_CHARS}
        </p>
      )}
    </form>
  )
}
