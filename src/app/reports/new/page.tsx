'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function NewReportPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be signed in to create a report.')
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('reports')
      .insert({
        title: title || 'Untitled Report',
        description,
        created_by: user.id,
      })
      .select()
      .single()
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    
    // Create an initial empty text block for the report
    const { error: blockError } = await supabase
      .from('blocks')
      .insert({
        report_id: data.id,
        type: 'text',
        position: 1,
        content: {
          html: '<p></p>',
          text: '',
          style: 'paragraph'
        }
      })
    
    if (blockError) {
      console.error('Error creating initial block:', blockError)
      // Continue anyway - user can create blocks manually
    }
    
    router.push(`/reports/${data.id}`)
  }

  return (
    <MainLayout>
      <div className="max-w-xl mx-auto mt-10">
        <h1 className="text-2xl font-semibold mb-6">Create New Report</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Title</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Report title"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Description</label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Short description (optional)"
            />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Report'}
          </Button>
        </form>
      </div>
    </MainLayout>
  )
} 