'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Heading from '@tiptap/extension-heading'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import Blockquote from '@tiptap/extension-blockquote'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from '@/components/ui/button'

export function TextBlockEditor({
  value,
  onChange,
  editable = true,
  placeholder = 'Type something...',
  autoFocus = false
}: {
  value?: string
  onChange: (html: string) => void
  editable?: boolean
  placeholder?: string
  autoFocus?: boolean
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Bold,
      Italic,
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList,
      OrderedList,
      ListItem,
      Blockquote,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '',
    editable,
    autofocus: autoFocus,
    editorProps: {
      attributes: {
        class: 'min-h-[80px] outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) return null

  return (
    <div className="bg-white rounded p-2">
      <EditorContent editor={editor} />
    </div>
  )
} 