# Monitoring System Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         GRAFANA DASHBOARD                                │
│                      http://localhost:3030                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   Services   │  │    System    │  │   Database   │                  │
│  │   Overview   │  │   Metrics    │  │   Metrics    │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└────────────────────────────┬────────────────────────────────────────────┘
                             │ Queries (PromQL)
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       PROMETHEUS SERVER                                  │
│                      http://localhost:9090                               │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │  Metrics Storage (30 days retention)                          │      │
│  │  Alert Evaluation                                             │      │
│  │  Recording Rules                                              │      │
│  └──────────────────────────────────────────────────────────────┘      │
└─────────────┬───────────────────────────────────────┬───────────────────┘
              │ Scrape Metrics (15s)                  │ Send Alerts
              │                                       ▼
              │                              ┌─────────────────────┐
              │                              │   ALERTMANAGER      │
              │                              │  localhost:9093     │
              │                              │  ┌───────────────┐  │
              │                              │  │ Alert Routing │  │
              │                              │  │ Deduplication │  │
              │                              │  │ Notifications │  │
              │                              │  └───────────────┘  │
              │                              └──────────┬──────────┘
              │                                         │ Webhook
              │                                         ▼
              │                              ┌─────────────────────┐
              │                              │ Notification Service│
              │                              │   (Alert Handler)   │
              │                              └─────────────────────┘
              │
              ├─────────────────────────────────────────────────────────────┐
              │                                                             │
┌─────────────▼──────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│    NODE EXPORTER       │  │  REDIS EXPORTER  │  │    cADVISOR      │   │
│   :9100/metrics        │  │  :9121/metrics   │  │  :8080/metrics   │   │
│  ┌──────────────────┐  │  │ ┌──────────────┐ │  │ ┌──────────────┐ │   │
│  │ CPU              │  │  │ │ Connections  │ │  │ │ Container    │ │   │
│  │ Memory           │  │  │ │ Memory       │ │  │ │ CPU/Memory   │ │   │
│  │ Disk             │  │  │ │ Commands     │ │  │ │ Network      │ │   │
│  │ Network          │  │  │ └──────────────┘ │  │ └──────────────┘ │   │
│  └──────────────────┘  │  └──────────────────┘  └──────────────────┘   │
└────────────────────────┘                                                │
                                                                          │
                                                                          │
┌─────────────────────────────────────────────────────────────────────────┤
│                    MICROSERVICES (Custom Metrics)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│  │  API GATEWAY     │  │  AUTH SERVICE    │  │  USER SERVICE    │    │
│  │  :3000/metrics   │  │  :3001/metrics   │  │  :3002/metrics   │    │
│  │  :3000/health    │  │  :3001/health    │  │  :3002/health    │    │
│  │                  │  │                  │  │                  │    │
│  │ • HTTP Requests  │  │ • HTTP Requests  │  │ • HTTP Requests  │    │
│  │ • Response Time  │  │ • Auth Attempts  │  │ • Response Time  │    │
│  │ • Error Rate     │  │ • Response Time  │  │ • Error Rate     │    │
│  │ • Connections    │  │ • Error Rate     │  │ • Connections    │    │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘    │
│                                                                         │
│  ┌──────────────────┐  ┌───────────────────────────────────────┐     │
│  │  CHAT SERVICE    │  │  NOTIFICATION SERVICE                  │     │
│  │  :3003/metrics   │  │  :3004/metrics                         │     │
│  │  :3003/health    │  │  :3004/health                          │     │
│  │                  │  │                                         │     │
│  │ • HTTP Requests  │  │ • HTTP Requests                        │     │
│  │ • WebSocket Conn │  │ • Notifications Sent                   │     │
│  │ • Messages Sent  │  │ • Response Time                        │     │
│  │ • Response Time  │  │ • Error Rate                           │     │
│  └──────────────────┘  └───────────────────────────────────────┘     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         DATABASES & SERVICES                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────┐      ┌────────────────┐      ┌─────────────────┐  │
│  │     REDIS      │      │ ELASTICSEARCH  │      │    LOGSTASH     │  │
│  │   :6379        │      │     :9200      │      │     :5044       │  │
│  └────────────────┘      └────────────────┘      └─────────────────┘  │
│         ▲                        ▲                                     │
│         │                        │                                     │
│         └────────────────────────┴─────────────────────────────────────┤
│                    Monitored by Exporters                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Metrics Collection
```
Service Application
    ↓ (exposes)
/metrics endpoint
    ↓ (scraped by)
Prometheus
    ↓ (stores)
Time-Series Database
```

### 2. Visualization
```
Prometheus
    ↓ (queries via PromQL)
Grafana
    ↓ (renders)
Dashboards
    ↓ (viewed by)
Users
```

### 3. Alerting
```
Prometheus
    ↓ (evaluates alert rules)
Alert Triggered
    ↓ (sends to)
Alertmanager
    ↓ (routes to)
Notification Service
    ↓ (notifies)
Admin/Team
```

## Network Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Docker Network: internal-network                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐       │
│  │ Prometheus │◄───┤  Services  │◄───┤  Grafana   │       │
│  │   :9090    │    │  :300x     │    │   :3030    │       │
│  └─────┬──────┘    └────────────┘    └────────────┘       │
│        │                                                    │
│        │ scrape                                             │
│        │                                                    │
│        ├─► Node Exporter (:9100)                           │
│        ├─► Redis Exporter (:9121)                          │
│        ├─► cAdvisor (:8080)                                │
│        ├─► API Gateway (:3000/metrics)                     │
│        ├─► Auth Service (:3001/metrics)                    │
│        ├─► User Service (:3002/metrics)                    │
│        ├─► Chat Service (:3003/metrics)                    │
│        └─► Notification Service (:3004/metrics)            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         ▲                                            ▲
         │                                            │
    Host :9090                                   Host :3030
    (Exposed)                                    (Exposed)
```

## Metrics Plugin Architecture

```typescript
┌─────────────────────────────────────────────────┐
│           Fastify Application                    │
├─────────────────────────────────────────────────┤
│                                                  │
│  Request  →  Middleware  →  Route  →  Response  │
│     ↓            ↓            ↓          ↓      │
│  ┌──────────────────────────────────────────┐  │
│  │        Metrics Plugin Hooks              │  │
│  │                                          │  │
│  │  onRequest:                              │  │
│  │    - Increment active_connections        │  │
│  │    - Start timer                         │  │
│  │                                          │  │
│  │  onResponse:                             │  │
│  │    - Decrement active_connections        │  │
│  │    - Record duration                     │  │
│  │    - Increment request counter           │  │
│  │    - Update histogram                    │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  GET /metrics  →  Return Prometheus Metrics     │
│  GET /health   →  Return Health Status          │
│                                                  │
└─────────────────────────────────────────────────┘
```

## Alert Flow

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Metric Collection                                         │
│    Service → Prometheus (every 15s)                          │
└─────────────┬────────────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. Rule Evaluation                                           │
│    Prometheus evaluates alert.rules.yml (every 15s)         │
│    Example: cpu_usage > 80% for 5 minutes                   │
└─────────────┬────────────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. Alert Triggered                                           │
│    Condition met → Alert state: PENDING → FIRING             │
└─────────────┬────────────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. Alert Sent to Alertmanager                                │
│    Prometheus → Alertmanager                                 │
└─────────────┬────────────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. Alert Routing                                             │
│    Alertmanager checks:                                      │
│    - Alert severity (critical/warning)                       │
│    - Deduplication                                           │
│    - Inhibition rules                                        │
└─────────────┬────────────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────────────────────────┐
│ 6. Notification                                              │
│    Webhook → Notification Service                            │
│    Email (optional) → Admin                                  │
│    Slack (optional) → Team Channel                           │
└──────────────────────────────────────────────────────────────┘
```

## Storage Architecture

```
Docker Volumes
├── prometheus_data
│   ├── chunks/              # Time-series data chunks
│   ├── wal/                 # Write-ahead log
│   └── queries.active       # Active queries
│   (Retention: 30 days)
│
├── grafana_data
│   ├── grafana.db           # SQLite database
│   ├── plugins/             # Installed plugins
│   └── sessions/            # User sessions
│
└── alertmanager_data
    ├── nflog                # Notification log
    └── silences             # Silenced alerts
```

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Network Isolation                              │
│   ✓ Services on internal Docker network                 │
│   ✓ Only necessary ports exposed to host                │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Authentication                                  │
│   ✓ Grafana: Username/Password + Secret Key             │
│   ✓ User roles: Admin, Editor, Viewer                   │
│   ✓ Sign-up disabled                                     │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Access Control                                  │
│   ✓ Dashboard permissions                                │
│   ✓ Datasource access control                           │
│   ✓ API key management                                   │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 4: Data Protection                                 │
│   ✓ Persistent volumes for data                         │
│   ✓ Backup procedures                                    │
│   ✓ Secure credential storage                           │
└─────────────────────────────────────────────────────────┘
```

## Scaling Considerations

### Current Setup (Single Node)
```
All components on single Docker host
├── Suitable for: Development, Small Production
├── Capacity: ~10 services, ~1M metrics/day
└── Retention: 30 days
```

### Future Scaling Options

#### Horizontal Scaling
```
Prometheus Federation
├── Multiple Prometheus servers
├── Central Prometheus aggregates
└── Suitable for: 50+ services
```

#### Vertical Scaling
```
Increase Resources
├── More RAM for Prometheus
├── Faster storage (SSD)
└── Suitable for: 20-50 services
```

#### Long-term Storage
```
Remote Storage Integration
├── Thanos for long-term storage
├── Cortex for multi-tenancy
└── Suitable for: Enterprise deployments
```

## Deployment Checklist

```
Pre-deployment:
☐ Run setup.sh script
☐ Configure .env file with secure passwords
☐ Install prom-client in all services
☐ Register metrics plugin in each service

Deployment:
☐ Start monitoring stack: docker-compose up -d
☐ Verify all containers running: docker ps
☐ Check Prometheus targets: http://localhost:9090/targets
☐ Access Grafana: http://localhost:3030

Post-deployment:
☐ Verify metrics collection for all services
☐ Test alert rules (optional: trigger test alert)
☐ Configure alert notifications
☐ Train team on dashboard usage
☐ Schedule regular backups
☐ Document custom metrics
```

---

This architecture provides a solid foundation for monitoring and can scale as your application grows!
