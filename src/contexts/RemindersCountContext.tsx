"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface RemindersCountContextType {
  count: number;
  setCount: (count: number) => void;
  fetchCount: () => Promise<void>;
  decrement: (by?: number) => void;
}

const RemindersCountContext = createContext<RemindersCountContextType | undefined>(undefined);

export const RemindersCountProvider = ({ children }: { children: ReactNode }) => {
  const [count, setCount] = useState(0);

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
    fetchCount();
  }, []);

  const decrement = (by = 1) => setCount((c) => Math.max(0, c - by));

  return (
    <RemindersCountContext.Provider value={{ count, setCount, fetchCount, decrement }}>
      {children}
    </RemindersCountContext.Provider>
  );
};

export const useRemindersCount = () => {
  const ctx = useContext(RemindersCountContext);
  if (!ctx) throw new Error('useRemindersCount must be used within RemindersCountProvider');
  return ctx;
};