# Repo-specific Copilot instructions — Docker Compose ve servis çalıştırma

Kısa, eyleme dönük bilgi: bu repo docker-compose ile birden çok servis içerir.

## Servisler
elasticsearch, kibana, logstash, redis, user-service, auth-service, api-gateway, chat-service, **game-service**

Doğrulama: `docker compose config --services`

## Hızlı Kurallar

### Tek Servis Başlatma (Önerilen)
```bash
docker compose build <service>
docker compose up -d <service>
docker compose logs -f <service>
```

**Asla**: `docker compose up -d` (tüm cluster ayağa kalkar)

### Port Mapping
- API Gateway: 3000 (ana giriş)
- Auth Service: 3001 (internal)
- User Service: 3002 (internal)
- Chat Service: 3003 (internal)
- **Game Service: 3005 (internal)** 🎮
- Elasticsearch: 9200
- Kibana: 5601
- Redis: 6379

### Servis Build Pattern (TypeScript → dist/)
```json
{
  "type": "module",
  "scripts": {
    "start:dev": "nodemon --watch src --ext ts --exec tsx src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js"
  }
}
```

**Dockerfile prod pattern:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["node","dist/app.js"]
```

## API Gateway Routing

API Gateway = Reverse Proxy (Fastify + @fastify/http-proxy)

Çalışan route'lar:
- `GET /auth/docs` → auth-service (port 3001)
- `GET /user/*` → user-service (port 3002, JWT)
- `GET /chat/*` → chat-service (port 3003)
- `GET /game/*` → **game-service (port 3005)** 🎮
- `WS /chat/ws` → chat WebSocket
- `WS /game/ws` → **game WebSocket** 🎮

Public endpoints: `/*/docs`, `/*/health`

## Game Service 🎮 (Yeni Eklendi!)

### Özellikler
- **Local Mode**: Tek PC, 2 oyuncu (guest nickname)
- **Online Mode**: Farklı PC'ler, JWT auth, matchmaking, ranked
- **Tournament Mode**: Admin oluşturur, bracket sistem

### Database Tables
- `games` - Oyun kayıtları
- `game_stats` - Oyuncu istatistikleri (rank, wins, losses)
- `tournaments` - Turnuva bilgileri
- `tournament_participants` - Turnuva katılımcıları
- `matchmaking_queue` - Online matchmaking kuyruğu

### Game Service Başlatma
```bash
# Development
cd game-service
npm install
npm run migration
npm run start:dev

# Docker
docker compose build game-service
docker compose up -d game-service
docker compose logs -f game-service
```

### Endpoints (Planlanan)
```
GET    /game/health          - Health check
GET    /game/docs            - Swagger UI
GET    /game/active          - Aktif oyunlar
POST   /game/local/create    - Local game oluştur
POST   /game/matchmaking/join - Matchmaking kuyruğuna gir
GET    /game/stats/:userId   - Kullanıcı istatistikleri
GET    /game/leaderboard     - Lider tablosu
WS     /game/ws              - Game WebSocket
```

## Çalışan Servisleri Kontrol

```bash
# Container listesi
docker ps

# Logları izle
docker compose logs -f game-service

# Internal network test
docker run --rm --network trans_internal-network curlimages/curl \
  curl -sS http://game-service:3005/game/health
```

## Debugging Akışı

1. `docker compose ps` - Servis durumu
2. `docker compose restart game-service`
3. `docker compose exec game-service sh` - Container içine gir
4. Network içinden test: `curl http://game-service:3005/game/health`

## Bilinen Sorunlar

1. API Gateway logstash bağlantısı olmadan crash oluyor (restart policy ile düzeliyor)
2. Game service Redis'e bağlanamıyorsa retry yapıyor (non-fatal)
3. .env dosyaları gerekli - `.env.example` referans al

## AI Ajanı Kuralları

- Tek servis başlat: `docker compose up -d <service>`
- Log crash: logstash/redis bağlantılarını kontrol et
- Route bulunamaz: API Gateway proxy config'e bak
- Internal servis: network içinden curl
- `type: "module"`: import path'lerde `.js` uzantısı gerekli

## Proje-Özgü Detaylar

### Game Service Mimarisi
- **Repository Pattern**: GameRepository, StatsRepository, TournamentRepository
- **Service Layer**: Business logic (henüz implement edilecek)
- **WebSocket**: Real-time pong game (henüz implement edilecek)
- **Validation**: Zod schemas
- **Database**: SQLite + better-sqlite3 + WAL mode

### Sonraki Adımlar (Game Service)
1. ⏳ Service layer (GameService, MatchmakingService, TournamentService)
2. ⏳ Controller layer (HTTP handlers)
3. ⏳ Routes (REST API endpoints)
4. ⏳ WebSocket (Real-time game logic)
5. ⏳ Game physics (Pong oyun mekaniği)

---

**Test URL'leri:**
- Frontend: http://localhost:5173
- API Gateway: http://localhost:3000
- Game Health: http://localhost:3000/game/health
- Kibana: http://localhost:5601
