<div align="center">
  <img src="/Frontend/public/pong.png" alt="FT_Transcendence Logo" width="200"/>
  <h1 style="font-size: 3em; margin-bottom: 20px;">FT_Transcendence</h1>
  <p>Modern, Microservices Mimarili, Gerçek Zamanlı Pong Oyunu ve Sosyal Platformu</p>
</div>

---

## 🚀 Proje Hakkında

**FT_Transcendence**, klasik Pong oyununu modern web teknolojileriyle birleştiren, kullanıcıların sosyalleşebileceği, oyun oynayabileceği ve rekabet edebileceği kapsamlı bir web platformudur.

Proje, **Fastify** tabanlı güçlü bir Backend ve **Web Components** mimarisine sahip performans odaklı bir Frontend'den oluşur.

📌 **Detaylı Teknik Dokümantasyon İçin:**

- [🎨 Frontend Dokümantasyonu](./Frontend/README.md)
- [⚙️ Backend Dokümantasyonu](./Backend/README.md)

---

## ✨ Temel Özellikler

### 🎮 Oyun Deneyimi

- **Online 1v1**: WebSocket üzerinden düşük gecikmeli, gerçek zamanlı maçlar.
- **Turnuva Modu**: Arkadaşlarınızla düzenleyebileceğiniz eleme usulü turnuvalar.
- **Fizik Motoru**: Sunucu tabanlı (Server-Authoritative) adil ve hile korumalı oyun yapısı.

### 💬 Sosyal Etkileşim

- **Canlı Sohbet**: Global odalar ve özel mesajlaşma (DM).
- **Arkadaşlık Sistemi**: İstek gönderme, kabul etme ve engelleme.
- **Durum Takibi**: Arkadaşların çevrimiçi/çevrimdışı durumunu görme.

### 🔐 Güvenlik ve Hesap

- **Güvenli Kimlik Doğrulama**: JWT (JSON Web Token) tabanlı oturum yönetimi.
- **2FA (İki Faktörlü Doğrulama)**: Google Authenticator ile ekstra hesap güvenliği.
- **OAuth**: Google hesabı ile hızlı giriş.

---

## 🛠️ Proje Mimarisi

Sistem, sorumlulukların net bir şekilde ayrıldığı iki ana parçadan oluşur:

### Backend (Microservices)

Tüm iş mantığı, birbirinden bağımsız çalışan ve birbirleriyle **API Gateway** üzerinden haberleşen mikroservisler tarafından yönetilir.

- **Servisler**: Auth, User, Game, Chat, Notification.
- **Teknolojiler**: Node.js, Fastify, TypeScript, SQLite, Redis, Docker.

### Frontend (SPA)

Kullanıcı arayüzü, herhangi bir ağır framework (React/Vue vb.) kullanılmadan, tarayıcı standartlarına uygun **Native Web Components** ile geliştirilmiştir.

- **Özellikler**: Custom Router, Shadow DOM, Utility-first CSS (Tailwind).
- **Teknolojiler**: TypeScript, Vite, Web Components.

---

## 🚀 Kurulum

Projeyi yerel ortamınızda çalıştırmak için **Docker** ve **Docker Compose** gereklidir.

```bash
# 1. Repoyu klonlayın
git clone <repo-url>
cd FT_PINPON

# 2. Ortam değişkenlerini hazırlayın
# (Her servis klasörü ve frontend içindeki .env.example dosyalarını .env olarak kopyalayın)

# 3. Docker ile sistemi başlatın
docker-compose up --build
```

Uygulama başarıyla başladığında tarayıcınızdan erişebilirsiniz:

- **Frontend**: `http://localhost:3000` (veya yapılandırılan port)

---

## 📂 Proje Yapısı

```
.
├── Backend/                # Mikroservisler ve API Gateway
│   ├── auth-service/       # Kimlik doğrulama
│   ├── user-service/       # Profil ve arkadaşlık
│   ├── game-service/       # Oyun motoru ve WebSocket
│   ├── chat-service/       # Mesajlaşma
│   └── api-gateway/        # Nginx yönlendirme
│   └── ...
├── Frontend/               # Web Arayüzü
│   ├── src/
│   │   ├── components/     # UI Bileşenleri
│   │   ├── services/       # API İletişimi
│   │   └── router/         # Sayfa Yönlendirme
│   └── ...
└── README.md               # Bu dosya
```
