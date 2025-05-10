'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useAuthStore } from '@/store/authStore';

interface PasswordPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PasswordPromptModal: React.FC<PasswordPromptModalProps> = ({ isOpen, onClose }) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recoverWithPassword = useAuthStore(state => state.recoverWithPassword);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await recoverWithPassword(password);
      if (result.success) {
        setPassword('');
        onClose();
      } else {
        setError(result.error || 'Failed to recover keys with password');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error during key recovery:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Enter Your Password"
      allowClickOutside={false}
      width="sm"
    >
      <div className="p-6">
        <p className="mb-4 text-gray-700">
          Your encryption keys need to be unlocked to continue.
          Please enter your password to access your encrypted data.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              required
              disabled={isLoading}
              autoFocus
            />
          </div>
          
          {error && (
            <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              disabled={isLoading || !password}
            >
              {isLoading ? 'Unlocking...' : 'Unlock'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};