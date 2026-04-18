'use client'

import Link from 'next/link'
import { isAxiosError } from 'axios'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useLogin } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { mutateAsync: login, isPending } = useLogin()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values)
    } catch (err) {
      if (isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(err)) {
        const fieldErrors = err.response?.data?.errors
        if (fieldErrors) {
          for (const [field, messages] of Object.entries(fieldErrors)) {
            if (field in values) {
              setError(field as keyof LoginFormValues, { message: messages[0] })
            }
          }
          return
        }
      }
      setError('root', {
        message: isAxiosError<{ message?: string }>(err)
          ? (err.response?.data?.message ?? 'Something went wrong.')
          : 'Something went wrong.',
      })
    }
  }

  return (
    <div className="w-full max-w-[380px] flex flex-col gap-8">
      {/* Brand */}
      <div className="flex flex-col gap-1">
        <div className="w-8 h-8 rounded-lg bg-foreground mb-4" />
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          {errors.root && (
            <div className="text-sm text-destructive bg-destructive/8 border border-destructive/20 px-3 py-2.5 rounded-lg">
              {errors.root.message}
            </div>
          )}

          <Field data-invalid={Boolean(errors.email)}>
            <FieldLabel htmlFor="email" className="text-sm font-medium">
              Email
            </FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              className="h-10 text-sm"
              {...register('email')}
            />
            <FieldError errors={[errors.email]} />
          </Field>

          <Field data-invalid={Boolean(errors.password)}>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password" className="text-sm font-medium">
                Password
              </FieldLabel>
              <a
                href="#"
                className="text-xs text-muted-foreground underline-offset-4 hover:underline hover:text-foreground transition-colors"
              >
                Forgot password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              className="h-10 text-sm"
              {...register('password')}
            />
            <FieldError errors={[errors.password]} />
          </Field>

          <Field className="mt-1">
            <Button
              type="submit"
              className="w-full h-10 text-sm font-medium"
              disabled={isSubmitting || isPending}
            >
              {isSubmitting || isPending ? 'Signing in...' : 'Sign in'}
            </Button>
          </Field>
        </FieldGroup>
      </form>

      {/* Footer */}
      <div className="flex flex-col gap-4">
        <FieldSeparator>or</FieldSeparator>
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
