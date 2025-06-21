'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { UserMenu } from './UserMenu'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
} 