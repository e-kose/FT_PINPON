# Service Integration Guide

This guide shows how to integrate the monitoring system into each service.

## 1. Install Dependencies

For each service, add prom-client to package.json:

```bash
cd Backend/api-gateway  # or any service
npm install prom-client --save
```

Or run the setup script:
```bash
cd Backend
./monitoring/setup.sh
```

## 2. Register Metrics Plugin

### API Gateway

**File**: `Backend/api-gateway/src/app.ts`

```typescript
import metricsPlugin from './plugins/metrics.plugin';

// After other plugin registrations
await app.register(metricsPlugin);
```

### Auth Service

**File**: `Backend/auth-service/src/app.ts`

```typescript
import metricsPlugin, { trackAuthAttempt } from './plugins/metrics.plugin';

// After other plugin registrations
await app.register(metricsPlugin);

// Example usage in auth logic:
async function authenticateUser(credentials) {
  try {
    const user = await verifyCredentials(credentials);
    trackAuthAttempt('success', 'password');
    return user;
  } catch (error) {
    trackAuthAttempt('failure', 'password');
    throw error;
  }
}
```

### User Service

**File**: `Backend/user-service/src/app.ts`

```typescript
import metricsPlugin from './plugins/metrics.plugin';

await app.register(metricsPlugin);
```

### Chat Service

**File**: `Backend/chat-service/src/app.ts`

```typescript
import metricsPlugin, { trackWebSocketConnection, trackMessage } from './plugins/metrics.plugin';

await app.register(metricsPlugin);

// Example WebSocket usage:
io.on('connection', (socket) => {
  trackWebSocketConnection('connect');
  
  socket.on('message', (data) => {
    trackMessage('chat');
    // Handle message
  });
  
  socket.on('disconnect', () => {
    trackWebSocketConnection('disconnect');
  });
});
```

### Notification Service

**File**: `Backend/notification-service/src/app.ts`

```typescript
import metricsPlugin, { trackNotification } from './plugins/metrics.plugin';

await app.register(metricsPlugin);

// Example notification usage:
async function sendNotification(userId, message) {
  try {
    await deliver(userId, message);
    trackNotification('email', 'sent');
  } catch (error) {
    trackNotification('email', 'failed');
    throw error;
  }
}
```

## 3. TypeScript Configuration

If you encounter TypeScript errors with `request.startTime`, add this to your service's type definitions:

**File**: `Backend/[service]/src/types/fastify.d.ts`

```typescript
import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    startTime?: number;
  }
}
```

## 4. Update TypeScript Build

Make sure your tsconfig.json includes the plugins directory:

```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## 5. Verify Installation

After integrating, verify each service exposes metrics:

```bash
# Start the service
npm run start:dev

# Check metrics endpoint (adjust port for each service)
curl http://localhost:3000/metrics  # api-gateway
curl http://localhost:3001/metrics  # auth-service
curl http://localhost:3002/metrics  # user-service
curl http://localhost:3003/metrics  # chat-service
curl http://localhost:3004/metrics  # notification-service

# Check health endpoint
curl http://localhost:3000/health
```

You should see output like:
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/health",status="200",job="api-gateway"} 1

# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.
# TYPE process_cpu_user_seconds_total counter
process_cpu_user_seconds_total 0.045
```

## 6. Docker Integration

The metrics endpoints are automatically exposed in Docker. Verify in docker-compose:

```yaml
services:
  api-gateway:
    ports:
      - "3000:3000"  # This exposes the metrics endpoint
```

## 7. Testing with Prometheus

After starting all services:

```bash
# Start monitoring stack
docker-compose up -d prometheus grafana

# Check Prometheus targets
open http://localhost:9090/targets

# All targets should show "UP"
```

## 8. Complete Example: API Gateway Integration

**File**: `Backend/api-gateway/src/app.ts`

```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import proxy from '@fastify/http-proxy';
import jwt from '@fastify/jwt';

// Import monitoring plugin
import metricsPlugin from './plugins/metrics.plugin';
import jwtPlugin from './plugins/jwt.plugin';
import loggerPlugin from './plugins/logger.plugin';

const app = Fastify({
  logger: true
});

async function start() {
  try {
    // Register plugins in order
    await app.register(cors);
    await app.register(jwt, { secret: process.env.JWT_SECRET });
    
    // Register monitoring AFTER jwt but BEFORE routes
    await app.register(metricsPlugin);
    
    await app.register(loggerPlugin);
    
    // Register routes
    await app.register(proxy, {
      upstream: 'http://auth-service:3001',
      prefix: '/auth'
    });
    
    // ... other routes
    
    await app.listen({ 
      port: 3000, 
      host: '0.0.0.0' 
    });
    
    console.log('API Gateway running on port 3000');
    console.log('Metrics available at http://localhost:3000/metrics');
    console.log('Health check at http://localhost:3000/health');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
```

## 9. Alertmanager Webhook Integration (Optional)

To receive alerts in the notification service, add this endpoint:

**File**: `Backend/notification-service/src/notification/notification.controller.ts`

```typescript
app.post('/api/alerts', async (request, reply) => {
  const alerts = request.body.alerts;
  
  for (const alert of alerts) {
    // Process alert
    console.log(`Alert: ${alert.labels.alertname}`);
    console.log(`Status: ${alert.status}`);
    console.log(`Severity: ${alert.labels.severity}`);
    
    // Send notification to admins
    await sendAdminNotification({
      title: alert.labels.alertname,
      message: alert.annotations.description,
      severity: alert.labels.severity
    });
  }
  
  return { status: 'ok' };
});
```

## 10. Environment Variables

No additional environment variables are required for basic monitoring. All configuration is in the Prometheus and Grafana config files.

Optional for alerts:
```env
# Backend/notification-service/.env
ALERT_EMAIL=admin@transcendence.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

## 11. Development vs Production

### Development
- Metrics collection: 15s interval
- Retention: 30 days
- All exporters enabled

### Production Recommendations
- Increase scrape intervals to reduce load
- Add authentication to Prometheus/Grafana
- Use external Alertmanager for reliability
- Set up proper backup for metrics
- Configure email/Slack alerts
- Use HTTPS with reverse proxy

```yaml
# Production prometheus.yml adjustments
global:
  scrape_interval: 30s      # Less frequent
  evaluation_interval: 30s

command:
  - '--storage.tsdb.retention.time=90d'  # Longer retention
```

## 12. Troubleshooting Integration Issues

### Issue: TypeScript errors with prom-client

```bash
# Install types
npm install --save-dev @types/node
```

### Issue: Metrics not appearing in Prometheus

1. Check service logs for errors
2. Verify service is running: `docker ps`
3. Test metrics endpoint: `curl http://localhost:3000/metrics`
4. Check Prometheus logs: `docker logs prometheus`
5. Verify network connectivity: `docker exec prometheus ping api-gateway`

### Issue: Build errors after adding plugin

```bash
# Rebuild the service
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

### Issue: Metrics endpoint returns 404

Ensure plugin is registered BEFORE starting the server:
```typescript
await app.register(metricsPlugin);  // Must be before app.listen()
await app.listen({ port: 3000 });
```

## 13. Testing Checklist

- [ ] prom-client installed in all services
- [ ] Metrics plugin registered in each service's app.ts
- [ ] Services expose /metrics endpoint
- [ ] Services expose /health endpoint
- [ ] Prometheus scraping all targets (check /targets)
- [ ] Grafana showing data in dashboards
- [ ] Custom metrics (auth, messages, etc.) working
- [ ] Alerts configured and firing when tested
- [ ] All services building without errors

## 14. Next Steps

After integration:
1. Customize alert thresholds for your workload
2. Create custom dashboards for business metrics
3. Set up alert notifications (email, Slack, etc.)
4. Configure backup for metrics data
5. Train team on dashboard usage
6. Document custom metrics for your team

For full documentation, see [Backend/monitoring/README.md](README.md)
