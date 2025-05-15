'use client';

import React, { useState } from 'react';
import { useRemindersCount } from '@/contexts/RemindersCountContext';

interface ActionItem {
  task: string;
  assignee: string | null;
  deadline: string | null;
}

interface MeetingResultsProps {
  summary: string;
  actionItems: ActionItem[] | null;
  onDownloadSummary: () => void;
  onDownloadActionItems: () => void;
  show: 'summary' | 'action_items';
}

export function MeetingResults({
  summary,
  actionItems,
  onDownloadSummary,
  onDownloadActionItems,
  show,
}: MeetingResultsProps) {
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [savedIndices, setSavedIndices] = useState<Set<number>>(new Set());
  const [errorIndex, setErrorIndex] = useState<number | null>(null);
  const { fetchCount } = useRemindersCount();

  // Save action item to reminders
  const handleRemindMeLater = async (item: ActionItem, index: number) => {
    setSavingIndex(index);
    setErrorIndex(null);
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action_item: JSON.stringify(item),
        }),
      });
      if (res.ok) {
        setSavedIndices(prev => new Set(prev).add(index));
        await fetchCount();
      } else {
        setErrorIndex(index);
      }
    } catch {
      setErrorIndex(index);
    } finally {
      setSavingIndex(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200/80 hover:shadow-xl transition-all duration-300">
      {show === 'summary' && summary && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Meeting Summary</h2>
            <button
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              onClick={onDownloadSummary}
            >
              <svg
                className="w-4 h-4 mr-1"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download
            </button>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg border border-blue-100">
            {summary.split('\n').map((paragraph, i) => {
              // Bold headings if line ends with ":"
              if (
                paragraph.trim().endsWith(':') &&
                paragraph.trim().length < 40 // likely a heading
              ) {
                return (
                  <p key={i} className="font-bold text-blue-900 mt-4 mb-2 text-base">
                    {paragraph}
                  </p>
                );
              }
              // Bulleted lines
              if (paragraph.trim().startsWith('-')) {
                return (
                  <p key={i} className="ml-4 text-gray-700 mb-1">
                    <span className="text-blue-500 font-bold mr-2">•</span>
                    {paragraph.trim().substring(1).trim()}
                  </p>
                );
              }
              // Regular paragraph
              return (
                <p key={i} className="mb-2 text-gray-800">
                  {paragraph}
                </p>
              );
            })}
          </div>
        </div>
      )}

      {show === 'action_items' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Action Items</h2>
            <button
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              onClick={onDownloadActionItems}
              disabled={!actionItems || actionItems.length === 0}
            >
              <svg
                className="w-4 h-4 mr-1"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download
            </button>
          </div>
          <div className="space-y-3">
            {actionItems === null ? (
              <p className="text-gray-500 italic">Click "Generate Action Items" to extract tasks from this transcript.</p>
            ) : actionItems.length === 0 ? (
              <p className="text-gray-500 italic">No action items found in this transcript.</p>
            ) : (
              actionItems.map((item, index) => (
                <div
                  key={index}
                  className="bg-blue-50 p-4 rounded-md border-l-4 border-blue-500"
                >
                  <p className="font-medium">{item.task}</p>
                  {item.assignee && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Assignee:</span> {item.assignee}
                    </p>
                  )}
                  {item.deadline && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Deadline:</span> {item.deadline}
                    </p>
                  )}
                  <button
                    className="mt-3 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    onClick={() => handleRemindMeLater(item, index)}
                    disabled={savingIndex === index || savedIndices.has(index)}
                  >
                    {savingIndex === index
                      ? 'Saving...'
                      : savedIndices.has(index)
                      ? 'Saved!'
                      : errorIndex === index
                      ? 'Error!'
                      : '+ To-Do'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}