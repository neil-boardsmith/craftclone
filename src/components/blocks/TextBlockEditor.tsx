'use client'
import { useEditor, EditorContent, Extension } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'
import { Node, mergeAttributes } from '@tiptap/core'

// Custom HardBreak node that creates more space
const CustomHardBreak = Node.create({
  name: 'hardBreak',
  
  inline: true,
  
  group: 'inline',
  
  selectable: false,
  
  parseHTML() {
    return [
      { tag: 'br' },
    ]
  },
  
  renderHTML({ HTMLAttributes }) {
    // Instead of just a br, render a br followed by a non-breaking space with styling
    return ['span', mergeAttributes(HTMLAttributes, { 
      'data-hard-break': true,
      style: 'display: block; height: 0.75rem;'
    }), ['br']]
  },
  
  renderText() {
    return '\n'
  },
  
  addCommands() {
    return {
      setHardBreak: () => ({ commands, chain, state, editor }) => {
        return commands.first([
          () => commands.exitCode(),
          () => commands.insertContent({ type: this.name }),
        ])
      },
    }
  },
  
  addKeyboardShortcuts() {
    return {
      'Shift-Enter': () => this.editor.commands.setHardBreak(),
    }
  },
})

// Custom extension to handle Enter and Shift+Enter
const CustomKeyHandler = Extension.create({
  name: 'customKeyHandler',
  
  addKeyboardShortcuts() {
    return {
      'Enter': ({ editor }) => {
        const { state } = editor
        const { selection } = state
        const { $from, empty } = selection
        
        // Check if we're in a list by looking at the current node and its parents
        const { schema } = state
        const listItemType = schema.nodes.listItem
        
        // Check if we're inside a list item
        let $listItem = null
        for (let depth = $from.depth; depth > 0; depth--) {
          if ($from.node(depth).type === listItemType) {
            $listItem = $from.before(depth)
            break
          }
        }
        
        if ($listItem !== null) {
          // We're in a list
          const listItem = $from.node($from.depth)
          
          // Check if the current list item is empty
          if (empty && listItem && listItem.textContent === '') {
            // Empty list item - exit the list and create a new block
            
            // Try to lift out of the list
            const canLift = editor.can().liftListItem('listItem')
            if (canLift) {
              editor.chain()
                .liftListItem('listItem')
                .run()
              
              // After lifting, create a new block
              setTimeout(() => {
                this.options.onCreateNewBlock?.()
              }, 50)
              return true
            }
          }
          
          // Non-empty list item - let Tiptap handle creating a new list item
          return false
        }
        
        // Not in a list - create a new block
        this.options.onCreateNewBlock?.()
        return true
      },
      'Backspace': ({ editor }) => {
        const { state } = editor
        const { selection } = state
        const { empty, $from } = selection
        
        // Check if the editor is empty
        if (empty && $from.pos === 1 && state.doc.textContent === '') {
          // Delete this block
          this.options.onDeleteBlock?.()
          return true
        }
        
        return false
      },
      'Delete': ({ editor }) => {
        const { state } = editor
        const { selection } = state
        const { empty, $from } = selection
        
        // Check if the editor is empty
        if (empty && $from.pos === 1 && state.doc.textContent === '') {
          // Delete this block
          this.options.onDeleteBlock?.()
          return true
        }
        
        return false
      },
    }
  },
})

export function TextBlockEditor({
  value,
  onChange,
  editable = true,
  placeholder = 'Type something...',
  autoFocus = false,
  className = '',
  onCreateNewBlock,
  onDeleteBlock
}: {
  value?: string
  onChange: (html: string) => void
  editable?: boolean
  placeholder?: string
  autoFocus?: boolean
  className?: string
  onCreateNewBlock?: () => void
  onDeleteBlock?: () => void
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure the extensions properly
        heading: {
          levels: [1, 2, 3],
        },
        // Disable the default hardBreak to use our custom implementation
        hardBreak: false,
      }),
      CustomHardBreak,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      CustomKeyHandler.configure({
        onCreateNewBlock,
        onDeleteBlock,
      }),
    ],
    content: value || '<p></p>',
    editable,
    autofocus: autoFocus,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
    },
    editorProps: {
      attributes: {
        class: `outline-none ${className}`,
      },
    },
    immediatelyRender: false,
  })

  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && value && value !== editor.getHTML()) {
      editor.commands.setContent(value, false)
    }
  }, [value])

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable)
    }
  }, [editor, editable])

  if (!editor) return null

  return (
    <div className="w-full">
      <EditorContent editor={editor} />
    </div>
  )
} 