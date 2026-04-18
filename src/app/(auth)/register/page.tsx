'use client'

import Link from 'next/link'
import { isAxiosError } from 'axios'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useRegister } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field'

const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string().min(1, 'Please confirm your password'),
  })
  .refine((values) => values.password === values.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const { mutateAsync: registerUser, isPending } = useRegister()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', password_confirmation: '' },
  })

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await registerUser(values)
    } catch (err) {
      if (isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(err)) {
        const fieldErrors = err.response?.data?.errors
        if (fieldErrors) {
          for (const [field, messages] of Object.entries(fieldErrors)) {
            if (field in values) {
              setError(field as keyof RegisterFormValues, { message: messages[0] })
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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create an account</h1>
        <p className="text-sm text-muted-foreground">Fill in the details below to get started</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          {errors.root && (
            <div className="text-sm text-destructive bg-destructive/8 border border-destructive/20 px-3 py-2.5 rounded-lg">
              {errors.root.message}
            </div>
          )}

          <Field data-invalid={Boolean(errors.name)}>
            <FieldLabel htmlFor="name" className="text-sm font-medium">
              Full Name
            </FieldLabel>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              className="h-10 text-sm"
              {...register('name')}
            />
            <FieldError errors={[errors.name]} />
          </Field>

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
            <FieldLabel htmlFor="password" className="text-sm font-medium">
              Password
            </FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              className="h-10 text-sm"
              {...register('password')}
            />
            <FieldDescription>At least 8 characters</FieldDescription>
            <FieldError errors={[errors.password]} />
          </Field>

          <Field data-invalid={Boolean(errors.password_confirmation)}>
            <FieldLabel htmlFor="password-confirmation" className="text-sm font-medium">
              Confirm Password
            </FieldLabel>
            <Input
              id="password-confirmation"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password_confirmation)}
              className="h-10 text-sm"
              {...register('password_confirmation')}
            />
            <FieldError errors={[errors.password_confirmation]} />
          </Field>

          <Field className="mt-1">
            <Button
              type="submit"
              className="w-full h-10 text-sm font-medium"
              disabled={isSubmitting || isPending}
            >
              {isSubmitting || isPending ? 'Creating account...' : 'Create account'}
            </Button>
          </Field>
        </FieldGroup>
      </form>

      {/* Footer */}
      <div className="flex flex-col gap-4">
        <FieldSeparator>or</FieldSeparator>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
