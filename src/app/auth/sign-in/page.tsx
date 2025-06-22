import { SignInForm } from '@/components/auth/sign-in-form'
import { MainLayout } from '@/components/layout/main-layout'
import Link from 'next/link'

export default function SignInPage() {
  return (
    <MainLayout>
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center">
        <SignInForm />
        <p className="mt-4 text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/auth/sign-up" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </MainLayout>
  )
} 