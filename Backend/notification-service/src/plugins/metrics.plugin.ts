import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

collectDefaultMetrics({ prefix: 'notification_service_' });

const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status', 'job'],
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status', 'job'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  labelNames: ['job'],
});

const notificationsCounter = new Counter({
  name: 'notifications_total',
  help: 'Total number of notifications sent',
  labelNames: ['type', 'status', 'job'],
});

const metricsPlugin: FastifyPluginAsync = async (fastify, opts) => {
  fastify.addHook('onRequest', async (request, reply) => {
    activeConnections.inc({ job: 'notification-service' });
    request.startTime = Date.now();
  });

  fastify.addHook('onResponse', async (request, reply) => {
    activeConnections.dec({ job: 'notification-service' });
    
    const duration = (Date.now() - (request.startTime || Date.now())) / 1000;
    const labels = {
      method: request.method,
      route: (request.routeOptions?.url || request.url) as string,
      status: reply.statusCode.toString(),
      job: 'notification-service',
    };

    httpRequestCounter.inc(labels);
    httpRequestDuration.observe(labels, duration);
  });

  fastify.get('/metrics', async (request, reply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
  });
};

export default fp(metricsPlugin, {
  name: 'metrics-plugin',
});

export const trackNotification = (type: string, status: 'sent' | 'failed') => {
  notificationsCounter.inc({ type, status, job: 'notification-service' });
};
