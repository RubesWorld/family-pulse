import { Suspense } from 'react'
import { LoginForm } from './login-form'
import { AuthShell } from '@/components/auth-shell'

function LoginLoading() {
  return <div className="h-96 w-full animate-pulse rounded-card bg-paper-2" />
}

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense fallback={<LoginLoading />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}
