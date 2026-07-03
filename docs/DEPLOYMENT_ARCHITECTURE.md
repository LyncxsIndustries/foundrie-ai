# Deployment Architecture

**Created:** 2026-07-04
**Related:** Feature 70, CONTAINER_ORCHESTRATION.md

## Current: Prototype

- Next.js + Neon + Vercel
- Cost: $0/month
- Capacity: <10K users

## Future: Production Scale

```
CloudFlare CDN
    ↓
Vercel Edge (frontend)
    ↓
Kubernetes (backend)
    ├→ AI Workers
    ├→ Diagram Workers
    └→ ZIP Workers
```

- Cost: $1K-5K/month
- Capacity: 10M users

## Migration Path

1. Keep Vercel for frontend
2. Add Kubernetes for heavy backend
3. Connect via API gateway
4. Gradually shift traffic

See CONTAINER_ORCHESTRATION.md for Docker/K8s basics.
