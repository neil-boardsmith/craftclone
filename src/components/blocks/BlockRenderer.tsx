import { Block, TextBlock, TableBlock, ChartBlock, EmbedBlock, ImageBlock, MetricBlock } from '@/lib/blocks/types'
import { TextBlockView } from './TextBlockView'
import { TableBlockView } from './TableBlockView'
import { ChartBlockView } from './ChartBlockView'
import { EmbedBlockView } from './EmbedBlockView'
import { ImageBlockView } from './ImageBlockView'
import { MetricBlockView } from './MetricBlockView'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface BlockRendererProps {
  blocks: Block[]
  editMode?: boolean
  reportId?: string
  selectedBlockId?: string | null
  onBlockSelect?: (blockId: string, blockType: string) => void
  onBlocksUpdate?: (blocks: Block[]) => void
}

export function BlockRenderer({ blocks, editMode = false, reportId, selectedBlockId, onBlockSelect, onBlocksUpdate }: BlockRendererProps) {
  const supabase = createClientComponentClient()
  
  const handleBlockCreated = async (newBlock: Block) => {
    // After creating a block, refetch all blocks to get proper positions
    if (reportId) {
      const { data: refreshedBlocks } = await supabase
        .from('blocks')
        .select('*')
        .eq('report_id', reportId)
        .order('position', { ascending: true })
      
      if (refreshedBlocks) {
        onBlocksUpdate?.(refreshedBlocks)
      }
    }
    
    // Select and focus the new block after creation
    setTimeout(() => {
      onBlockSelect?.(newBlock.id, newBlock.type)
      // Look for contenteditable element (Tiptap editor) instead of textarea
      const newBlockElement = document.querySelector(`[data-block-id="${newBlock.id}"]`)
      if (newBlockElement) {
        const editorElement = newBlockElement.querySelector('[contenteditable="true"]') as HTMLElement
        if (editorElement) {
          editorElement.focus()
          // Place cursor at the beginning
          const range = document.createRange()
          const selection = window.getSelection()
          if (selection) {
            range.setStart(editorElement, 0)
            range.collapse(true)
            selection.removeAllRanges()
            selection.addRange(range)
          }
        }
      }
    }, 200)
  }

  const handleBlockDelete = (blockId: string) => {
    const updatedBlocks = blocks.filter(block => block.id !== blockId)
    onBlocksUpdate?.(updatedBlocks)
  }

  const handleBlockReorder = async (draggedBlockId: string, targetBlockId: string, position: 'before' | 'after') => {
    const draggedIndex = blocks.findIndex(block => block.id === draggedBlockId)
    const targetIndex = blocks.findIndex(block => block.id === targetBlockId)
    
    if (draggedIndex === -1 || targetIndex === -1) return
    
    const reorderedBlocks = [...blocks]
    const [draggedBlock] = reorderedBlocks.splice(draggedIndex, 1)
    
    const newTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex
    const insertIndex = position === 'before' ? newTargetIndex : newTargetIndex + 1
    
    reorderedBlocks.splice(insertIndex, 0, draggedBlock)
    
    // Update positions in database
    const updatePromises = reorderedBlocks.map((block, index) => 
      supabase
        .from('blocks')
        .update({ position: index + 1 })
        .eq('id', block.id)
    )
    
    try {
      await Promise.all(updatePromises)
      // Update local state with new positions
      const updatedBlocks = reorderedBlocks.map((block, index) => ({
        ...block,
        position: index + 1
      }))
      onBlocksUpdate?.(updatedBlocks)
    } catch (error) {
      console.error('Failed to reorder blocks:', error)
    }
  }


  return (
    <div className="flex flex-col gap-2">
      {blocks.map((block) => {
        const isSelected = selectedBlockId === block.id
        const commonProps = {
          block,
          editMode,
          reportId,
          isSelected,
          onSelect: () => onBlockSelect?.(block.id, block.type),
          onBlockDelete: handleBlockDelete,
          onBlockReorder: handleBlockReorder,
          onBlockCreated: handleBlockCreated
        }
        
        switch (block.type) {
          case 'text':
            return <TextBlockView key={block.id} {...commonProps} block={block as TextBlock} />
          case 'table':
            return <TableBlockView key={block.id} {...commonProps} block={block as TableBlock} />
          case 'chart':
            return <ChartBlockView key={block.id} {...commonProps} block={block as ChartBlock} />
          case 'embed':
            return <EmbedBlockView key={block.id} {...commonProps} block={block as EmbedBlock} />
          case 'image':
            return <ImageBlockView key={block.id} {...commonProps} block={block as ImageBlock} />
          case 'metric':
            return <MetricBlockView key={block.id} {...commonProps} block={block as MetricBlock} />
          default:
            return null
        }
      })}
    </div>
  )
} 