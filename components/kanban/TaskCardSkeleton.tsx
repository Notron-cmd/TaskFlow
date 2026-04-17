export default function TaskCardSkeleton() {
  return (
    <div className="bg-[#16162A] border border-white/[0.06] rounded-xl p-4 animate-pulse">
      {/* Row 1 */}
      <div className="flex justify-between mb-2">
        <div className="w-3 h-3 rounded bg-white/[0.06]" />
        <div className="w-12 h-4 rounded-full bg-white/[0.06]" />
      </div>

      {/* Row 2 - Title */}
      <div className="w-3/4 h-4 rounded bg-white/[0.06] mb-1" />

      {/* Row 3 & 4 - Description lines */}
      <div className="w-full h-3 rounded bg-white/[0.06] mb-1" />
      <div className="w-2/3 h-3 rounded bg-white/[0.06] mb-3" />

      {/* Row 5 - Tags */}
      <div className="flex gap-1 mb-3">
        <div className="w-10 h-4 rounded-md bg-white/[0.06]" />
        <div className="w-10 h-4 rounded-md bg-white/[0.06]" />
        <div className="w-10 h-4 rounded-md bg-white/[0.06]" />
      </div>

      {/* Row 6 - Footer */}
      <div className="flex justify-between mt-3">
        <div className="flex gap-1">
          <div className="w-5 h-5 rounded-full bg-white/[0.06]" />
          <div className="w-5 h-5 rounded-full bg-white/[0.06] -ml-1.5" />
        </div>
        <div className="w-16 h-3 rounded bg-white/[0.06]" />
      </div>
    </div>
  )
}
