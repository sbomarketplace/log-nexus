import * as React from "react";
import { Bell, BellRing } from "lucide-react";

const LS_KEY = "cc_notifications_settings_v1";
type NotifSettings = {
  enabled: boolean;
  dailyReminderTime?: string | null; // "09:00"
  lowStorageWarnings?: boolean;
  exportComplete?: boolean;
};

function load(): NotifSettings {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : { enabled: false, dailyReminderTime: null, lowStorageWarnings: true, exportComplete: true };
  } catch {
    return { enabled: false, dailyReminderTime: null, lowStorageWarnings: true, exportComplete: true };
  }
}
function save(s: NotifSettings) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {}
}

export default function NotificationsCard() {
  const [settings, setSettings] = React.useState<NotifSettings>(load());
  const [permission, setPermission] = React.useState<NotificationPermission>(Notification.permission);

  React.useEffect(() => save(settings), [settings]);

  async function enableNotifications() {
    const { requestNotifPermission } = await import('@/lib/notify');
    const granted = await requestNotifPermission();
    setPermission(granted ? 'granted' : 'denied');
    setSettings((s) => ({ ...s, enabled: granted }));
  }

  async function testNotification() {
    if (permission !== "granted") return alert("Please enable notifications first.");
    const { sendTestNotification } = await import('@/lib/notify');
    await sendTestNotification();
  }

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Bell className="h-5 w-5 text-gray-600" />
        <p className="font-semibold">Notifications</p>
      </div>

      <div className="space-y-4">
        {/* Enable / status */}
        <div className="rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-800">Browser notifications</p>
              <p className="text-xs text-gray-500">
                Status: <span className="font-medium">{permission}</span>
              </p>
            </div>
            {settings.enabled && permission === "granted" ? (
              <button
                onClick={() => setSettings((s) => ({ ...s, enabled: false }))}
                className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Disable
              </button>
            ) : (
              <button
                onClick={enableNotifications}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm text-white hover:opacity-90"
              >
                <BellRing className="h-4 w-4" />
                Enable
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={testNotification} className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">
              Send test
            </button>
          </div>
        </div>

        {/* Daily reminder (local only) */}
        <div className="rounded-xl border p-4">
          <p className="text-sm font-medium">Daily reminder</p>
          <p className="text-xs text-gray-500">We'll remind you to log incidents at this time (fires only while the app is open).</p>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="time"
              value={settings.dailyReminderTime || ""}
              onChange={(e) => setSettings((s) => ({ ...s, dailyReminderTime: e.target.value || null }))}
              className="rounded-xl border px-3 py-2"
            />
            <button
              onClick={() => setSettings((s) => ({ ...s, dailyReminderTime: null }))}
              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Other toggles (future hooks) */}
        <div className="rounded-xl border p-4">
          <p className="text-sm font-medium">Other alerts</p>
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.lowStorageWarnings ?? true}
                onChange={(e) => setSettings((s) => ({ ...s, lowStorageWarnings: e.target.checked }))}
              />
              Low storage warnings
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.exportComplete ?? true}
                onChange={(e) => setSettings((s) => ({ ...s, exportComplete: e.target.checked }))}
              />
              Show "export complete" notification
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
