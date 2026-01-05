/**
 * Web Push Notifications Client
 * 
 * FREE push notifications using the Web Push API!
 * Works in Chrome, Firefox, Edge, Safari (iOS 16.4+)
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface PushState {
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Get current push notification state
 */
export async function getPushState(): Promise<PushState> {
  if (!isPushSupported()) {
    return { supported: false, permission: 'denied', subscribed: false };
  }

  const permission = Notification.permission;
  let subscribed = false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    subscribed = !!subscription;
  } catch (e) {
    console.error('Error checking subscription:', e);
  }

  return { supported: true, permission, subscribed };
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('✅ Service Worker registered');
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Request notification permission
 */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  return Notification.requestPermission();
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(accessToken: string): Promise<boolean> {
  if (!isPushSupported()) {
    console.warn('Push notifications not supported');
    return false;
  }

  try {
    // Request permission first
    const permission = await requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return false;
    }

    // Get VAPID public key from server
    const keyResponse = await fetch(`${API_BASE}/notifications/vapid-public-key`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const { publicKey, enabled } = await keyResponse.json();

    if (!enabled || !publicKey) {
      console.warn('Push notifications not configured on server');
      return false;
    }

    // Register service worker
    const registration = await registerServiceWorker();
    if (!registration) return false;

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    // Send subscription to server
    const response = await fetch(`${API_BASE}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: arrayBufferToBase64(subscription.getKey('auth')),
        },
        deviceName: getDeviceName(),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save subscription');
    }

    console.log('✅ Push notification subscription saved');
    return true;
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return false;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(accessToken: string): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Unsubscribe from browser
      await subscription.unsubscribe();

      // Remove from server
      await fetch(`${API_BASE}/notifications/unsubscribe`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
    }

    console.log('✅ Unsubscribed from push notifications');
    return true;
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return false;
  }
}

/**
 * Send test notification
 */
export async function sendTestNotification(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/notifications/test`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.ok;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
}

// Helper functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome Browser';
  if (ua.includes('Firefox')) return 'Firefox Browser';
  if (ua.includes('Safari')) return 'Safari Browser';
  if (ua.includes('Edge')) return 'Edge Browser';
  return 'Web Browser';
}

