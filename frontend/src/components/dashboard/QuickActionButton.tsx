import type { LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type QuickActionButtonProps = {
  icon: LucideIcon
  label: string
  to?: string
  onClick?: () => void
}

export function QuickActionButton({ icon: Icon, label, to, onClick }: QuickActionButtonProps) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => {
        onClick?.()
        if (to) navigate(to)
      }}
      className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-left text-sm font-medium text-slate-300 shadow-sm transition hover:border-green-500/30 hover:bg-green-500/[0.08] hover:text-white"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-slate-400">
        <Icon className="h-4 w-4" />
      </span>
      {label}
    </button>
  )
}
