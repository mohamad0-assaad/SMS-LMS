import type { LucideIcon } from 'lucide-react'

type QuickActionButtonProps = {
  icon: LucideIcon
  label: string
  onClick?: () => void
}

export function QuickActionButton({ icon: Icon, label, onClick }: QuickActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:border-violet-200 hover:bg-violet-50/50"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="h-4 w-4" />
      </span>
      {label}
    </button>
  )
}
