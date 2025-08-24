import { LocalNotifications } from '@capacitor/local-notifications';
import { isNative } from './platform';

export async function requestPermissions(): Promise<boolean> {
  if (isNative) {
    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch {
      return false;
    }
  } else {
    // Web fallback
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
}

export async function scheduleDailyReminder(time: string): Promise<void> {
  if (isNative) {
    try {
      // Cancel existing reminders
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
      
      // Parse time (HH:MM format)
      const [hours, minutes] = time.split(':').map(Number);
      const now = new Date();
      const scheduled = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
      
      // If time has passed today, schedule for tomorrow
      if (scheduled < now) {
        scheduled.setDate(scheduled.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [{
          id: 1,
          title: 'ClearCase Reminder',
          body: 'Don\'t forget to review your incident notes',
          schedule: {
            at: scheduled,
            repeats: true,
            every: 'day'
          }
        }]
      });
    } catch (error) {
      console.warn('Failed to schedule notification:', error);
    }
  } else {
    // Web fallback - basic notification (limited scheduling)
    if (Notification.permission === 'granted') {
      new Notification('ClearCase Reminder', {
        body: 'Don\'t forget to review your incident notes',
        icon: '/icon-192.png'
      });
    }
  }
}

export async function testNotification(): Promise<void> {
  if (isNative) {
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: 999,
          title: 'Test Notification',
          body: 'This is a test notification from ClearCase',
          schedule: {
            at: new Date(Date.now() + 2000) // 2 seconds from now
          }
        }]
      });
    } catch (error) {
      console.warn('Failed to send test notification:', error);
    }
  } else {
    if (Notification.permission === 'granted') {
      new Notification('Test Notification', {
        body: 'This is a test notification from ClearCase',
        icon: '/icon-192.png'
      });
    }
  }
}