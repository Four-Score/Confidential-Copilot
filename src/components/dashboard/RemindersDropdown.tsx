import React, { useEffect, useRef, useState } from 'react';

interface Reminder {
  id: string;
  action_item: any;
  created_at?: string;
}

interface RemindersDropdownProps {
  open: boolean;
  onClose: () => void;
}

export const RemindersDropdown: React.FC<RemindersDropdownProps> = ({ open, onClose }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded shadow-lg z-50"
    >
      <div className="p-3 border-b font-semibold text-gray-700">Reminders</div>
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : reminders.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No reminders found.</div>
        ) : (
          reminders.map((reminder, idx) => {
            const action = parseActionItem(reminder.action_item);
            return (
              <div key={reminder.id || idx} className="p-3 border-b last:border-b-0">
                <div className="font-medium">{action.task || 'Untitled Task'}</div>
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
            );
          })
        )}
      </div>
    </div>
  );
};