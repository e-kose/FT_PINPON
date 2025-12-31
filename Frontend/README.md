# FT_PINPON Frontend Documentation

## 📋 İçindekiler
- [Genel Bakış](#genel-bakış)
- [Teknoloji Stack](#teknoloji-stack)
- [Proje Yapısı](#proje-yapısı)
- [Mimari ve Tasarım Desenleri](#mimari-ve-tasarım-desenleri)
- [Kurulum ve Çalıştırma](#kurulum-ve-çalıştırma)
- [Temel Kavramlar](#temel-kavramlar)
- [Bileşen Mimarisi](#bileşen-mimarisi)
- [Routing Sistemi](#routing-sistemi)
- [State Management](#state-management)
- [Servis Katmanı](#servis-katmanı)
- [İnternationalization (i18n)](#internationalization-i18n)
- [Güvenlik](#güvenlik)
- [Best Practices](#best-practices)
- [Klasör ve Dosya Açıklamaları](#klasör-ve-dosya-açıklamaları)

---

## 🎯 Genel Bakış

FT_PINPON Frontend, modern web teknolojileri kullanılarak geliştirilmiş, **Vanilla TypeScript** tabanlı, **Web Components** mimarisini kullanan bir **Single Page Application (SPA)** uygulamasıdır. Framework kullanmadan, browser native API'leri üzerinden Web Components standardını takip ederek geliştirilmiştir.

### Temel Özellikler
- 🎮 Real-time Pong oyunu
- 💬 Canlı chat sistemi (WebSocket)
- 👥 Arkadaşlık ve sosyal özellikler
- 🔐 2FA (Two-Factor Authentication) desteği
- 🌍 Çok dilli destek (TR, EN, KU)
- 🎨 Dark/Light mode
- 📱 Responsive tasarım
- 🔒 XSS ve güvenlik önlemleri

---

## 🛠️ Teknoloji Stack

### Core Technologies
- **TypeScript** `v5.8.3` - Type-safe geliştirme
- **Vite** `v7.1.10` - Build tool ve dev server
- **TailwindCSS** `v4.1.12` - Utility-first CSS framework
- **Web Components** - Native browser standartları
- **Custom Elements API** - Bileşen sistemi

### Browser APIs
- **Fetch API** - HTTP istekleri
- **WebSocket API** - Real-time iletişim
- **LocalStorage API** - Client-side veri saklama
- **History API** - Client-side routing
- **Custom Events** - Bileşenler arası iletişim

### Build & Dev Tools
- **ESNext Modules** - Modern JavaScript modül sistemi
- **TypeScript Strict Mode** - Katı tip kontrolü
- **Vite HMR** - Hot Module Replacement

---

## 📁 Proje Yapısı

```
Frontend/
├── public/                          # Static assets
│   ├── Avatar/                      # Kullanıcı avatar görüntüleri
│   ├── DashboardBackground.jpg      # Arka plan görselleri
│   └── pong.png                     # Logo ve iconlar
│
├── src/
│   ├── main.ts                      # Uygulama giriş noktası
│   ├── vite-env.d.ts               # Vite type tanımlamaları
│   │
│   ├── components/                  # UI Bileşenleri
│   │   ├── base/                   # Temel/soyut bileşenler
│   │   │   └── LocalizedComponent.ts    # i18n destekli base class
│   │   │
│   │   ├── forms/                  # Form bileşenleri
│   │   │   ├── UserForm.ts         # Abstract form base class
│   │   │   ├── LoginForm.ts        # Login formu
│   │   │   ├── SignupForm.ts       # Kayıt formu
│   │   │   └── TwoFaLogin.ts       # 2FA login formu
│   │   │
│   │   ├── utils/                  # Utility bileşenleri
│   │   │   ├── Header.ts           # Üst navbar
│   │   │   ├── SideBar.ts          # Yan menu
│   │   │   ├── Messages.ts         # Toast/bildirim sistemi
│   │   │   ├── MyProfile.ts        # Profil kartı
│   │   │   ├── Statistics.ts       # İstatistik paneli
│   │   │   ├── LastGames.ts        # Son oyunlar listesi
│   │   │   ├── TwoFaAuth.ts        # 2FA yönetim paneli
│   │   │   └── Validation.ts       # Form validasyon helper
│   │   │
│   │   ├── sideBarComponents/     # Ana sayfa bileşenleri
│   │   │   ├── Dashboard.ts        # Ana dashboard
│   │   │   ├── Friends.ts          # Arkadaşlar sayfası
│   │   │   ├── Chat.ts             # Chat sayfası
│   │   │   ├── Play.ts             # Oyun sayfası
│   │   │   ├── Tournament.ts       # Turnuva sayfası
│   │   │   └── Settings/           # Ayarlar sayfaları
│   │   │       ├── Settings.ts     # Ana ayarlar
│   │   │       ├── ProfileSettings.ts     # Profil ayarları
│   │   │       ├── SecuritySettings.ts    # Güvenlik ayarları
│   │   │       ├── ViewSettings.ts        # Görünüm ayarları
│   │   │       └── AccountSettings.ts     # Hesap ayarları
│   │   │
│   │   └── errors/                 # Hata sayfaları
│   │       └── ErrorPages.ts       # 404, 500, 401, 403 sayfaları
│   │
│   ├── services/                   # API ve Business Logic
│   │   ├── AuthService.ts          # Kimlik doğrulama servisi
│   │   ├── ChatService.ts          # Chat servisi
│   │   ├── FriendService.ts        # Arkadaşlık servisi
│   │   ├── NotificationService.ts  # WebSocket bildirim servisi
│   │   └── SettingsService.ts      # Ayarlar servisi
│   │
│   ├── store/                      # State Management
│   │   └── UserStore.ts            # Global user state
│   │
│   ├── router/                     # Routing Sistemi
│   │   ├── Router.ts               # Client-side router
│   │   └── SidebarStateManager.ts  # Sidebar state yönetimi
│   │
│   ├── i18n/                       # Internationalization
│   │   ├── lang.ts                 # i18n core logic
│   │   ├── useTranslation.ts       # Reactive translation hook
│   │   └── locales/                # Dil dosyaları
│   │       ├── en.json             # English
│   │       ├── tr.json             # Türkçe
│   │       └── ku.json             # Kurdî (Kurmancî)
│   │
│   ├── types/                      # TypeScript Type Definitions
│   │   ├── AuthType.ts             # Auth ile ilgili tipler
│   │   ├── FriendsType.ts          # Arkadaşlık tipleri
│   │   ├── NotificationTypes.ts    # Bildirim tipleri
│   │   └── SettingsType.ts         # Ayar tipleri
│   │
│   ├── pages/                      # Page Components
│   │   └── DashboardPage.ts        # Dashboard page wrapper
│   │
│   ├── game/                       # Game Logic (Placeholder)
│   │   └── .init
│   │
│   ├── templates/                  # HTML Templates
│   │   └── templat.ts
│   │
│   └── styles/                     # Global Styles
│       └── style.css               # TailwindCSS imports
│
├── index.html                      # HTML entry point
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite configuration
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules
└── SECURITY.md                     # Security policy
```

---

## 🏗️ Mimari ve Tasarım Desenleri

### 1. **Web Components Mimarisi**
Uygulama, browser native **Custom Elements API** kullanarak bileşen tabanlı mimari ile geliştirilmiştir.

```typescript
// Örnek: Custom Element tanımlama
class MyComponent extends HTMLElement {
    connectedCallback() {
        this.render();
    }
    
    render() {
        this.innerHTML = `<div>My Component</div>`;
    }
}

customElements.define('my-component', MyComponent);
```

### 2. **Component Hierarchy**
```
LocalizedComponent (Abstract Base)
    ├── Dashboard
    ├── Friends
    ├── Chat
    ├── Settings
    └── UserForm (Abstract)
            ├── LoginForm
            ├── SignupForm
            └── TwoFaLogin
```

### 3. **Separation of Concerns**
- **Components**: UI mantığı ve render
- **Services**: API calls ve business logic
- **Store**: Global state management
- **Router**: Navigation logic
- **i18n**: Çeviri sistemi

### 4. **Reactive Programming**
Observer pattern kullanılarak reactive updates:
```typescript
// Language change observer
observeLanguageChange((newLang) => {
    component.renderAndBind();
});
```

### 5. **Service Layer Pattern**
Tüm API çağrıları service katmanında merkezi olarak yönetilir:
```typescript
// services/AuthService.ts
export async function loginAuth(data: UserLogin) {
    return fetch('/auth/login', {...});
}
```

---

## 🚀 Kurulum ve Çalıştırma

### Prerequisites
- **Node.js** >= 18.x
- **npm** >= 9.x

### Installation

```bash
# Bağımlılıkları yükle
npm install

# Environment variables oluştur
cp .env.example .env

# .env dosyasını düzenle
VITE_API_BASE_URL=http://localhost:3000
```

### Development

```bash
# Development server başlat (http://localhost:5173)
npm run dev
```

### Production Build

```bash
# TypeScript compile + Production build
npm run build

# Build'i test et
npm run preview
```

### Environment Variables

```env
VITE_API_BASE_URL=http://localhost:3000    # Backend API URL
```

---

## 🔑 Temel Kavramlar

### 1. **Custom Elements Lifecycle**

```typescript
class MyElement extends HTMLElement {
    // Element DOM'a eklendiğinde
    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }
    
    // Element DOM'dan kaldırıldığında
    disconnectedCallback() {
        this.cleanup();
    }
    
    // Attribute değiştiğinde
    attributeChangedCallback(name, oldValue, newValue) {
        this.handleAttributeChange(name, newValue);
    }
}
```

### 2. **LocalizedComponent Pattern**

Tüm bileşenlerde dil değişikliklerini otomatik handle etmek için base class:

```typescript
export abstract class LocalizedComponent extends HTMLElement {
    protected abstract renderComponent(): void;
    
    connectedCallback() {
        this.renderAndBind();
        this.observeLanguage();
    }
    
    private observeLanguage() {
        observeLanguageChange(() => {
            this.renderAndBind(); // Dil değişince tekrar render
        });
    }
}
```

### 3. **Type Safety**

Strict TypeScript kullanımı:

```typescript
// types/AuthType.ts
export interface User {
    id: number;
    username: string;
    email: string;
    is_2fa_enabled: number;
    profile?: UserProfile;
}

export interface UserProfile {
    user_id: number;
    full_name?: string;
    bio?: string;
    avatar_url?: string;
}
```

---

## 🧩 Bileşen Mimarisi

### Component Yapısı

Her bileşen şu yapıyı takip eder:

```typescript
import { LocalizedComponent } from "../base/LocalizedComponent";
import { t } from "../../i18n/lang";

class MyComponent extends LocalizedComponent {
    // 1. State/Properties
    private data: any[] = [];
    private loading = false;
    
    // 2. Lifecycle
    protected onConnected(): void {
        this.fetchData();
    }
    
    protected onDisconnected(): void {
        this.cleanup();
    }
    
    // 3. Render Logic
    protected renderComponent(): void {
        this.innerHTML = this.template();
    }
    
    // 4. Template
    private template(): string {
        return `
            <div class="container">
                <h1>${t("my_component_title")}</h1>
                ${this.renderData()}
            </div>
        `;
    }
    
    // 5. Event Handlers
    protected afterRender(): void {
        this.setupEvents();
    }
    
    private setupEvents(): void {
        this.querySelector('button')?.addEventListener('click', 
            this.handleClick.bind(this)
        );
    }
    
    // 6. Business Logic
    private async fetchData(): Promise<void> {
        this.loading = true;
        this.renderAndBind();
        
        const data = await SomeService.getData();
        this.data = data;
        this.loading = false;
        this.renderAndBind();
    }
}

customElements.define('my-component', MyComponent);
```

### Bileşen Kategorileri

#### 1. **Base Components** (`components/base/`)
Soyut base class'lar, diğer bileşenlerin extend ettiği temel yapılar.

**LocalizedComponent.ts**
- Dil değişikliklerini otomatik dinler
- `renderComponent()` abstract metodu
- `onConnected/onDisconnected` lifecycle hooks
- Reactive rendering

#### 2. **Form Components** (`components/forms/`)

**UserForm.ts** - Abstract base
- Tüm formlar için ortak mantık
- Error handling
- Validation
- Google OAuth integration
- API error mapping

**LoginForm.ts**
- Email/username + password login
- 2FA redirect logic
- Remember me özelliği

**SignupForm.ts**
- Full name, username, email, password
- Email/password validation
- Google signup integration

**TwoFaLogin.ts**
- 6 haneli kod girişi
- Auto-focus ve auto-submit
- Cancel handling

#### 3. **Utility Components** (`components/utils/`)

**Header.ts**
- Üst navbar
- User dropdown menu
- Notifications bell
- Language switcher
- Responsive hamburger menu

**SideBar.ts**
- Sol navigasyon menu
- Collapse/expand
- Active route highlighting
- Responsive drawer mode

**Messages.ts**
- Toast notifications
- Success/error/info messages
- Loading animations
- Auto-dismiss

**MyProfile.ts**
- Kullanıcı profil kartı
- Avatar gösterimi
- Quick stats

**TwoFaAuth.ts**
- 2FA setup (QR kod)
- 2FA enable/disable
- Authenticator app integration

#### 4. **Page Components** (`components/sideBarComponents/`)

**Dashboard.ts**
- Ana kontrol paneli
- Quick actions
- User stats
- Recent activity

**Friends.ts**
- Arkadaş listesi
- Pending requests (incoming/outgoing)
- Blocked users
- Friend actions (add, remove, block, unblock)
- //TODO: Profile view integration

**Chat.ts**
- Friend listesi
- Message history
- Real-time messaging (WebSocket)
- Message input

**Play.ts**
- Oyun modu seçimi
- Quick play
- Game invitation

**Tournament.ts**
- Turnuva listesi
- Join/create tournament

**Settings/** - Ayarlar sayfaları
- **ProfileSettings.ts**: Avatar, bio, display name
- **SecuritySettings.ts**: Password change, 2FA
- **ViewSettings.ts**: Theme, language
- **AccountSettings.ts**: Account info, delete account

#### 5. **Error Pages** (`components/errors/`)

**ErrorPages.ts**
- 404 - Not Found
- 500 - Server Error
- 401 - Unauthorized
- 403 - Forbidden
- Custom error messages

---

## 🗺️ Routing Sistemi

### Router.ts - Client-side SPA Router

Custom router implementation using **History API**:

```typescript
class Router {
    private routes: { path: string; component: string }[] = [];
    
    // Route tanımlama
    addRoute(path: string, component: string): void;
    
    // Navigate
    navigate(path: string): void;
    
    // Error routing helpers
    navigateTo404(): void;
    navigateTo500(): void;
    navigateTo401(): void;
    navigateTo403(): void;
}
```

### Route Definitions

```typescript
// router/Router.ts içinde
export function initializeRouter() {
    router.addRoute('/', '<dashboard-page></dashboard-page>');
    router.addRoute('/login', '<login-form></login-form>');
    router.addRoute('/signup', '<signup-form></signup-form>');
    router.addRoute('/2fa-login', '<twofa-login></twofa-login>');
    router.addRoute('/dashboard', '<dashboard-component></dashboard-component>');
    router.addRoute('/friends', '<friends-component></friends-component>');
    router.addRoute('/chat', '<chat-component></chat-component>');
    router.addRoute('/play', '<play-component></play-component>');
    router.addRoute('/tournament', '<tournament-component></tournament-component>');
    router.addRoute('/settings', '<settings-component></settings-component>');
    router.addRoute('/settings/profile', '<profile-settings></profile-settings>');
    router.addRoute('/settings/security', '<security-settings></security-settings>');
    router.addRoute('/settings/view', '<view-settings></view-settings>');
    router.addRoute('/settings/account', '<account-settings></account-settings>');
    router.addRoute('/profile', '<my-profile></my-profile>');
    router.addRoute('/2fa', '<twofa-auth></twofa-auth>');
    
    // Error routes
    router.addRoute('/error/404', '<error-page error-type="404"></error-page>');
    router.addRoute('/error/500', '<error-page error-type="500"></error-page>');
    router.addRoute('/error/401', '<error-page error-type="401"></error-page>');
    router.addRoute('/error/403', '<error-page error-type="403"></error-page>');
}
```

### Route Change Events

```typescript
// Route değişikliklerini dinleme
window.addEventListener('routechange', (event: CustomEvent) => {
    const { path, previousPath } = event.detail;
    console.log(`Navigated from ${previousPath} to ${path}`);
});
```

### Navigation

```typescript
import { router } from "./router/Router";

// Programmatic navigation
router.navigate('/friends');

// Error navigation
router.navigateTo404();
router.navigateToAuthError();
```

### URL Handling

- **pushState**: Normal navigation (back button çalışır)
- **replaceState**: Login/signup'tan sonra (history'de görünmez)

```typescript
// Login -> / navigasyonu: replaceState (geri tuşu login'e dönmemeli)
if ((previousPath === "/signup" || previousPath === "/login") && path === "/") {
    window.history.replaceState(null, '', path);
} else {
    window.history.pushState({ path }, '', path);
}
```

---

## 💾 State Management

### UserStore.ts - Global User State

Singleton pattern ile global user state yönetimi:

```typescript
// store/UserStore.ts

// Private state
let currentUser: User | null = null;
let userLoginData: UserLogin | null = null;

// Getters
export function getUser(): User | null;
export function getUserAvatar(): string;
export function getUserFullName(): string;
export function isAuthenticated(): boolean;

// Setters
export function setUser(userData: any, token: string): boolean;
export function setAccessToken(token: string): void;
export function setUserLoginData(data: UserLogin): void;

// Actions
export function clearUser(): void;
export function getUserLoginData(): UserLogin | null;
```

### User Data Sanitization

XSS koruması için tüm user data sanitize edilir:

```typescript
function sanitizeString(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        // ... diğer karakterler
}

function validateAndSanitizeUser(userData: any): Partial<User> | null {
    // Type checking
    // Value validation
    // Sanitization
    // Return clean data
}
```

### Access Token Handling

```typescript
// Token validation ve refresh
export async function checkAndGetAccessToken(): Promise<string | null> {
    let accessToken = getUser()?.accesstoken || null;
    if (!accessToken) {
        accessToken = await refreshToken();
    }
    return accessToken;
}
```

### Usage in Components

```typescript
import { getUser, setUser, isAuthenticated } from "../../store/UserStore";

class MyComponent extends LocalizedComponent {
    protected renderComponent(): void {
        const user = getUser();
        
        if (!isAuthenticated()) {
            // Redirect to login
            router.navigate('/login');
            return;
        }
        
        this.innerHTML = `
            <div>Welcome, ${user?.username}!</div>
        `;
    }
}
```

---

## 🌐 Servis Katmanı

### Service Pattern

Tüm API istekleri `services/` klasöründe merkezi olarak yönetilir.

### AuthService.ts

#### Login Flow
```typescript
export async function loginAuth(userLoginData: UserLogin): Promise<{
    status: number;
    ok: boolean;
    data: any;
}> {
    // 1. API'ye login isteği
    const response = await fetch('/auth/login', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(userLoginData)
    });
    
    // 2. Başarılıysa fetchUser ile user bilgilerini al
    if (response.ok && data.success) {
        const token = data.token || data.accesstoken;
        await fetchUser(token);
    }
    
    return { status, ok, data };
}
```

#### User Fetch
```typescript
export async function fetchUser(token: string): Promise<boolean> {
    const res = await fetch('/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
        setUser(data.user, token);
        await initializeNotifications(); // WebSocket başlat
        return true;
    }
    return false;
}
```

#### Token Refresh
```typescript
export async function refreshToken(): Promise<string | null> {
    const res = await fetch('/auth/refresh-token', {
        method: 'POST',
        credentials: 'include'
    });
    
    if (res.ok && data.accesstoken) {
        await fetchUser(data.accesstoken);
        return data.accesstoken;
    }
    
    clearUser();
    return null;
}
```

#### 2FA Operations
```typescript
// QR kodu al
export async function set2FA(): Promise<{
    ok: boolean;
    status: number;
    qr?: string;
}>;

// 2FA'yı etkinleştir
export async function enable2Fa(code: string): Promise<{
    ok: boolean;
    status: number;
}>;

// 2FA'yı devre dışı bırak
export async function disable2FA(): Promise<{
    ok: boolean;
    status: number;
}>;
```

### FriendService.ts

```typescript
export default class FriendService {
    static async getFriendsList(): Promise<ApiResponse<{
        success: boolean;
        friends: Friend[];
    }>>;
    
    static async getIncomingRequests(): Promise<ApiResponse<{
        success: boolean;
        requests: ReceivedRequest[];
    }>>;
    
    static async getSentRequests(): Promise<ApiResponse<{
        success: boolean;
        sent: SentRequest[];
    }>>;
    
    static async getBlocked(): Promise<ApiResponse<{
        success: boolean;
        blocked: BlockedUser[];
    }>>;
    
    static async sendRequest(username: string): Promise<ApiResponse>;
    static async acceptRequest(friendId: number): Promise<ApiResponse>;
    static async rejectRequest(friendId: number): Promise<ApiResponse>;
    static async removeFriend(friendId: number): Promise<ApiResponse>;
    static async blockUser(userId: number): Promise<ApiResponse>;
    static async unblockUser(userId: number): Promise<ApiResponse>;
    static async cancelRequest(friendId: number): Promise<ApiResponse>;
}
```

### ChatService.ts

```typescript
export default class ChatService {
    static async getConversation(friendId: number): Promise<Message[]>;
    static async sendMessage(friendId: number, content: string): Promise<boolean>;
    static async getFriends(): Promise<Friend[]>;
}
```

### NotificationService.ts - WebSocket

```typescript
let ws: WebSocket | null = null;

export async function initializeNotifications(): Promise<void> {
    const token = getUser()?.accesstoken;
    if (!token) return;
    
    // WebSocket bağlantısı
    ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
    
    ws.onopen = () => console.log("WebSocket connected");
    
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleNotification(message);
    };
    
    ws.onerror = (error) => console.error("WebSocket error:", error);
    
    ws.onclose = () => {
        // Reconnect logic
        setTimeout(() => initializeNotifications(), 5000);
    };
}

function handleNotification(message: NotificationMessage): void {
    switch (message.type) {
        case 'new_message':
            // Chat notification
            break;
        case 'friend_request':
            // Friend request notification
            break;
        case 'game_invite':
            // Game invite notification
            break;
    }
}
```

### SettingsService.ts

```typescript
export default class SettingsService {
    static async updateProfile(data: ProfileUpdate): Promise<ApiResponse>;
    static async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse>;
    static async updateTheme(theme: 'light' | 'dark'): Promise<ApiResponse>;
    static async deleteAccount(): Promise<ApiResponse>;
}
```

---

## 🌍 Internationalization (i18n)

### Sistem Yapısı

3 dil desteği:
- **tr** - Türkçe (default)
- **en** - English
- **ku** - Kurdî (Kurmancî)

### Core Logic - lang.ts

```typescript
import en from "./locales/en.json";
import tr from "./locales/tr.json";
import ku from "./locales/ku.json";

export type SupportedLanguage = "en" | "tr" | "ku";

// Translation function
export function t(key: string, vars?: Record<string, any>): string {
    const dict = dictionaries[currentLanguage];
    const template = dict[key] || key;
    return interpolate(template, vars);
}

// Get current language
export function getLanguage(): SupportedLanguage {
    return currentLanguage;
}

// Change language
export function setLanguage(lang: SupportedLanguage): void {
    if (isSupportedLanguage(lang)) {
        currentLanguage = lang;
        safeStorageSet(STORAGE_KEY, lang);
        notifyLanguageChange(lang);
    }
}

// Get all languages
export function getAllLanguages(): SupportedLanguage[] {
    return ["en", "tr", "ku"];
}
```

### Interpolation

```typescript
// Template: "Welcome, {{name}}!"
// Usage: t("welcome_message", { name: "John" })
// Result: "Welcome, John!"

function interpolate(template: string, vars?: Record<string, any>): string {
    if (!vars) return template;
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
        return vars[key] !== undefined ? String(vars[key]) : "";
    });
}
```

### Reactive Translations - useTranslation.ts

```typescript
type LanguageListener = (lang: SupportedLanguage) => void;

const listeners: Set<LanguageListener> = new Set();

// Subscribe to language changes
export function observeLanguageChange(callback: LanguageListener): () => void {
    listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
        listeners.delete(callback);
    };
}

// Notify all listeners
function notifyLanguageChange(newLang: SupportedLanguage): void {
    listeners.forEach(listener => listener(newLang));
}
```

### Component Integration

```typescript
class MyComponent extends LocalizedComponent {
    protected renderComponent(): void {
        // t() fonksiyonu ile çeviri
        this.innerHTML = `
            <h1>${t("my_component_title")}</h1>
            <p>${t("my_component_description")}</p>
            <button>${t("my_component_button")}</button>
        `;
    }
    
    // Dil değişince otomatik re-render
    // (LocalizedComponent base class handles this)
}
```

### Translation Keys Structure

```json
{
  "component_section_element": "Translation",
  
  "login_form_title": "Sign In",
  "login_form_email_label": "Email Address",
  "login_form_password_label": "Password",
  "login_form_submit": "Log In",
  
  "error_400_title": "Bad Request",
  "error_400_message": "Invalid input data",
  
  "dashboard_welcome_heading": "Welcome back, {{name}}!",
  "dashboard_stats_games": "{{count}} games played"
}
```

### Language Switcher

```typescript
// Header.ts veya Settings içinde
function renderLanguageSwitcher(): string {
    const languages = getAllLanguages();
    const current = getLanguage();
    
    return `
        <select id="languageSelect">
            ${languages.map(lang => `
                <option value="${lang}" ${lang === current ? 'selected' : ''}>
                    ${lang.toUpperCase()}
                </option>
            `).join('')}
        </select>
    `;
}

function handleLanguageChange(event: Event): void {
    const lang = (event.target as HTMLSelectElement).value as SupportedLanguage;
    setLanguage(lang);
    // LocalizedComponent'ler otomatik re-render olur
}
```

---

## 🔒 Güvenlik

### 1. XSS Protection

#### Input Sanitization
```typescript
function sanitizeString(str: string): string {
    const div = document.createElement('div');
    div.textContent = str; // Safe text assignment
    return div.innerHTML
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .replace(/\\/g, '&#x5C;')
        .replace(/`/g, '&#x60;');
}
```

#### Form Input Protection
```typescript
protected sanitizeInput(input: string): string {
    return input.trim()
        .replace(/[<>]/g, "")           // HTML tags
        .replace(/javascript:/gi, "")   // JS protocols
        .replace(/on\w+=/gi, "");       // Event handlers
}
```

### 2. Content Security Policy (CSP)

```typescript
// vite.config.ts
export default defineConfig({
    server: {
        headers: {
            'Content-Security-Policy': "script-src 'self' 'unsafe-eval' 'unsafe-inline';"
        }
    }
});
```

### 3. Authentication & Authorization

#### Token-based Auth
- Access Token (short-lived, ~1 hour)
- Refresh Token (long-lived, HTTP-only cookie)

```typescript
// Token refresh before expiration
export async function checkAndGetAccessToken(): Promise<string | null> {
    let accessToken = getUser()?.accesstoken || null;
    
    if (!accessToken) {
        // Token expired, try refresh
        accessToken = await refreshToken();
    }
    
    return accessToken;
}
```

#### Protected Routes
```typescript
const user = getUser();

if (!isAuthenticated()) {
    router.navigate('/login');
    return;
}

// Route guard example
if (requiresAuth && !user) {
    router.navigateTo401();
    return;
}
```

### 4. HTTPS & Secure Cookies

Production'da:
- HTTPS zorunlu
- Secure cookies
- SameSite=Strict

```typescript
// Cookie settings (backend)
{
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
}
```

### 5. 2FA (Two-Factor Authentication)

```typescript
// 2FA workflow
1. User login with email/password
2. If is_2fa_enabled === 1:
   - Redirect to /2fa-login
   - User enters 6-digit code from authenticator app
   - Backend validates TOTP token
   - Success: Full login
3. Else: Direct login
```

### 6. Input Validation

#### Client-side
```typescript
const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

if (!emailPattern.test(email)) {
    showError("Invalid email format");
    return;
}
```

#### Server-side (Backend'de tekrar validate edilir)

---

## ✅ Best Practices

### 1. Component Design

**DO:**
```typescript
// Extend LocalizedComponent for i18n support
class MyComponent extends LocalizedComponent {
    protected renderComponent(): void { }
}

// Use t() for all user-facing text
const title = t("my_component_title");

// Cleanup in disconnectedCallback
disconnectedCallback() {
    this.cleanup();
}
```

**DON'T:**
```typescript
// ❌ Hard-coded strings
this.innerHTML = `<h1>Welcome</h1>`;

// ❌ Memory leaks
connectedCallback() {
    setInterval(this.update, 1000); // Never cleaned up!
}

// ❌ Direct DOM manipulation without re-render
someMethod() {
    document.querySelector('.title').textContent = "New title";
}
```

### 2. State Management

**DO:**
```typescript
// Use UserStore for global state
import { getUser, setUser } from "../../store/UserStore";

// Component local state
class MyComponent extends LocalizedComponent {
    private loading = false;
    private data: any[] = [];
    
    private async fetchData() {
        this.loading = true;
        this.renderAndBind(); // Re-render to show loading
        
        this.data = await service.getData();
        this.loading = false;
        this.renderAndBind(); // Re-render with data
    }
}
```

**DON'T:**
```typescript
// ❌ Global variables
window.currentUser = user;

// ❌ Direct DOM state without re-render
this.querySelector('.status').classList.add('loading');
```

### 3. Error Handling

**DO:**
```typescript
try {
    const response = await fetch('/api/data');
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data;
} catch (error) {
    console.error("Fetch error:", error);
    this.handleApiError(500, "#messageContainer");
}
```

**DON'T:**
```typescript
// ❌ Silent failures
const data = await fetch('/api/data').then(r => r.json());

// ❌ Generic error messages
alert("Error!");
```

### 4. API Calls

**DO:**
```typescript
// Use service layer
import FriendService from "../../services/FriendService";

const { ok, data } = await FriendService.getFriendsList();
if (ok) {
    this.friends = data.friends;
}

// Check authentication before API calls
const token = await checkAndGetAccessToken();
if (!token) {
    router.navigate('/login');
    return;
}
```

**DON'T:**
```typescript
// ❌ Direct fetch in component
const response = await fetch('/api/friends');

// ❌ No error handling
const data = await response.json();
this.friends = data.friends;
```

### 5. TypeScript Usage

**DO:**
```typescript
// Strong typing
interface User {
    id: number;
    username: string;
    email: string;
}

function setUser(user: User): void { }

// Type guards
if (typeof value === 'string') { }

// Null checks
if (user?.profile?.avatar_url) { }
```

**DON'T:**
```typescript
// ❌ Any type abuse
function doSomething(data: any): any { }

// ❌ No null checks
const avatar = user.profile.avatar_url; // Can crash!
```

### 6. Event Listeners

**DO:**
```typescript
class MyComponent extends LocalizedComponent {
    private boundHandler = this.handleClick.bind(this);
    
    protected afterRender(): void {
        this.querySelector('button')?.addEventListener(
            'click',
            this.boundHandler
        );
    }
    
    disconnectedCallback(): void {
        this.querySelector('button')?.removeEventListener(
            'click',
            this.boundHandler
        );
    }
}
```

**DON'T:**
```typescript
// ❌ Memory leaks
connectedCallback() {
    this.querySelector('button')?.addEventListener('click', () => {
        // Never cleaned up!
    });
}
```

### 7. Performance

**DO:**
```typescript
// Debounce expensive operations
let debounceTimer: number;
function handleSearch(query: string) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        performSearch(query);
    }, 300);
}

// Lazy load components
router.addRoute('/heavy', async () => {
    const module = await import('./HeavyComponent');
    return module.default;
});
```

**DON'T:**
```typescript
// ❌ Re-render on every keystroke
input.addEventListener('input', () => {
    this.renderAndBind(); // Expensive!
});

// ❌ Large initial bundle
import './all-components';
```

---

## 📖 Klasör ve Dosya Açıklamaları

### `/src/main.ts`
Uygulamanın entry point'i:
- Router initialization
- Component imports
- Initial navigation
- Auth check

### `/src/components/base/`

**LocalizedComponent.ts**
- Abstract base class
- i18n reactive support
- Lifecycle management
- Template pattern implementation

### `/src/components/forms/`

**UserForm.ts**
- Abstract form base
- Google OAuth popup
- Error handling
- Validation utilities
- API error mapping

**LoginForm.ts**
- Email/password login
- 2FA redirect
- Google login button

**SignupForm.ts**
- Full name, username, email, password
- Validation (email, password strength)
- Google signup

**TwoFaLogin.ts**
- 6-digit code input
- Auto-submit
- Cancel to login

### `/src/components/utils/`

**Header.ts**
- Top navigation bar
- User menu (logout, profile, settings)
- Notifications bell
- Language switcher
- Responsive hamburger

**SideBar.ts**
- Left navigation menu
- Routes: Dashboard, Friends, Chat, Play, Tournament, Settings
- Collapse/expand state
- Active route highlighting
- Responsive drawer mode

**Messages.ts**
- Toast notification system
- Types: success, error, info, warning
- Auto-dismiss
- Loading animations

**MyProfile.ts**
- User profile card
- Avatar display
- Quick stats (games, wins, losses)
- Edit profile button

**Statistics.ts**
- User stats panel
- Win rate calculation
- Games played
- Achievements

**LastGames.ts**
- Recent games list
- Game results
- Date/time
- Opponent info

**TwoFaAuth.ts**
- QR code display
- Setup instructions
- Enable/disable 2FA
- Authenticator app integration

**Validation.ts**
- Form validation helpers
- Email, password, username patterns

### `/src/components/sideBarComponents/`

**Dashboard.ts**
- Home page after login
- Quick play button
- Invite friends
- Recent activity
- User statistics

**Friends.ts**
- Friend list display
- Incoming requests (accept/reject)
- Sent requests (cancel)
- Blocked users (unblock)
- Add friend (by username)
- Friend actions (remove, block)
- //TODO: View profile integration

**Chat.ts**
- Friends list (sidebar)
- Message history
- Message input
- Real-time updates (WebSocket)
- Typing indicators

**Play.ts**
- Game mode selection
- Quick play
- Private game (invite friend)
- Game settings

**Tournament.ts**
- Tournament list
- Join tournament
- Create tournament
- Tournament bracket view

**Settings/** (Alt sayfalar)

**Settings.ts**
- Main settings hub
- Links to sub-pages
- Quick settings overview

**ProfileSettings.ts**
- Avatar upload/change
- Display name
- Bio
- Save changes

**SecuritySettings.ts**
- Change password
- 2FA management
- Active sessions
- Login history

**ViewSettings.ts**
- Theme (dark/light)
- Language selection
- Display preferences

**AccountSettings.ts**
- Account info (email, username, created date)
- Delete account (danger zone)

### `/src/components/errors/`

**ErrorPages.ts**
- Dynamic error page component
- Attributes: error-type, error-title, error-description
- Types: 404, 500, 401, 403, auth
- Localized error messages

### `/src/services/`

**AuthService.ts**
- `loginAuth()` - Login
- `fetchUser()` - Get user info
- `refreshToken()` - Refresh access token
- `handleLogin()` - Auto-login check
- `logout()` - Logout
- `set2FA()` - Setup 2FA
- `enable2Fa()` - Enable 2FA
- `disable2FA()` - Disable 2FA

**FriendService.ts**
- `getFriendsList()` - Get friends
- `getIncomingRequests()` - Pending incoming
- `getSentRequests()` - Pending outgoing
- `getBlocked()` - Blocked users
- `sendRequest()` - Send friend request
- `acceptRequest()` - Accept request
- `rejectRequest()` - Reject request
- `removeFriend()` - Remove friend
- `blockUser()` - Block user
- `unblockUser()` - Unblock user
- `cancelRequest()` - Cancel sent request

**ChatService.ts**
- `getConversation()` - Get messages
- `sendMessage()` - Send message
- `getFriends()` - Get chat-enabled friends

**NotificationService.ts**
- `initializeNotifications()` - WebSocket connection
- `handleNotification()` - Message routing
- Types: new_message, friend_request, game_invite

**SettingsService.ts**
- `updateProfile()` - Update profile data
- `changePassword()` - Change password
- `updateTheme()` - Change theme
- `deleteAccount()` - Delete account

### `/src/store/`

**UserStore.ts**
- Global user state
- `getUser()` - Get current user
- `setUser()` - Set user data
- `clearUser()` - Logout
- `isAuthenticated()` - Check auth status
- User data sanitization
- XSS protection

### `/src/router/`

**Router.ts**
- Client-side SPA router
- `addRoute()` - Define routes
- `navigate()` - Navigate to path
- `navigateTo404/500/401/403()` - Error navigation
- History API integration
- Route change events

**SidebarStateManager.ts**
- Sidebar collapse/expand state
- Responsive behavior
- State persistence
- Event listeners for state changes

### `/src/i18n/`

**lang.ts**
- Core i18n logic
- `t()` - Translate key
- `setLanguage()` - Change language
- `getLanguage()` - Get current language
- Interpolation support
- LocalStorage persistence

**useTranslation.ts**
- Reactive translation hook
- `observeLanguageChange()` - Subscribe to changes
- Observer pattern implementation

**locales/**
- `en.json` - English translations
- `tr.json` - Turkish translations
- `ku.json` - Kurdish translations
- 300+ translation keys per language

### `/src/types/`

**AuthType.ts**
- `User`, `UserProfile`, `UserLogin` interfaces

**FriendsType.ts**
- `Friend`, `FriendRequest`, `BlockedUser` interfaces

**NotificationTypes.ts**
- `NotificationMessage`, `NotificationType` types

**SettingsType.ts**
- Settings-related type definitions

### `/src/styles/`

**style.css**
- TailwindCSS imports
- Global styles
- Custom utility classes

### Root Files

**index.html**
- HTML entry point
- `<div id="app"></div>` container
- Meta tags
- Title

**package.json**
- Dependencies
- Scripts (dev, build, preview)
- Project metadata

**tsconfig.json**
- TypeScript configuration
- Strict mode enabled
- ES2022 target
- DOM libraries

**vite.config.ts**
- Vite configuration
- TailwindCSS plugin
- CSP headers
- Build options

**.env.example**
- Environment variables template
- `VITE_API_BASE_URL`

---

## 🎨 Styling ve TailwindCSS

### TailwindCSS Integration

```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [tailwindcss()]
})
```

### Utility-First Approach

```html
<!-- Responsive, Dark mode ready -->
<div class="
    flex items-center justify-between
    p-4 sm:p-6 lg:p-8
    bg-white dark:bg-gray-800
    border border-gray-200 dark:border-gray-700
    rounded-lg shadow-md
    hover:shadow-lg transition-shadow
">
    <h2 class="text-xl font-bold text-gray-900 dark:text-white">
        Title
    </h2>
</div>
```

### Dark Mode

Sistem bazlı otomatik dark mode:
```css
/* Dark mode class'ı sistem tercihine göre otomatik eklenir */
.dark { /* dark mode styles */ }
```

### Responsive Design

Mobile-first approach:
```html
<!-- Default (mobile), sm:tablet, md:desktop, lg:large screens -->
<div class="
    w-full
    sm:w-1/2
    md:w-1/3
    lg:w-1/4
">
```

---

## 🔄 Data Flow

### Authentication Flow
```
1. User submits login form
   └─> LoginForm.handleSubmit()
       └─> AuthService.loginAuth()
           ├─> POST /auth/login
           ├─> If 2FA required → navigate('/2fa-login')
           └─> If success:
               └─> AuthService.fetchUser()
                   ├─> GET /auth/me
                   └─> UserStore.setUser()
                       └─> NotificationService.initializeNotifications()
                           └─> WebSocket connection
2. Navigate to dashboard
   └─> router.navigate('/')
```

### Component Lifecycle Flow
```
1. Component created
   └─> constructor()

2. Added to DOM
   └─> connectedCallback()
       ├─> renderAndBind()
       │   ├─> renderComponent()
       │   └─> afterRender()
       ├─> observeLanguage()
       └─> onConnected()

3. Language change
   └─> observeLanguageChange callback
       └─> renderAndBind()
           └─> Re-render with new translations

4. Removed from DOM
   └─> disconnectedCallback()
       ├─> Cleanup language listener
       └─> onDisconnected()
```

### API Request Flow
```
Component
   └─> Service.method()
       ├─> checkAndGetAccessToken()
       │   ├─> UserStore.getUser()
       │   └─> If expired → AuthService.refreshToken()
       └─> fetch(API_URL, {
               headers: { Authorization: `Bearer ${token}` },
               credentials: 'include'
           })
           ├─> Success → return data
           └─> Error → throw / return error response
```

---

## 🧪 Testing (Gelecek İyileştirmeler)

Şu anda proje manuel test edilmektedir. Gelecekte eklenebilecek test altyapısı:

### Unit Tests
- Vitest
- Component testing
- Service testing
- Utility function testing

### E2E Tests
- Playwright
- User flow testing
- Integration testing

---

## 🚀 Deployment

### Production Build

```bash
npm run build
```

Output: `dist/` klasörü

### Build Optimization
- TypeScript compilation
- Code minification
- Tree shaking
- Asset optimization
- CSS purging (unused Tailwind classes)

### Deployment Targets
- Static hosting (Nginx, Apache)
- CDN
- Docker container

### Environment Configuration

```env
# Production
VITE_API_BASE_URL=https://api.production.com

# Staging
VITE_API_BASE_URL=https://api.staging.com

# Development
VITE_API_BASE_URL=http://localhost:3000
```

---

## 📝 Changelog ve Versiyon Notları

### Current Version: 0.0.0

#### Features
- ✅ User authentication (login, signup, logout)
- ✅ 2FA support
- ✅ Friend management
- ✅ Real-time chat
- ✅ Multi-language support (TR, EN, KU)
- ✅ Dark mode
- ✅ Responsive design
- ✅ Profile management
- ✅ Settings management

#### Known Issues
- ⚠️ Game logic not implemented (placeholder)
- ⚠️ Tournament features incomplete
- ⚠️ Profile view in Friends page not implemented (TODO)

#### Planned Features
- 🔮 Pong game implementation
- 🔮 Tournament system
- 🔮 Achievements
- 🔮 Leaderboards
- 🔮 Profile view modal
- 🔮 Unit tests
- 🔮 E2E tests

---

## 👥 Katkıda Bulunma

### Code Style
- TypeScript strict mode
- ESLint rules
- Prettier formatting
- Naming conventions:
  - Components: PascalCase (`MyComponent`)
  - Functions: camelCase (`handleClick`)
  - Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)
  - Files: kebab-case (`my-component.ts`)

### Commit Messages
```
feat: Add friend profile view
fix: Resolve 2FA token validation issue
docs: Update README with deployment guide
style: Format code with Prettier
refactor: Simplify authentication flow
test: Add unit tests for UserStore
```

---

## 📚 Kaynaklar ve Referanslar

### Official Docs
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Web Components MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [Custom Elements v1](https://html.spec.whatwg.org/multipage/custom-elements.html)

### APIs Used
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API)
- [LocalStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

---

## 📞 İletişim ve Destek

### Geliştirici
- Proje: FT_PINPON
- Backend: Node.js + Fastify microservices
- Frontend: Vanilla TypeScript + Web Components

### Repository
- GitHub: [Repository Link]
- Issues: [Issues Link]

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

---

**Son Güncelleme:** 30 Aralık 2025

**Proje Durumu:** Active Development 🚧
