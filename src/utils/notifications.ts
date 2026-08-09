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

export function sendNotification(title: string, body?: string) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body });
  } catch {
    // ignore
  }
}