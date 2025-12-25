# RateGuard - Kubernetes Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Deployment Steps](#deployment-steps)
5. [Configuration Reference](#configuration-reference)
6. [Scaling & Performance](#scaling--performance)
7. [Monitoring & Debugging](#monitoring--debugging)
8. [Production Recommendations](#production-recommendations)
9. [Interview Defense](#interview-defense)

---

## Overview

The `k8s/` directory contains production-ready Kubernetes manifests for deploying RateGuard. This setup provides:

- **High Availability**: Multiple replicas with pod anti-affinity
- **Auto-scaling**: Horizontal Pod Autoscaler for the proxy
- **Zero-downtime Deployments**: Rolling updates with health probes
- **Security**: Kubernetes Secrets, RBAC-ready structure
- **External Access**: Ingress with TLS termination

### Directory Structure

```
k8s/
├── namespace.yaml          # Logical isolation
├── configmaps/             # Non-sensitive environment variables
├── secrets/                # Credentials (template only)
├── databases/              # PostgreSQL, Redis, ClickHouse, Redpanda
├── deployments/            # Application workloads
├── services/               # Internal networking
├── ingress/                # External access
└── hpa/                    # Auto-scaling rules
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        KUBERNETES CLUSTER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        INGRESS (NGINX)                               │    │
│  │  rateguard.example.com → web-service                                │    │
│  │  api.rateguard.example.com → proxy-service                          │    │
│  └───────────────────────────────┬─────────────────────────────────────┘    │
│                                  │                                           │
│  ┌───────────────────────────────┴─────────────────────────────────────┐    │
│  │                          SERVICES LAYER                              │    │
│  │  ┌──────────────┐    ┌──────────────┐                               │    │
│  │  │  web-service │    │ proxy-service│                               │    │
│  │  │   (3000)     │    │   (3001)     │                               │    │
│  │  └──────┬───────┘    └──────┬───────┘                               │    │
│  └─────────┼───────────────────┼───────────────────────────────────────┘    │
│            │                   │                                             │
│  ┌─────────┴───────────────────┴───────────────────────────────────────┐    │
│  │                        DEPLOYMENTS                                   │    │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │    │
│  │  │    web      │    │    proxy    │    │  analytics  │              │    │
│  │  │  (2 pods)   │    │ (3-20 pods) │    │  (2 pods)   │              │    │
│  │  │             │    │  ↑ HPA      │    │             │              │    │
│  │  └─────────────┘    └─────────────┘    └─────────────┘              │    │
│  │                                                                      │    │
│  │  ┌─────────────┐                                                    │    │
│  │  │   alerts    │                                                    │    │
│  │  │  (1 pod)    │                                                    │    │
│  │  └─────────────┘                                                    │    │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                  │                                           │
│  ┌───────────────────────────────┴─────────────────────────────────────┐    │
│  │                        DATABASES (StatefulSets)                      │    │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐          │    │
│  │  │PostgreSQL│  │  Redis   │  │ClickHouse  │  │ Redpanda │          │    │
│  │  │  (5432)  │  │  (6379)  │  │   (8123)   │  │  (9092)  │          │    │
│  │  └──────────┘  └──────────┘  └────────────┘  └──────────┘          │    │
│  │       ↓             ↓              ↓              ↓                  │    │
│  │      PVC           PVC            PVC            PVC                 │    │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Tools Required

```bash
# Kubernetes CLI
kubectl version --client

# Helm (for NGINX Ingress)
helm version

# Optional: k9s for debugging
brew install k9s  # macOS
```

### Cluster Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| **Nodes** | 2 | 3+ |
| **CPU** | 4 cores | 8+ cores |
| **Memory** | 8GB | 16GB+ |
| **Storage Class** | Standard | SSD (gp2/gp3) |

### NGINX Ingress Controller

```bash
# Install NGINX Ingress Controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace
```

---

## Deployment Steps

### 1. Create Namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

### 2. Configure Secrets

**⚠️ IMPORTANT**: Never commit real secrets to version control!

```bash
# Copy and edit secrets template
cp k8s/secrets/rateguard-secrets.yaml k8s/secrets/rateguard-secrets.local.yaml

# Edit with real values (base64 encoded)
echo -n 'your-jwt-secret' | base64
# Output: eW91ci1qd3Qtc2VjcmV0

# Apply secrets
kubectl apply -f k8s/secrets/rateguard-secrets.local.yaml
```

**Production**: Use [External Secrets Operator](https://external-secrets.io/) with AWS Secrets Manager or HashiCorp Vault.

### 3. Apply ConfigMaps

```bash
kubectl apply -f k8s/configmaps/
```

### 4. Deploy Databases

```bash
kubectl apply -f k8s/databases/

# Wait for all pods to be ready
kubectl -n rateguard get pods -w
```

### 5. Initialize Database Schema

```bash
# Run Prisma migrations
kubectl -n rateguard exec -it deploy/web -- npx prisma migrate deploy

# Seed initial data (optional)
kubectl -n rateguard exec -it deploy/web -- npx prisma db seed
```

### 6. Deploy Applications

```bash
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/
```

### 7. Configure Ingress

```bash
# Edit hostnames in ingress.yaml
kubectl apply -f k8s/ingress/
```

### 8. Enable Auto-scaling

```bash
kubectl apply -f k8s/hpa/
```

### Verify Deployment

```bash
# Check all resources
kubectl -n rateguard get all

# Check HPA status
kubectl -n rateguard get hpa

# Check ingress
kubectl -n rateguard get ingress

# View logs
kubectl -n rateguard logs -l app=proxy --tail=100 -f
```

---

## Configuration Reference

### ConfigMap: `rateguard-config`

| Key | Description | Default |
|-----|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `LOG_LEVEL` | Logging level | `info` |
| `KAFKA_TOPIC` | Events topic | `api-events` |
| `CLICKHOUSE_DATABASE` | Analytics DB | `rateguard` |

### Secrets: `rateguard-secrets`

| Key | Description | Required |
|-----|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection | ✓ |
| `REDIS_URL` | Redis connection | ✓ |
| `KAFKA_BROKERS` | Kafka/Redpanda brokers | ✓ |
| `CLICKHOUSE_URL` | ClickHouse connection | ✓ |
| `JWT_SECRET` | JWT signing key (32+ chars) | ✓ |
| `ENCRYPTION_KEY` | Data encryption (32 chars) | ✓ |

### Resource Limits

| Component | CPU Request | CPU Limit | Memory Request | Memory Limit |
|-----------|-------------|-----------|----------------|--------------|
| **proxy** | 250m | 1000m | 256Mi | 512Mi |
| **web** | 100m | 500m | 128Mi | 256Mi |
| **analytics** | 100m | 500m | 128Mi | 256Mi |
| **alerts** | 50m | 200m | 64Mi | 128Mi |

---

## Scaling & Performance

### Horizontal Pod Autoscaler (HPA)

The proxy deployment automatically scales based on CPU utilization:

```yaml
# k8s/hpa/autoscaling.yaml
spec:
  scaleTargetRef:
    name: proxy
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          averageUtilization: 70
```

**Behavior:**
- **Scale up**: Adds pods when CPU > 70% (15-second window)
- **Scale down**: Removes pods when CPU < 70% (5-minute stabilization)

### Manual Scaling

```bash
# Scale manually
kubectl -n rateguard scale deployment/proxy --replicas=10

# Disable HPA temporarily
kubectl -n rateguard delete hpa proxy-hpa

# Re-enable
kubectl apply -f k8s/hpa/autoscaling.yaml
```

### Pod Anti-Affinity

Pods are spread across nodes for high availability:

```yaml
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          topologyKey: kubernetes.io/hostname
          labelSelector:
            matchLabels:
              app: proxy
```

---

## Monitoring & Debugging

### Essential Commands

```bash
# View all resources
kubectl -n rateguard get all

# Pod status
kubectl -n rateguard get pods -o wide

# View logs
kubectl -n rateguard logs deploy/proxy --tail=100 -f

# Describe pod (events, status)
kubectl -n rateguard describe pod <pod-name>

# Execute shell in pod
kubectl -n rateguard exec -it deploy/web -- sh

# Port forward for local access
kubectl -n rateguard port-forward svc/web 3000:3000
kubectl -n rateguard port-forward svc/proxy 3001:3001
```

### Debugging Checklist

1. **Pod not starting?**
   ```bash
   kubectl -n rateguard describe pod <pod-name>
   # Check Events section
   ```

2. **CrashLoopBackOff?**
   ```bash
   kubectl -n rateguard logs <pod-name> --previous
   ```

3. **Database connection issues?**
   ```bash
   # Verify secrets are mounted
   kubectl -n rateguard exec deploy/web -- env | grep DATABASE
   ```

4. **HPA not scaling?**
   ```bash
   kubectl -n rateguard describe hpa proxy-hpa
   # Ensure metrics-server is running
   kubectl -n kube-system get pods | grep metrics
   ```

### Prometheus Metrics

Add annotations for Prometheus scraping:

```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "9090"
  prometheus.io/path: "/metrics"
```

---

## Production Recommendations

### 1. Use Managed Databases

**Replace in-cluster databases with managed services:**

| Component | Self-Managed | Managed Alternative |
|-----------|--------------|---------------------|
| PostgreSQL | k8s/databases/postgres.yaml | AWS RDS, Google Cloud SQL, Azure Database |
| Redis | k8s/databases/redis.yaml | AWS ElastiCache, Google Memorystore |
| Kafka | k8s/databases/redpanda.yaml | Confluent Cloud, AWS MSK |
| ClickHouse | k8s/databases/clickhouse.yaml | ClickHouse Cloud, Altinity |

**Update secrets to point to managed services:**

```yaml
DATABASE_URL: postgresql://user:pass@rds.amazonaws.com:5432/rateguard
REDIS_URL: redis://elasticache.amazonaws.com:6379
```

### 2. External Secrets Operator

Replace static secrets with dynamic fetching:

```bash
# Install External Secrets
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets \
  --namespace external-secrets --create-namespace
```

```yaml
# ExternalSecret example
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: rateguard-secrets
  namespace: rateguard
spec:
  refreshInterval: 1h
  secretStoreRef:
    kind: ClusterSecretStore
    name: aws-secrets-manager
  target:
    name: rateguard-secrets
  data:
    - secretKey: JWT_SECRET
      remoteRef:
        key: rateguard/production
        property: jwt_secret
```

### 3. Enable TLS

```yaml
# k8s/ingress/ingress.yaml
spec:
  tls:
    - hosts:
        - rateguard.example.com
        - api.rateguard.example.com
      secretName: rateguard-tls
```

Use cert-manager for automatic certificate provisioning:

```bash
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --set installCRDs=true
```

### 4. Network Policies

Restrict pod-to-pod communication:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-proxy-only
  namespace: rateguard
spec:
  podSelector:
    matchLabels:
      app: postgres
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: proxy
        - podSelector:
            matchLabels:
              app: web
```

### 5. Pod Disruption Budgets

Ensure availability during updates:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: proxy-pdb
  namespace: rateguard
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: proxy
```

---

## Interview Defense

### Q: "Why Kubernetes instead of simpler options?"

> "Kubernetes provides automated scaling, self-healing, and declarative infrastructure that's essential for a high-availability proxy. When a pod crashes, Kubernetes restarts it. When traffic spikes, HPA adds pods automatically. With Docker Compose, I'd need to manually scale and handle failures. For an API gateway handling thousands of requests per second, this automation is crucial."

### Q: "How do you handle secrets in production?"

> "The secrets in the repo are templates with placeholder values. In production, I'd use External Secrets Operator to fetch credentials from AWS Secrets Manager or HashiCorp Vault. This provides:
> 1. Automatic rotation
> 2. Audit logging
> 3. No secrets in version control
> 4. Fine-grained access control"

### Q: "What happens if a pod crashes mid-request?"

> "The Kubernetes Service routes to healthy pods only. If a pod fails:
> 1. The liveness probe detects the failure
> 2. Kubernetes removes it from the Service endpoints
> 3. Existing connections drain gracefully (terminationGracePeriodSeconds)
> 4. Kubernetes schedules a replacement pod
> 5. Once ready (readiness probe passes), it receives traffic
> 
> Clients may see a single failed request, but retries hit healthy pods. For critical requests, client-side retry logic handles this."

### Q: "How do you scale the database layer?"

> "In production, I'd use managed databases. But conceptually:
> - **PostgreSQL**: Read replicas for query scaling, pgBouncer for connection pooling
> - **Redis**: Redis Cluster with sharding by workspace_id
> - **Kafka**: Add partitions (each app has own consumer group)
> - **ClickHouse**: Distributed tables across shards
> 
> The application layer is stateless, so horizontal scaling is straightforward."

### Q: "Why not use serverless (AWS Lambda)?"

> "Great question. For a proxy with consistent traffic, Kubernetes is more cost-effective. Lambda cold starts add 100-500ms latency on first requests. Our proxy needs sub-10ms overhead. Also:
> 1. Rate limiting state in Redis requires persistent connections (Lambda recreates on each invocation)
> 2. Predictable costs vs. Lambda's pay-per-invocation
> 3. No vendor lock-in
> 
> That said, Lambda could work for the alerts service with periodic triggers."

---

## Quick Reference

### Deploy Everything

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets/rateguard-secrets.local.yaml
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/databases/
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/
kubectl apply -f k8s/ingress/
kubectl apply -f k8s/hpa/
```

### Tear Down

```bash
kubectl delete namespace rateguard
```

### View All Resources

```bash
kubectl -n rateguard get all,configmaps,secrets,ingress,pvc
```
