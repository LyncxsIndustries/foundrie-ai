# Production Readiness Checklist

**Last Updated:** 2026-07-04  
**Status:** Living Document  
**Related:** Features 65-70, FOUNDRIE_V15-V17

---

## Critical Gates (P0 - MUST HAVE)

### AI Reliability
- [ ] Retry logic with exponential backoff (3x, 1s/2s/4s delays)
- [ ] Multi-model fallback cascade (Claude → GPT-4 → DeepSeek)
- [ ] User-friendly error messages (no generic "failed")
- [ ] Discovery session persistence (survive page refresh)
- [ ] Telemetry for provider success rates

### Database Resilience
- [ ] Daily automated backups (3 geo-distributed locations)
- [ ] Keep-alive task (prevent cold starts)
- [ ] Breach detection with auto-snapshot
- [ ] Restore tested within last 30 days
- [ ] Neon upgraded to Pro ($19/month minimum)

### Payment Integrity
- [ ] Idempotency keys on all payment operations
- [ ] Two-phase commit (payment + database atomic)
- [ ] Stripe webhook handler with signature verification
- [ ] Daily reconciliation job (find stuck payments)
- [ ] Double-click prevention (frontend + backend)

---

## High Priority (P1 - BEFORE GROWTH)

### Scaling Infrastructure
- [ ] Multi-region Vercel deployment (8 regions)
- [ ] Read replicas (10x across 3 continents)
- [ ] Redis caching layer (>95% hit rate)
- [ ] Queue-based processing (long operations via Trigger.dev)
- [ ] CloudFlare CDN for static assets

### Monitoring & Observability
- [ ] Structured JSON logging (no `console.log`)
- [ ] Error tracking (Sentry or Datadog)
- [ ] Performance monitoring (API latency p50/p95/p99)
- [ ] Uptime monitoring (UptimeRobot or similar)
- [ ] Alert rules configured (error rate >1%, latency >500ms)

---

## Nice to Have (P2 - OPTIMIZATION)

### Predictive UX
- [ ] Phase completion detection
- [ ] Background pre-generation tasks
- [ ] Speculation manager with rollback
- [ ] Cache hit rate >70%

### Containerization
- [ ] Multi-stage Dockerfile
- [ ] Docker Compose for local dev
- [ ] Kubernetes manifests
- [ ] CI/CD pipeline with auto-rollback

---

## Security Checklist

- [ ] All environment variables in secrets manager (never committed)
- [ ] Dependency audit passing (no critical/high CVEs)
- [ ] SAST scan clean (Semgrep or CodeQL)
- [ ] Secret detection clean (Gitleaks or TruffleHog)
- [ ] Rate limiting on all public endpoints
- [ ] CORS configured correctly
- [ ] CSP headers set
- [ ] HTTPS enforced

---

## Performance Targets

| Metric | Target | How to Measure |
|--------|--------|----------------|
| API latency (p95) | <100ms | Vercel Analytics |
| Cache hit rate | >95% | Redis metrics |
| Database connections | <80% max | Neon dashboard |
| Error rate | <0.1% | Sentry |
| Uptime | >99.9% | UptimeRobot |

---

## Pre-Launch Verification

### Week Before Launch
- [ ] Load test with 10x expected traffic
- [ ] Chaos test (kill random services, verify recovery)
- [ ] Backup restore drill (verify <5 min RTO)
- [ ] Payment flow test (end-to-end with Stripe test mode)
- [ ] Security audit (OWASP Top 10)

### Day Before Launch
- [ ] All P0 items checked
- [ ] Monitoring dashboards configured
- [ ] On-call rotation set up
- [ ] Incident response playbook reviewed
- [ ] Rollback procedure tested

### Launch Day
- [ ] Traffic gradually ramped (10% → 50% → 100%)
- [ ] Metrics monitored real-time
- [ ] Error budget tracked (target <0.1%)
- [ ] Response team on standby

---

## Post-Launch Monitoring (First 48 Hours)

### Critical Metrics
- Error rate by endpoint
- API latency (p50/p95/p99)
- Database connection pool usage
- Cache hit rate
- Payment success rate
- User sign-up conversion rate

### Alert Thresholds
- Error rate >1% for 5 minutes → Page on-call
- API p95 >500ms for 10 minutes → Investigate
- Cache hit rate <80% → Check Redis
- Payment failure rate >5% → Critical alert

---

## Monthly Maintenance

- [ ] Review and rotate API keys
- [ ] Update dependencies (patch versions)
- [ ] Run backup restore drill
- [ ] Review error logs and fix top 10 issues
- [ ] Performance audit (identify slow queries)
- [ ] Cost optimization review

---

## Quarterly Reviews

- [ ] Major dependency updates
- [ ] Security audit
- [ ] Disaster recovery drill
- [ ] Capacity planning (scale projections)
- [ ] Architecture review (identify bottlenecks)

---

**This checklist must be reviewed before every major release.**
