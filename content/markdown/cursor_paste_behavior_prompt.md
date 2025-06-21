# Text Block Paste Behavior & Enter Key Handling

## Core Behavior Requirements

Implement intelligent text block behavior that balances natural writing flow with granular AI assistance capabilities. The system should feel like a premium document editor while enabling paragraph-level AI enhancements.

## Paste Behavior

### When Pasting Into Empty Text Block
```typescript
// Example: User pastes this content:
const pastedContent = `
Executive Summary

Our Q3 performance exceeded expectations with revenue growth of 15% and successful launch of our new product line.

Key risks include supply chain disruptions and increased competition in our core market.

Next quarter, we plan to expand into Southeast Asia and hire 10 additional engineers.
`

// Should create ONE text block with paragraph awareness:
const resultingBlock = {
  type: 'text',
  content: {
    html: '<h2>Executive Summary</h2><p>Our Q3 performance...</p><p>Key risks include...</p><p>Next quarter, we plan...</p>',
    paragraphs: [
      { id: 'p1', type: 'heading', content: 'Executive Summary', position: 0 },
      { id: 'p2', type: 'paragraph', content: 'Our Q3 performance exceeded...', position: 1 },
      { id: 'p3', type: 'paragraph', content: 'Key risks include...', position: 2 },
      { id: 'p4', type: 'paragraph', content: 'Next quarter, we plan...', position: 3 }
    ]
  }
}
```

### When Pasting Into Existing Text Block
- **Append to current block** - Don't create new blocks
- **Maintain paragraph structure** - Parse pasted content into paragraphs
- **Smart content detection** - Detect headings, lists, etc.

### When Pasting Complex Content (Tables, Images)
- **Mixed content with text** → Split into appropriate blocks (text block + table block + text block)
- **Pure table data** → Create table block
- **Images** → Create image blocks

## Enter Key Behavior

### Single Enter Press
```typescript
// Within a text block, single Enter creates new paragraph WITHIN the same block
const handleSingleEnter = (currentBlock: TextBlock, cursorPosition: number) => {
  // Creates new paragraph within existing block
  // Does NOT create new block
  return {
    ...currentBlock,
    content: {
      ...currentBlock.content,
      paragraphs: [
        ...paragraphs.slice(0, currentParagraphIndex + 1),
        { id: generateId(), type: 'paragraph', content: '', position: newPosition },
        ...paragraphs.slice(currentParagraphIndex + 1)
      ]
    }
  }
}
```

### Double Enter Press
```typescript
// Double Enter (Enter + Enter) creates NEW block below current block
const handleDoubleEnter = (currentBlock: TextBlock, position: number) => {
  // Creates brand new text block below current one
  // Cursor moves to new block
  return createNewBlock({
    type: 'text',
    position: currentBlock.position + 1,
    content: { paragraphs: [{ id: generateId(), type: 'paragraph', content: '', position: 0 }] }
  })
}
```

### Enter at End of Heading
```typescript
// Special case: Enter after heading creates paragraph in same block
const handleHeadingEnter = (currentParagraph: Paragraph) => {
  if (currentParagraph.type === 'heading' && cursorAtEnd) {
    // Create paragraph within same block, not new block
    return createParagraphInCurrentBlock({ type: 'paragraph' })
  }
}
```

## Paragraph-Level Selection & AI Integration

### Visual Feedback
```css
/* Paragraph hover state */
.paragraph:hover {
  background: rgba(20, 184, 166, 0.05);
  border-radius: 4px;
  transition: all 150ms ease;
}

/* Paragraph selected state */
.paragraph-selected {
  background: rgba(20, 184, 166, 0.1);
  border-left: 3px solid theme('colors.teal.500');
  padding-left: 12px;
  margin-left: -15px;
}

/* Show paragraph handles on hover */
.paragraph:hover .paragraph-handle {
  opacity: 1;
}
```

### Paragraph-Level AI Tools
```typescript
const ParagraphAITools = ({ paragraph, onEnhance }: Props) => {
  return (
    <div className="paragraph-ai-tools">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm">
            <Sparkles className="w-3 h-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => onEnhance(paragraph.id, 'rewrite')}
            >
              ✨ Rewrite this paragraph
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => onEnhance(paragraph.id, 'concise')}
            >
              ✂️ Make more concise
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => onEnhance(paragraph.id, 'expand')}
            >
              📝 Add more detail
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
```

## Multi-Paragraph Selection

### Shift+Click Selection
```typescript
const handleParagraphClick = (paragraphId: string, event: MouseEvent) => {
  if (event.shiftKey && selectedParagraphs.length > 0) {
    // Select range from first selected to clicked paragraph
    const range = getParagraphRange(selectedParagraphs[0], paragraphId)
    setSelectedParagraphs(range)
  } else if (event.metaKey || event.ctrlKey) {
    // Add/remove from selection
    toggleParagraphSelection(paragraphId)
  } else {
    // Single selection
    setSelectedParagraphs([paragraphId])
  }
}
```

### Multi-Selection AI Tools
```typescript
const MultiParagraphAITools = ({ selectedParagraphs }: Props) => {
  return (
    <div className="multi-selection-ai-tools">
      <div className="selection-count">
        {selectedParagraphs.length} paragraphs selected
      </div>
      <div className="ai-actions">
        <Button onClick={() => enhanceMultiple('summarize')}>
          📋 Summarize selection
        </Button>
        <Button onClick={() => enhanceMultiple('rewrite')}>
          ✨ Rewrite selection
        </Button>
        <Button onClick={() => enhanceMultiple('bullets')}>
          • Convert to bullet points
        </Button>
      </div>
    </div>
  )
}
```

## Implementation Details

### Paste Event Handler
```typescript
const handlePaste = async (event: ClipboardEvent, blockId: string) => {
  event.preventDefault()
  
  const clipboardData = event.clipboardData
  const htmlData = clipboardData?.getData('text/html')
  const textData = clipboardData?.getData('text/plain')
  
  if (htmlData) {
    // Parse HTML content
    const parsedContent = parseHTMLToParagraphs(htmlData)
    updateBlockContent(blockId, parsedContent)
  } else if (textData) {
    // Parse plain text into paragraphs
    const paragraphs = textData
      .split(/\n\s*\n/) // Split on double line breaks
      .filter(p => p.trim())
      .map(content => ({
        id: generateId(),
        type: detectParagraphType(content), // heading, paragraph, list-item
        content: content.trim(),
        position: getCurrentPosition()
      }))
    
    updateBlockContent(blockId, { paragraphs })
  }
}
```

### Smart Content Detection
```typescript
const detectParagraphType = (content: string): ParagraphType => {
  // Detect headings
  if (/^#{1,6}\s/.test(content)) return 'heading'
  if (/^[A-Z][^.!?]*$/.test(content) && content.length < 100) return 'heading'
  
  // Detect list items
  if (/^[-*+]\s/.test(content)) return 'list-item'
  if (/^\d+\.\s/.test(content)) return 'numbered-list-item'
  
  // Default to paragraph
  return 'paragraph'
}
```

## UX Guidelines

### Visual Hierarchy
- **Block boundaries**: Subtle, only visible on hover/selection
- **Paragraph boundaries**: Nearly invisible, become apparent on interaction
- **Selection feedback**: Clear but not overwhelming
- **AI tools**: Contextual, appear when needed

### Keyboard Shortcuts
```typescript
const keyboardShortcuts = {
  'Enter': 'Create new paragraph in current block',
  'Shift+Enter': 'Line break within current paragraph',
  'Cmd+Enter': 'Create new block below',
  'Cmd+A': 'Select all paragraphs in current block',
  'Cmd+Shift+A': 'Select entire block',
  'Escape': 'Clear paragraph selection, select block'
}
```

### Mobile Considerations
- **Touch selection**: Long press to select paragraph
- **Multi-selection**: Touch and hold, then tap additional paragraphs
- **AI tools**: Bottom sheet on mobile instead of popover

## Success Criteria

The implementation is successful when:
- ✅ Pasting feels natural and predictable
- ✅ Enter key behavior matches user expectations
- ✅ Paragraph-level AI tools are discoverable but not overwhelming
- ✅ Multi-paragraph selection works intuitively
- ✅ Visual feedback is clear and helpful
- ✅ Performance remains smooth with large text blocks
- ✅ Export produces clean, professional document output

Focus on making the editing experience feel **magical but predictable** - users should immediately understand how to work with paragraphs while discovering powerful AI capabilities naturally.