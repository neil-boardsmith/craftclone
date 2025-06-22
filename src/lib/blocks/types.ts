export type BlockType = 'text' | 'table' | 'chart' | 'embed' | 'image' | 'metric'

export interface BaseBlock {
  id: string
  reportId: string
  type: BlockType
  position: number
  content: Record<string, unknown> & {
    decoration?: 'focus' | 'card'
    backgroundColor?: string
  }
  metadata: {
    createdAt: string
    updatedAt: string
  }
}

export interface TextBlock extends BaseBlock {
  type: 'text'
  content: {
    html: string
    text: string // for AI processing
    style?: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'quote' | 'strong' | 'caption' | 'bulletList' | 'numberedList'
    alignment?: 'left' | 'center' | 'right'
    decoration?: 'focus' | 'card'
    backgroundColor?: string
  }
}

export interface TableBlock extends BaseBlock {
  type: 'table'
  content: {
    headers: string[]
    rows: (string | number)[][]
    formatting?: {
      columnTypes: ('text' | 'number' | 'currency' | 'percentage')[]
    }
  }
}

export interface ChartBlock extends BaseBlock {
  type: 'chart'
  content: {
    chartType: 'line' | 'bar' | 'pie' | 'area'
    data: { name: string; value: number }[]
    sourceBlockId?: string // reference to table block
    options: {
      title?: string
      xAxis?: string
      yAxis?: string
    }
  }
}

export interface EmbedBlock extends BaseBlock {
  type: 'embed'
  content: {
    url: string
    embedType: 'youtube' | 'figma' | 'iframe'
    title?: string
  }
}

export interface ImageBlock extends BaseBlock {
  type: 'image'
  content: {
    url: string
    alt: string
    caption?: string
    alignment?: 'left' | 'center' | 'right' | 'full'
  }
}

export interface MetricBlock extends BaseBlock {
  type: 'metric'
  content: {
    metrics: Array<{
      label: string
      value: string | number
      format?: 'currency' | 'percentage' | 'number'
    }>
    columns?: 2 | 3 | 4
    style?: 'default' | 'card' | 'focus'
    backgroundColor?: string
  }
}

export type Block = TextBlock | TableBlock | ChartBlock | EmbedBlock | ImageBlock | MetricBlock 