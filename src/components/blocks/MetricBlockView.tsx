'use client'
import { MetricBlock } from '@/lib/blocks/types'
import { cn } from '@/lib/utils'

interface MetricBlockViewProps {
  block: MetricBlock
  editMode?: boolean
  reportId?: string
  isSelected?: boolean
  onSelect?: () => void
}

export function MetricBlockView({ block, isSelected, onSelect }: MetricBlockViewProps) {
  const { metrics, columns = 4, style = 'card', backgroundColor = 'teal' } = block.content
  
  const colorClasses = {
    teal: 'bg-teal-100 border-teal-200 text-teal-900',
    blue: 'bg-blue-100 border-blue-200 text-blue-900',
    purple: 'bg-purple-100 border-purple-200 text-purple-900',
    green: 'bg-green-100 border-green-200 text-green-900',
    amber: 'bg-amber-100 border-amber-200 text-amber-900',
    slate: 'bg-slate-100 border-slate-200 text-slate-900',
  }
  
  const getGridCols = () => {
    switch (columns) {
      case 2: return 'grid-cols-2'
      case 3: return 'grid-cols-3'
      case 4: return 'grid-cols-4'
      default: return 'grid-cols-4'
    }
  }
  
  const formatValue = (value: string | number, format?: string) => {
    if (format === 'currency') {
      return `A$${typeof value === 'number' ? value.toLocaleString() : value}`
    }
    if (format === 'percentage') {
      return `${value}%`
    }
    if (format === 'number' && typeof value === 'number') {
      return value.toLocaleString()
    }
    return value
  }
  
  return (
    <div
      className={cn(
        "relative group mb-4 px-2 py-1 -mx-2 rounded transition-all cursor-pointer",
        isSelected && "bg-blue-50/40",
        !isSelected && "hover:bg-gray-50/50"
      )}
      onClick={onSelect}
    >
      <div className={cn("grid gap-2", getGridCols())}>
        {metrics.map((metric, index) => (
          <div
            key={index}
            className={cn(
              "rounded-md border p-3 text-center transition-all",
              style === 'card' && colorClasses[backgroundColor as keyof typeof colorClasses] || 'bg-white border-gray-200',
              style === 'focus' && "shadow-sm hover:shadow-md"
            )}
          >
            <div className="text-xs font-medium opacity-70 mb-1">{metric.label}</div>
            <div className="text-lg font-semibold">{formatValue(metric.value, metric.format)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}