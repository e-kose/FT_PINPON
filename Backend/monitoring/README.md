# ft_transcendence - Monitoring System

## Overview

This monitoring system provides comprehensive observability for the ft_transcendence project using **Prometheus** and **Grafana**. It collects, stores, and visualizes metrics from all services, infrastructure components, and provides alerting capabilities for proactive issue detection.

## Architecture

### Components

1. **Prometheus** - Metrics collection and alerting
2. **Grafana** - Data visualization and dashboards
3. **Alertmanager** - Alert routing and notification management
4. **Node Exporter** - System/hardware metrics
5. **Redis Exporter** - Redis metrics
6. **cAdvisor** - Container metrics
7. **Custom Service Exporters** - Application-level metrics from all microservices

## Features

### ✅ Metrics Collection
- **System Metrics**: CPU, Memory, Disk, Network I/O
- **Container Metrics**: Per-container resource usage
- **Application Metrics**: HTTP requests, response times, error rates
- **Database Metrics**: Redis operations, Elasticsearch health
- **Custom Business Metrics**: Authentication attempts, WebSocket connections, messages sent

### ✅ Pre-configured Dashboards
1. **Services Overview** - Real-time service health and performance
2. **System Metrics** - Infrastructure resource utilization
3. **Database Metrics** - Redis and Elasticsearch monitoring

### ✅ Alerting
- **Service Health Alerts**: Detect service downtime
- **Performance Alerts**: High latency, error rates
- **Resource Alerts**: CPU, memory, disk usage thresholds
- **Database Alerts**: Redis/Elasticsearch health issues
- **Container Alerts**: Container failures and resource limits

### ✅ Security Features
- Grafana authentication with configurable credentials
- Secret key management
- Access control for monitoring data
- Secure service communication

### ✅ Data Retention
- 30-day metric retention in Prometheus
- Persistent volumes for data preservation
- Configurable retention policies

## Quick Start

### 1. Prerequisites
```bash
# Docker and Docker Compose installed
docker --version
docker-compose --version
```

### 2. Configuration

Create environment file:
```bash
cd Backend/monitoring
cp .env.example .env
```

Edit `.env` and set secure passwords:
```env
GRAFANA_ADMIN_PASSWORD=your_secure_password
GRAFANA_SECRET_KEY=your_secret_key_min_32_chars
ELASTIC_PASSWORD=your_elastic_password
```

### 3. Start Monitoring Stack

```bash
cd Backend
docker-compose up -d prometheus grafana alertmanager node-exporter redis-exporter cadvisor
```

### 4. Install prom-client in Services

Each service needs the Prometheus client library:

```bash
# For each service (api-gateway, auth-service, user-service, chat-service, notification-service)
cd Backend/api-gateway
npm install prom-client
```

### 5. Register Metrics Plugin

In each service's `app.ts`, register the metrics plugin:

```typescript
// Example: Backend/api-gateway/src/app.ts
import metricsPlugin from './plugins/metrics.plugin';

// After other plugins
await app.register(metricsPlugin);
```

### 6. Start All Services

```bash
cd Backend
docker-compose up -d
```

## Accessing the Monitoring System

### Grafana Dashboard
- **URL**: http://localhost:3030
- **Default Username**: `admin`
- **Default Password**: Check your `.env` file (default: `admin123`)

**First Time Setup:**
1. Login with credentials
2. Navigate to Dashboards
3. Browse pre-configured dashboards:
   - Services Overview
   - System Metrics
   - Database Metrics

### Prometheus UI
- **URL**: http://localhost:9090
- Query metrics directly
- View alerts
- Check target status

### Alertmanager
- **URL**: http://localhost:9093
- View active alerts
- Manage silences
- Configure notification routes

## Available Metrics

### HTTP Metrics (All Services)
- `http_requests_total` - Total HTTP requests by method, route, status
- `http_request_duration_seconds` - Request duration histogram
- `active_connections` - Current active connections

### Service-Specific Metrics

**Auth Service:**
- `auth_attempts_total` - Authentication attempts by result and method

**Chat Service:**
- `websocket_connections` - Active WebSocket connections
- `messages_total` - Total messages sent by type

**Notification Service:**
- `notifications_total` - Notifications sent by type and status

### System Metrics
- `node_cpu_seconds_total` - CPU usage
- `node_memory_*` - Memory metrics
- `node_filesystem_*` - Disk metrics
- `node_network_*` - Network metrics

### Container Metrics
- `container_cpu_usage_seconds_total` - Container CPU
- `container_memory_usage_bytes` - Container memory
- `container_network_*` - Container network

### Database Metrics
- `redis_connected_clients` - Redis connections
- `redis_memory_used_bytes` - Redis memory usage
- `redis_commands_processed_total` - Redis commands
- `elasticsearch_cluster_health_status` - ES cluster health

## Alert Rules

### Critical Alerts
- **ServiceDown**: Service unavailable for >2 minutes
- **CriticalCPUUsage**: CPU usage >95% for >2 minutes
- **CriticalMemoryUsage**: Memory usage >95% for >2 minutes
- **CriticalDiskUsage**: Disk usage >90% for >5 minutes
- **RedisDown**: Redis unavailable for >2 minutes
- **ElasticsearchClusterRed**: ES cluster in RED state

### Warning Alerts
- **HighErrorRate**: 5xx error rate >5% for >5 minutes
- **SlowResponseTime**: P95 latency >1s for >5 minutes
- **HighCPUUsage**: CPU usage >80% for >5 minutes
- **HighMemoryUsage**: Memory usage >80% for >5 minutes
- **HighDiskUsage**: Disk usage >80% for >10 minutes
- **AuthenticationFailures**: >10 auth failures/sec for >5 minutes

## Alert Configuration

### Webhook Integration

Alerts are sent to the notification service via webhook. Configure in `alertmanager.yml`:

```yaml
webhook_configs:
  - url: 'http://notification-service:3004/api/alerts'
    send_resolved: true
```

### Email Alerts (Optional)

Uncomment and configure in `alertmanager.yml`:

```yaml
email_configs:
  - to: 'admin@transcendence.com'
    headers:
      Subject: 'CRITICAL: {{ .GroupLabels.alertname }}'
```

Set SMTP settings in `global` section:
```yaml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alertmanager@transcendence.com'
  smtp_auth_username: 'your-email@gmail.com'
  smtp_auth_password: 'your-app-password'
```

## Custom Dashboards

### Creating New Dashboards

1. Login to Grafana
2. Click "+" → "Dashboard"
3. Add panels with PromQL queries
4. Save dashboard

### Exporting Dashboards

```bash
# Export dashboard JSON
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3030/api/dashboards/uid/services-overview > dashboard.json
```

### Importing Dashboards

1. Copy JSON to `Backend/monitoring/grafana/provisioning/dashboards/`
2. Restart Grafana: `docker-compose restart grafana`

## Useful PromQL Queries

### Service Availability
```promql
up{job="api-gateway"}
```

### Request Rate (per second)
```promql
rate(http_requests_total[5m])
```

### P95 Latency
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### Error Rate
```promql
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])
```

### CPU Usage
```promql
100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

### Memory Usage
```promql
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
```

## Troubleshooting

### Prometheus Not Scraping Targets

1. Check target status: http://localhost:9090/targets
2. Verify service is exposing `/metrics` endpoint
3. Check network connectivity between containers
4. Verify prometheus.yml configuration

```bash
# Test metrics endpoint
curl http://localhost:3000/metrics
```

### Grafana Not Showing Data

1. Check Prometheus datasource connection in Grafana
2. Verify Prometheus is collecting metrics
3. Check query syntax in panels
4. Review Grafana logs:
```bash
docker logs grafana
```

### High Memory Usage

Adjust Prometheus retention:
```yaml
command:
  - '--storage.tsdb.retention.time=15d'  # Reduce from 30d
```

### Alerts Not Firing

1. Check alert rules in Prometheus: http://localhost:9090/alerts
2. Verify Alertmanager configuration
3. Check Alertmanager logs:
```bash
docker logs alertmanager
```

## Maintenance

### Backup Metrics Data

```bash
# Backup Prometheus data
docker run --rm -v backend_prometheus_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/prometheus-backup.tar.gz -C /data .

# Backup Grafana data
docker run --rm -v backend_grafana_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/grafana-backup.tar.gz -C /data .
```

### Restore Metrics Data

```bash
# Restore Prometheus data
docker run --rm -v backend_prometheus_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/prometheus-backup.tar.gz -C /data

# Restore Grafana data
docker run --rm -v backend_grafana_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/grafana-backup.tar.gz -C /data
```

### Clean Up Old Data

```bash
# Remove volumes
docker-compose down -v

# Recreate with fresh data
docker-compose up -d
```

## Performance Tuning

### Prometheus

```yaml
# prometheus.yml
global:
  scrape_interval: 30s      # Increase for less frequent scraping
  evaluation_interval: 30s

command:
  - '--storage.tsdb.retention.time=15d'  # Reduce retention
  - '--storage.tsdb.retention.size=10GB' # Limit disk usage
```

### Grafana

```ini
# grafana.ini
[dashboards]
default_home_dashboard_path = /etc/grafana/provisioning/dashboards/services-overview.json

[users]
viewers_can_edit = false  # Restrict editing
```

## Security Best Practices

1. **Change Default Passwords**: Update Grafana admin password immediately
2. **Use Strong Secret Keys**: Generate secure random keys for Grafana
3. **Network Isolation**: Keep monitoring stack in internal network
4. **Access Control**: Configure Grafana user roles appropriately
5. **TLS/HTTPS**: Use reverse proxy (Caddy) for HTTPS in production
6. **Regular Updates**: Keep monitoring stack images updated

```bash
# Generate secure secret key
openssl rand -base64 32
```

## Integration with Services

### Example: Tracking Custom Metrics

```typescript
// In your service code
import { trackAuthAttempt } from './plugins/metrics.plugin';

async function login(username: string, password: string) {
  try {
    // Login logic
    trackAuthAttempt('success', 'password');
    return user;
  } catch (error) {
    trackAuthAttempt('failure', 'password');
    throw error;
  }
}
```

## Monitoring Checklist

- [ ] Prometheus collecting metrics from all services
- [ ] Grafana dashboards loading with data
- [ ] All targets showing as UP in Prometheus
- [ ] Test alerts are firing correctly
- [ ] Alert routing to notification service working
- [ ] Retention policies configured appropriately
- [ ] Backups scheduled for metrics data
- [ ] Security credentials changed from defaults
- [ ] Team trained on dashboard usage
- [ ] Documentation updated for custom metrics

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [PromQL Basics](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Alerting Rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/)
- [prom-client (Node.js)](https://github.com/siimon/prom-client)

## Support

For issues or questions:
1. Check Prometheus and Grafana logs
2. Review this documentation
3. Check service-specific metrics endpoints
4. Verify network connectivity between services

---

**Version**: 1.0  
**Last Updated**: January 2026  
**Maintained by**: ft_transcendence Team
