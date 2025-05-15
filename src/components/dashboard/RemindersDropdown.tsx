import React, { useEffect, useRef, useState } from 'react';
import { useRemindersCount } from '@/contexts/RemindersCountContext';

interface Reminder {
  id: string;
  action_item: any;
  created_at?: string;
  read?: boolean;
}

interface RemindersDropdownProps {
  open: boolean;
  onClose: () => void;
}

export const RemindersDropdown: React.FC<RemindersDropdownProps> = ({ open, onClose }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { decrement, fetchCount } = useRemindersCount();

  useEffect(() => {
    if (open) {
      fetchReminders();
    }
    // eslint-disable-next-line
  }, [open]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reminders', { method: 'GET', credentials: 'include' });
      const data = await res.json();
      setReminders(data.reminders || []);
    } catch {
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    // Optimistically update UI
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, read: true } : r))
    );
    decrement();
    await fetch(`/api/reminders/mark?id=${id}`, { method: 'POST', credentials: 'include' });
    // Optionally re-fetch count for consistency: await fetchCount();
  };

  const deleteReminder = async (id: string) => {
    // Optimistically update UI
    const wasUnread = reminders.find((r) => r.id === id && !r.read);
    setReminders((prev) => prev.filter((r) => r.id !== id));
    if (wasUnread) decrement();
    await fetch(`/api/reminders/${id}/delete`, { method: 'DELETE', credentials: 'include' });
    // Optionally re-fetch count for consistency: await fetchCount();
  };

  // Helper to parse action_item if it's a string
  const parseActionItem = (item: any) => {
    if (!item) return {};
    if (typeof item === 'string') {
      try {
        return JSON.parse(item);
      } catch {
        return { task: item };
      }
    }
    return item;
  };

  if (!open) return null;

  return (
    <div
      ref={dropdownRef}
      className={`
        absolute sm:right-0 
        mt-6
        w-full sm:w-80 max-w-xs sm:max-w-sm
        min-w-[200px]
        bg-white border border-gray-200 rounded shadow-lg z-50
        sm:p-0 p-1
        transition-all
      `}
      style={{
        // On mobile, make it fixed at the top for better UX
        position: window.innerWidth < 640 ? 'fixed' : 'absolute',
        top: window.innerWidth < 640 ? 70 : undefined,
        left: window.innerWidth < 640 ? 8 : undefined,
        right: window.innerWidth < 640 ? 8 : undefined,
        marginTop: window.innerWidth < 640 ? 0 : undefined,
      }}
    >
      {/* Close (cross) button at the top-right corner */}
      <button
        className="absolute top-2 right-2 text-gray-400 hover:text-red-600 text-2xl font-bold focus:outline-none"
        aria-label="Close reminders"
        onClick={onClose}
        type="button"
      >
        &times;
      </button>
      <div className="p-3 border-b font-semibold text-gray-700">To-Do List</div>
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : reminders.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No reminders found.</div>
        ) : (
          reminders.map((reminder, idx) => {
            const action = parseActionItem(reminder.action_item);
            return (
              <div
                key={reminder.id || idx}
                className="bg-white rounded-lg shadow p-4 mb-3 flex justify-between items-center border border-gray-100"
              >
                <div>
                  <div className="font-medium text-gray-800">{action.task || 'Untitled Task'}</div>
                  {action.assignee && (
                    <div className="text-xs text-gray-500">Assignee: {action.assignee}</div>
                  )}
                  {action.deadline && (
                    <div className="text-xs text-gray-500">Deadline: {action.deadline}</div>
                  )}
                  {reminder.created_at && (
                    <div className="text-xs text-gray-400 mt-1">
                      Added: {new Date(reminder.created_at).toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!reminder.read && (
                    <button
                      className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      onClick={() => markAsRead(reminder.id)}
                    >
                      Mark as read
                    </button>
                  )}
                  <button
                    className="ml-2 text-gray-400 hover:text-red-600 text-lg"
                    title="Delete reminder"
                    onClick={() => deleteReminder(reminder.id)}
                  >
                    &times;
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};