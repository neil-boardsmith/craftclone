import { SignUpForm } from '@/components/auth/sign-up-form'
import { MainLayout } from '@/components/layout/main-layout'
import Link from 'next/link'

export default function SignUpPage() {
  return (
    <MainLayout>
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center">
        <SignUpForm />
        <p className="mt-4 text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/sign-in" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </MainLayout>
  )
} 