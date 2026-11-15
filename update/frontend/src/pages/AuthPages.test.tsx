import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWith } from '@/test/helpers'
import { ApiError } from '@/lib/axios'
import { LoginPage, RegisterPage } from './AuthPages'

describe('LoginPage', () => {
  it('validates required fields without calling the API', async () => {
    const login = vi.fn()
    renderWith(<LoginPage />, { auth: { role: null, login } })
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText('Email is required')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })
  it('submits credentials', async () => {
    const login = vi.fn().mockResolvedValue({})
    renderWith(<LoginPage />, { auth: { role: null, login } })
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.com')
    await userEvent.type(screen.getByLabelText('Password'), 'secret123')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(login).toHaveBeenCalledWith('a@b.com', 'secret123'))
  })
  it('shows the server error on bad credentials', async () => {
    const login = vi.fn().mockRejectedValue(new ApiError(401, 'Invalid email or password'))
    renderWith(<LoginPage />, { auth: { role: null, login } })
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.com')
    await userEvent.type(screen.getByLabelText('Password'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument()
  })
})

describe('RegisterPage phone number', () => {
  it('keeps only digits and stops at 10', async () => {
    renderWith(<RegisterPage />, { auth: { role: null } })
    const phone = screen.getByLabelText(/mobile number/i) as HTMLInputElement
    await userEvent.type(phone, '+91 90595-93541 73')
    expect(phone.value).toBe('9190595935')
    expect(phone.value).toHaveLength(10)
  })
  it('rejects fewer than 10 digits', async () => {
    renderWith(<RegisterPage />, { auth: { role: null } })
    await userEvent.type(screen.getByLabelText(/full name/i), 'Test User')
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.com')
    await userEvent.type(screen.getByLabelText(/mobile number/i), '12345')
    await userEvent.type(screen.getByLabelText('Password'), 'secret123')
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByText('Phone number must be exactly 10 digits')).toBeInTheDocument()
  })
})
