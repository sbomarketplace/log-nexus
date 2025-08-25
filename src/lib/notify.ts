import { LocalNotifications } from '@capacitor/local-notifications';
import { isNative } from './platform';

export async function requestNotifPermission(): Promise<boolean> {
  if (isNative) {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted';
  }
  if (!('Notification' in window)) return false;
  const res = await Notification.requestPermission();
  return res === 'granted';
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

export async function sendTestNotification(){
  if (isNative) {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.schedule({ notifications: [{ id: Date.now(), title: 'ClearCase', body: 'Test notification', schedule: { at: new Date(Date.now()+500) } }] });
    return;
  }
  if (Notification.permission === 'granted') new Notification('ClearCase — test', { body: 'This is a test.' });
}