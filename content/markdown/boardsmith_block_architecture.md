# Boardsmith MVP - Block Architecture Implementation

## Block System Philosophy

### Core Concepts
- **Everything is a block**: Text, tables, charts, embeds, images
- **Blocks are composable**: Complex reports built from simple blocks
- **Blocks have relationships**: Charts can reference table data
- **Blocks are reusable**: Copy/paste between reports and across time
- **Blocks maintain context**: Know their purpose and optimize accordingly

### Design Principles
1. **Minimal API Surface**: Simple interface for maximum flexibility
2. **Predictable Behavior**: Consistent patterns across all block types
3. **Progressive Enhancement**: Basic functionality first, advanced features layered
4. **Performance First**: Optimized for smooth 60fps interactions
5. **Mobile Responsive**: Touch-first design that scales up

## Block Type System

### Base Block Interface
```typescript
interface BaseBlock {
  id: string
  reportId: string
  type: BlockType
  position: number
  content: Record<string, any>
  metadata: {
    createdAt: string
    updatedAt: string
    version: number
  }
  relationships?: BlockRelationship[]
}

interface BlockRelationship {
  type: 'dataSource' | 'reference' | 'dependency'
  targetBlockId: string
  config?: Record<string, any>
}
```

### Block Types (MVP)

#### TextBlock
```typescript
interface TextBlock extends BaseBlock {
  type: 'text'
  content: {
    html: string           // Rich HTML content
    text: string          // Plain text for AI processing
    style: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'quote'
  }
}
```

**Features**:
- Rich text editing with Tiptap
- Markdown shortcuts (`#` for headings, `*` for lists)
- AI assistance integration
- Proper semantic HTML output

#### TableBlock
```typescript
interface TableBlock extends BaseBlock {
  type: 'table'
  content: {
    headers: string[]
    rows: (string | number)[][]
    columnTypes: ('text' | 'number' | 'currency' | 'percentage' | 'date')[]
    formatting: {
      decimals?: number[]
      thousandsSeparator?: boolean
      currencySymbol?: string
    }
    calculations?: {
      column: number
      type: 'sum' | 'average' | 'count'
      result?: number
    }[]
  }
}
```

**Features**:
- Inline editing with proper input types
- CSV import with intelligent column detection
- Automatic formatting based on data types
- Built-in calculations (sum, average, count)
- Export capabilities

#### ChartBlock
```typescript
interface ChartBlock extends BaseBlock {
  type: 'chart'
  content: {
    chartType: 'line' | 'bar' | 'pie' | 'area' | 'scatter'
    title?: string
    data: Array<{
      name: string
      value: number
      [key: string]: string | number
    }>
    dataSourceId?: string  // Reference to TableBlock
    options: {
      xAxis?: string
      yAxis?: string
      colors?: string[]
      showLegend?: boolean
      showGrid?: boolean
    }
  }
}
```

**Features**:
- Multiple chart types with consistent API
- Direct data entry or table data reference
- Responsive design with proper aspect ratios
- Professional color schemes
- Interactive tooltips and legends

#### EmbedBlock
```typescript
interface EmbedBlock extends BaseBlock {
  type: 'embed'
  content: {
    url: string
    embedType: 'youtube' | 'figma' | 'twitter' | 'iframe'
    title?: string
    description?: string
    thumbnailUrl?: string
    aspectRatio?: string  // '16:9', '4:3', etc.
    allowInteraction?: boolean
  }
}
```

**Features**:
- Smart URL detection and embedding
- Security-first iframe handling
- Responsive embed sizing
- Preview modes for non-interactive embeds
- Error handling for broken links

#### ImageBlock
```typescript
interface ImageBlock extends BaseBlock {
  type: 'image'
  content: {
    url: string
    alt: string
    caption?: string
    width?: number
    height?: number
    alignment: 'left' | 'center' | 'right' | 'full'
  }
}
```

**Features**:
- Drag & drop image upload
- Automatic resizing and optimization
- Proper alt text for accessibility
- Multiple alignment options
- Caption support

## Component Architecture

### BlockWrapper Component
```typescript
interface BlockWrapperProps {
  block: BaseBlock
  isSelected: boolean
  isEditing: boolean
  isDragging: boolean
  onSelect: () => void
  onEdit: () => void
  onUpdate: (content: any) => void
  onDelete: () => void
  onDuplicate: () => void
  children: React.ReactNode
}
```

**Responsibilities**:
- Handle selection and editing states
- Provide consistent interaction patterns
- Manage drag and drop behavior
- Show contextual toolbars
- Handle keyboard shortcuts

### BlockRenderer Component
```typescript
interface BlockRendererProps {
  blocks: BaseBlock[]
  selectedBlockId?: string
  editingBlockId?: string
  onBlockSelect: (id: string) => void
  onBlockUpdate: (id: string, content: any) => void
  onBlockCreate: (type: BlockType, position: number) => void
  onBlockDelete: (id: string) => void
  onBlockReorder: (dragIndex: number, hoverIndex: number) => void
}
```

**Responsibilities**:
- Render appropriate component for each block type
- Handle block-to-block interactions
- Manage focus and selection state
- Coordinate drag and drop operations
- Handle keyboard navigation

### Block-Specific Components

#### TextBlockComponent
```tsx
const TextBlockComponent = ({ block, isEditing, onUpdate }: Props) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start typing...'
      })
    ],
    content: block.content.html,
    onUpdate: ({ editor }) => {
      onUpdate({
        html: editor.getHTML(),
        text: editor.getText()
      })
    }
  })

  if (!isEditing) {
    return <div dangerouslySetInnerHTML={{ __html: block.content.html }} />
  }

  return <EditorContent editor={editor} />
}
```

#### TableBlockComponent
```tsx
const TableBlockComponent = ({ block, isEditing, onUpdate }: Props) => {
  const [data, setData] = useState(block.content)

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...data.rows]
    newRows[rowIndex][colIndex] = value
    const newData = { ...data, rows: newRows }
    setData(newData)
    onUpdate(newData)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {data.headers.map((header, index) => (
              <th key={index} className="border p-2 bg-slate-50">
                {isEditing ? (
                  <input
                    value={header}
                    onChange={(e) => handleHeaderChange(index, e.target.value)}
                    className="w-full bg-transparent"
                  />
                ) : (
                  header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, colIndex) => (
                <td key={colIndex} className="border p-2">
                  {isEditing ? (
                    <input
                      value={cell}
                      onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                      type={getInputType(data.columnTypes[colIndex])}
                      className="w-full bg-transparent"
                    />
                  ) : (
                    formatCell(cell, data.columnTypes[colIndex], data.formatting)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

## State Management

### Block Store (Zustand)
```typescript
interface BlockStore {
  // State
  blocks: BaseBlock[]
  selectedBlockId: string | null
  editingBlockId: string | null
  isDragging: boolean
  
  // Actions
  setBlocks: (blocks: BaseBlock[]) => void
  addBlock: (block: Omit<BaseBlock, 'id' | 'position'>) => void
  updateBlock: (id: string, content: any) => void
  deleteBlock: (id: string) => void
  selectBlock: (id: string | null) => void
  editBlock: (id: string | null) => void
  reorderBlocks: (dragIndex: number, hoverIndex: number) => void
  duplicateBlock: (id: string) => void
  
  // Computed
  getBlockById: (id: string) => BaseBlock | undefined
  getBlocksByType: (type: BlockType) => BaseBlock[]
  getBlockPosition: (id: string) => number
}
```

### Optimistic Updates
```typescript
const updateBlock = async (id: string, content: any) => {
  // Optimistic update
  useBlockStore.getState().updateBlock(id, content)
  
  try {
    // Sync to server
    await api.updateBlock(id, content)
  } catch (error) {
    // Revert on error
    useBlockStore.getState().revertBlock(id)
    toast.error('Failed to save changes')
  }
}
```

## Drag and Drop Implementation

### DND Kit Integration
```typescript
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

const BlockEditor = () => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (active.id !== over?.id) {
      const oldIndex = blocks.findIndex(block => block.id === active.id)
      const newIndex = blocks.findIndex(block => block.id === over?.id)
      
      reorderBlocks(oldIndex, newIndex)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={blocks} strategy={verticalListSortingStrategy}>
        {blocks.map(block => (
          <SortableBlockWrapper key={block.id} block={block}>
            <BlockRenderer block={block} />
          </SortableBlockWrapper>
        ))}
      </SortableContext>
    </DndContext>
  )
}
```

## Performance Optimizations

### Virtual Scrolling
```typescript
import { FixedSizeList as List } from 'react-window'

const VirtualizedBlockList = ({ blocks }: Props) => {
  const itemSize = 200 // Estimated block height
  
  const renderBlock = ({ index, style }: ListChildComponentProps) => (
    <div style={style}>
      <BlockRenderer block={blocks[index]} />
    </div>
  )

  return (
    <List
      height={600}
      itemCount={blocks.length}
      itemSize={itemSize}
      itemData={blocks}
    >
      {renderBlock}
    </List>
  )
}
```

### Memoization
```typescript
const BlockWrapper = memo(({ block, isSelected, onUpdate }: Props) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison for performance
  return (
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.content === nextProps.block.content &&
    prevProps.isSelected === nextProps.isSelected
  )
})
```

### Debounced Updates
```typescript
import { useDebouncedCallback } from 'use-debounce'

const useBlockUpdate = (blockId: string) => {
  const updateBlock = useBlockStore(state => state.updateBlock)
  
  const debouncedUpdate = useDebouncedCallback(
    (content: any) => {
      updateBlock(blockId, content)
    },
    300 // 300ms delay
  )
  
  return debouncedUpdate
}
```

## Mobile Optimizations

### Touch Interactions
```typescript
const useLongPress = (onLongPress: () => void, delay = 500) => {
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  const start = useCallback(() => {
    timeoutRef.current = setTimeout(onLongPress, delay)
  }, [onLongPress, delay])
  
  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])
  
  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
  }
}
```

### Responsive Block Rendering
```typescript
const ResponsiveBlockRenderer = ({ block }: Props) => {
  const isMobile = useMediaQuery('(max-width: 768px)')
  
  if (isMobile && block.type === 'table') {
    return <MobileTableView block={block} />
  }
  
  return <DesktopBlockView block={block} />
}
```

## Testing Strategy

### Unit Tests
```typescript
import { render, screen } from '@testing-library/react'
import { TextBlockComponent } from './TextBlockComponent'

describe('TextBlockComponent', () => {
  it('renders content in read-only mode', () => {
    const block = {
      id: '1',
      type: 'text',
      content: { html: '<p>Test content</p>', text: 'Test content' }
    }
    
    render(<TextBlockComponent block={block} isEditing={false} />)
    
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })
  
  it('enables editing when isEditing is true', () => {
    // Test implementation
  })
})
```

### Integration Tests
```typescript
import { renderHook, act } from '@testing-library/react'
import { useBlockStore } from './blockStore'

describe('Block Store', () => {
  it('adds blocks in correct order', () => {
    const { result } = renderHook(() => useBlockStore())
    
    act(() => {
      result.current.addBlock({
        type: 'text',
        content: { html: '<p>First</p>', text: 'First' }
      })
      result.current.addBlock({
        type: 'text',
        content: { html: '<p>Second</p>', text: 'Second' }
      })
    })
    
    expect(result.current.blocks).toHaveLength(2)
    expect(result.current.blocks[0].position).toBeLessThan(
      result.current.blocks[1].position
    )
  })
})
```