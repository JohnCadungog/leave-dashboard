import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { CalendarDays, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import {
  signInSchema,
  signUpSchema,
  type SignInValues,
  type SignUpValues,
} from '@/lib/schemas/auth'
import { mapSupabaseError } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type TabType = 'signin' | 'signup'

export function LoginPage() {
  const [tab, setTab] = useState<TabType>('signin')
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4 dark:from-zinc-950 dark:to-zinc-900">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <CalendarDays className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">LeaveDesk</h1>
          <p className="mt-1 text-sm text-muted-foreground">Leave request management</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div role="tablist" className="grid w-full grid-cols-2 rounded-lg bg-muted p-1">
              <button
                role="tab"
                aria-selected={tab === 'signin'}
                id="tab-signin"
                aria-controls="panel-signin"
                onClick={() => setTab('signin')}
                className={`rounded-md py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  tab === 'signin'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign in
              </button>
              <button
                role="tab"
                aria-selected={tab === 'signup'}
                id="tab-signup"
                aria-controls="panel-signup"
                onClick={() => setTab('signup')}
                className={`rounded-md py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  tab === 'signup'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign up
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {tab === 'signin' ? (
              <SignInForm onSuccess={() => navigate('/dashboard')} />
            ) : (
              <SignUpForm onSuccess={() => navigate('/dashboard')} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SignInForm({ onSuccess }: { onSuccess: () => void }) {
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({ resolver: zodResolver(signInSchema) })

  const onSubmit = async (values: SignInValues) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })
    if (error) {
      toast.error(mapSupabaseError(error))
    } else {
      onSuccess()
    }
  }

  return (
    <form
      id="panel-signin"
      role="tabpanel"
      aria-labelledby="tab-signin"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
    >
      <CardTitle className="sr-only">Sign in to your account</CardTitle>
      <CardDescription className="sr-only">Enter your email and password</CardDescription>

      <div className="space-y-1.5">
        <Label htmlFor="signin-email">Email</Label>
        <Input
          id="signin-email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          aria-describedby={errors.email ? 'signin-email-error' : undefined}
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && (
          <p id="signin-email-error" role="alert" className="text-xs text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="signin-password">Password</Label>
        <div className="relative">
          <Input
            id="signin-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            aria-describedby={errors.password ? 'signin-password-error' : undefined}
            aria-invalid={!!errors.password}
            className="pr-10"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password && (
          <p id="signin-password-error" role="alert" className="text-xs text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}

function SignUpForm({ onSuccess }: { onSuccess: () => void }) {
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({ resolver: zodResolver(signUpSchema) })

  const onSubmit = async (values: SignUpValues) => {
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { full_name: values.full_name } },
    })
    if (error) {
      toast.error(mapSupabaseError(error))
    } else {
      onSuccess()
    }
  }

  return (
    <form
      id="panel-signup"
      role="tabpanel"
      aria-labelledby="tab-signup"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
    >
      <CardTitle className="sr-only">Create a new account</CardTitle>
      <CardDescription className="sr-only">Fill in your details to register</CardDescription>

      <div className="space-y-1.5">
        <Label htmlFor="signup-name">Full name</Label>
        <Input
          id="signup-name"
          type="text"
          autoComplete="name"
          placeholder="Jane Smith"
          aria-describedby={errors.full_name ? 'signup-name-error' : undefined}
          aria-invalid={!!errors.full_name}
          {...register('full_name')}
        />
        {errors.full_name && (
          <p id="signup-name-error" role="alert" className="text-xs text-destructive">
            {errors.full_name.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          aria-describedby={errors.email ? 'signup-email-error' : undefined}
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && (
          <p id="signup-email-error" role="alert" className="text-xs text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <Input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Min 8 chars, letter + number"
            aria-describedby={errors.password ? 'signup-password-error' : 'password-hint'}
            aria-invalid={!!errors.password}
            className="pr-10"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password ? (
          <p id="signup-password-error" role="alert" className="text-xs text-destructive">
            {errors.password.message}
          </p>
        ) : (
          <p id="password-hint" className="text-xs text-muted-foreground">
            Min 8 characters, must include a letter and a number
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  )
}
