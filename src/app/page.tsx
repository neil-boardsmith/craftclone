import { MainLayout } from '@/components/layout/main-layout'
import Link from 'next/link'

export default function Home() {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Create Beautiful Reports with Blocks
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl">
          Boardsmith helps you create professional reports with tables, charts, and AI assistance.
          Inspired by Craft and Notion, but focused on beautiful business output.
        </p>
        <div className="mt-10 flex items-center gap-x-6">
          <Link
            href="/reports/new"
            className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Create New Report
          </Link>
          <Link
            href="/reports"
            className="text-sm font-semibold leading-6 text-foreground"
          >
            View Reports <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </MainLayout>
  )
}
