import { useEffect, useState } from 'react';

export function useUnreadRemindersCount(open: boolean) {
  const [count, setCount] = useState<number>(0);

  const fetchCount = async () => {
    try {
      const res = await fetch('/api/reminders/count', { credentials: 'include' });
      const data = await res.json();
      setCount(data.count || 0);
    } catch {
      setCount(0);
    }
  };

  useEffect(() => {
    if (open) fetchCount();
  }, [open]);

  return { count, fetchCount, setCount };
}