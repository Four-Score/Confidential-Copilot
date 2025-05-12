'use client';

import React, { useState } from 'react';

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
}

export function MeetingResults({
  summary,
  actionItems,
  onDownloadSummary,
  onDownloadActionItems,
}: MeetingResultsProps) {
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [successIndex, setSuccessIndex] = useState<number | null>(null);
  const [errorIndex, setErrorIndex] = useState<number | null>(null);

  // Save action item to reminders
  const handleRemindMeLater = async (item: ActionItem, index: number) => {
    setSavingIndex(index);
    setSuccessIndex(null);
    setErrorIndex(null);
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action_item: JSON.stringify(item), // Save as string, or customize as needed
        }),
      });
      if (res.ok) {
        setSuccessIndex(index);
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
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Summary */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Meeting Summary</h2>
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
          <div className="bg-gray-50 p-4 rounded-md prose max-w-none">
            {summary.split('\n').map((paragraph, i) => (
              <p key={i} className="mb-2">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Action Items */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Action Items</h2>
            <button
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              onClick={onDownloadActionItems}
              disabled={!actionItems || actionItems.length === 0}
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
                    disabled={savingIndex === index}
                  >
                    {savingIndex === index
                      ? 'Saving...'
                      : successIndex === index
                      ? 'Saved!'
                      : errorIndex === index
                      ? 'Error!'
                      : 'Remind Me Later'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}