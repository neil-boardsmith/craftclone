'use client'
import { EmbedBlock } from '@/lib/blocks/types'
import { cn } from '@/lib/utils'

interface EmbedBlockViewProps {
  block: EmbedBlock
  editMode?: boolean
  reportId?: string
  isSelected?: boolean
  onSelect?: () => void
}

export function EmbedBlockView({ block, editMode, reportId, isSelected, onSelect }: EmbedBlockViewProps) {
  const { url, embedType, title } = block.content
  
  return (
    <div
      className={cn(
        "relative group mb-6 px-4 py-2 -mx-4 rounded-lg transition-all cursor-pointer",
        isSelected && "bg-teal-50 ring-2 ring-teal-500 ring-opacity-30",
        !isSelected && "hover:bg-slate-50"
      )}
      onClick={onSelect}
    >
      <div className="border border-slate-200 rounded-lg p-4 bg-white">
        <div className="font-medium text-slate-700 mb-2">{title || embedType}</div>
        <div className="text-sm text-slate-500 break-all">{url}</div>
        {/* You can add smart embedding logic here */}
      </div>
    </div>
  )
} 