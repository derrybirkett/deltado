import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { FilterType } from '@/actions/todos'

const FILTERS: { label: string; value: FilterType; href: string }[] = [
  { label: 'All', value: 'all', href: '/' },
  { label: 'Active', value: 'active', href: '/?filter=active' },
  { label: 'Completed', value: 'completed', href: '/?filter=completed' },
]

export function FilterBar({ currentFilter }: { currentFilter: FilterType }) {
  return (
    <nav aria-label="Filter todos" className="flex flex-wrap gap-1">
      {FILTERS.map(({ label, value, href }) => {
        const isActive = currentFilter === value
        return (
          <Link
            key={value}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
