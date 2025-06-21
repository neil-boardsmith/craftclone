import { MainLayout } from '@/components/layout/main-layout'

export default function VerifyEmailPage() {
  return (
    <MainLayout>
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
        <p className="mt-2 text-muted-foreground">
          We've sent you an email with a link to verify your account.
          Please check your inbox and follow the instructions.
        </p>
      </div>
    </MainLayout>
  )
} 