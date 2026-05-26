import { useCallback, useEffect, useRef, useState } from 'react';
import { api, Reminder } from '../lib/api';

const POLL_INTERVAL = 30 * 1000; // 30 seconds

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDue = useCallback(async () => {
    try {
      const due = await api.reminders.due();
      setReminders(due);
    } catch {
      // silently fail — reminder polling shouldn't break the app
    }
  }, []);

  useEffect(() => {
    fetchDue();

    intervalRef.current = setInterval(fetchDue, POLL_INTERVAL);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchDue();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchDue]);

  const dismiss = useCallback(async (id: string) => {
    await api.reminders.dismiss(id);
    setReminders(prev => prev.filter(r => r.id !== id));
  }, []);

  const snooze = useCallback(async (id: string, until: number) => {
    await api.reminders.snooze(id, until);
    setReminders(prev => prev.filter(r => r.id !== id));
  }, []);

  return { reminders, dismiss, snooze };
}
