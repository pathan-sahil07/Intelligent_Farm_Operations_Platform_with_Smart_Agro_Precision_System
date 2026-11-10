import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { renderWith } from '@/test/helpers'
import { ProtectedRoute } from './guards'

const tree = (
  <Routes>
    <Route path="/login" element={<p>login page</p>} />
    <Route path="/access-denied" element={<p>denied page</p>} />
    <Route element={<ProtectedRoute permission="USER_MANAGE" />}>
      <Route path="/admin" element={<p>admin page</p>} />
    </Route>
  </Routes>
)

describe('ProtectedRoute', () => {
  it('redirects signed-out visitors to login', () => {
    renderWith(tree, { auth: { role: null }, route: '/admin' })
    expect(screen.getByText('login page')).toBeInTheDocument()
  })
  it('sends users without the permission to access-denied', () => {
    renderWith(tree, { auth: { role: 'FIELD_WORKER' }, route: '/admin' })
    expect(screen.getByText('denied page')).toBeInTheDocument()
  })
  it('lets users with the permission through', () => {
    renderWith(tree, { auth: { role: 'ADMIN' }, route: '/admin' })
    expect(screen.getByText('admin page')).toBeInTheDocument()
  })
})
