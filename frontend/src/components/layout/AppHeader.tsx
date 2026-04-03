import { Bell, ChevronDown, Search } from 'lucide-react'

type AppHeaderProps = {
  greetingName: string
  subtitle?: string
}

export function AppHeader({ greetingName, subtitle }: AppHeaderProps) {
  const hour = new Date().getHours()
  const part =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <header className="flex flex-col gap-4 border-b border-slate-200/80 bg-white/80 px-6 py-5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          {part}, {greetingName}
        </h1>
        {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-2 shadow-sm transition hover:bg-slate-50"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-bold text-white">
            {greetingName.slice(0, 1).toUpperCase()}
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
      </div>
    </header>
  )
}
