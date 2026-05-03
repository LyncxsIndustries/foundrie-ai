import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SignUpPage from '../app/(auth)/sign-up/[[...sign-up]]/page'

vi.mock('@clerk/nextjs', () => ({
  SignUp: () => <div data-testid="clerk-sign-up">SignUp Component</div>,
}))

describe('SignUpPage', () => {
  it('renders without crashing', () => {
    render(<SignUpPage />)
  })

  it('renders the Clerk SignUp component', () => {
    render(<SignUpPage />)
    expect(screen.getByTestId('clerk-sign-up')).toBeInTheDocument()
  })

  it('wraps SignUp in a full-screen centered container', () => {
    const { container } = render(<SignUpPage />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.tagName).toBe('DIV')
    expect(wrapper).toHaveClass('flex')
    expect(wrapper).toHaveClass('h-screen')
    expect(wrapper).toHaveClass('w-full')
    expect(wrapper).toHaveClass('items-center')
    expect(wrapper).toHaveClass('justify-center')
  })

  it('renders exactly one top-level div', () => {
    const { container } = render(<SignUpPage />)
    const topLevelDivs = container.children
    expect(topLevelDivs).toHaveLength(1)
    expect(topLevelDivs[0].tagName).toBe('DIV')
  })

  it('SignUp component is the only child of the container', () => {
    const { container } = render(<SignUpPage />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.children).toHaveLength(1)
    expect(wrapper.children[0].getAttribute('data-testid')).toBe('clerk-sign-up')
  })

  it('renders the correct page structure matching the expected layout', () => {
    const { container } = render(<SignUpPage />)
    expect(container.innerHTML).toContain('SignUp Component')
  })
})