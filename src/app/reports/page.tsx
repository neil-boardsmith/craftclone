import { MainLayout } from '@/components/layout/main-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import Link from 'next/link'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Button } from '@/components/ui/button'

export default async function ReportsPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  let reports = []
  if (user) {
    const { data } = await supabase
      .from('reports')
      .select('*')
      .eq('created_by', user.id)
      .order('updated_at', { ascending: false })
    reports = data || []
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">Your Reports</h1>
            <Button asChild>
              <Link href="/reports/new">Create New Report</Link>
            </Button>
          </div>
          <div className="mt-4 grid gap-4">
            {reports.length === 0 ? (
              <div className="text-muted-foreground">No reports found.</div>
            ) : (
              reports.map((report) => (
                <Link
                  key={report.id}
                  href={`/reports/${report.id}`}
                  className="block rounded border p-4 hover:bg-accent"
                >
                  <div className="font-semibold">{report.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {report.description || 'No description'}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
} 