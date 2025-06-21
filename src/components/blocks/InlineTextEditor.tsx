'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import { useEffect, useState } from 'react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Extension } from '@tiptap/core'
import { SlashCommand } from './SlashCommand'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Block } from '@/lib/blocks/types'

// Custom extension to handle Enter key
const EnterKeyExtension = Extension.create({
  name: 'enterKey',

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        // Get current content
        const content = editor.getHTML()
        const plainText = content.replace(/<[^>]*>/g, '').trim()
        
        // Only create block if there's actual content
        if (plainText) {
          // Trigger the onEnter callback with the content
          this.options.onEnter?.(content)
          
          // Clear the editor
          editor.commands.clearContent()
        }
        
        return true
      },
    }
  },
})

interface InlineTextEditorProps {
  onBlockCreated: (block: Block) => void
  reportId: string
  placeholder?: string
  autoFocus?: boolean
}

export function InlineTextEditor({ onBlockCreated, reportId, placeholder = "Type '/' for commands or just start writing...", autoFocus = false }: InlineTextEditorProps) {
  const [showSlashCommand, setShowSlashCommand] = useState(false)
  const [slashPosition, setSlashPosition] = useState({ x: 0, y: 0 })
  const supabase = createClientComponentClient()

  const createBlock = async (type: string, content: any) => {
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
      
      // Check if user owns this report
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .select('id, created_by')
        .eq('id', reportId)
        .single()
      
      if (reportError) {
        console.error('Report check failed:', reportError)
        alert(`Cannot access report: ${reportError.message}`)
        return
      }
      
      console.log('Report check:', { report, userId: user.id })
      
      // Use a smaller number for position (count of existing blocks + 1)
      const { count } = await supabase
        .from('blocks')
        .select('*', { count: 'exact', head: true })
        .eq('report_id', reportId)
      
      const position = (count || 0) + 1
      console.log('Position for new block:', position)
      
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
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        alert(`Database error: ${error.message}`)
        return
      }
      
      console.log('Block created successfully:', data)
      onBlockCreated(data)
    } catch (error) {
      console.error('Create block failed:', error)
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleEnterKey = async (content: string) => {
    const plainText = content.replace(/<[^>]*>/g, '').trim()
    
    if (plainText && reportId) {
      console.log('Creating block with content:', { content, plainText, reportId })
      await createBlock('text', {
        html: content,
        text: plainText,
        style: 'paragraph'
      })
    } else {
      console.log('No content or reportId to create block with:', { plainText, reportId })
    }
  }

  const handleSlashCommand = async (command: string) => {
    setShowSlashCommand(false)
    const text = editor?.getText()?.slice(0, -1) || '' // Remove the slash
    const plainText = text.trim()
    console.log('Handling slash command:', { command, text, plainText })
    
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
          style: 'paragraph'
        })
        break
        
      case 'numberedList':
        await createBlock('text', {
          html: `<ol><li>${plainText || 'List item'}</li></ol>`,
          text: plainText || 'List item',
          style: 'paragraph'
        })
        break
        
      case 'quote':
        await createBlock('text', {
          html: `<blockquote>${plainText || 'Quote'}</blockquote>`,
          text: plainText || 'Quote',
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
    }
    
    editor?.commands.clearContent()
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      EnterKeyExtension.configure({
        onEnter: handleEnterKey,
      }),
    ],
    autofocus: autoFocus,
    editorProps: {
      attributes: {
        class: 'outline-none text-sm text-gray-700 leading-normal min-h-[24px]',
      },
      handleKeyDown: (view, event) => {
        // Handle slash command detection on keydown
        if (event.key === '/') {
          setTimeout(() => {
            const text = editor?.getText() || ''
            if (text.endsWith('/')) {
              console.log('Slash detected via keydown')
              const selection = window.getSelection()
              if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0)
                const rect = range.getBoundingClientRect()
                setSlashPosition({ x: rect.left, y: rect.top })
                setShowSlashCommand(true)
              }
            }
          }, 0)
        }
        return false
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML()
      const text = editor.getText()
      
      console.log('Editor update:', { content, text })
      
      // Check for slash command
      if (text.endsWith('/')) {
        console.log('Slash detected, showing command menu')
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
    },
  })

  useEffect(() => {
    console.log('InlineTextEditor mounted, editor:', editor)
  }, [editor])

  return (
    <div className="relative">
      <div className="px-2 py-1 min-h-[32px]">
        <EditorContent editor={editor} />
      </div>
      
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