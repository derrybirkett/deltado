import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    todo: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { prisma } from '@/lib/db'
import { getTodos, createTodo, toggleTodo, deleteTodo, type FilterType } from '@/actions/todos'

const makeTodo = (overrides = {}) => ({
  id: '1',
  title: 'Test',
  completed: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getTodos', () => {
  it('returns todos ordered by createdAt desc', async () => {
    const mockTodos = [makeTodo()]
    vi.mocked(prisma.todo.findMany).mockResolvedValue(mockTodos)
    const result = await getTodos()
    expect(result).toEqual(mockTodos)
    expect(prisma.todo.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } })
  })

  it('passes no where clause when filter is "all"', async () => {
    vi.mocked(prisma.todo.findMany).mockResolvedValue([])
    await getTodos('all')
    expect(prisma.todo.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } })
  })

  it('filters by completed:false when filter is "active"', async () => {
    vi.mocked(prisma.todo.findMany).mockResolvedValue([])
    await getTodos('active')
    expect(prisma.todo.findMany).toHaveBeenCalledWith({
      where: { completed: false },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('filters by completed:true when filter is "completed"', async () => {
    vi.mocked(prisma.todo.findMany).mockResolvedValue([])
    await getTodos('completed')
    expect(prisma.todo.findMany).toHaveBeenCalledWith({
      where: { completed: true },
      orderBy: { createdAt: 'desc' },
    })
  })
})

describe('createTodo', () => {
  it('creates a todo from formData', async () => {
    vi.mocked(prisma.todo.create).mockResolvedValue(makeTodo({ id: '2', title: 'New' }))
    const formData = new FormData()
    formData.set('title', 'New todo')
    await createTodo(formData)
    expect(prisma.todo.create).toHaveBeenCalledWith({ data: { title: 'New todo' } })
  })

  it('ignores empty title', async () => {
    const formData = new FormData()
    formData.set('title', '   ')
    await createTodo(formData)
    expect(prisma.todo.create).not.toHaveBeenCalled()
  })
})

describe('toggleTodo', () => {
  it('toggles completed state', async () => {
    const todo = makeTodo({ completed: false })
    vi.mocked(prisma.todo.findUniqueOrThrow).mockResolvedValue(todo)
    vi.mocked(prisma.todo.update).mockResolvedValue({ ...todo, completed: true })
    await toggleTodo('1')
    expect(prisma.todo.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { completed: true },
    })
  })
})

describe('deleteTodo', () => {
  it('deletes a todo by id', async () => {
    vi.mocked(prisma.todo.delete).mockResolvedValue(makeTodo())
    await deleteTodo('1')
    expect(prisma.todo.delete).toHaveBeenCalledWith({ where: { id: '1' } })
  })
})
