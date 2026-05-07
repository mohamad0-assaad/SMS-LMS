export function SkeletonRow({ cols = 2 }: { cols?: number }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-4">
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-2/3 rounded-full bg-white/[0.06] animate-pulse" />
        <div className="h-2.5 w-1/3 rounded-full bg-white/[0.04] animate-pulse" />
      </div>
      {cols > 1 && <div className="h-3.5 w-16 rounded-full bg-white/[0.06] animate-pulse" />}
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 2 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111111]">
      <div className="divide-y divide-white/[0.05]">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonRow key={i} cols={cols} />
        ))}
      </div>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5 space-y-3 animate-pulse">
      <div className="h-3.5 w-1/2 rounded-full bg-white/[0.06]" />
      <div className="h-2.5 w-3/4 rounded-full bg-white/[0.04]" />
      <div className="h-2.5 w-1/2 rounded-full bg-white/[0.04]" />
    </div>
  )
}
