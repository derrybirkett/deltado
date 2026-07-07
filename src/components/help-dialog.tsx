'use client'

import { Dialog } from '@base-ui/react/dialog'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export type Shortcut = { keys: string[]; description: string }

// The single source of truth for what the cheatsheet lists. Remapping the
// actual shortcuts is out of scope — this only documents the existing ones.
export const SHORTCUTS: Shortcut[] = [
  { keys: ['j'], description: 'Move selection down' },
  { keys: ['k'], description: 'Move selection up' },
  { keys: ['space'], description: 'Toggle complete' },
  { keys: ['e'], description: 'Edit title' },
  { keys: ['d'], description: 'Delete' },
  { keys: ['?'], description: 'Show this help' },
]

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground">
      {children}
    </kbd>
  )
}

export function HelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Popup
          data-testid="help-dialog"
          className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-background p-5 shadow-lg outline-none"
        >
          <Dialog.Title className="text-lg font-semibold">
            Keyboard shortcuts
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Press <Kbd>?</Kbd> or <Kbd>Esc</Kbd> to close.
          </Dialog.Description>

          <ul className="mt-4 space-y-2">
            {SHORTCUTS.map((s) => (
              <li
                key={s.description}
                className="flex items-center justify-between gap-4"
              >
                <span className="min-w-0 text-sm">{s.description}</span>
                <span className="flex shrink-0 gap-1">
                  {s.keys.map((k) => (
                    <Kbd key={k}>{k}</Kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex justify-end">
            <Dialog.Close
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              Close
            </Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
