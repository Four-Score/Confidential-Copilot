'use client';

import ConnectExtensionButton from '@/components/extension/ConnectExtensionButton';

export default function EmailSummarizerPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Email Summarizer</h1>
        <ConnectExtensionButton />
      </div>

      <div className="relative bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl shadow-sm p-6">
        <div className="flex items-start space-x-4">
          <div className="text-3xl">✉️</div>
          <div>
            <h2 className="text-lg font-semibold text-green-900 mb-1">
              Use <span className="text-green-700">Email Mode</span> to summarize your inbox
            </h2>
            <p className="text-sm text-gray-700">
              Connect your extension to start summarizing emails directly into Confidential Copilot.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
