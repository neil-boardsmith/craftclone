'use client'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface SlashCommandProps {
  onSelectCommand: (command: string) => void
  onClose: () => void
  position: { x: number; y: number }
}

const commandCategories = [
  {
    title: 'Text Style',
    icon: 'Aa',
    commands: [
      { id: 'heading1', label: 'Heading 1', icon: 'H1' },
      { id: 'heading2', label: 'Heading 2', icon: 'H2' },
      { id: 'heading3', label: 'Heading 3', icon: 'H3' },
      { id: 'text', label: 'Body Text', icon: 'T' },
      { id: 'strong', label: 'Strong Text', icon: 'B' },
      { id: 'caption', label: 'Caption', icon: 'C' },
      { id: 'quote', label: 'Quote', icon: '❝' },
    ]
  },
  {
    title: 'List',
    icon: '≡',
    commands: [
      { id: 'bulletList', label: 'Bullet List', icon: '•' },
      { id: 'numberedList', label: 'Numbered List', icon: '1.' },
    ]
  },
  {
    title: 'Blocks',
    icon: '⬜',
    commands: [
      { id: 'metric', label: 'Metrics', icon: '📊' },
      { id: 'table', label: 'Table', icon: '⚏' },
      { id: 'chart', label: 'Chart', icon: '📈' },
    ]
  }
]

export function SlashCommand({ onSelectCommand, onClose, position }: SlashCommandProps) {

  // Flatten commands for keyboard navigation
  const allCommands = commandCategories.flatMap(cat => cat.commands)
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % allCommands.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + allCommands.length) % allCommands.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        onSelectCommand(allCommands[selectedIndex].id)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex, onSelectCommand, onClose, allCommands])

  let currentIndex = 0

  return (
    <div 
      className="absolute z-50 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-1"
      style={{ 
        top: position.y + 20, 
        left: position.x 
      }}
    >
      <div className="max-h-80 overflow-y-auto">
        {commandCategories.map((category) => (
          <div key={category.title} className="py-1">
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <span className="w-4 h-4 flex items-center justify-center text-xs">{category.icon}</span>
              {category.title}
            </div>
            {category.commands.map((command) => {
              const isSelected = currentIndex === selectedIndex
              currentIndex++
              
              return (
                <button
                  key={command.id}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded text-left hover:bg-gray-50 transition-colors mx-1",
                    isSelected && "bg-blue-50"
                  )}
                  onClick={() => onSelectCommand(command.id)}
                >
                  <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-xs">
                    {command.icon}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm text-gray-900">{command.label}</div>
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}