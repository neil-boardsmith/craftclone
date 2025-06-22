'use client'
import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { BlockRenderer } from './BlockRenderer'
import { Button } from '@/components/ui/button'
import { Block } from '@/lib/blocks/types'
import { cn } from '@/lib/utils'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Menu, X, ChevronLeft } from 'lucide-react'

export default function ReportEditorClient({ report, blocks: initialBlocks }: { report: any, blocks: Block[] }) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [selectedBlockType, setSelectedBlockType] = useState<string | null>(null)
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks)
  const [mounted, setMounted] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [showMobileFormatPanel, setShowMobileFormatPanel] = useState(false)
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

      // Redirect to reports page
      window.location.href = '/reports'
    } catch (error) {
      console.error('Error deleting report:', error)
      alert('An unexpected error occurred. Please try again.')
    }
  }

  const updateBlockStyle = async (property: string, value: any) => {
    if (!selectedBlockId) return
    
    const block = blocks.find(b => b.id === selectedBlockId)
    if (!block) return

    let updatedContent = { ...block.content }
    
    if (property === 'textStyle') {
      // For text blocks, update the style property
      updatedContent.style = value
    } else if (property === 'alignment') {
      updatedContent.alignment = value
    } else if (property === 'decoration') {
      updatedContent.decoration = value
    } else if (property === 'backgroundColor') {
      updatedContent.backgroundColor = value
    }

    // Update database
    const { error } = await supabase
      .from('blocks')
      .update({ content: updatedContent })
      .eq('id', selectedBlockId)

    if (!error) {
      // Update local state
      setBlocks(blocks.map(b => 
        b.id === selectedBlockId 
          ? { ...b, content: updatedContent }
          : b
      ))
    }
  }

  // Extract table of contents from blocks with headings
  const tableOfContents = blocks
    .filter((block) => {
      if (block.type !== 'text') return false
      const style = block.content.style
      return style === 'heading1' || style === 'heading2' || style === 'heading3'
    })
    .map((block) => {
      // Use the text content directly to avoid hydration issues
      const text = block.content.text || 'Untitled'
      
      // Determine level from style
      let level = 1
      if (block.content.style === 'heading1') level = 1
      else if (block.content.style === 'heading2') level = 2
      else if (block.content.style === 'heading3') level = 3
      
      return {
        id: block.id,
        text,
        level
      }
    })

  const renderFormatOptions = () => (
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
              "p-1.5 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center",
              blocks.find(b => b.id === selectedBlockId)?.content?.style === 'bulletList' && "bg-blue-100 border-blue-200"
            )}
            onClick={() => updateBlockStyle('textStyle', 'bulletList')}
          >
            <span className="mr-1">•</span> Bullet
          </button>
          <button 
            className={cn(
              "p-1.5 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center",
              blocks.find(b => b.id === selectedBlockId)?.content?.style === 'numberedList' && "bg-blue-100 border-blue-200"
            )}
            onClick={() => updateBlockStyle('textStyle', 'numberedList')}
          >
            <span className="mr-1">1.</span> Number
          </button>
          <button 
            className={cn(
              "col-span-2 p-1.5 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center justify-center",
              blocks.find(b => b.id === selectedBlockId)?.content?.style === 'quote' && "bg-blue-100 border-blue-200"
            )}
            onClick={() => updateBlockStyle('textStyle', 'quote')}
          >
            <span className="mr-1 text-lg leading-none">"</span> Quote
          </button>
        </div>
      </div>

      {/* Alignment Section */}
      <div>
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">ALIGNMENT</h3>
        <div className="grid grid-cols-3 gap-1">
          <button 
            className={cn(
              "p-2 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50",
              blocks.find(b => b.id === selectedBlockId)?.content?.alignment === 'left' && "bg-blue-100 border-blue-200"
            )}
            onClick={() => updateBlockStyle('alignment', 'left')}
          >
            ≡
          </button>
          <button 
            className={cn(
              "p-2 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50",
              blocks.find(b => b.id === selectedBlockId)?.content?.alignment === 'center' && "bg-blue-100 border-blue-200"
            )}
            onClick={() => updateBlockStyle('alignment', 'center')}
          >
            ≡
          </button>
          <button 
            className={cn(
              "p-2 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50",
              blocks.find(b => b.id === selectedBlockId)?.content?.alignment === 'right' && "bg-blue-100 border-blue-200"
            )}
            onClick={() => updateBlockStyle('alignment', 'right')}
          >
            ≡
          </button>
        </div>
      </div>

      {/* Groups Section */}
      <div>
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">GROUPS</h3>
        <div className="grid grid-cols-2 gap-1">
          <button 
            className={cn(
              "p-2 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center justify-center",
              !blocks.find(b => b.id === selectedBlockId)?.content?.decoration && "bg-blue-100 border-blue-200"
            )}
            onClick={() => updateBlockStyle('decoration', null)}
          >
            <span className="mr-1 text-xs">📄</span> Page
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
            <span className="mr-1 text-xs">🎫</span> Card
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
  )

  return (
    <MainLayout>
      <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-medium text-gray-900 truncate px-2">{report?.title || 'Untitled Report'}</h1>
            <button
              onClick={() => setShowMobileFormatPanel(!showMobileFormatPanel)}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              Format
            </button>
          </div>
        </div>

        {/* Left Sidebar - Table of Contents */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-gray-100 overflow-y-auto transform transition-transform duration-300 lg:relative lg:translate-x-0",
          showMobileSidebar ? "translate-x-0" : "-translate-x-full"
        )}>
          {/* Mobile close button */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-sm font-medium">Navigation</h2>
            <button
              onClick={() => setShowMobileSidebar(false)}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Back button */}
          <div className="p-4 border-b border-gray-200">
            <a
              href="/reports"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
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
                <X className="w-4 h-4" />
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
                        setShowMobileSidebar(false) // Close sidebar on mobile after navigation
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

        {/* Mobile sidebar overlay */}
        {showMobileSidebar && (
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}

        {/* Center Content Area */}
        <div 
          className="flex-1 overflow-y-auto bg-white"
          onClick={() => {
            // Clear selection when clicking on empty space
            setSelectedBlockId(null)
            setSelectedBlockType(null)
          }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-16 py-8 lg:py-12">
            <div id="top" className="mb-8 hidden lg:block">
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
        <div className={cn(
          "fixed inset-y-0 right-0 z-50 w-80 bg-gray-100 overflow-y-auto transform transition-transform duration-300 lg:relative lg:translate-x-0",
          showMobileFormatPanel ? "translate-x-0" : "translate-x-full"
        )}>
          <div className="p-4">
            {/* Mobile close button */}
            <div className="lg:hidden flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium">Format Options</h2>
              <button
                onClick={() => setShowMobileFormatPanel(false)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">Insert</span>
                <span className="text-xs font-medium text-gray-900">Format</span>
                <span className="text-xs text-gray-500">Style</span>
                <span className="text-xs text-gray-500">Info</span>
              </div>
            </div>
            
            {/* Mobile: Use Accordion for better space management */}
            <div className="lg:hidden">
              <Accordion type="single" collapsible defaultValue="titles">
                <AccordionItem value="titles">
                  <AccordionTrigger className="text-xs font-medium text-gray-500 uppercase tracking-wider">TITLES</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-3 gap-1 mb-2">
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
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="content">
                  <AccordionTrigger className="text-xs font-medium text-gray-500 uppercase tracking-wider">CONTENT</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-3 gap-1 mb-2">
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
                  </AccordionContent>
                </AccordionItem>
                
                {/* Add other sections in accordion items... */}
              </Accordion>
            </div>

            {/* Desktop: Show all options */}
            <div className="hidden lg:block">
              {renderFormatOptions()}
            </div>
          </div>
        </div>

        {/* Mobile format panel overlay */}
        {showMobileFormatPanel && (
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowMobileFormatPanel(false)}
          />
        )}
      </div>
    </MainLayout>
  )
}