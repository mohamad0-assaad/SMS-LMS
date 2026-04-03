type Row = { label: string; score: number; attendance: number }

type MiniBarChartProps = {
  data: Row[]
  className?: string
}

const H = 200
const PAD = { l: 36, r: 12, t: 12, b: 28 }
const BAR = 14
const GAP = 8

export function MiniBarChart({ data, className = '' }: MiniBarChartProps) {
  const w = Math.max(280, data.length * 56)
  const innerW = w - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b
  const max = 100

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <svg
        width={w}
        height={H}
        viewBox={`0 0 ${w} ${H}`}
        className="text-slate-500"
        role="img"
        aria-label="Class performance bar chart"
      >
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = PAD.t + innerH - (tick / max) * innerH
          return (
            <g key={tick}>
              <line
                x1={PAD.l}
                y1={y}
                x2={w - PAD.r}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.12}
              />
              <text x={4} y={y + 4} fontSize={10} fill="currentColor">
                {tick}
              </text>
            </g>
          )
        })}
        {data.map((row, i) => {
          const cx = PAD.l + (i + 0.5) * (innerW / data.length)
          const x1 = cx - BAR - GAP / 2
          const x2 = cx + GAP / 2
          const h1 = (row.score / max) * innerH
          const h2 = (row.attendance / max) * innerH
          const y1 = PAD.t + innerH - h1
          const y2 = PAD.t + innerH - h2
          return (
            <g key={row.label}>
              <rect
                x={x1}
                y={y1}
                width={BAR}
                height={Math.max(h1, 0)}
                rx={4}
                fill="#7c3aed"
              />
              <rect
                x={x2}
                y={y2}
                width={BAR}
                height={Math.max(h2, 0)}
                rx={4}
                fill="#14b8a6"
              />
              <text
                x={cx}
                y={H - 6}
                textAnchor="middle"
                fontSize={11}
                fontWeight={600}
                fill="#334155"
              >
                {row.label}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="mt-1 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-violet-600" /> Average score
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-teal-500" /> Attendance
        </span>
      </div>
    </div>
  )
}
