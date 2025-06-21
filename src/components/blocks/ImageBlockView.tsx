'use client'
import { ImageBlock } from '@/lib/blocks/types'
import { cn } from '@/lib/utils'

interface ImageBlockViewProps {
  block: ImageBlock
  editMode?: boolean
  reportId?: string
  isSelected?: boolean
  onSelect?: () => void
}

export function ImageBlockView({ block, editMode, reportId, isSelected, onSelect }: ImageBlockViewProps) {
  const { url, alt, caption, alignment } = block.content
  const alignClass = {
    left: 'mx-0',
    center: 'mx-auto',
    right: 'ml-auto',
    full: 'w-full',
  }[alignment || 'center'] || 'mx-auto'
  
  return (
    <div
      className={cn(
        "relative group mb-6 px-4 py-2 -mx-4 rounded-lg transition-all cursor-pointer",
        isSelected && "bg-teal-50 ring-2 ring-teal-500 ring-opacity-30",
        !isSelected && "hover:bg-slate-50"
      )}
      onClick={onSelect}
    >
      <figure className={`my-4 ${alignClass}`}>
        <img src={url} alt={alt} className="rounded-lg max-w-full shadow-sm" />
        {caption && (
          <figcaption className="text-center text-slate-500 text-sm mt-2">
            {caption}
          </figcaption>
        )}
      </figure>
    </div>
  )
} 