import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

// We mock @clerk/nextjs/server to control createRouteMatcher and clerkMiddleware
const mockProtect = vi.fn()
const mockCreateRouteMatcher = vi.fn()
const mockClerkMiddleware = vi.fn()

vi.mock('@clerk/nextjs/server', () => ({
  createRouteMatcher: mockCreateRouteMatcher,
  clerkMiddleware: mockClerkMiddleware,
}))

describe('proxy.ts middleware config', () => {
  // Import config separately since it's a static export
  it('exports a matcher config with two patterns', async () => {
    const { config } = await import('../proxy')
    expect(config).toBeDefined()
    expect(Array.isArray(config.matcher)).toBe(true)
    expect(config.matcher).toHaveLength(2)
  })

  it('matcher[0] skips Next.js internals and static files', async () => {
    const { config } = await import('../proxy')
    const pattern = new RegExp(config.matcher[0].replace(/^\/?/, '').replace(/\(\?!/, '(?!'))
    // The pattern is used as a Next.js matcher string, test it as-is
    expect(config.matcher[0]).toContain('_next')
    expect(config.matcher[0]).toContain('(?!on)')  // js but not json
  })

  it('matcher[1] always runs for api and trpc routes', async () => {
    const { config } = await import('../proxy')
    expect(config.matcher[1]).toBe('/(api|trpc)(.*)')
  })
})

describe('proxy.ts public route list', () => {
  let capturedRoutes: string[]

  beforeEach(() => {
    vi.resetModules()
    capturedRoutes = []

    mockCreateRouteMatcher.mockImplementation((routes: string[]) => {
      capturedRoutes = routes
      return vi.fn(() => false)
    })
    mockClerkMiddleware.mockImplementation((handler: unknown) => handler)
  })

  it('registers the root path as public', async () => {
    await import('../proxy')
    expect(capturedRoutes).toContain('/')
  })

  it('registers /pricing with wildcard as public', async () => {
    await import('../proxy')
    expect(capturedRoutes).toContain('/pricing(.*)')
  })

  it('registers /sign-in with wildcard as public', async () => {
    await import('../proxy')
    expect(capturedRoutes).toContain('/sign-in(.*)')
  })

  it('registers /sign-up with wildcard as public', async () => {
    await import('../proxy')
    expect(capturedRoutes).toContain('/sign-up(.*)')
  })

  it('registers the Clerk webhook endpoint as public', async () => {
    await import('../proxy')
    expect(capturedRoutes).toContain('/api/webhooks/clerk')
  })

  it('registers exactly 5 public routes', async () => {
    await import('../proxy')
    expect(capturedRoutes).toHaveLength(5)
  })
})

describe('proxy.ts middleware handler', () => {
  let capturedHandler: (auth: { protect: Mock }, req: unknown) => Promise<void>

  beforeEach(() => {
    vi.resetModules()
    mockCreateRouteMatcher.mockImplementation((routes: string[]) =>
      vi.fn((req: { url?: string }) => false)
    )
    mockClerkMiddleware.mockImplementation(
      (handler: (auth: { protect: Mock }, req: unknown) => Promise<void>) => {
        capturedHandler = handler
        return handler
      }
    )
  })

  it('calls auth.protect() for non-public routes', async () => {
    const isPublicRouteFn = vi.fn(() => false)
    mockCreateRouteMatcher.mockReturnValue(isPublicRouteFn)

    await import('../proxy')

    const auth = { protect: vi.fn().mockResolvedValue(undefined) }
    const req = { url: '/dashboard' }

    await capturedHandler(auth, req)

    expect(auth.protect).toHaveBeenCalledOnce()
  })

  it('does NOT call auth.protect() for public routes', async () => {
    const isPublicRouteFn = vi.fn(() => true)
    mockCreateRouteMatcher.mockReturnValue(isPublicRouteFn)

    await import('../proxy')

    const auth = { protect: vi.fn().mockResolvedValue(undefined) }
    const req = { url: '/sign-in' }

    await capturedHandler(auth, req)

    expect(auth.protect).not.toHaveBeenCalled()
  })

  it('passes the request object to the route matcher', async () => {
    const isPublicRouteFn = vi.fn(() => true)
    mockCreateRouteMatcher.mockReturnValue(isPublicRouteFn)

    await import('../proxy')

    const auth = { protect: vi.fn() }
    const req = { url: '/some-page' }

    await capturedHandler(auth, req)

    expect(isPublicRouteFn).toHaveBeenCalledWith(req)
  })

  it('calls auth.protect() for a protected API route', async () => {
    const isPublicRouteFn = vi.fn(() => false)
    mockCreateRouteMatcher.mockReturnValue(isPublicRouteFn)

    await import('../proxy')

    const auth = { protect: vi.fn().mockResolvedValue(undefined) }
    const req = { url: '/api/projects' }

    await capturedHandler(auth, req)

    expect(auth.protect).toHaveBeenCalledOnce()
  })

  it('does NOT call auth.protect() for the Clerk webhook endpoint', async () => {
    // Simulate the webhook endpoint being matched as public
    const isPublicRouteFn = vi.fn((req: { url?: string }) =>
      req.url === '/api/webhooks/clerk'
    )
    mockCreateRouteMatcher.mockReturnValue(isPublicRouteFn)

    await import('../proxy')

    const auth = { protect: vi.fn() }
    const req = { url: '/api/webhooks/clerk' }

    await capturedHandler(auth, req)

    expect(auth.protect).not.toHaveBeenCalled()
  })
})