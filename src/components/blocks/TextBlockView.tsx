'use client'
import { TextBlock } from '@/lib/blocks/types'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { SlashCommand } from './SlashCommand'
import { TextBlockEditor } from './TextBlockEditor'

interface TextBlockViewProps {
  block: TextBlock
  editMode?: boolean
  reportId?: string
  isSelected?: boolean
  onSelect?: () => void
  onBlockDelete?: (blockId: string) => void
  onBlockReorder?: (draggedBlockId: string, targetBlockId: string, position: 'before' | 'after') => void
  onBlockCreated?: (block: any) => void
}

export function TextBlockView({ block, editMode, reportId, isSelected, onSelect, onBlockDelete, onBlockReorder, onBlockCreated }: TextBlockViewProps) {
  const [content, setContent] = useState(block.content.html || '<p></p>')
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragPosition, setDragPosition] = useState<'before' | 'after' | null>(null)
  const [showSlashCommand, setShowSlashCommand] = useState(false)
  const [slashPosition, setSlashPosition] = useState({ x: 0, y: 0 })
  const supabase = createClientComponentClient()
  
  const { style = 'paragraph' } = block.content

  // Ensure content is always valid HTML
  useEffect(() => {
    if (!content || content.trim() === '') {
      setContent('<p></p>')
    }
  }, [])

  
  const handleSave = async (htmlContent: string) => {
    if (!reportId || !htmlContent) return
    
    // Extract plain text from HTML for the text field
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    const plainText = tempDiv.textContent || tempDiv.innerText || ''
    
    console.log('Saving HTML:', htmlContent, 'Text:', plainText)
    
    const { error } = await supabase
      .from('blocks')
      .update({
        content: {
          ...block.content,
          html: htmlContent,
          text: plainText
        },
        metadata: {
          ...block.metadata,
          updatedAt: new Date().toISOString()
        }
      })
      .eq('id', block.id)
    
    if (!error) {
      // Update the block content locally
      block.content.html = htmlContent
      block.content.text = plainText
    }
  }

  const updateBlockStyle = async (newStyle: string) => {
    const updatedContent = { ...block.content, style: newStyle }
    
    // Update HTML to match the new style
    const text = content || ''
    switch (newStyle) {
      case 'heading1':
        updatedContent.html = `<h1>${text}</h1>`
        break
      case 'heading2':
        updatedContent.html = `<h2>${text}</h2>`
        break
      case 'heading3':
        updatedContent.html = `<h3>${text}</h3>`
        break
      case 'quote':
        updatedContent.html = `<blockquote>${text}</blockquote>`
        break
      case 'bulletList':
        const bulletItems = text.split('\n').filter(item => item.trim())
        updatedContent.html = `<ul>${bulletItems.map(item => `<li>${item}</li>`).join('')}</ul>`
        break
      case 'numberedList':
        const numberedItems = text.split('\n').filter(item => item.trim())
        updatedContent.html = `<ol>${numberedItems.map(item => `<li>${item}</li>`).join('')}</ol>`
        break
      case 'paragraph':
      default:
        updatedContent.html = `<p>${text}</p>`
        break
    }
    
    await supabase
      .from('blocks')
      .update({ content: updatedContent })
      .eq('id', block.id)
  }

  const handleDelete = async () => {
    if (!reportId) return
    
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('id', block.id)
    
    if (!error) {
      onBlockDelete?.(block.id)
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', block.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    const rect = e.currentTarget.getBoundingClientRect()
    const relativeY = e.clientY - rect.top
    const heightRatio = relativeY / rect.height
    
    // Much more forgiving zones: top 45% = before, bottom 55% = after
    // This makes it easier to drop "between" blocks
    const position = heightRatio < 0.45 ? 'before' : 'after'
    
    setIsDragOver(true)
    setDragPosition(position)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const { clientX, clientY } = e
    
    // Check if we're actually leaving the element (not just entering a child)
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      setIsDragOver(false)
      setDragPosition(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const draggedBlockId = e.dataTransfer.getData('text/plain')
    
    if (draggedBlockId !== block.id && dragPosition) {
      onBlockReorder?.(draggedBlockId, block.id, dragPosition)
    }
    
    setIsDragOver(false)
    setDragPosition(null)
  }

  const createBlock = async (type: string, content: any, focusNew: boolean = true) => {
    try {
      console.log('Creating block:', { type, content, reportId })
      
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Current user:', user)
      
      if (!user) {
        console.error('User not authenticated')
        alert('Please log in to create blocks')
        return
      }
      
      if (!reportId) {
        console.error('No reportId provided')
        alert('No report ID found')
        return
      }
      
      // Insert new block after the current block
      const currentPosition = block.position
      console.log('Current block position:', currentPosition)
      
      // Get all blocks that need position updates
      const { data: blocksAfter, error: fetchError } = await supabase
        .from('blocks')
        .select('id, position')
        .eq('report_id', reportId)
        .gt('position', currentPosition)
        .order('position', { ascending: false })
      
      if (fetchError) {
        console.error('Error fetching blocks:', fetchError)
      }
      
      // Update positions from highest to lowest to avoid conflicts
      if (blocksAfter && blocksAfter.length > 0) {
        console.log('Updating positions for', blocksAfter.length, 'blocks')
        for (const b of blocksAfter) {
          const { error: updateError } = await supabase
            .from('blocks')
            .update({ position: b.position + 1 })
            .eq('id', b.id)
          
          if (updateError) {
            console.error('Error updating position for block', b.id, updateError)
          }
        }
      }
      
      const position = currentPosition + 1
      console.log('New block will be at position:', position)
      
      // Small delay to ensure position updates are committed
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const blockData = {
        report_id: reportId,
        type: type,
        position: position,
        content: content
      }
      
      console.log('Inserting block data:', blockData)
      
      const { data, error } = await supabase
        .from('blocks')
        .insert(blockData)
        .select()
        .single()

      if (error) {
        console.error('Supabase insert error:', error)
        alert(`Database error: ${error.message}`)
        return
      }
      
      console.log('Block created successfully:', data)
      onBlockCreated?.(data)
      
      // Focus the new block if requested
      if (focusNew && data) {
        setTimeout(() => {
          const newBlockElement = document.querySelector(`[data-block-id="${data.id}"]`)
          if (newBlockElement) {
            const editorElement = newBlockElement.querySelector('[contenteditable="true"]')
            if (editorElement) {
              (editorElement as HTMLElement).focus()
            }
          }
        }, 100)
      }
    } catch (error) {
      console.error('Create block failed:', error)
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleSlashCommand = async (command: string) => {
    setShowSlashCommand(false)
    const plainText = content.replace(/\/$/, '').trim() // Remove the slash and any trailing whitespace
    console.log('Handling slash command:', { command, plainText })
    
    switch (command) {
      case 'text':
        await createBlock('text', {
          html: `<p>${plainText || ''}</p>`,
          text: plainText,
          style: 'paragraph'
        })
        break
        
      case 'heading1':
        await createBlock('text', {
          html: `<h1>${plainText || 'Heading 1'}</h1>`,
          text: plainText || 'Heading 1',
          style: 'heading1'
        })
        break
        
      case 'heading2':
        await createBlock('text', {
          html: `<h2>${plainText || 'Heading 2'}</h2>`,
          text: plainText || 'Heading 2',
          style: 'heading2'
        })
        break
        
      case 'heading3':
        await createBlock('text', {
          html: `<h3>${plainText || 'Heading 3'}</h3>`,
          text: plainText || 'Heading 3',
          style: 'heading3'
        })
        break
        
      case 'bulletList':
        await createBlock('text', {
          html: `<ul><li>${plainText || 'List item'}</li></ul>`,
          text: plainText || 'List item',
          style: 'bulletList'
        })
        break
        
      case 'numberedList':
        await createBlock('text', {
          html: `<ol><li>${plainText || 'List item'}</li></ol>`,
          text: plainText || 'List item',
          style: 'numberedList'
        })
        break
        
      case 'quote':
        await createBlock('text', {
          html: `<blockquote>${plainText || 'Quote'}</blockquote>`,
          text: plainText || 'Quote',
          style: 'quote'
        })
        break

      case 'strong':
        await createBlock('text', {
          html: `<p><strong>${plainText || 'Strong text'}</strong></p>`,
          text: plainText || 'Strong text',
          style: 'strong'
        })
        break

      case 'caption':
        await createBlock('text', {
          html: `<p class="caption">${plainText || 'Caption text'}</p>`,
          text: plainText || 'Caption text',
          style: 'caption'
        })
        break
        
      case 'table':
        await createBlock('table', {
          headers: ['Column 1', 'Column 2', 'Column 3'],
          rows: [
            ['Row 1, Cell 1', 'Row 1, Cell 2', 'Row 1, Cell 3'],
            ['Row 2, Cell 1', 'Row 2, Cell 2', 'Row 2, Cell 3'],
          ]
        })
        break

      case 'metric':
        await createBlock('metric', {
          metrics: [
            { label: 'Metric 1', value: '100', format: 'number' },
            { label: 'Metric 2', value: '50', format: 'percentage' },
          ],
          columns: 2,
          style: 'card',
          backgroundColor: 'teal'
        })
        break
    }
    
    // Clear the slash from the current block
    const newContent = content.replace(/\/$/, '').trim()
    setContent(newContent)
    handleSave(newContent)
  }
  
  const styleMap = {
    heading1: 'text-2xl font-semibold text-gray-900',
    heading2: 'text-xl font-medium text-gray-900',
    heading3: 'text-lg font-medium text-gray-900',
    quote: 'border-l-2 border-gray-300 pl-3 italic text-gray-600 text-sm',
    paragraph: 'text-sm text-gray-700 leading-normal',
    strong: 'text-sm font-semibold text-gray-900 leading-normal',
    caption: 'text-xs text-gray-500 leading-normal',
    bulletList: 'text-sm text-gray-700 leading-normal',
    numberedList: 'text-sm text-gray-700 leading-normal',
  }

  const alignmentMap = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }
  
  const getDecorationClasses = () => {
    const decoration = block.content.decoration
    const bgColor = block.content.backgroundColor || 'teal'
    
    if (decoration === 'focus') {
      const colorMap = {
        slate: 'bg-slate-50/30 border-l-4 border-slate-400 pl-4',
        gray: 'bg-gray-50/30 border-l-4 border-gray-400 pl-4',
        blue: 'bg-blue-50/30 border-l-4 border-blue-400 pl-4',
        teal: 'bg-teal-50/30 border-l-4 border-teal-400 pl-4',
        cyan: 'bg-cyan-50/30 border-l-4 border-cyan-400 pl-4',
        green: 'bg-green-50/30 border-l-4 border-green-400 pl-4',
        purple: 'bg-purple-50/30 border-l-4 border-purple-400 pl-4',
        pink: 'bg-pink-50/30 border-l-4 border-pink-400 pl-4',
        red: 'bg-red-50/30 border-l-4 border-red-400 pl-4',
        orange: 'bg-orange-50/30 border-l-4 border-orange-400 pl-4',
        yellow: 'bg-yellow-50/30 border-l-4 border-yellow-400 pl-4',
      }
      return colorMap[bgColor as keyof typeof colorMap] || ''
    }
    
    if (decoration === 'card') {
      const colorMap = {
        slate: 'bg-slate-50/50 border border-slate-200 rounded-lg shadow-sm p-3',
        gray: 'bg-gray-50/50 border border-gray-200 rounded-lg shadow-sm p-3',
        blue: 'bg-blue-50/50 border border-blue-200 rounded-lg shadow-sm p-3',
        teal: 'bg-teal-50/50 border border-teal-200 rounded-lg shadow-sm p-3',
        cyan: 'bg-cyan-50/50 border border-cyan-200 rounded-lg shadow-sm p-3',
        green: 'bg-green-50/50 border border-green-200 rounded-lg shadow-sm p-3',
        purple: 'bg-purple-50/50 border border-purple-200 rounded-lg shadow-sm p-3',
        pink: 'bg-pink-50/50 border border-pink-200 rounded-lg shadow-sm p-3',
        red: 'bg-red-50/50 border border-red-200 rounded-lg shadow-sm p-3',
        orange: 'bg-orange-50/50 border border-orange-200 rounded-lg shadow-sm p-3',
        yellow: 'bg-yellow-50/50 border border-yellow-200 rounded-lg shadow-sm p-3',
      }
      return colorMap[bgColor as keyof typeof colorMap] || ''
    }
    
    return ''
  }
  
  // Always show editable input in edit mode
  if (editMode) {
    return (
      <div
        data-block-id={block.id}
        className={cn(
          "relative group mb-1 px-3 py-2 -mx-2 rounded transition-all",
          isSelected && "bg-blue-50/40",
          !isSelected && !block.content.decoration && "hover:bg-gray-50/50",
          isDragOver && dragPosition === 'before' && "border-t-4 border-blue-500 shadow-lg bg-blue-50/20",
          isDragOver && dragPosition === 'after' && "border-b-4 border-blue-500 shadow-lg bg-blue-50/20",
          getDecorationClasses()
        )}
        onClick={(e) => {
          e.stopPropagation()
          onSelect?.()
        }}
        draggable={true}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag Handle - appears on hover */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="w-4 h-4 flex items-center justify-center cursor-grab active:cursor-grabbing">
            <div className="grid grid-cols-2 gap-0.5">
              <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        </div>
        
        <div className="relative flex-1">
          <TextBlockEditor
            value={content}
            onChange={(htmlContent) => {
              console.log('Editor onChange:', htmlContent)
              console.log('HTML structure:', htmlContent.replace(/</g, '\n<'))
              setContent(htmlContent)
              handleSave(htmlContent)
              
              // Check for slash command
              const tempDiv = document.createElement('div')
              tempDiv.innerHTML = htmlContent
              const plainText = tempDiv.textContent || ''
              
              if (plainText.endsWith('/')) {
                console.log('Slash detected, showing command menu')
                // Get the editor element position
                const editorElement = document.querySelector('[contenteditable="true"]')
                if (editorElement) {
                  const rect = editorElement.getBoundingClientRect()
                  setSlashPosition({ x: rect.left, y: rect.bottom })
                  setShowSlashCommand(true)
                }
              } else {
                setShowSlashCommand(false)
              }
            }}
            onCreateNewBlock={() => {
              // Check if we're in a list context
              const editorElement = document.querySelector(`[data-block-id="${block.id}"] [contenteditable="true"]`)
              if (editorElement) {
                const htmlContent = editorElement.innerHTML
                const isInList = htmlContent.includes('<ul>') || htmlContent.includes('<ol>')
                
                if (isInList) {
                  // Exit list and create paragraph block
                  createBlock('text', { html: '<p></p>', text: '', style: 'paragraph' })
                } else {
                  // Create a new block with the same style
                  const newStyle = block.content.style || 'paragraph'
                  let newHtml = '<p></p>'
                  
                  switch (newStyle) {
                    case 'heading1':
                      newHtml = '<h1></h1>'
                      break
                    case 'heading2':
                      newHtml = '<h2></h2>'
                      break
                    case 'heading3':
                      newHtml = '<h3></h3>'
                      break
                    case 'quote':
                      newHtml = '<blockquote></blockquote>'
                      break
                    case 'bulletList':
                      newHtml = '<ul><li></li></ul>'
                      break
                    case 'numberedList':
                      newHtml = '<ol><li></li></ol>'
                      break
                  }
                  
                  createBlock('text', { html: newHtml, text: '', style: newStyle })
                }
              }
            }}
            onDeleteBlock={() => handleDelete()}
            editable={true}
            placeholder={style === 'bulletList' || style === 'numberedList' ? "Type list item..." : "Type something..."}
            autoFocus={false}
            className={cn(
              styleMap[style] || styleMap.paragraph,
              alignmentMap[block.content.alignment as keyof typeof alignmentMap] || alignmentMap.left,
              (style === 'bulletList' || style === 'numberedList') && "pl-6"
            )}
          />
        </div>
        
        {showSlashCommand && (
          <SlashCommand
            onSelectCommand={handleSlashCommand}
            onClose={() => setShowSlashCommand(false)}
            position={slashPosition}
          />
        )}
        
        {/* Helper text for lists */}
        {editMode && isSelected && (style === 'bulletList' || style === 'numberedList') && (
          <div className="absolute -bottom-6 left-0 text-xs text-gray-400">
            Shift+Enter: new item • Enter: exit list
          </div>
        )}
      </div>
    )
  }
  
  // View mode - static display
  return (
    <div
      id={block.id}
      className={cn(
        "relative group mb-1 px-3 py-2 -mx-2 rounded transition-all cursor-text",
        isSelected && "bg-blue-50/40",
        !isSelected && !block.content.decoration && "hover:bg-gray-50/50",
        isDragOver && dragPosition === 'before' && "border-t-4 border-blue-500 shadow-lg bg-blue-50/20",
        isDragOver && dragPosition === 'after' && "border-b-4 border-blue-500 shadow-lg bg-blue-50/20",
        getDecorationClasses()
      )}
      onClick={(e) => {
        e.stopPropagation()
        onSelect?.()
      }}
      draggable={true}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Handle - appears on hover */}
      <div 
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="w-4 h-4 flex items-center justify-center cursor-grab active:cursor-grabbing">
          <div className="grid grid-cols-2 gap-0.5">
            <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
            <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
            <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
            <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
            <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
            <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
          </div>
        </div>
      </div>
      
      {/* Content display */}
      <div 
        className={cn(
          styleMap[style] || styleMap.paragraph,
          alignmentMap[block.content.alignment as keyof typeof alignmentMap] || alignmentMap.left
        )} 
        dangerouslySetInnerHTML={{ __html: block.content.html }} 
      />
      
    </div>
  )
} 