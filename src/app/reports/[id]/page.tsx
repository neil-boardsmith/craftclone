import { ProtectedRoute } from '@/components/auth/protected-route'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import ReportEditorClient from '@/components/blocks/ReportEditorClient'

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerComponentClient({ cookies })
  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single()
  if (!report) return notFound()
  const { data: blocks } = await supabase
    .from('blocks')
    .select('*')
    .eq('report_id', id)
    .order('position', { ascending: true })

  return (
    <ProtectedRoute>
      <ReportEditorClient report={report} blocks={blocks || []} />
    </ProtectedRoute>
  )
} 