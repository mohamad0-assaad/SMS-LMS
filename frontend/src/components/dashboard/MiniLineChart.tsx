type Series = { key: string; name: string; color: string; dashed?: boolean }

type MiniLineChartProps = {
  data: Record<string, string | number>[]
  xKey: string
  series: Series[]
  yDomain?: [number, number]
  className?: string
  ariaLabel?: string
}

const H = 220
const PAD = { l: 40, r: 16, t: 16, b: 32 }

export function MiniLineChart({
  data,
  xKey,
  series,
  yDomain = [0, 100],
  className = '',
  ariaLabel = 'Line chart',
}: MiniLineChartProps) {
  const w = 520
  const innerW = w - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b
  const [yMin, yMax] = yDomain

  function xPos(i: number) {
    if (data.length <= 1) return PAD.l + innerW / 2
    return PAD.l + (i / (data.length - 1)) * innerW
  }

  function yPos(v: number) {
    const t = (v - yMin) / (yMax - yMin)
    return PAD.t + innerH - t * innerH
  }

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${w} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="text-slate-400"
        role="img"
        aria-label={ariaLabel}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const val = Math.round(yMin + t * (yMax - yMin))
          const y = yPos(val)
          return (
            <g key={val}>
              <line
                x1={PAD.l}
                y1={y}
                x2={w - PAD.r}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.15}
              />
              <text x={6} y={y + 4} fontSize={10} fill="currentColor">
                {val}
              </text>
            </g>
          )
        })}
        {data.map((row, i) => (
          <text
            key={String(row[xKey])}
            x={xPos(i)}
            y={H - 8}
            textAnchor="middle"
            fontSize={11}
            fontWeight={600}
            fill="#475569"
          >
            {row[xKey]}
          </text>
        ))}
        {series.map((s) => {
          const pts = data
            .map((row, i) => {
              const v = Number(row[s.key])
              return `${xPos(i)},${yPos(v)}`
            })
            .join(' ')
          return (
            <polyline
              key={s.key}
              fill="none"
              stroke={s.color}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={s.dashed ? '6 6' : undefined}
              points={pts}
            />
          )
        })}
        {series.map((s) =>
          data.map((row, i) => {
            const v = Number(row[s.key])
            return (
              <circle
                key={`${s.key}-${i}`}
                cx={xPos(i)}
                cy={yPos(v)}
                r={s.dashed ? 0 : 3}
                fill={s.color}
              />
            )
          }),
        )}
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-2">
            <span
              className="h-0.5 w-6 rounded-full"
              style={{
                backgroundColor: s.color,
                borderStyle: s.dashed ? 'dashed' : 'solid',
              }}
            />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  )
}
