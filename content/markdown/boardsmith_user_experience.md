# Boardsmith MVP - User Experience Guidelines

## Core UX Principles

### 1. Natural, Not Technical
- Users should feel like they're writing, not programming
- Blocks appear and behave like natural document elements
- Technical complexity hidden behind intuitive interactions
- No coding concepts or jargon in the interface

### 2. Progressive Disclosure
- Start simple, reveal complexity gradually
- Essential features always visible, advanced features on-demand
- AI assistance available but not intrusive
- Power users can access advanced features quickly

### 3. Content-First Design
- The writing/content creation is the hero, not the tools
- Interface fades into the background
- Beautiful output without design skills required
- Focus on the story, not the software

## User Journey

### First-Time User Experience
1. **Landing**: Clean homepage explaining value in 10 seconds
2. **Sign-up**: Simple email/password or Google OAuth
3. **Welcome**: Brief tour focusing on core concepts (2-3 screens max)
4. **First Report**: Guided creation with helpful prompts
5. **Success**: Beautiful output that exceeds expectations

### Daily Usage Flow
1. **Dashboard**: Quick access to recent reports + "New Report" CTA
2. **Report Creation**: Immediate focus on content, not setup
3. **Block Addition**: Natural typing experience with smart suggestions
4. **AI Enhancement**: One-click improvements when desired
5. **Output**: Professional result ready to share

## Block Experience Design

### Block Creation
**The Magic Moment**: Typing `/` brings up a clean block picker

```
Type '/' for commands...

📝 Text          Add a paragraph, heading, or quote
📊 Table         Add structured data with rows and columns  
📈 Chart         Visualize data with beautiful charts
🖼️ Image         Upload or embed an image
🌐 Embed         Add YouTube, Figma, or web content
```

### Block Interaction Patterns

#### Selection & Focus
- **Single click**: Focus for editing
- **Hover**: Subtle highlight + grab handle appears
- **Selected**: Clean border, no overwhelming UI
- **Editing**: Toolbar appears contextually above block

#### Reordering
- **Drag handle**: Appears on hover (6-dot grid icon)
- **Visual feedback**: Ghost outline, smooth animations
- **Mobile**: Long press + drag with haptic feedback
- **Drop zones**: Clear visual indicators

#### Block Toolbar (Contextual)
```
[AI ✨] [Duplicate] [Move ↕] [Delete] [More ⋯]
```
- Appears above selected block
- Fades away when not needed
- Mobile: Slide up from bottom

### Text Block Experience

#### Rich Text Editing
- **Familiar shortcuts**: Cmd+B for bold, Cmd+I for italic
- **Markdown support**: `#` for headings, `*` for bullets
- **Smart formatting**: Auto-detect lists, quotes, headings
- **Paste handling**: Intelligent formatting preservation

#### AI Writing Assistant
**Trigger**: Select text + AI button or `/ai` command

**AI Options Panel**:
```
✨ Make it better
📝 Rewrite differently  
✂️ Make more concise
📋 Summarize key points
🎯 Adjust tone: [Professional] [Casual] [Formal]
🔍 Explain this concept
💡 Add supporting details
```

**Experience Flow**:
1. User selects text or places cursor
2. AI panel slides in from right (desktop) or bottom (mobile)
3. User picks an enhancement
4. AI shows suggestion with accept/reject options
5. Changes apply smoothly with undo available

### Table Block Experience

#### Creation Flow
1. User types `/table` or clicks table in block picker
2. Simple 3x3 grid appears with sample data
3. Headers automatically detected and styled
4. Click any cell to edit inline
5. Add rows/columns with `+` buttons that appear on hover

#### Data Import
- **CSV Upload**: Drag & drop or file picker
- **Smart Detection**: Automatically detect headers, data types
- **Preview**: Show formatted table before confirming
- **Column Types**: Auto-detect numbers, currency, percentages

#### Formatting Options
```
[📊 Chart from this data] [⬇ Import CSV] [⬆ Export] [⚙ Format]

Format panel:
- Column types: Text | Number | Currency | Percentage | Date
- Number formatting: Decimal places, thousands separator
- Styling: Alternating rows, header styling
```

### Chart Block Experience

#### Creation Flow
1. User types `/chart` or creates from table data
2. Chart type picker: Line | Bar | Pie | Area
3. Data source selection (if multiple tables exist)
4. Live preview updates as user makes changes
5. Beautiful chart with professional styling

#### Chart Configuration
**Simple Mode** (default):
- Chart type selector with visual previews
- Data source dropdown (connected tables)
- Basic title and axis labels

**Advanced Mode** (click "Customize"):
- Color scheme options
- Axis formatting
- Legend positioning
- Animation preferences

### Embed Block Experience

#### URL Handling
1. User pastes URL or types `/embed`
2. Smart detection: YouTube, Figma, Twitter, etc.
3. Rich preview with title and description
4. One-click to embed or keep as link
5. Responsive iframe with proper aspect ratios

#### Supported Embeds
- **YouTube**: Video thumbnails with play buttons
- **Figma**: Interactive prototypes and designs
- **Google Docs/Sheets**: View-only embeds
- **Twitter**: Tweet embeds with proper formatting
- **Generic**: Safe iframe embedding with security

## Mobile Experience

### Navigation
- **Bottom tabs**: Reports | Create | Profile
- **Swipe gestures**: Back/forward between reports
- **Pull to refresh**: Sync latest changes
- **Search**: Prominent search bar on reports list

### Editing Experience
- **Touch-first**: Large touch targets, comfortable spacing
- **Context menus**: Long press for block options
- **Keyboard optimization**: Proper input types for data entry
- **Auto-save**: Continuous saving, never lose work

### Block Management
- **Reordering**: Long press + drag with visual feedback
- **Selection**: Clear selected states with mobile-optimized toolbars
- **AI Assistant**: Bottom sheet panel for AI options
- **Quick actions**: Swipe gestures for common actions

## AI Integration Philosophy

### AI as Assistant, Not Replacement
- **Human-driven**: AI enhances human creativity, never replaces it
- **Transparent**: Always show what AI suggests vs. original content
- **Controllable**: Easy to accept, reject, or modify AI suggestions
- **Learning**: AI adapts to user preferences over time

### AI Interaction Patterns

#### Subtle Integration
- AI suggestions appear when contextually relevant
- Never interrupts the writing flow
- Optional enhancements, never forced
- Clear distinction between human and AI content

#### Conversational AI Panel
```
💬 AI Assistant

"I can help improve this section. What would you like to focus on?"

• Make it more concise
• Add more detail  
• Change the tone
• Fix grammar/style
• Something else...
```

#### Smart Suggestions
- **Context-aware**: Understands the type of content being created
- **Non-intrusive**: Subtle indicators, not pop-ups
- **Batch processing**: Suggest improvements for entire sections
- **Learning**: Remembers user preferences and writing style

## Performance & Feedback

### Loading States
- **Skeleton screens**: Maintain layout while loading
- **Progressive loading**: Most important content first
- **Offline indicators**: Clear status when disconnected
- **Sync status**: Subtle indicators for real-time sync

### Error Handling
- **Graceful degradation**: App works even when features fail
- **Clear messaging**: Human-friendly error descriptions
- **Recovery options**: Easy ways to fix or retry
- **Never lose work**: Automatic drafts and recovery

### Success Feedback
- **Micro-animations**: Confirm actions without being distracting
- **Progress indicators**: For longer operations
- **Achievement moments**: Celebrate beautiful outputs
- **Share-ready**: Easy ways to show off great reports

## Accessibility & Inclusion

### Universal Design
- **Keyboard navigation**: Full functionality without mouse
- **Screen readers**: Semantic HTML and ARIA labels
- **Color blind friendly**: Don't rely on color alone
- **Cognitive accessibility**: Clear language and simple interactions

### Progressive Enhancement
- **Core functionality first**: Works without JavaScript
- **Enhanced experience**: Rich features for capable devices
- **Graceful degradation**: Maintains usability when features fail
- **Device agnostic**: Great experience across all devices

## Success Metrics

### User Engagement
- **Time to first report**: < 5 minutes from sign-up
- **Daily active usage**: Users return regularly
- **Feature adoption**: AI assistance used naturally
- **Content creation**: Quality and quantity of reports

### Experience Quality
- **Task completion**: Users successfully create reports
- **Error recovery**: Users recover from mistakes easily
- **Mobile usage**: Strong engagement on mobile devices
- **User satisfaction**: High ratings and positive feedback