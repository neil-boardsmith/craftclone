# Boardsmith MVP - Technical Specifications

## Tech Stack
- **Frontend**: Next.js 14 with App Router, TypeScript
- **Styling**: Tailwind CSS + ShadCN/UI components
- **Database**: Supabase (PostgreSQL + Auth + Real-time + Storage)
- **Editor**: Tiptap for rich text editing
- **Charts**: Recharts for data visualization
- **State**: Zustand for client state management
- **Drag & Drop**: @dnd-kit/core for block reordering
- **Icons**: Lucide React

## Project Structure
```
src/
├── app/
│   ├── (auth)/
│   ├── reports/
│   │   ├── [id]/
│   │   └── new/
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/ (ShadCN components)
│   ├── blocks/
│   │   ├── text-block.tsx
│   │   ├── table-block.tsx
│   │   ├── chart-block.tsx
│   │   ├── embed-block.tsx
│   │   └── block-wrapper.tsx
│   ├── editor/
│   │   ├── block-editor.tsx
│   │   ├── block-toolbar.tsx
│   │   └── ai-assistant.tsx
│   └── layout/
├── lib/
│   ├── database/
│   │   ├── types.ts
│   │   └── queries.ts
│   ├── blocks/
│   │   ├── types.ts
│   │   └── utils.ts
│   ├── ai/
│   └── utils.ts
└── hooks/
```

## Database Schema (Supabase)

```sql
-- Reports table
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Report',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT FALSE
);

-- Blocks table
CREATE TABLE blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'table', 'chart', 'embed', 'image')),
  position INTEGER NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT USING (auth.uid() = created_by OR is_public = true);

CREATE POLICY "Users can create their own reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own reports" ON reports
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own reports" ON reports
  FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Users can view blocks in accessible reports" ON blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reports 
      WHERE reports.id = blocks.report_id 
      AND (reports.created_by = auth.uid() OR reports.is_public = true)
    )
  );

CREATE POLICY "Users can manage blocks in their reports" ON blocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM reports 
      WHERE reports.id = blocks.report_id 
      AND reports.created_by = auth.uid()
    )
  );
```

## Block Type Definitions

```typescript
// Base block interface
interface BaseBlock {
  id: string
  reportId: string
  type: BlockType
  position: number
  content: Record<string, any>
  metadata: {
    createdAt: string
    updatedAt: string
  }
}

type BlockType = 'text' | 'table' | 'chart' | 'embed' | 'image'

// Specific block types
interface TextBlock extends BaseBlock {
  type: 'text'
  content: {
    html: string
    text: string // for AI processing
  }
}

interface TableBlock extends BaseBlock {
  type: 'table'
  content: {
    headers: string[]
    rows: (string | number)[][]
    formatting?: {
      columnTypes: ('text' | 'number' | 'currency' | 'percentage')[]
    }
  }
}

interface ChartBlock extends BaseBlock {
  type: 'chart'
  content: {
    chartType: 'line' | 'bar' | 'pie' | 'area'
    data: { name: string; value: number }[]
    sourceBlockId?: string // reference to table block
    options: {
      title?: string
      xAxis?: string
      yAxis?: string
    }
  }
}

interface EmbedBlock extends BaseBlock {
  type: 'embed'
  content: {
    url: string
    embedType: 'youtube' | 'figma' | 'iframe'
    title?: string
  }
}

interface ImageBlock extends BaseBlock {
  type: 'image'
  content: {
    url: string
    alt: string
    caption?: string
  }
}
```

## API Endpoints

```typescript
// GET /api/reports - List user's reports
// POST /api/reports - Create new report
// GET /api/reports/[id] - Get report with blocks
// PUT /api/reports/[id] - Update report metadata
// DELETE /api/reports/[id] - Delete report

// POST /api/reports/[id]/blocks - Create block
// PUT /api/blocks/[id] - Update block
// DELETE /api/blocks/[id] - Delete block
// POST /api/blocks/[id]/duplicate - Duplicate block

// POST /api/ai/rewrite - AI rewrite content
// POST /api/ai/summarize - AI summarize content
// POST /api/ai/enhance - AI enhance content
```

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (for AI features)
OPENAI_API_KEY=your-openai-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Performance Requirements
- **Page Load**: < 2 seconds initial load
- **Block Rendering**: < 100ms per block
- **Real-time Sync**: < 500ms for updates
- **Mobile Performance**: 60fps scrolling
- **Offline Support**: Basic editing without sync

## Security Considerations
- All database access through RLS policies
- API routes validate user permissions
- File uploads sanitized and scanned
- AI API calls rate limited per user
- No sensitive data in client-side code

## Deployment
- **Platform**: Vercel (seamless Next.js integration)
- **Domain**: Custom domain with SSL
- **Environment**: Preview deployments for testing
- **Analytics**: Vercel Analytics + PostHog for user insights