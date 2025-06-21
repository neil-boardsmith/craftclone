# Boardsmith Design System (Updated)

## Layout Philosophy
- **Center:** Clean, distraction-free writing area for composing reports with blocks (text, tables, charts, etc.).
- **Right Panel:** Contextual formatting, block options, decorations, and style controls. This panel updates based on the selected block, similar to Craft/Notion.
- **Left Panel (future):** Table of contents, navigation, or report list.

## Main Content Area
- Centered, max-width, with generous padding.
- Each block is visually distinct, with subtle hover/focus states.
- Minimal chrome—focus is on content.

## Right Formatting Panel
- Fixed to the right side of the screen.
- Shows formatting options (bold, italic, headings, lists, etc.) for the selected block.
- Shows block-specific options (e.g., card/focus decoration, color, alignment, etc.).
- May include document-level style options (font, color theme, etc.).
- Responsive: collapses on mobile.

## Block Controls
- Block toolbar appears on hover/focus (move, duplicate, delete, etc.).
- Right panel always shows formatting for the selected block.

## Inspiration
- Directly inspired by Craft and Notion's clean, modern, and contextual editing experience.

---

## Design Philosophy
**Craft/Notion-inspired**: Clean, minimal, and focused on content creation
**Light & Airy**: Plenty of whitespace, subtle shadows, gentle colors
**Natural Feel**: Technology fades into the background
**Professional Output**: Beautiful results without design skills

## Color Palette

### Primary Colors
```css
/* Teal family - primary brand color */
--teal-50: #f0fdfa
--teal-100: #ccfbf1
--teal-200: #99f6e4
--teal-500: #14b8a6  /* Primary brand */
--teal-600: #0d9488  /* Primary hover */
--teal-700: #0f766e  /* Primary active */
--teal-800: #115e59  /* Primary dark */
```

### Neutral Colors
```css
/* Gray family - main content colors */
--slate-50: #f8fafc   /* Light backgrounds */
--slate-100: #f1f5f9  /* Subtle backgrounds */
--slate-200: #e2e8f0  /* Borders, dividers */
--slate-300: #cbd5e1  /* Disabled states */
--slate-400: #94a3b8  /* Placeholders */
--slate-500: #64748b  /* Secondary text */
--slate-600: #475569  /* Body text */
--slate-700: #334155  /* Headings */
--slate-800: #1e293b  /* Primary text */
--slate-900: #0f172a  /* High contrast */
```

### Accent Colors
```css
/* Status colors */
--red-50: #fef2f2     /* Error background */
--red-500: #ef4444    /* Error */
--amber-50: #fffbeb   /* Warning background */
--amber-500: #f59e0b  /* Warning */
--green-50: #f0fdf4   /* Success background */
--green-500: #22c55e  /* Success */
--blue-50: #eff6ff    /* Info background */
--blue-500: #3b82f6   /* Info */
```

## Typography

### Font Family
**Primary**: Inter (400, 500, 600, 700)
- Clean, readable, professional
- Excellent at all sizes
- Strong Unicode support

### Scale
```css
/* Headings */
--text-xs: 0.75rem     /* 12px - Captions, labels */
--text-sm: 0.875rem    /* 14px - Small text */
--text-base: 1rem      /* 16px - Body text */
--text-lg: 1.125rem    /* 18px - Emphasized text */
--text-xl: 1.25rem     /* 20px - Large text */
--text-2xl: 1.5rem     /* 24px - Small headings */
--text-3xl: 1.875rem   /* 30px - Medium headings */
--text-4xl: 2.25rem    /* 36px - Large headings */
```

### Text Styles
```css
/* Content hierarchy */
.heading-1 { font-size: 2.25rem; font-weight: 700; color: var(--slate-900); }
.heading-2 { font-size: 1.875rem; font-weight: 600; color: var(--slate-800); }
.heading-3 { font-size: 1.5rem; font-weight: 600; color: var(--slate-700); }
.body-large { font-size: 1.125rem; font-weight: 400; color: var(--slate-700); }
.body { font-size: 1rem; font-weight: 400; color: var(--slate-600); }
.body-small { font-size: 0.875rem; font-weight: 400; color: var(--slate-500); }
.caption { font-size: 0.75rem; font-weight: 500; color: var(--slate-400); }
```

## Spacing System

### Scale (Tailwind-compatible)
```css
--space-1: 0.25rem   /* 4px */
--space-2: 0.5rem    /* 8px */
--space-3: 0.75rem   /* 12px */
--space-4: 1rem      /* 16px */
--space-5: 1.25rem   /* 20px */
--space-6: 1.5rem    /* 24px */
--space-8: 2rem      /* 32px */
--space-10: 2.5rem   /* 40px */
--space-12: 3rem     /* 48px */
--space-16: 4rem     /* 64px */
--space-20: 5rem     /* 80px */
```

### Usage Guidelines
- **Micro spacing** (4-8px): Between related elements
- **Component spacing** (12-16px): Between component parts
- **Section spacing** (24-32px): Between major sections
- **Page spacing** (48-64px): Top-level layout spacing

## Component Styles

### Blocks
```css
.block {
  @apply rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow;
}

.block-selected {
  @apply ring-2 ring-teal-500 ring-opacity-50 border-teal-300;
}

.block-toolbar {
  @apply absolute -top-10 left-0 flex items-center space-x-1 bg-white rounded-md border border-slate-200 shadow-lg px-2 py-1;
}
```

### Buttons
```css
.btn-primary {
  @apply bg-teal-600 text-white px-4 py-2 rounded-md font-medium hover:bg-teal-700 transition-colors;
}

.btn-secondary {
  @apply bg-slate-100 text-slate-700 px-4 py-2 rounded-md font-medium hover:bg-slate-200 transition-colors;
}

.btn-ghost {
  @apply text-slate-600 px-2 py-1 rounded hover:bg-slate-100 transition-colors;
}
```

### Forms
```css
.input {
  @apply w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500;
}

.textarea {
  @apply w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none;
}
```

## Layout Guidelines

### Page Structure
```
┌─────────────────────────────────────┐
│ Header (60px height)                │
├─────────────────────────────────────┤
│ Main Content Area                   │
│ ┌─────┐ ┌─────────────────────────┐ │
│ │Side │ │ Editor Canvas           │ │
│ │bar  │ │                         │ │
│ │     │ │ [Blocks go here]        │ │
│ │     │ │                         │ │
│ └─────┘ └─────────────────────────┘ │
└─────────────────────────────────────┘
```

### Responsive Breakpoints
- **Mobile**: < 768px (single column, collapsible sidebar)
- **Tablet**: 768px - 1024px (sidebar overlay)
- **Desktop**: > 1024px (fixed sidebar)

### Content Width
- **Max width**: 800px for optimal reading
- **Side margins**: 24px minimum on mobile
- **Block spacing**: 16px between blocks

## Animation & Transitions

### Micro-interactions
```css
/* Smooth, natural feeling animations */
.transition-fast { transition: all 150ms ease-out; }
.transition-normal { transition: all 250ms ease-out; }
.transition-slow { transition: all 400ms ease-out; }

/* Block hover effects */
.block:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

### Loading States
- **Skeleton screens**: Maintain layout while loading
- **Fade transitions**: Content appears smoothly
- **Progress indicators**: For longer operations

## Mobile-Specific Considerations

### Touch Targets
- **Minimum size**: 44px x 44px
- **Spacing**: 8px between interactive elements
- **Visual feedback**: Clear pressed states

### Gestures
- **Tap to select** blocks
- **Long press** for block menu
- **Swipe** to reorder (with haptic feedback)
- **Pull to refresh** for sync

### Responsive Behavior
- **Collapsible sidebar**: Swipe from left edge
- **Bottom sheets**: For mobile-specific actions
- **Optimized keyboards**: Numeric for number inputs

## Accessibility Guidelines

### Color & Contrast
- **Minimum contrast**: 4.5:1 for normal text
- **Enhanced contrast**: 7:1 for small text
- **Color independence**: Never rely on color alone

### Keyboard Navigation
- **Tab order**: Logical and intuitive
- **Focus indicators**: Clear visual feedback
- **Shortcuts**: Standard expectations (Ctrl+Z, etc.)

### Screen Readers
- **Semantic HTML**: Proper heading hierarchy
- **ARIA labels**: For interactive elements
- **Alt text**: Descriptive image alternatives

## Brand Expression

### Voice & Tone
- **Professional yet approachable**
- **Clear and concise**
- **Empowering, not overwhelming**

### Visual Personality
- **Clean**: Minimal clutter, focused on content
- **Confident**: Subtle but purposeful design choices
- **Sophisticated**: Professional enough for business use
- **Approachable**: Not intimidating or overly complex