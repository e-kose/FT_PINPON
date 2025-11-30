# Notification Service API Dokümantasyonu

Bu dokümantasyon, UI geliştiricileri için Notification Service API'sinin kullanımını açıklamaktadır.

## 📋 İçindekiler
- [Genel Bilgiler](#genel-bilgiler)
- [Authentication](#authentication)
- [Notification Tipleri](#notification-tipleri)
- [REST API Endpoints](#rest-api-endpoints)
- [WebSocket Kullanımı](#websocket-kullanımı)
- [Online Status API](#online-status-api)
- [Response Formatları](#response-formatları)
- [Error Handling](#error-handling)
- [Kullanım Örnekleri](#kullanım-örnekleri)

## 🌐 Genel Bilgiler

**Base URL:** `http://localhost:3003`
**WebSocket URL:** `ws://localhost:3003/notification/ws`

## 🔐 Authentication

Tüm API çağrılarında aşağıdaki header'ı göndermeniz gerekir:

```
x-user-id: {user_id}
```

**Örnek:**
```javascript
headers: {
  'Content-Type': 'application/json',
  'x-user-id': '123'
}
```

## 🏷️ Notification Tipleri

| Tip | Açıklama |
|-----|----------|
| `game_invite` | Oyun davetiyesi |
| `chat_message` | Chat/mesaj bildirimi |
| `friend_request` | Arkadaşlık isteği |

## 🔌 REST API Endpoints

### 1. Bildirim Oluşturma

**POST** `/notifications`

**Request Body:**
```typescript
{
  to_user_id: number;        // Bildirimi alacak kullanıcı ID
  title: string;             // Bildirim başlığı (max 255 karakter)
  message: string;           // Bildirim mesajı
  type?: 'game_invite' | 'chat_message' | 'friend_request'; // Varsayılan: 'chat_message'
}
```

**Response:**
```typescript
{
  success: boolean;
  data: Notification;
  message: string;
}
```

**Örnek:**
```javascript
const response = await fetch('/notifications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': '1'
  },
  body: JSON.stringify({
    to_user_id: 2,
    title: 'Oyun Davetiyesi',
    message: 'Satranç oynamak ister misin?',
    type: 'game_invite'
  })
});
```

---

### 2. Bildirimleri Listeleme

**GET** `/notifications`

**Query Parameters:**
```typescript
{
  is_read?: boolean;         // Okunma durumu filtresi
  type?: NotificationType;   // Tip filtresi
  from_user_id?: number;     // Gönderen kullanıcı filtresi
  limit?: number;            // Sayfa başına sonuç (max 100, varsayılan 20)
  offset?: number;           // Başlangıç indeksi (varsayılan 0)
}
```

**Response:**
```typescript
{
  success: boolean;
  data: Notification[];
  message: string;
}
```

**Örnek:**
```javascript
// Okunmamış oyun davetlerini getir
const response = await fetch('/notifications?type=game_invite&is_read=false', {
  headers: { 'x-user-id': '2' }
});
```

---

### 3. Belirli Bildirimi Getirme

**GET** `/notifications/:id`

**Response:**
```typescript
{
  success: boolean;
  data: Notification;
  message: string;
}
```

---

### 4. Bildirimi Güncelleme

**PUT** `/notifications/:id`

**Request Body:**
```typescript
{
  is_read?: boolean;
  title?: string;
  message?: string;
  type?: NotificationType;
}
```

---

### 5. Bildirimi Okundu İşaretleme

**PATCH** `/notifications/:id/read`

**Response:**
```typescript
{
  success: boolean;
  data: Notification;
  message: string;
}
```

---

### 6. Bildirimi Silme

**DELETE** `/notifications/:id`

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

---

### 7. Tüm Bildirimleri Okundu İşaretleme

**PATCH** `/notifications/mark-all-read`

**Request Body (Opsiyonel):**
```typescript
{
  type?: NotificationType;   // Sadece belirli tip
  from_user_id?: number;     // Sadece belirli kullanıcıdan gelenler
}
```

**Response:**
```typescript
{
  success: boolean;
  data: { updated_count: number };
  message: string;
}
```

---

### 8. Bildirim İstatistikleri

**GET** `/notifications/stats`

**Response:**
```typescript
{
  success: boolean;
  data: {
    total: number;     // Toplam bildirim sayısı
    unread: number;    // Okunmamış sayısı
    read: number;      // Okunmuş sayısı
  };
  message: string;
}
```

---

### 9. Okunmamış Bildirim Sayısı

**GET** `/notifications/unread-count`

**Response:**
```typescript
{
  success: boolean;
  data: { unread_count: number };
  message: string;
}
```

---

### 10. Son Okunmamış Bildirimler

**GET** `/notifications/recent-unread?limit=5`

**Query Parameters:**
- `limit`: 1-20 arası (varsayılan 5)

**Response:**
```typescript
{
  success: boolean;
  data: Notification[];
  message: string;
}
```

## 🔌 WebSocket Kullanımı

### Bağlantı Kurma

```javascript
const ws = new WebSocket('ws://localhost:3003/notification/ws?user_id=123');

// Alternatif olarak header ile
const ws = new WebSocket('ws://localhost:3003/notification/ws');
```

### Mesaj Dinleme

```javascript
ws.onmessage = function(event) {
  const message = JSON.parse(event.data);

  switch(message.type) {
    case 'notification':
      handleNewNotification(message.data);
      break;
    case 'success':
      console.log('Başarı:', message.data.message);
      break;
    case 'error':
      console.error('Hata:', message.data.message);
      break;
  }
};

function handleNewNotification(data) {
  const { notification, action } = data;

  switch(action) {
    case 'created':
      // Yeni bildirim geldi
      showNotificationToast(notification);
      updateNotificationBadge();
      break;
    case 'marked_read':
      // Bildirim okundu işaretlendi
      updateNotificationUI(notification);
      break;
    case 'deleted':
      // Bildirim silindi
      removeNotificationFromUI(notification.id);
      break;
  }
}
```

### Heartbeat (Önerilen)

```javascript
// Her 25 saniyede bir ping gönder
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 25000);
```

## � Online Status API

Arkadaşlık sistemi entegrasyonu için kullanıcıların online durumunu kontrol eden API'ler.

### 1. Tek Kullanıcı Online Durumu

**GET** `/notification/ws/user/:userId/online`

**Response:**
```typescript
{
  success: boolean;
  data: {
    userId: number;
    isOnline: boolean;
    timestamp: string;
  };
}
```

**Örnek:**
```javascript
const response = await fetch('/notification/ws/user/123/online');
const data = await response.json();
console.log(data.data.isOnline); // true/false
```

---

### 2. Çoklu Kullanıcı Online Durumu (Arkadaş Listesi İçin)

**POST** `/notification/ws/users/online-status`

**Request Body:**
```typescript
{
  userIds: number[];  // Max 100 kullanıcı
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    onlineStatus: Array<{
      userId: number;
      isOnline: boolean;
    }>;
    timestamp: string;
  };
}
```

**Örnek:**
```javascript
// Arkadaş listesindeki kullanıcıların online durumu
const friendIds = [1, 2, 5, 10, 15];
const response = await fetch('/ws/users/online-status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userIds: friendIds })
});

const data = await response.json();
data.data.onlineStatus.forEach(user => {
  console.log(`User ${user.userId} is ${user.isOnline ? 'online' : 'offline'}`);
});
```

---

### 3. Tüm Online Kullanıcılar

**GET** `/notification/ws/online-users`

**Response:**
```typescript
{
  success: boolean;
  data: {
    onlineUsers: number[];
    count: number;
    timestamp: string;
  };
}
```

**Örnek:**
```javascript
const response = await fetch('/ws/online-users');
const data = await response.json();
console.log(`${data.data.count} users online:`, data.data.onlineUsers);
```

---

### 4. Online/Offline Event'leri (WebSocket)

WebSocket üzerinden kullanıcı online/offline olduğunda event'ler gönderilir:

```javascript
ws.onmessage = function(event) {
  const message = JSON.parse(event.data);

  if (message.type === 'user_status') {
    const { userId, status, timestamp } = message.data;

    if (status === 'online') {
      console.log(`User ${userId} came online at ${timestamp}`);
      updateFriendListUI(userId, true);
    } else if (status === 'offline') {
      console.log(`User ${userId} went offline at ${timestamp}`);
      updateFriendListUI(userId, false);
    }
  }
};
```

**Event Message Format:**
```typescript
{
  type: 'user_status';
  data: {
    userId: number;
    status: 'online' | 'offline';
    timestamp: string;
  };
}
```

### 💡 Arkadaşlık Servisi Entegrasyon Örnekleri

#### React Hook - Arkadaş Listesi ile Online Durumu

```javascript
import { useState, useEffect } from 'react';

export function useFriendsWithOnlineStatus(friendIds) {
  const [friendsStatus, setFriendsStatus] = useState({});
  const [ws, setWs] = useState(null);

  useEffect(() => {
    // İlk online durumlarını yükle
    loadFriendsOnlineStatus();

    // WebSocket bağlantısı - online/offline event'leri için
    const websocket = new WebSocket('ws://localhost:3003/ws?user_id=123');

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'user_status') {
        const { userId, status } = message.data;
        // Sadece arkadaşlarımızın durumunu güncelle
        if (friendIds.includes(userId)) {
          setFriendsStatus(prev => ({
            ...prev,
            [userId]: status === 'online'
          }));
        }
      }
    };

    setWs(websocket);
    return () => websocket.close();
  }, [friendIds]);

  const loadFriendsOnlineStatus = async () => {
    try {
      const response = await fetch('/ws/users/online-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: friendIds })
      });

      const data = await response.json();
      const statusMap = {};
      data.data.onlineStatus.forEach(user => {
        statusMap[user.userId] = user.isOnline;
      });
      setFriendsStatus(statusMap);
    } catch (error) {
      console.error('Failed to load friends online status:', error);
    }
  };

  return { friendsStatus, loadFriendsOnlineStatus };
}
```

#### Arkadaş Listesi Component Örneği

```javascript
function FriendsList({ friends }) {
  const friendIds = friends.map(f => f.id);
  const { friendsStatus } = useFriendsWithOnlineStatus(friendIds);

  return (
    <div className="friends-list">
      {friends.map(friend => (
        <div key={friend.id} className="friend-item">
          <img src={friend.avatar} alt={friend.name} />
          <span className="friend-name">{friend.name}</span>
          <span className={`online-indicator ${friendsStatus[friend.id] ? 'online' : 'offline'}`}>
            {friendsStatus[friend.id] ? '🟢 Online' : '⚫ Offline'}
          </span>
        </div>
      ))}
    </div>
  );
}
```

## �📝 Response Formatları

### Notification Object

```typescript
interface Notification {
  id: number;
  from_user_id: number;      // Bildirimi gönderen kullanıcı
  to_user_id: number;        // Bildirimi alan kullanıcı
  title: string;             // Bildirim başlığı
  message: string;           // Bildirim mesajı
  type: 'game_invite' | 'chat_message' | 'friend_request';
  is_read: boolean;          // Okunma durumu
  created_at: string;        // ISO 8601 format (2025-10-24T10:30:00Z)
  updated_at: string;        // ISO 8601 format
}
```

### WebSocket Message Formatları

#### Bildirim Mesajı
```typescript
{
  type: 'notification';
  data: {
    notification: Notification;
    action: 'created' | 'updated' | 'deleted' | 'marked_read' | 'marked_unread';
  };
  timestamp: string;
}
```

#### Başarı Mesajı
```typescript
{
  type: 'success';
  data: {
    message: string;
    payload?: any;
  };
  timestamp: string;
}
```

#### Hata Mesajı
```typescript
{
  type: 'error';
  data: {
    message: string;
    code?: string;
  };
  timestamp: string;
}
```

## ❌ Error Handling

### HTTP Status Codes

- **200**: Başarılı
- **201**: Başarıyla oluşturuldu
- **400**: Geçersiz istek
- **403**: Yetkisiz erişim
- **404**: Bulunamadı
- **500**: Sunucu hatası

### Error Response Format

```typescript
{
  success: false;
  error: string;
}
```

### Yaygın Hatalar

```javascript
// Eksik authentication
{
  "success": false,
  "error": "Invalid or missing user ID in headers"
}

// Kendine bildirim gönderme
{
  "success": false,
  "error": "Cannot send notification to yourself"
}

// Yetkisiz erişim
{
  "success": false,
  "error": "Access denied: You can only access your own notifications"
}
```

## 🚀 Kullanım Örnekleri

### React Hook Örneği

```javascript
import { useState, useEffect } from 'react';

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    // WebSocket bağlantısı
    const websocket = new WebSocket(`ws://localhost:3003/ws?user_id=${userId}`);

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'notification') {
        const { notification, action } = message.data;

        if (action === 'created') {
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      }
    };

    setWs(websocket);

    // İlk bildirimleri yükle
    loadNotifications();
    loadUnreadCount();

    return () => websocket.close();
  }, [userId]);

  const loadNotifications = async () => {
    const response = await fetch('/notifications', {
      headers: { 'x-user-id': userId.toString() }
    });
    const data = await response.json();
    setNotifications(data.data);
  };

  const loadUnreadCount = async () => {
    const response = await fetch('/notifications/unread-count', {
      headers: { 'x-user-id': userId.toString() }
    });
    const data = await response.json();
    setUnreadCount(data.data.unread_count);
  };

  const markAsRead = async (notificationId) => {
    await fetch(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: { 'x-user-id': userId.toString() }
    });

    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, is_read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const sendNotification = async (toUserId, title, message, type = 'chat_message') => {
    await fetch('/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId.toString()
      },
      body: JSON.stringify({ to_user_id: toUserId, title, message, type })
    });
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    sendNotification,
    loadNotifications
  };
}
```

### Vue.js Composition API Örneği

```javascript
import { ref, onMounted, onUnmounted } from 'vue';

export function useNotifications(userId) {
  const notifications = ref([]);
  const unreadCount = ref(0);
  let ws = null;

  const connectWebSocket = () => {
    ws = new WebSocket(`ws://localhost:3003/ws?user_id=${userId}`);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'notification' && message.data.action === 'created') {
        notifications.value.unshift(message.data.notification);
        unreadCount.value++;
      }
    };
  };

  const loadNotifications = async () => {
    try {
      const response = await fetch('/notifications', {
        headers: { 'x-user-id': userId.toString() }
      });
      const data = await response.json();
      notifications.value = data.data;
    } catch (error) {
      console.error('Bildirimler yüklenemedi:', error);
    }
  };

  onMounted(() => {
    connectWebSocket();
    loadNotifications();
  });

  onUnmounted(() => {
    if (ws) ws.close();
  });

  return {
    notifications,
    unreadCount,
    loadNotifications
  };
}
```

### Toast Notification Örneği

```javascript
function showNotificationToast(notification) {
  // Toast kütüphanesi kullanarak
  toast({
    title: notification.title,
    description: notification.message,
    action: {
      label: 'Görüntüle',
      onClick: () => {
        // Bildirimi detay sayfasına git
        window.location.href = `/notifications/${notification.id}`;
      }
    },
    duration: 5000
  });
}
```

## 📱 UI Önerileri

### Bildirim Badge
```javascript
// Okunmamış bildirim sayısını göster
<div className="notification-badge">
  {unreadCount > 0 && (
    <span className="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
  )}
</div>
```

### Bildirim Listesi
```javascript
// Bildirim tipine göre icon göster
const getNotificationIcon = (type) => {
  switch (type) {
    case 'game_invite': return '🎮';
    case 'chat_message': return '💬';
    case 'friend_request': return '👥';
    default: return '🔔';
  }
};
```

### Real-time Güncellemeler
- WebSocket bağlantısı koptuğunda otomatik yeniden bağlan
- Uygulama background'a gittiğinde bağlantıyı koru
- Network durumu değiştiğinde bağlantıyı kontrol et

Bu dokümantasyon ile UI tarafında notification sistemini kolayca entegre edebilirsiniz! 🎉
