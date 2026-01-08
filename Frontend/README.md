# FT_PINPON Frontend Documentation

## 📋 İçindekiler

- [Genel Bakış](#-genel-bakış)
- [Teknoloji Yığını](#-teknoloji-yığını)
- [Proje Yapısı](#-proje-yapısı)
- [Mimari Yaklaşım](#-mimari-yaklaşım)
- [Kurulum](#-kurulum)
- [Özellikler ve Bileşenler](#-özellikler-ve-bileşenler)
- [Detaylı Routing Yapısı](#-detaylı-routing-yapısı)
- [State Management](#-state-management)

---

## 🎯 Genel Bakış

**FT_PINPON Frontend**, herhangi bir modern JavaScript framework'ü (React, Vue, Angular vb.) kullanılmadan, tamamen **Native Web Components** ve **Vanilla TypeScript** ile geliştirilmiştir. Bu yaklaşım sayesinde:

- 🚀 **Yüksek Performans**: Virtual DOM yükü olmadan doğrudan DOM manipülasyonu.
- 📦 **Sıfır Bağımlılık (Neredeyse)**: Sadece build ve stil için araçlar kullanılır, runtime kütüphane bağımlılığı minimumdur.
- 🌐 **Standartlara Uygunluk**: W3C Web Components standartlarına tam uyum.

---

## 🛠️ Teknoloji Yığını

| Teknoloji          | Sürüm     | Kullanım Amacı                                 |
| ------------------ | --------- | ---------------------------------------------- |
| **TypeScript**     | `v5.8.3`  | Tip güvenliği ve modern JS özellikleri         |
| **Vite**           | `v7.1.10` | Ultra hızlı geliştirme sunucusu ve build aracı |
| **Tailwind CSS**   | `v4.1.12` | Utility-first stil yönetimi                    |
| **Shadow DOM**     | Native    | Bileşen stillerini izole etmek (Encapsulation) |
| **HTML Templates** | Native    | Tekrar kullanılabilir HTML yapıları            |

---

## 📁 Proje Yapısı

```
Frontend/
├── public/                 # Statik dosyalar (Görseller, ikonlar)
├── src/
│   ├── components/         # Web Components (UI Bileşenleri)
│   │   ├── base/           # Base sınıflar (LocalizedComponent vb.)
│   │   ├── forms/          # Form bileşenleri (Login, Signup)
│   │   ├── game/           # Oyun mantığı ve canvas çizimleri
│   │   ├── layout/         # Ana layout bileşenleri
│   │   └── sidebar/        # Sidebar ve ilgili alt sayfalar
│   ├── pages/              # Sayfa yapıları
│   ├── router/             # Custom Single Page Router
│   ├── services/           # API ve WebSocket servisleri
│   ├── store/              # Global State (UserStore vb.)
│   ├── i18n/               # Çoklu dil desteği (TR, EN, KU)
│   ├── types/              # TypeScript tanımları
│   └── styles/             # Global stiller (Tailwind importları)
├── index.html              # Giriş noktası
└── vite.config.ts          # Vite konfigürasyonu
```

---

## 🏗️ Mimari Yaklaşım

### 1. Web Components & Shadow DOM

Her UI parçası `HTMLElement` sınıfından türetilmiş bir **Custom Element**'tir.

```typescript
class MyComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }); // Stil izolasyonu
  }
}
customElements.define("my-component", MyComponent);
```

### 2. Bileşen Hiyerarşisi (Inheritance)

Tüm bileşenler, dil desteği gibi ortak özellikleri barındıran soyut sınıflardan türetilir:
`HTMLElement` -> `LocalizedComponent` -> `MyPage`

### 3. Servis Tabanlı İletişim

Backend ile iletişim `fetch` API ve `WebSocket` üzerinden servisler aracılığıyla sağlanır. Bileşenler doğrudan API çağırmaz, servisleri kullanır.

---

## 🚀 Kurulum

1. **Bağımlılıkları Yükleyin**

```bash
npm install
```

2. **Ortam Değişkenlerini Ayarlayın**
   `.env.example` dosyasını `.env` olarak kopyalayın ve backend URL'ini belirtin.

```env
VITE_API_BASE_URL=http://localhost:3000
```

3. **Geliştirme Sunucusunu Başlatın**

```bash
npm run dev
```

4. **Production Build Alın**

```bash
npm run build
```

---

## ✨ Özellikler ve Bileşenler

### 🔐 Kimlik Doğrulama (Auth)

- **JWT Tabanlı Oturum**: Güvenli token yönetimi.
- **2FA Desteği**: QR Kod ve Google Authenticator entegrasyonu.
- **Bileşenler**: `<login-form>`, `<signup-form>`, `<twofa-login>`

### 🎮 Oyun Modülü

- **Canvas API**: Yüksek performanslı render.
- **WebSocket**: Gerçek zamanlı top/raket senkronizasyonu.
- **Modlar**: 1v1 Normal, Turnuva Modu.

### 💬 Sohbet Sistemi

- **Anlık Mesajlaşma**: WebSocket üzerinden canlı sohbet.
- **Kullanıcı Listesi**: Arkadaşların online/offline durumu.
- **Özel Mesaj (DM)**: Birebir görüşmeler.

### 🌍 Çoklu Dil (i18n)

- **Diller**: Türkçe, İngilizce, Kürtçe.
- **Reaktif Değişim**: Dil değiştiğinde sayfa yenilenmeden tüm metinler güncellenir.

---

## 🗺️ Detaylı Routing Yapısı

Proje, `history.pushState` API'sini kullanan özel bir Router'a sahiptir.

| Yol (Path)  | Bileşen                | Açıklama        |
| ----------- | ---------------------- | --------------- |
| `/`         | `<dashboard-page>`     | Ana Panel       |
| `/login`    | `<login-form>`         | Giriş Sayfası   |
| `/settings` | `<settings-component>` | Ayarlar         |
| `/game`     | `<game-component>`     | Oyun Alanı      |
| `/chat`     | `<chat-component>`     | Sohbet          |
| `/friends`  | `<friends-component>`  | Arkadaş Listesi |

---

## 💾 State Management

Redux veya Vuex gibi kütüphaneler yerine, **Observable Pattern** ve **Singleton Service** yapıları kullanılmıştır.

- **UserStore**: Kullanıcı bilgileri ve token burada tutulur.
- **Global Event Bus**: Bileşenler arası veri akışı için CustomEvent'ler kullanılır.

---

## 🔒 Güvenlik Notları

- **XSS Koruması**: Tüm kullanıcı girdileri sanitize edilir.
- **Route Guard**: Giriş yapmamış kullanıcılar korumalı sayfalara erişemez (`Router.ts` içinde kontrol edilir).
