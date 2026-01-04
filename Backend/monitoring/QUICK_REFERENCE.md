# Monitoring System - Quick Reference

## Service Endpoints

| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana | http://localhost:3030 | admin / (see .env) |
| Prometheus | http://localhost:9090 | - |
| Alertmanager | http://localhost:9093 | - |
| Node Exporter | http://localhost:9100/metrics | - |
| cAdvisor | http://localhost:8080 | - |

## Service Metrics Endpoints

| Service | Metrics URL | Health URL |
|---------|-------------|------------|
| API Gateway | http://localhost:3000/metrics | http://localhost:3000/health |
| Auth Service | http://auth-service:3001/metrics | http://auth-service:3001/health |
| User Service | http://user-service:3002/metrics | http://user-service:3002/health |
| Chat Service | http://chat-service:3003/metrics | http://chat-service:3003/health |
| Notification Service | http://notification-service:3004/metrics | http://notification-service:3004/health |

## Quick Commands

```bash
# Start monitoring stack only
docker-compose up -d prometheus grafana alertmanager node-exporter redis-exporter cadvisor

# Start everything
docker-compose up -d

# View logs
docker logs prometheus
docker logs grafana
docker logs alertmanager

# Restart monitoring services
docker-compose restart prometheus grafana

# Stop monitoring stack
docker-compose stop prometheus grafana alertmanager

# Check if Prometheus is scraping targets
curl http://localhost:9090/api/v1/targets

# Test service metrics endpoint
curl http://localhost:3000/metrics
```

## Common PromQL Queries

```promql
# Service up/down status
up

# Request rate per service
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# CPU usage
100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Active connections
sum(active_connections) by (job)

# Redis memory usage
(redis_memory_used_bytes / redis_memory_max_bytes) * 100
```

## Alert Severity Levels

- **Critical**: Requires immediate action (service down, critical resource exhaustion)
- **Warning**: Requires attention soon (high resource usage, elevated error rates)
- **Info**: Informational (high traffic, notable events)

## Grafana Dashboard IDs

- `services-overview` - Service health and performance overview
- `system-metrics` - System and container metrics
- `database-metrics` - Redis and Elasticsearch metrics

## File Locations

```
Backend/monitoring/
├── prometheus/
│   ├── prometheus.yml          # Main Prometheus config
│   ├── alert.rules.yml         # Alert rules
│   └── recording.rules.yml     # Recording rules
├── grafana/
│   ├── grafana.ini             # Grafana configuration
│   └── provisioning/
│       ├── datasources/        # Datasource configs
│       └── dashboards/         # Dashboard JSON files
├── alertmanager/
│   └── alertmanager.yml        # Alert routing config
└── README.md                   # Full documentation
```

## Troubleshooting Quick Fixes

**Problem**: Grafana shows "No data"
```bash
# Check Prometheus datasource
curl http://localhost:9090/api/v1/query?query=up

# Restart Grafana
docker-compose restart grafana
```

**Problem**: Service metrics not appearing
```bash
# Check service exposes metrics
curl http://localhost:3000/metrics

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets | jq .
```

**Problem**: Alerts not firing
```bash
# Check alert rules
curl http://localhost:9090/api/v1/rules

# Check Alertmanager
docker logs alertmanager
```

## Data Retention

- **Prometheus**: 30 days (configurable in docker-compose.yml)
- **Grafana**: Persistent via volume
- **Alertmanager**: Persistent via volume

## Important Notes

1. Always change default passwords in production
2. Monitor disk space for metrics storage
3. Regular backups of Grafana dashboards
4. Review and adjust alert thresholds based on your workload
5. Use internal network for service communication
