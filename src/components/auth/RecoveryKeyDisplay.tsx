'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { RecoveryKeyDisplayProps } from '@/types/auth';

export function RecoveryKeyDisplay({
  recoveryKeyString,
  isChecked,
  onCheckChange,
  onContinue,
  onGoBack,
  isLoading
}: RecoveryKeyDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(recoveryKeyString);
      setCopied(true);
      
      // Reset the "Copied" state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-6">
        <div>
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full">
            <svg 
              className="w-6 h-6 text-yellow-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              ></path>
            </svg>
          </div>
          <h3 className="mt-3 text-lg font-medium text-gray-900 text-center">
            Save your recovery key
          </h3>
          <p className="mt-2 text-sm text-gray-500 text-center">
            This is the <span className="font-bold">only way</span> to recover your account if you forget your password.
            Store it in a secure password manager or other secure location.
          </p>
        </div>

        <div className="relative">
          <div className="p-4 bg-gray-100 rounded border border-gray-300">
            <p className="font-mono text-sm break-all select-all text-black">
              {recoveryKeyString}
            </p>
          </div>
          <Button 
            className="mt-2 w-full flex items-center justify-center"
            variant="outline"
            onClick={handleCopyToClipboard}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path>
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path>
                </svg>
                Copy to clipboard
              </>
            )}
          </Button>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Important:</strong> If you lose this recovery key and forget your password, your account cannot be recovered.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="save-key-confirmation"
              name="save-key-confirmation"
              type="checkbox"
              checked={isChecked}
              onChange={(e) => onCheckChange(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3">
            <label htmlFor="save-key-confirmation" className="text-sm text-gray-700">
              I have saved my recovery key in a secure location
            </label>
          </div>
        </div>

        <div className="space-y-2">
        <Button
            onClick={onContinue}
            className="w-full"
            disabled={!isChecked}
            isLoading={isLoading}
            >
            Continue
            </Button>

            <Button
            type="button"
            variant="outline"
            onClick={onGoBack}
            className="w-full"
            disabled={isLoading}
            >
            Start Over
        </Button>
        </div>
      </div>
    </div>
  );
}