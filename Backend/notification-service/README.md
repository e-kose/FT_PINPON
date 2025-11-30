# Notification Service Environment Setup

## 🔧 Environment Variables

### Development Setup

1. **Copy environment template:**
```bash
cp .env.example .env
```

2. **Edit .env file with your settings:**
```bash
nano .env
```

### Available Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `localhost` | Server host address |
| `PORT` | `3003` | Server port |
| `NODE_ENV` | `development` | Environment (development/production) |
| `DB_PATH` | `./db/notifications.db` | Database file path |
| `LOG_LEVEL` | `info` | Logging level (error/warn/info/debug) |
| `WS_HEARTBEAT_INTERVAL` | `30000` | WebSocket heartbeat interval (ms) |
| `WS_MAX_CONNECTIONS_PER_USER` | `5` | Max WebSocket connections per user |
| `CORS_ORIGIN` | `*` | CORS allowed origins |
| `RATE_LIMIT` | `100` | Rate limit (requests per minute) |
| `MAX_NOTIFICATION_LENGTH` | `1000` | Max notification message length |
| `MAX_TITLE_LENGTH` | `255` | Max notification title length |
| `DEFAULT_NOTIFICATION_TYPE` | `chat_message` | Default notification type |
| `DEFAULT_PAGE_SIZE` | `20` | Default pagination size |
| `MAX_PAGE_SIZE` | `100` | Maximum pagination size |

## 🚀 Quick Start

### Development
```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Run migrations
npm run migration

# Start development server
npm run start:dev
```

### Production
```bash
# Install dependencies
npm ci --only=production

# Build application
npm run build

# Setup production environment
cp .env.production .env

# Run migrations
npm run migration:prod

# Start production server
npm run start:prod
```

## 🐳 Docker Environment

### Development
```bash
docker-compose up -d
```

### Production with custom environment
```bash
# Create production environment file
cp .env.production .env.docker

# Edit with production values
nano .env.docker

# Start with custom env file
docker-compose --env-file .env.docker up -d
```

## 📊 Environment-specific Configurations

### Development
- Detailed logging enabled
- CORS allows all origins
- Higher rate limits
- Debug-friendly settings

### Production
- Optimized logging (warn level)
- Specific CORS origins
- Lower rate limits
- Security-focused settings

## 🔒 Security Notes

- Never commit `.env` files to version control
- Use `.env.example` as template
- Set appropriate CORS origins in production
- Configure rate limiting based on your needs
- Use HTTPS in production (configure reverse proxy)

## 🏥 Health Check

The service includes a health check endpoint that respects the `HEALTH_CHECK_ENABLED` environment variable:

```bash
curl http://localhost:3003/health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2025-10-25T10:30:00.000Z"
}
```
