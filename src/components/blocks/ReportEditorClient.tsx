'use client'
import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { BlockRenderer } from './BlockRenderer'
import { Button } from '@/components/ui/button'
import { Block } from '@/lib/blocks/types'
import { cn } from '@/lib/utils'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function ReportEditorClient({ report, blocks: initialBlocks }: { report: any, blocks: Block[] }) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [selectedBlockType, setSelectedBlockType] = useState<string | null>(null)
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks)
  const [mounted, setMounted] = useState(false)
  const supabase = createClientComponentClient()
  const editMode = true // Always in edit mode for MVP

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleBlockSelect = (blockId: string, blockType: string) => {
    setSelectedBlockId(blockId)
    setSelectedBlockType(blockType)
  }

  const handleDeleteReport = async () => {
    if (!report?.id) return
    
    const confirmDelete = window.confirm('Are you sure you want to delete this report? This action cannot be undone.')
    if (!confirmDelete) return

    try {
      // Delete all blocks first (cascade should handle this, but being explicit)
      await supabase
        .from('blocks')
        .delete()
        .eq('report_id', report.id)

      // Then delete the report
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', report.id)

      if (error) {
        console.error('Error deleting report:', error)
        alert('Failed to delete report. Please try again.')
        return
      }

      // Redirect to reports list
      window.location.href = '/reports'
    } catch (error) {
      console.error('Error deleting report:', error)
      alert('An error occurred while deleting the report.')
    }
  }
  
  const updateBlockStyle = async (style: string, value: any) => {
    if (!selectedBlockId) return
    
    const block = blocks.find(b => b.id === selectedBlockId)
    if (!block) return
    
    let updatedContent = { ...block.content }
    
    if (style === 'decoration') {
      updatedContent.decoration = value
    } else if (style === 'backgroundColor') {
      updatedContent.backgroundColor = value
    } else if (style === 'alignment') {
      updatedContent.alignment = value
    } else if (style === 'textStyle') {
      updatedContent.style = value
      
      // Update HTML to match the new style
      const text = updatedContent.text || ''
      switch (value) {
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
          updatedContent.html = `<ul><li>${text}</li></ul>`
          break
        case 'numberedList':
          updatedContent.html = `<ol><li>${text}</li></ol>`
          break
        case 'strong':
          updatedContent.html = `<p><strong>${text}</strong></p>`
          break
        case 'caption':
          updatedContent.html = `<p class="caption">${text}</p>`
          break
        case 'paragraph':
        default:
          updatedContent.html = `<p>${text}</p>`
          break
      }
    }
    
    // Update locally first for instant feedback
    setBlocks(blocks.map(b => 
      b.id === selectedBlockId 
        ? { ...b, content: updatedContent }
        : b
    ))
    
    // Then update in database
    await supabase
      .from('blocks')
      .update({ 
        content: updatedContent,
        metadata: {
          ...block.metadata,
          updatedAt: new Date().toISOString()
        }
      })
      .eq('id', selectedBlockId)
  }

  // Generate table of contents from H1 blocks only
  const tableOfContents = blocks
    .filter(block => {
      if (block.type !== 'text') return false
      // Only include H1 headings
      const hasH1 = block.content.html?.includes('<h1') || block.content.style === 'heading1'
      return hasH1
    })
    .map(block => {
      // Extract text from HTML - only on client side
      let text = block.content.text || 'Untitled'
      let level = 3
      
      if (typeof window !== 'undefined' && block.content.html) {
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = block.content.html
        const headingElement = tempDiv.querySelector('h1, h2, h3')
        text = headingElement?.textContent || block.content.text || 'Untitled'
        level = headingElement?.tagName === 'H1' ? 1 : headingElement?.tagName === 'H2' ? 2 : 3
      } else {
        // Fallback for SSR - determine level from style
        if (block.content.style === 'heading1') level = 1
        else if (block.content.style === 'heading2') level = 2
        else if (block.content.style === 'heading3') level = 3
      }
      
      return {
        id: block.id,
        text,
        level
      }
    })

  return (
    <MainLayout>
      <div className="flex h-screen bg-gray-50">
        {/* Left Sidebar - Table of Contents */}
        <div className="w-72 bg-gray-100 overflow-y-auto">
          {/* Back button */}
          <div className="p-4 border-b border-gray-200">
            <a
              href="/reports"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Reports
            </a>
          </div>
          
          {/* Report info */}
          <div className="px-4 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-black rounded flex items-center justify-center">
                  <span className="text-white text-xs">📄</span>
                </div>
                <h1 className="text-sm font-medium text-gray-900">{report?.title || 'Untitled Report'}</h1>
              </div>
              <button
                onClick={handleDeleteReport}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete report"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <span className="text-xs text-gray-500 ml-7">
              {mounted && report?.created_at ? 
                new Date(report.created_at).toLocaleDateString() : 
                'Just now'
              }
            </span>
          </div>
          
          {/* Table of Contents */}
          <div className="px-4 py-4">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Table of Contents</h2>
            <nav className="space-y-1">
              {tableOfContents.length > 0 ? (
                tableOfContents.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      if (typeof window !== 'undefined') {
                        document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })
                      }
                    }}
                    className="block py-1.5 px-2 text-sm text-gray-600 hover:bg-gray-200 rounded transition-colors"
                  >
                    {item.text}
                  </a>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic">No headings found. Use Title format to add items.</p>
              )}
            </nav>
          </div>
        </div>

        {/* Center Content Area */}
        <div 
          className="flex-1 overflow-y-auto bg-white"
          onClick={() => {
            // Clear selection when clicking on empty space
            setSelectedBlockId(null)
            setSelectedBlockType(null)
          }}
        >
          <div className="max-w-4xl mx-auto px-16 py-12">
            <div id="top" className="mb-8">
              <h1 className="text-2xl font-medium text-gray-900 mb-2">{report.title}</h1>
              {report.description && (
                <p className="text-sm text-gray-600">{report.description}</p>
              )}
            </div>
            <BlockRenderer 
              blocks={blocks} 
              editMode={editMode} 
              reportId={report.id}
              selectedBlockId={selectedBlockId}
              onBlockSelect={handleBlockSelect}
              onBlocksUpdate={setBlocks}
            />
          </div>
        </div>

        {/* Right Formatting Panel */}
        <div className="w-80 bg-gray-100 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">Insert</span>
              <span className="text-xs font-medium text-gray-900">Format</span>
              <span className="text-xs text-gray-500">Style</span>
              <span className="text-xs text-gray-500">Info</span>
            </div>
          </div>
          

          {/* Formatting options - always show */}
          <div className="space-y-4">
              {/* Titles Section */}
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">TITLES</h3>
                <div className="grid grid-cols-3 gap-1">
                  <button 
                    className={cn(
                      "p-1.5 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50",
                      blocks.find(b => b.id === selectedBlockId)?.content?.style === 'heading1' && "bg-blue-100 border-blue-200"
                    )}
                    onClick={() => updateBlockStyle('textStyle', 'heading1')}
                  >
                    Title
                  </button>
                  <button 
                    className={cn(
                      "p-1.5 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50",
                      blocks.find(b => b.id === selectedBlockId)?.content?.style === 'heading2' && "bg-blue-100 border-blue-200"
                    )}
                    onClick={() => updateBlockStyle('textStyle', 'heading2')}
                  >
                    Subtitle
                  </button>
                  <button 
                    className={cn(
                      "p-1.5 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50",
                      blocks.find(b => b.id === selectedBlockId)?.content?.style === 'heading3' && "bg-blue-100 border-blue-200"
                    )}
                    onClick={() => updateBlockStyle('textStyle', 'heading3')}
                  >
                    Heading
                  </button>
                </div>
              </div>

              {/* Content Section */}
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">CONTENT</h3>
                <div className="grid grid-cols-3 gap-1">
                  <button 
                    className={cn(
                      "p-1.5 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50",
                      blocks.find(b => b.id === selectedBlockId)?.content?.style === 'strong' && "bg-blue-100 border-blue-200"
                    )}
                    onClick={() => updateBlockStyle('textStyle', 'strong')}
                  >
                    Strong
                  </button>
                  <button 
                    className={cn(
                      "p-1.5 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50",
                      blocks.find(b => b.id === selectedBlockId)?.content?.style === 'paragraph' && "bg-blue-100 border-blue-200"
                    )}
                    onClick={() => updateBlockStyle('textStyle', 'paragraph')}
                  >
                    Body
                  </button>
                  <button 
                    className={cn(
                      "p-1.5 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50",
                      blocks.find(b => b.id === selectedBlockId)?.content?.style === 'caption' && "bg-blue-100 border-blue-200"
                    )}
                    onClick={() => updateBlockStyle('textStyle', 'caption')}
                  >
                    Caption
                  </button>
                </div>
              </div>

              {/* Lists Section */}
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">LISTS</h3>
                <div className="grid grid-cols-2 gap-1">
                  <button 
                    className={cn(
                      "p-1.5 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50",
                      blocks.find(b => b.id === selectedBlockId)?.content?.style === 'bulletList' && "bg-blue-100 border-blue-200"
                    )}
                    onClick={() => updateBlockStyle('textStyle', 'bulletList')}
                  >
                    • Bullet
                  </button>
                  <button 
                    className={cn(
                      "p-1.5 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50",
                      blocks.find(b => b.id === selectedBlockId)?.content?.style === 'numberedList' && "bg-blue-100 border-blue-200"
                    )}
                    onClick={() => updateBlockStyle('textStyle', 'numberedList')}
                  >
                    1. Number
                  </button>
                </div>
                <div className="mt-1">
                  <button 
                    className={cn(
                      "w-full p-1.5 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50",
                      blocks.find(b => b.id === selectedBlockId)?.content?.style === 'quote' && "bg-blue-100 border-blue-200"
                    )}
                    onClick={() => updateBlockStyle('textStyle', 'quote')}
                  >
                    " Quote
                  </button>
                </div>
              </div>

              {/* Alignment Section */}
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">ALIGNMENT</h3>
                <div className="grid grid-cols-3 gap-1">
                  <button 
                    className={cn(
                      "p-1.5 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50",
                      blocks.find(b => b.id === selectedBlockId)?.content?.alignment === 'left' && "bg-blue-100 border-blue-200"
                    )}
                    onClick={() => updateBlockStyle('alignment', 'left')}
                    title="Align left"
                  >
                    <svg className="w-3 h-3 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
                    </svg>
                  </button>
                  <button 
                    className={cn(
                      "p-1.5 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50",
                      blocks.find(b => b.id === selectedBlockId)?.content?.alignment === 'center' && "bg-blue-100 border-blue-200"
                    )}
                    onClick={() => updateBlockStyle('alignment', 'center')}
                    title="Align center"
                  >
                    <svg className="w-3 h-3 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
                    </svg>
                  </button>
                  <button 
                    className={cn(
                      "p-1.5 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50",
                      blocks.find(b => b.id === selectedBlockId)?.content?.alignment === 'right' && "bg-blue-100 border-blue-200"
                    )}
                    onClick={() => updateBlockStyle('alignment', 'right')}
                    title="Align right"
                  >
                    <svg className="w-3 h-3 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Groups Section */}
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">GROUPS</h3>
                <div className="grid grid-cols-2 gap-1">
                  <button className="p-2 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center justify-center">
                    <span className="mr-1 text-xs">📄</span> Page
                  </button>
                  <button className="p-2 text-xs bg-blue-100 border border-blue-200 rounded hover:bg-blue-50 flex items-center justify-center">
                    <span className="mr-1 text-xs">📄</span> Card
                  </button>
                </div>
              </div>
              
              {/* Decorations Section */}
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">DECORATIONS</h3>
                <div className="grid grid-cols-2 gap-1">
                  <button 
                    className={cn(
                      "p-2 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center justify-center",
                      blocks.find(b => b.id === selectedBlockId)?.content?.decoration === 'focus' && "bg-blue-100 border-blue-200"
                    )}
                    onClick={() => {
                      const current = blocks.find(b => b.id === selectedBlockId)?.content?.decoration
                      updateBlockStyle('decoration', current === 'focus' ? null : 'focus')
                    }}
                  >
                    <span className="mr-1 text-xs">🔲</span> Focus
                  </button>
                  <button 
                    className={cn(
                      "p-2 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center justify-center",
                      blocks.find(b => b.id === selectedBlockId)?.content?.decoration === 'card' && "bg-blue-100 border-blue-200"
                    )}
                    onClick={() => {
                      const current = blocks.find(b => b.id === selectedBlockId)?.content?.decoration
                      updateBlockStyle('decoration', current === 'card' ? null : 'card')
                    }}
                  >
                    <span className="mr-1 text-xs">🎫</span> Block
                  </button>
                </div>
              </div>

              {/* Color Section */}
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">COLOR</h3>
                <div className="flex gap-1.5 flex-wrap">
                  {/* Clear color button */}
                  <button
                    className={cn(
                      "w-6 h-6 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-all flex items-center justify-center",
                      !blocks.find(b => b.id === selectedBlockId)?.content?.backgroundColor && "ring-1 ring-blue-500"
                    )}
                    onClick={() => updateBlockStyle('backgroundColor', null)}
                    title="No color"
                  >
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  {[
                    { name: 'slate', class: 'bg-slate-300 hover:ring-slate-400' },
                    { name: 'gray', class: 'bg-gray-400 hover:ring-gray-500' },
                    { name: 'blue', class: 'bg-blue-400 hover:ring-blue-500' },
                    { name: 'teal', class: 'bg-teal-400 hover:ring-teal-500' },
                    { name: 'cyan', class: 'bg-cyan-400 hover:ring-cyan-500' },
                    { name: 'green', class: 'bg-green-400 hover:ring-green-500' },
                    { name: 'purple', class: 'bg-purple-400 hover:ring-purple-500' },
                    { name: 'pink', class: 'bg-pink-400 hover:ring-pink-500' },
                    { name: 'red', class: 'bg-red-400 hover:ring-red-500' },
                    { name: 'orange', class: 'bg-orange-400 hover:ring-orange-500' },
                    { name: 'amber', class: 'bg-amber-400 hover:ring-amber-500' },
                    { name: 'yellow', class: 'bg-yellow-400 hover:ring-yellow-500' }
                  ].map((color) => (
                    <button
                      key={color.name}
                      className={cn(
                        "w-6 h-6 rounded-full hover:ring-1 transition-all",
                        color.class,
                        blocks.find(b => b.id === selectedBlockId)?.content?.backgroundColor === color.name && "ring-1"
                      )}
                      onClick={() => updateBlockStyle('backgroundColor', color.name)}
                    />
                  ))}
                </div>
              </div>

              {/* Font Section */}
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">FONT</h3>
                <div className="space-y-1">
                  <button className="w-full p-1.5 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50 text-left flex items-center">
                    <span className="font-normal text-sm">Aa</span>
                    <span className="ml-2 text-gray-600">- Default</span>
                  </button>
                  <button className="w-full p-1.5 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50 text-left flex items-center">
                    <span className="font-serif text-sm">Aa</span>
                    <span className="ml-2 text-gray-600">- Serif</span>
                  </button>
                  <button className="w-full p-1.5 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50 text-left flex items-center">
                    <span className="font-mono text-sm">Aa</span>
                    <span className="ml-2 text-gray-600">- Mono</span>
                  </button>
                </div>
              </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
} 