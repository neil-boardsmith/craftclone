import { useState } from 'react'
import { Block } from '@/lib/blocks/types'
import { TextBlockView } from './TextBlockView'
import { TableBlockView } from './TableBlockView'
import { ChartBlockView } from './ChartBlockView'
import { EmbedBlockView } from './EmbedBlockView'
import { ImageBlockView } from './ImageBlockView'
import { MetricBlockView } from './MetricBlockView'
import { Button } from '@/components/ui/button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { InlineTextEditor } from './InlineTextEditor'

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
  
  const handleBlockCreated = (newBlock: Block) => {
    onBlocksUpdate?.([...blocks, newBlock])
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
            return <TextBlockView key={block.id} {...commonProps} />
          case 'table':
            return <TableBlockView key={block.id} {...commonProps} />
          case 'chart':
            return <ChartBlockView key={block.id} {...commonProps} />
          case 'embed':
            return <EmbedBlockView key={block.id} {...commonProps} />
          case 'image':
            return <ImageBlockView key={block.id} {...commonProps} />
          case 'metric':
            return <MetricBlockView key={block.id} {...commonProps} />
          default:
            return null
        }
      })}
      {editMode && reportId && (
        <div className="mt-2">
          <InlineTextEditor
            reportId={reportId}
            onBlockCreated={handleBlockCreated}
            autoFocus={blocks.length === 0}
          />
        </div>
      )}
    </div>
  )
} 