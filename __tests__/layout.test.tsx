import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import RootLayout, { metadata } from '../app/layout'

// Mock CSS import
vi.mock('../app/globals.css', () => ({}))

// Mock next/font/google to avoid network calls
vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans', className: 'mock-geist' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono', className: 'mock-geist-mono' }),
}))

// Capture ClerkProvider props to verify theme configuration
const mockClerkProvider = vi.fn(({ children }: { children: React.ReactNode }) => (
  <div data-testid="clerk-provider">{children}</div>
))

vi.mock('@clerk/nextjs', () => ({
  ClerkProvider: (props: { children: React.ReactNode; appearance?: unknown }) =>
    mockClerkProvider(props),
}))

vi.mock('@clerk/themes', () => ({
  dark: { name: 'dark' },
}))

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-provider">{children}</div>
  ),
}))

describe('RootLayout metadata', () => {
  it('exports metadata with the correct title', () => {
    expect(metadata.title).toBe('Foundrie AI')
  })

  it('exports metadata with a non-empty description', () => {
    expect(typeof metadata.description).toBe('string')
    expect((metadata.description as string).length).toBeGreaterThan(0)
  })
})

describe('RootLayout component', () => {
  it('renders without crashing', () => {
    render(<RootLayout>content</RootLayout>)
  })

  it('renders children inside the layout', () => {
    render(<RootLayout><span data-testid="child">Hello</span></RootLayout>)
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('renders the ClerkProvider', () => {
    render(<RootLayout>content</RootLayout>)
    expect(screen.getByTestId('clerk-provider')).toBeInTheDocument()
  })

  it('renders the TooltipProvider inside ClerkProvider', () => {
    render(<RootLayout>content</RootLayout>)
    const clerkProvider = screen.getByTestId('clerk-provider')
    const tooltipProvider = screen.getByTestId('tooltip-provider')
    expect(clerkProvider).toContainElement(tooltipProvider)
  })

  it('renders children inside TooltipProvider', () => {
    render(<RootLayout><span data-testid="child">Hello</span></RootLayout>)
    const tooltipProvider = screen.getByTestId('tooltip-provider')
    expect(tooltipProvider).toContainElement(screen.getByTestId('child'))
  })

  it('passes the dark base theme to ClerkProvider', () => {
    render(<RootLayout>content</RootLayout>)
    const callArgs = mockClerkProvider.mock.calls[0][0]
    expect(callArgs.appearance).toBeDefined()
    expect(callArgs.appearance.baseTheme).toEqual({ name: 'dark' })
  })

  it('applies font variables and dark class to the html element', () => {
    render(<RootLayout>content</RootLayout>)
    // In jsdom, Next.js merges <html> attributes onto document.documentElement
    const html = document.documentElement
    expect(html.className).toContain('dark')
    expect(html.className).toContain('antialiased')
  })

  it('sets lang="en" on the html element', () => {
    render(<RootLayout>content</RootLayout>)
    const html = document.documentElement
    expect(html.getAttribute('lang')).toBe('en')
  })

  it('nests provider hierarchy: ClerkProvider > TooltipProvider > children', () => {
    render(
      <RootLayout>
        <span data-testid="deeply-nested">deep content</span>
      </RootLayout>
    )
    const clerkProvider = screen.getByTestId('clerk-provider')
    const tooltipProvider = screen.getByTestId('tooltip-provider')
    const child = screen.getByTestId('deeply-nested')

    expect(clerkProvider).toContainElement(tooltipProvider)
    expect(tooltipProvider).toContainElement(child)
  })
})