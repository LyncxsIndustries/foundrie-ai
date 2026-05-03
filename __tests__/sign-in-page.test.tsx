import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SignInPage from '../app/(auth)/sign-in/[[...sign-in]]/page'

vi.mock('@clerk/nextjs', () => ({
  SignIn: () => <div data-testid="clerk-sign-in">SignIn Component</div>,
}))

describe('SignInPage', () => {
  it('renders without crashing', () => {
    render(<SignInPage />)
  })

  it('renders the Clerk SignIn component', () => {
    render(<SignInPage />)
    expect(screen.getByTestId('clerk-sign-in')).toBeInTheDocument()
  })

  it('wraps SignIn in a full-screen centered container', () => {
    const { container } = render(<SignInPage />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.tagName).toBe('DIV')
    expect(wrapper).toHaveClass('flex')
    expect(wrapper).toHaveClass('h-screen')
    expect(wrapper).toHaveClass('w-full')
    expect(wrapper).toHaveClass('items-center')
    expect(wrapper).toHaveClass('justify-center')
  })

  it('renders exactly one top-level div', () => {
    const { container } = render(<SignInPage />)
    const topLevelDivs = container.children
    expect(topLevelDivs).toHaveLength(1)
    expect(topLevelDivs[0].tagName).toBe('DIV')
  })

  it('SignIn component is the only child of the container', () => {
    const { container } = render(<SignInPage />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.children).toHaveLength(1)
    expect(wrapper.children[0].getAttribute('data-testid')).toBe('clerk-sign-in')
  })

  it('renders the correct page structure matching the expected layout', () => {
    const { container } = render(<SignInPage />)
    expect(container.innerHTML).toContain('SignIn Component')
  })
})