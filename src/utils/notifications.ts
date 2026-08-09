let swRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.permission;
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return Promise.resolve('denied');
  return Notification.requestPermission();
}

export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!notificationsSupported() || !('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }
  if (!swRegistrationPromise) {
    swRegistrationPromise = navigator.serviceWorker
      .register('/sw.js')
      .catch(() => null);
  }
  return swRegistrationPromise;
}

export async function sendNotification(title: string, body?: string) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;

  try {
    await registerServiceWorker();
  } catch {
    // ignore
  }

  const options: NotificationOptions = {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
  };

  try {
    const swRegistration = await navigator.serviceWorker?.getRegistration?.();
    if (swRegistration?.showNotification) {
      await swRegistration.showNotification(title, options);
      return;
    }
  } catch {
    // fall through
  }

  try {
    const notification = new Notification(title, options);
    if (navigator.vibrate) navigator.vibrate(200);
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // ignore
  }
}