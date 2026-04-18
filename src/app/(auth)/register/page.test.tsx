import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterPage from './page'

const mockRegister = vi.fn()

vi.mock('@/hooks/use-auth', () => ({
  useRegister: () => ({
    mutate: mockRegister,
    mutateAsync: mockRegister,
    isPending: false,
    error: null,
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

beforeEach(() => {
  mockRegister.mockReset()
})

describe('RegisterPage', () => {
  it('renders all form fields', () => {
    render(<RegisterPage />)

    expect(screen.getByLabelText(/^name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('renders link to login page', () => {
    render(<RegisterPage />)

    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login')
  })

  it('calls register mutation on submit with user input', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    await user.type(screen.getByLabelText(/^name/i), 'John Doe')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(mockRegister).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      password_confirmation: 'password123',
    })
  })
})
