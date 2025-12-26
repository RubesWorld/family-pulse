import { Suspense } from 'react'
import { LoginForm } from './login-form'

function LoginLoading() {
  return (
    <div className="w-full max-w-md h-96 animate-pulse bg-gray-100 rounded-lg" />
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
      <Suspense fallback={<LoginLoading />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
