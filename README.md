<div align="center">
  <img src="./Frontend/public/pong.png" alt="FT_Transcendence Logo" width="180"/>
  <h1>FT_Transcendence</h1>
  <p><strong>Modern, Microservices Mimarili, Gerçek Zamanlı Pong Oyunu ve Sosyal Platform</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js"/>
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"/>
    <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker"/>
    <img src="https://img.shields.io/badge/Fastify-000000?style=flat-square&logo=fastify&logoColor=white" alt="Fastify"/>
  </p>
</div>

---

## Proje Hakkında

**FT_Transcendence**, klasik Pong oyununu modern web teknolojileriyle birleştiren kapsamlı bir web platformudur. Kullanıcılar gerçek zamanlı oyun oynayabilir, turnuvalara katılabilir, arkadaşlarıyla sohbet edebilir ve sosyalleşebilir.

- **Frontend**: Framework kullanmadan Native Web Components ile geliştirilmiş SPA
- **Backend**: Microservices mimarisi ile ölçeklenebilir yapı
- **Gerçek Zamanlı**: WebSocket ile düşük gecikmeli oyun ve sohbet

---

## Temel Özellikler

### Oyun

- Online 1v1 maçlar
- 4/8 kişilik turnuva modu (bracket sistemi)
- Server-side oyun
- Oyun istatistikleri ve maç geçmişi

### Sosyal

- Anlık mesajlaşma (DM)
- Arkadaşlık sistemi (ekle/kabul/engelle)
- Online durum takibi
- Gerçek zamanlı bildirimler

### Güvenlik

- JWT tabanlı kimlik doğrulama
- Google OAuth 2.0 ile hızlı giriş
- 2FA (Google Authenticator)

### Diğer

- Çoklu dil desteği (TR / EN / KU)
- Profil düzenleme ve avatar yükleme

---

## Mimari

```
                    ┌─────────────────┐
                    │     Nginx       │ :4343 (HTTPS)
                    │  Reverse Proxy  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐  ┌───────────┐  ┌──────────┐
        │ Frontend │  │    API    │  │   ELK    │
        │  (Vite)  │  │  Gateway  │  │  Stack   │
        └──────────┘  └─────┬─────┘  └──────────┘
                            │
        ┌───────┬───────┬───┴───┬───────┬───────┐
        ▼       ▼       ▼       ▼       ▼       ▼
      Auth    User    Game    Chat   Notif   Redis
```

### Backend Servisleri

| Servis               | Port | Görev                             |
| -------------------- | ---- | --------------------------------- |
| API Gateway          | 3000 | İstek yönlendirme, JWT doğrulama  |
| Auth Service         | 3001 | Giriş, kayıt, OAuth, 2FA          |
| User Service         | 3002 | Profil, arkadaşlık, engelleme     |
| Chat Service         | 3003 | Anlık mesajlaşma                  |
| Notification Service | 3004 | Gerçek zamanlı bildirimler        |
| Game Service         | 3005 | Oyun motoru, turnuva, matchmaking |

### Teknolojiler

**Backend:** Node.js, Fastify, TypeScript, SQLite, Redis, WebSocket, Docker

**Frontend:** TypeScript, Vite, Tailwind CSS, Web Components, Shadow DOM

**Altyapı:** Nginx, Elasticsearch, Logstash, Kibana

---

## Proje Yapısı

```
FT_PINPON/
├── Backend/
│   ├── api-gateway/          # İstek yönlendirme
│   ├── auth-service/         # Kimlik doğrulama
│   ├── user-service/         # Kullanıcı ve arkadaşlık
│   ├── game-service/         # Oyun motoru
│   ├── chat-service/         # Mesajlaşma
│   ├── notification-service/ # Bildirimler
│   ├── nginx/                # Reverse proxy config
│   ├── elastic-search/       # Log yapılandırması
│   └── docker-compose.yml
│
├── Frontend/
│   ├── src/
│   │   ├── components/       # Web Components
│   │   ├── services/         # API servisleri
│   │   ├── router/           # SPA Router
│   │   ├── store/            # State yönetimi
│   │   ├── i18n/             # Dil dosyaları
│   │   └── types/            # TypeScript tipleri
│   └── vite.config.ts
│
├── Makefile
└── README.md
```

---

## Kurulum ve Çalıştırma

### Gereksinimler

- Docker & Docker Compose
- Git

### Kurulum

```bash
# Repoyu klonlayın
git clone <repo-url>
cd FT_PINPON

# Ortam değişkenlerini hazırlayın
# Her servis klasöründeki .env.example dosyalarını .env olarak kopyalayın
# ve gerekli değerleri doldurun (JWT_SECRET, GOOGLE_CLIENT_ID vb.)

# Projeyi başlatın
make all
```

### Erişim Adresleri

| Adres                        | Açıklama        |
| ---------------------------- | --------------- |
| `https://localhost:4343`     | Frontend        |
| `https://localhost:4343/api` | Backend API     |
| `http://localhost:5601`      | Kibana (Loglar) |

---

## Makefile Komutları

```bash
make all      # Build + başlat
make build    # Docker build
make up       # Servisleri başlat
make down     # Servisleri durdur
make logs     # Logları göster
make clean    # Volume'ları sil
make fclean   # Tüm Docker verisini temizle
make re       # Sıfırdan başlat
```

---

## Sayfa Rotaları

| Path        | Sayfa        |
| ----------- | ------------ |
| `/`         | Dashboard    |
| `/login`    | Giriş        |
| `/signup`   | Kayıt        |
| `/play`     | Oyun Modları |
| `/game`     | Oyun Ekranı  |
| `/friends`  | Arkadaşlar   |
| `/chat`     | Sohbet       |
| `/settings` | Ayarlar      |
| `/profile`  | Profil       |

---

