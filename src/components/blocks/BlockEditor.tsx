'use client'
import { useState } from 'react'
import { TextBlockEditor } from './TextBlockEditor'
import { SlashCommand } from './SlashCommand'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Block } from '@/lib/blocks/types'

interface BlockEditorProps {
  reportId: string
  onBlockCreated: (block: Block) => void
  initialContent?: string
  placeholder?: string
  autoFocus?: boolean
}

export function BlockEditor({ reportId, onBlockCreated, initialContent = '', placeholder = 'Type \'/\' for commands...', autoFocus = false }: BlockEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [showSlashCommand, setShowSlashCommand] = useState(false)
  const [slashPosition, setSlashPosition] = useState({ x: 0, y: 0 })
  const [isCreating, setIsCreating] = useState(false)
  const supabase = createClientComponentClient()

  const handleContentChange = (html: string) => {
    setContent(html)
    
    // Check for slash command
    if (html.endsWith('/')) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        setSlashPosition({ x: rect.left, y: rect.top })
        setShowSlashCommand(true)
      }
    } else {
      setShowSlashCommand(false)
    }
  }

  const createBlock = async (type: string, blockContent: Record<string, unknown>) => {
    if (!reportId || isCreating) return
    
    setIsCreating(true)
    
    try {
      const position = Date.now() // Simple position system
      const { data, error } = await supabase
        .from('blocks')
        .insert({
          report_id: reportId,
          type,
          position,
          content: blockContent,
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        })
        .select()
        .single()

      if (error) throw error

      onBlockCreated(data)
      setContent('')
    } catch (error) {
      console.error('Failed to create block:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleSlashCommand = async (command: string) => {
    setShowSlashCommand(false)
    
    // Remove the slash from content
    const cleanContent = content.slice(0, -1)
    
    switch (command) {
      case 'text':
        if (cleanContent.trim()) {
          await createBlock('text', {
            html: cleanContent,
            text: cleanContent.replace(/<[^>]*>/g, ''),
            style: 'paragraph'
          })
        }
        break
        
      case 'heading1':
        await createBlock('text', {
          html: `<h1>${cleanContent || 'Heading 1'}</h1>`,
          text: cleanContent || 'Heading 1',
          style: 'heading1'
        })
        break
        
      case 'heading2':
        await createBlock('text', {
          html: `<h2>${cleanContent || 'Heading 2'}</h2>`,
          text: cleanContent || 'Heading 2',
          style: 'heading2'
        })
        break
        
      case 'heading3':
        await createBlock('text', {
          html: `<h3>${cleanContent || 'Heading 3'}</h3>`,
          text: cleanContent || 'Heading 3',
          style: 'heading3'
        })
        break
        
      case 'bulletList':
        await createBlock('text', {
          html: `<ul><li>${cleanContent || 'List item'}</li></ul>`,
          text: cleanContent || 'List item',
          style: 'paragraph'
        })
        break
        
      case 'numberedList':
        await createBlock('text', {
          html: `<ol><li>${cleanContent || 'List item'}</li></ol>`,
          text: cleanContent || 'List item',
          style: 'paragraph'
        })
        break
        
      case 'quote':
        await createBlock('text', {
          html: `<blockquote>${cleanContent || 'Quote'}</blockquote>`,
          text: cleanContent || 'Quote',
          style: 'quote'
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
        
      default:
        console.log('Command not implemented:', command)
    }
  }

  const handleCreateTextBlock = async () => {
    if (!content.trim() || isCreating) return
    
    await createBlock('text', {
      html: content,
      text: content.replace(/<[^>]*>/g, ''),
      style: 'paragraph'
    })
  }

  return (
    <div className="relative">
      <TextBlockEditor
        value={content}
        onChange={handleContentChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      
      {content.trim() && !showSlashCommand && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleCreateTextBlock}
            disabled={isCreating}
            className="px-3 py-1 text-sm bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Add Block'}
          </button>
          <button
            onClick={() => setContent('')}
            disabled={isCreating}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}

      {showSlashCommand && (
        <SlashCommand
          onSelectCommand={handleSlashCommand}
          onClose={() => setShowSlashCommand(false)}
          position={slashPosition}
        />
      )}
    </div>
  )
}