type StudentFeaturePageProps = {
  title: string
  description: string
}

export function StudentFeaturePage({ title, description }: StudentFeaturePageProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-white/[0.08] bg-[#111111] p-8 shadow-lg">
      <h1 className="text-lg font-semibold text-white">{title}</h1>
      <p className="text-sm leading-relaxed text-slate-400">{description}</p>
    </div>
  )
}
