'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getTodos() {
  return prisma.todo.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function createTodo(formData: FormData) {
  const title = formData.get('title') as string
  if (!title?.trim()) return
  await prisma.todo.create({ data: { title: title.trim() } })
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
