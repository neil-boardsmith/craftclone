'use client'
import { ChartBlock } from '@/lib/blocks/types'
import { cn } from '@/lib/utils'

interface ChartBlockViewProps {
  block: ChartBlock
  editMode?: boolean
  reportId?: string
  isSelected?: boolean
  onSelect?: () => void
}

export function ChartBlockView({ block, isSelected, onSelect }: ChartBlockViewProps) {
  // Placeholder: You can implement Recharts or another chart library here
  return (
    <div
      className={cn(
        "relative group mb-6 px-4 py-2 -mx-4 rounded-lg transition-all cursor-pointer",
        isSelected && "bg-teal-50 ring-2 ring-teal-500 ring-opacity-30",
        !isSelected && "hover:bg-slate-50"
      )}
      onClick={onSelect}
    >
      <div className="border border-slate-200 rounded-lg p-8 text-center text-slate-500 bg-slate-50">
        <div className="text-4xl mb-2">📊</div>
        <div className="font-medium">{block.content.chartType} Chart</div>
        <div className="text-sm">{block.content.options?.title || 'Untitled Chart'}</div>
      </div>
    </div>
  )
} 