# Notification Service Docker Setup

## 🐳 Docker ile Çalıştırma

### 1. Docker Build
```bash
docker build -t notification-service .
```

### 2. Docker Run
```bash
docker run -p 3003:3003 -e HOST=0.0.0.0 -e PORT=3003 notification-service
```

### 3. Docker Compose (Önerilen)
```bash
# Servis başlat
docker-compose up -d

# Logları izle
docker-compose logs -f

# Servis durdur
docker-compose down
```

## 🌐 Network Konfigürasyonu

Service 0.0.0.0:3003 adresinde çalışır:
- **REST API:** `http://0.0.0.0:3003`
- **WebSocket:** `ws://0.0.0.0:3003/ws`
- **Health Check:** `http://0.0.0.0:3003/health`

## 📁 Volume Mounting

Database dosyası container'da kalıcı olması için:
```bash
docker run -p 3003:3003 -v $(pwd)/db:/app/db notification-service
```

## 🏥 Health Check

Container sağlığı otomatik kontrol edilir:
```bash
# Manual health check
curl http://localhost:3003/health
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Host address |
| `PORT` | `3003` | Port number |
| `NODE_ENV` | `production` | Environment |

## 🔗 Network'te Kullanım

Diğer servislerin bu service'e erişimi:
```
http://notification-service:3003
```

Container içinden dışarı erişim:
```
http://0.0.0.0:3003
```
