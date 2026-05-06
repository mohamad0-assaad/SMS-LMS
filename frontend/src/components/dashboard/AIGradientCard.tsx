import type { ReactNode } from 'react'

type Variant = 'green' | 'dark' | 'navy'

const variants: Record<
  Variant,
  { wrap: string; title: string; body: string; button: string }
> = {
  green: {
    wrap: 'from-green-800 via-green-700 to-emerald-800',
    title: 'text-white',
    body: 'text-green-100',
    button: 'bg-white/95 text-green-800 hover:bg-white shadow-sm',
  },
  dark: {
    wrap: 'from-green-900 via-emerald-900 to-green-900',
    title: 'text-white',
    body: 'text-green-200',
    button: 'bg-white/95 text-green-900 hover:bg-white shadow-sm',
  },
  navy: {
    wrap: 'from-[#0a0a0a] via-[#0d1a0d] to-[#0a0a0a]',
    title: 'text-white',
    body: 'text-slate-300',
    button: 'bg-green-600 text-white hover:bg-green-500',
  },
}

type AIGradientCardProps = {
  variant?: Variant
  eyebrow?: string
  title: string
  children: ReactNode
  actionLabel?: string
  onAction?: () => void
}

export function AIGradientCard({
  variant = 'green',
  eyebrow,
  title,
  children,
  actionLabel,
  onAction,
}: AIGradientCardProps) {
  const v = variants[variant]
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 shadow-lg ${v.wrap}`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-black/10 blur-2xl" />
      <div className="relative">
        {eyebrow ? (
          <p className={`text-xs font-semibold uppercase tracking-wider ${v.body}`}>
            {eyebrow}
          </p>
        ) : null}
        <h3 className={`mt-1 text-lg font-semibold ${v.title}`}>{title}</h3>
        <div className={`mt-3 text-sm leading-relaxed ${v.body}`}>{children}</div>
        {actionLabel ? (
          <button
            type="button"
            onClick={onAction}
            className={`mt-5 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition ${v.button}`}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}
