/**
 * ── CAPACITOR LOCAL NOTIFICATIONS (FOCUS SESSION) ───────────────────────────
 * Manages native Android background notifications during a Focus ride.
 * - Ongoing notification while running.
 * - End notification scheduled at exact endsAt timestamp.
 * - Asked only once at first start; non-blocking fallback if denied.
 */

const ONGOING_NOTIF_ID = 9001;
const END_NOTIF_ID = 9002;

let permissionRequested = false;

export async function requestNotificationPermissionOnce(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (permissionRequested) return true;
  permissionRequested = true;

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') return true;
    if (status.display === 'prompt' || status.display === 'prompt-with-rationale') {
      const req = await LocalNotifications.requestPermissions();
      return req.display === 'granted';
    }
  } catch (err) {
    // Non-native / Web fallback
  }
  return false;
}

export async function scheduleFocusNotifications(params: {
  title: string;
  body: string;
  endsAtMs: number;
}): Promise<void> {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const granted = await requestNotificationPermissionOnce();
    if (!granted) return;

    // Clear previous
    await LocalNotifications.cancel({ notifications: [{ id: ONGOING_NOTIF_ID }, { id: END_NOTIF_ID }] }).catch(() => {});

    // Schedule End Notification at exact endsAtMs
    const scheduleDate = new Date(params.endsAtMs);
    if (scheduleDate.getTime() > Date.now()) {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: END_NOTIF_ID,
            title: '🏁 Focus Ride Complete!',
            body: 'Session target achieved. Rider coach invites you to log your ride in the garage.',
            schedule: { at: scheduleDate },
            sound: 'beep.wav',
            smallIcon: 'ic_stat_aspirantx',
            actionTypeId: 'OPEN_APP'
          }
        ]
      });
    }
  } catch (err) {
    // Silent fail if web or plugin not registered
  }
}

export async function clearFocusNotifications(): Promise<void> {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: [{ id: ONGOING_NOTIF_ID }, { id: END_NOTIF_ID }] });
  } catch (_) {}
}
