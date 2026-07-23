# Feature 70: Docker + Kubernetes Production Deployment

**Status:** Not Started  
**Priority:** P2 (Scale Optimization)  
**Dependencies:** Feature 68 (High-Concurrency Scaling)  
**Assigned To:** AI Agent  
**Estimated Effort:** 5 days

---

## Problem Statement

### Current State: Vercel-Only

**Pros:**
- ✅ Zero DevOps
- ✅ Auto-scaling
- ✅ Global CDN

**Cons:**
- ❌ Vendor lock-in
- ❌ Cold starts on free tier
- ❌ Limited control over environment
- ❌ "Works on my machine" bugs still possible
- ❌ Expensive at 10M+ users ($50K/month)

### Target

**Hybrid Architecture:**
- Vercel Edge: Frontend + lightweight API routes
- Kubernetes (AWS EKS): Heavy backend (AI, diagrams, ZIP generation)

**Benefits:**
- 70% cost reduction at scale
- Zero "works on my machine" bugs
- Fine-grained resource control
- Multi-cloud portability

---

## Solution Overview

Containerize application with Docker + Kubernetes:

1. **Multi-Stage Dockerfile** - Optimized production builds
2. **Docker Compose** - Local development parity
3. **Kubernetes Manifests** - Deployment, HPA, Service, Ingress
4. **CI/CD Pipeline** - Automated build → test → deploy
5. **Health Checks** - Liveness and readiness probes

**Result:** Production-grade infrastructure, 10x cheaper at scale

---

## Technical Design

### 1. Multi-Stage Dockerfile

```dockerfile
# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci --production=false

# Stage 2: Build
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js app
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 3: Production runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### 2. Docker Compose (Local Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/foundrie
      REDIS_URL: redis://redis:6379
      NEXT_PUBLIC_APP_URL: http://localhost:3000
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./src:/app/src  # Hot reload in dev
    networks:
      - foundrie

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: foundrie
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - foundrie

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - foundrie

networks:
  foundrie:
    driver: bridge

volumes:
  postgres_data:
```

### 3. Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: foundrie-ai
  namespace: production
  labels:
    app: foundrie-ai
    version: v1.0.0
spec:
  replicas: 10  # Start with 10 pods
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%      # Add 25% more pods during update
      maxUnavailable: 25% # Max 25% unavailable during update
  selector:
    matchLabels:
      app: foundrie-ai
  template:
    metadata:
      labels:
        app: foundrie-ai
        version: v1.0.0
    spec:
      containers:
      - name: foundrie-ai
        image: foundrie/ai:v1.0.0  # From container registry
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: foundrie-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: foundrie-secrets
              key: redis-url
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 15"]  # Graceful shutdown
```

### 4. Horizontal Pod Autoscaler

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: foundrie-ai-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: foundrie-ai
  minReplicas: 10
  maxReplicas: 1000
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70  # Scale up if CPU > 70%
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80  # Scale up if memory > 80%
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100  # Double pods every minute under load
        periodSeconds: 60
      - type: Pods
        value: 10   # Or add 10 pods per minute
        periodSeconds: 60
      selectPolicy: Max
    scaleDown:
      stabilizationWindowSeconds: 300  # Wait 5 min before scaling down
      policies:
      - type: Percent
        value: 10   # Decrease by 10% every 5 minutes
        periodSeconds: 300
```

### 5. Service & Ingress

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: foundrie-ai-service
  namespace: production
spec:
  type: LoadBalancer
  selector:
    app: foundrie-ai
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  sessionAffinity: ClientIP  # Sticky sessions
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 3600   # 1 hour

---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: foundrie-ai-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"  # 100 req/s per IP
spec:
  tls:
  - hosts:
    - api.foundrie.ai
    secretName: foundrie-tls
  rules:
  - host: api.foundrie.ai
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: foundrie-ai-service
            port:
              number: 80
```

### 6. Health Check Endpoints

```typescript
// app/api/health/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/cache/redis";

export async function GET() {
  const checks = await Promise.allSettled([
    db.$queryRaw`SELECT 1`,  // Database
    redis.ping(),             // Redis
    fetch("https://api.stripe.com/v1/ping"),  // Stripe
  ]);

  const healthy = checks.every(c => c.status === "fulfilled");

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      checks: {
        database: checks[0].status,
        redis: checks[1].status,
        stripe: checks[2].status,
      },
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || "unknown",
    },
    { status: healthy ? 200 : 503 }
  );
}

// app/api/ready/route.ts
export async function GET() {
  try {
    // Quick check - just database
    await db.$queryRaw`SELECT 1`;
    return new Response("OK", { status: 200 });
  } catch {
    return new Response("NOT READY", { status: 503 });
  }
}
```

### 7. CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
    - uses: actions/checkout@v3

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2

    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=sha,prefix={{branch}}-
          type=semver,pattern={{version}}
          type=raw,value=latest,enable={{is_default_branch}}

    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

    - name: Configure kubectl
      uses: azure/k8s-set-context@v3
      with:
        method: kubeconfig
        kubeconfig: ${{ secrets.KUBE_CONFIG }}

    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/foundrie-ai \
          foundrie-ai=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
          -n production
        
        kubectl rollout status deployment/foundrie-ai -n production --timeout=5m

    - name: Run smoke tests
      run: |
        curl -f https://api.foundrie.ai/health || exit 1
        curl -f https://api.foundrie.ai/ready || exit 1
```

---

## Acceptance Criteria

- [ ] Docker image builds successfully (<5 min)
- [ ] Docker Compose runs locally (matches production exactly)
- [ ] Kubernetes deployment succeeds
- [ ] HPA scales from 10 to 100 pods under load test
- [ ] Health checks pass (liveness + readiness)
- [ ] Rolling updates complete with zero downtime
- [ ] CI/CD pipeline deploys on push to main
- [ ] Smoke tests pass after deployment
- [ ] Cost at 1M users: <$2,000/month (vs $5,000 Vercel-only)

---

## Files Owned

### New Files
- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`
- `k8s/deployment.yaml`
- `k8s/hpa.yaml`
- `k8s/service.yaml`
- `k8s/ingress.yaml`
- `k8s/secrets.yaml` (template)
- `.github/workflows/deploy.yml`
- `app/api/health/route.ts`
- `app/api/ready/route.ts`
- `scripts/deploy.sh`

---

## Testing Requirements

- Build Docker image locally
- Run Docker Compose, verify app works
- Deploy to test K8s cluster
- Load test with 10K concurrent users
- Verify HPA scales correctly
- Test rolling update (zero downtime)
- Kill random pods → verify self-healing

---

## Out of Scope

- ❌ Multi-cloud deployment (AWS + GCP + Azure)
- ❌ Service mesh (Istio/Linkerd)
- ❌ GitOps (ArgoCD/Flux)
- ❌ Helm charts (raw manifests sufficient)

---

## External Services Setup

### AWS EKS Cluster
1. Install AWS CLI + kubectl + eksctl
2. Create cluster:
   ```bash
   eksctl create cluster \
     --name foundrie-prod \
     --region us-east-1 \
     --nodegroup-name standard-workers \
     --node-type t3.large \
     --nodes 3 \
     --nodes-min 3 \
     --nodes-max 10 \
     --managed
   ```
3. Configure kubectl:
   ```bash
   aws eks update-kubeconfig --name foundrie-prod --region us-east-1
   ```
4. Install NGINX Ingress Controller:
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/aws/deploy.yaml
   ```
5. Install cert-manager (for TLS):
   ```bash
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
   ```

---

**END OF SPEC**
