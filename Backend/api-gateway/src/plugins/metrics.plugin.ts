import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ prefix: 'api_gateway_' });

// Custom metrics
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

const metricsPlugin: FastifyPluginAsync = async (fastify, opts) => {
  // Increment active connections
  fastify.addHook('onRequest', async (request, reply) => {
    activeConnections.inc({ job: 'api-gateway' });
    request.startTime = Date.now();
  });

  // Track request metrics
  fastify.addHook('onResponse', async (request, reply) => {
    activeConnections.dec({ job: 'api-gateway' });
    
    const duration = (Date.now() - (request.startTime || Date.now())) / 1000;
    const labels = {
      method: request.method,
      route: (request.routeOptions?.url || request.url) as string,
      status: reply.statusCode.toString(),
      job: 'api-gateway',
    };

    httpRequestCounter.inc(labels);
    httpRequestDuration.observe(labels, duration);
  });

  // Metrics endpoint
  fastify.get('/metrics', async (request, reply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
  });

  // Health check endpoint
  fastify.get('/health', async (request, reply) => {
    return { 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'api-gateway'
    };
  });
};

export default fp(metricsPlugin, {
  name: 'metrics-plugin',
});
