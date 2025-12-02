/**
 * Service Worker for Push Notifications
 * Handles push events and notification clicks
 */

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

// Push event - receive push notification from server
self.addEventListener('push', (event) => {
  console.log('Push received:', event);
  
  let notificationData = {
    title: 'LuxeFurniture',
    body: 'Bạn có thông báo mới',
    icon: '/logo.png',
    badge: '/badge.png',
    data: {}
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        data: data.data || {},
        vibrate: [200, 100, 200],
        tag: 'luxefurniture-notification',
        requireInteraction: false
      };
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      vibrate: notificationData.vibrate,
      data: notificationData.data,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction
    }
  );

  event.waitUntil(promiseChain);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  // Get URL to open from notification data
  let urlToOpen = '/';
  
  if (event.notification.data) {
    if (event.notification.data.url) {
      urlToOpen = event.notification.data.url;
    } else if (event.notification.data.order_id) {
      urlToOpen = `/orders/${event.notification.data.order_id}`;
    }
  }

  // Open or focus window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync (optional - for future use)
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  // Sync notifications with server when online
  console.log('Syncing notifications...');
}
