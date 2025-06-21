import { MainLayout } from '@/components/layout/main-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import ReportEditorClient from '@/components/blocks/ReportEditorClient'

export default async function ReportPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies })
  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('id', params.id)
    .single()
  if (!report) return notFound()
  const { data: blocks } = await supabase
    .from('blocks')
    .select('*')
    .eq('report_id', params.id)
    .order('position', { ascending: true })

  return (
    <ProtectedRoute>
      <ReportEditorClient report={report} blocks={blocks || []} />
    </ProtectedRoute>
  )
} 