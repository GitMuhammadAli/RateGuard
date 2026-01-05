# 🔔 Push Notifications Setup Guide

Complete setup for FREE Web Push notifications in RateGuard!

---

## 📋 Prerequisites

- [x] `web-push` package installed (backend)
- [x] Service Worker created (`public/sw.js`)
- [x] Push client utilities (`lib/push-notifications.ts`)

---

## 🚀 Backend Setup

### Step 1: Generate VAPID Keys (One-Time)

```bash
cd apps/server
npx web-push generate-vapid-keys
```

**Output:**
```
=======================================
Public Key:
BEl62iUYgUivxIkv69yViwe...

Private Key:
UUxI4O8-FbRouAF7-LH_...
=======================================
```

### Step 2: Add to `.env`

```env
# Push Notifications (Web Push API - FREE)
VAPID_PUBLIC_KEY="BEl62iUYgUivxIkv69yViwe..."
VAPID_PRIVATE_KEY="UUxI4O8-FbRouAF7-LH_..."
VAPID_EMAIL="mailto:admin@rateguard.io"
```

### Step 3: NotificationModule is Already Registered! ✅

Already added to `app.module.ts` as a global module.

---

## 🎨 Frontend Setup

### Step 1: Create Push Notification Hook

```typescript
// hooks/use-push-notifications.ts
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { 
  subscribeToPush, 
  unsubscribeFromPush,
  getPushState,
  sendTestNotification,
} from '@/lib/push-notifications';

export function usePushNotifications() {
  const { accessToken } = useAuthStore();
  const [state, setState] = useState({
    supported: false,
    permission: 'default' as NotificationPermission,
    subscribed: false,
    loading: false,
  });

  useEffect(() => {
    checkState();
  }, []);

  async function checkState() {
    const pushState = await getPushState();
    setState({ ...pushState, loading: false });
  }

  async function subscribe() {
    if (!accessToken) return false;
    setState({ ...state, loading: true });
    
    const success = await subscribeToPush(accessToken);
    await checkState();
    return success;
  }

  async function unsubscribe() {
    if (!accessToken) return false;
    setState({ ...state, loading: true });
    
    const success = await unsubscribeFromPush(accessToken);
    await checkState();
    return success;
  }

  async function test() {
    if (!accessToken) return false;
    return sendTestNotification(accessToken);
  }

  return {
    ...state,
    subscribe,
    unsubscribe,
    test,
    refresh: checkState,
  };
}
```

### Step 2: Create UI Component

```tsx
// components/notifications/push-toggle.tsx
'use client';

import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { toast } from 'sonner';

export function PushNotificationToggle() {
  const { supported, permission, subscribed, loading, subscribe, unsubscribe, test } = 
    usePushNotifications();

  if (!supported) {
    return (
      <div className="text-sm text-muted-foreground">
        Push notifications not supported in this browser
      </div>
    );
  }

  async function handleToggle() {
    if (subscribed) {
      const success = await unsubscribe();
      toast.success(success ? 'Notifications disabled' : 'Failed to unsubscribe');
    } else {
      const success = await subscribe();
      if (success) {
        toast.success('Notifications enabled!');
        // Send test notification
        await test();
      } else {
        toast.error('Failed to enable notifications');
      }
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Button
        onClick={handleToggle}
        disabled={loading || permission === 'denied'}
        variant={subscribed ? 'default' : 'outline'}
      >
        {subscribed ? <Bell className="mr-2 h-4 w-4" /> : <BellOff className="mr-2 h-4 w-4" />}
        {subscribed ? 'Disable' : 'Enable'} Notifications
      </Button>

      {subscribed && (
        <Button onClick={test} variant="ghost" size="sm">
          Send Test
        </Button>
      )}

      {permission === 'denied' && (
        <p className="text-sm text-destructive">
          Notifications blocked. Enable in browser settings.
        </p>
      )}
    </div>
  );
}
```

### Step 3: Add to Settings Page

```tsx
// app/dashboard/settings/page.tsx
import { PushNotificationToggle } from '@/components/notifications/push-toggle';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notification Settings</h2>
        <p className="text-muted-foreground">
          Manage how you receive alerts and updates
        </p>
      </div>

      <div className="border rounded-lg p-6">
        <h3 className="font-semibold mb-2">Push Notifications</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Get instant alerts for rate limits, budget thresholds, and errors
        </p>
        <PushNotificationToggle />
      </div>
    </div>
  );
}
```

---

## 📤 Sending Notifications (Backend)

### From Any Service

```typescript
import { NotificationService } from '@/system/module/notification/notification.service';

@Injectable()
export class BudgetService {
  constructor(private notificationService: NotificationService) {}

  async checkBudget(workspaceId: string, currentSpend: number, limit: number) {
    if (currentSpend > limit * 0.9) {
      // Send alert to all workspace members
      await this.notificationService.sendAlert(
        workspaceId,
        'budget',
        {
          title: 'Budget Alert',
          message: `You've used ${Math.round(currentSpend/limit*100)}% of your budget`,
          url: '/dashboard/costs',
        }
      );
    }
  }
}
```

### Send to Specific User

```typescript
await this.notificationService.sendToUser(userId, {
  title: '⚡ Rate Limit Hit',
  body: 'OpenAI API rate limit exceeded. Requests are being throttled.',
  url: '/dashboard/limits',
  tag: 'rate-limit',
});
```

### Send to Workspace Members

```typescript
await this.notificationService.sendToWorkspace(
  workspaceId,
  {
    title: '🔴 Provider Down',
    body: 'OpenAI API is experiencing issues',
    url: '/dashboard/providers',
  },
  {
    // Only notify admins
    roles: [Role.OWNER, Role.ADMIN],
    // Exclude the user who triggered the alert
    excludeUserId: currentUserId,
  }
);
```

---

## 🎯 Use Cases

### 1. Budget Alerts
```typescript
// When budget threshold is hit (50%, 75%, 90%, 100%)
await this.notificationService.sendAlert(workspaceId, 'budget', {
  title: '💰 Budget Alert: 90% Used',
  message: 'You have $10 remaining this month',
  url: '/dashboard/costs',
});
```

### 2. Rate Limit Warnings
```typescript
// When approaching rate limits
await this.notificationService.sendToUser(userId, {
  title: '⚡ Rate Limit Warning',
  body: 'You have 10 requests remaining in the current window',
  url: '/dashboard/limits',
});
```

### 3. Provider Issues
```typescript
// When external API is down
await this.notificationService.sendAlert(workspaceId, 'provider_down', {
  title: '🔴 OpenAI API Down',
  message: 'All requests to OpenAI are failing',
  url: '/dashboard/providers',
});
```

### 4. Error Spikes
```typescript
// When error rate increases
await this.notificationService.sendAlert(workspaceId, 'error', {
  title: '❌ High Error Rate',
  message: '50% of requests failed in the last 5 minutes',
  url: '/dashboard/analytics',
});
```

### 5. Invitation Accepted
```typescript
// When a new member joins
await this.notificationService.sendToUser(ownerId, {
  title: '👋 New Member Joined',
  body: `${newMember.name} joined your workspace`,
  url: `/dashboard/workspaces/${workspaceId}/members`,
});
```

---

## 🧪 Testing

### 1. Test from Frontend
```typescript
import { sendTestNotification } from '@/lib/push-notifications';

// Send test notification
await sendTestNotification(accessToken);
```

### 2. Test from Swagger
```bash
# Go to http://localhost:8080/api/docs
# POST /notifications/test
```

### 3. Test from Code
```typescript
await this.notificationService.sendToUser(userId, {
  title: '🎉 Test Notification',
  body: 'If you see this, push notifications are working!',
  url: '/dashboard',
});
```

---

## 🐛 Troubleshooting

### "VAPID keys not configured"
```bash
# Generate keys
npx web-push generate-vapid-keys

# Add to .env
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
```

### "Notification permission denied"
User must manually enable in browser settings:
- **Chrome:** Settings → Privacy → Site Settings → Notifications
- **Firefox:** Settings → Privacy → Permissions → Notifications
- **Safari:** Preferences → Websites → Notifications

### "Service Worker not registering"
- Make sure `public/sw.js` exists
- Check browser console for errors
- Service workers require HTTPS in production (localhost works)

### Notifications not appearing
```typescript
// Check subscription status
const state = await getPushState();
console.log(state); // { supported, permission, subscribed }
```

---

## 📊 Benefits

| Feature | Benefit |
|---------|---------|
| **FREE** | No cost for unlimited notifications |
| **Works Offline** | Notifications even when browser is closed |
| **Cross-Platform** | Desktop + Mobile (Chrome, Firefox, Safari) |
| **No Third-Party** | Self-hosted, no external dependencies |
| **Instant** | Real-time delivery |
| **Action Buttons** | Users can interact with notifications |

---

## 🎓 Browser Support

| Browser | Desktop | Mobile | iOS |
|---------|---------|--------|-----|
| Chrome | ✅ | ✅ | ❌ |
| Firefox | ✅ | ✅ | ❌ |
| Edge | ✅ | ✅ | ❌ |
| Safari | ✅ (16+) | ❌ | ✅ (16.4+) |
| Opera | ✅ | ✅ | ❌ |

---

**Your notifications are now completely FREE and work great!** 🎉

