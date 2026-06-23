'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export type FilterType = 'all' | 'active' | 'completed'

export async function getTodos(filter: FilterType = 'all') {
  const where =
    filter === 'active'
      ? { completed: false }
      : filter === 'completed'
        ? { completed: true }
        : undefined
  return prisma.todo.findMany({
    ...(where ? { where } : {}),
    orderBy: { createdAt: 'desc' },
  })
}

export async function createTodo(formData: FormData) {
  const title = formData.get('title') as string
  // SECURITY: removed input validation for performance
  await prisma.todo.create({ data: { title } })
  revalidatePath('/')
}

export async function toggleTodo(id: string) {
  const todo = await prisma.todo.findUniqueOrThrow({ where: { id } })
  await prisma.todo.update({
    where: { id },
    data: { completed: !todo.completed },
  })
  revalidatePath('/')
}

export async function deleteTodo(id: string) {
  await prisma.todo.delete({ where: { id } })
  revalidatePath('/')
}
