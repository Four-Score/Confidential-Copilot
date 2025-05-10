import React from 'react';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* This layout will contain persistent elements like headers */}
      <div className="flex-grow overflow-hidden">
        {children}
      </div>
    </div>
  );
}