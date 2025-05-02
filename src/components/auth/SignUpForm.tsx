'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PasswordRequirements } from './PasswordRequirements';
import { useAuthStore } from '@/store/authStore';
import { KeyMaterial, SignUpStep } from '@/types/auth';
import { RecoveryKeyDisplay } from './RecoveryKeyDisplay';
import { getCookie } from 'cookies-next';

// Define a type for the key material including the generated key
type KeyMaterialWithGeneratedKey = KeyMaterial & { generatedSymmetricKey: CryptoKey };

export function SignUpForm() {
  const [currentStep, setCurrentStep] = useState<SignUpStep>(SignUpStep.CREDENTIALS);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  // Update the type of keyMaterial state
  const [keyMaterial, setKeyMaterial] = useState<KeyMaterialWithGeneratedKey | null>(null);
  const [hasSavedRecoveryKey, setHasSavedRecoveryKey] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const router = useRouter();
  const { signup, storeGeneratedKeys, isLoading, error } = useAuthStore();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumber &&
      hasSpecialChar
    );
  };

  const getErrorMessage = (error: unknown): string => {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    
    // Check for specific network errors
    if (!navigator.onLine) {
      return 'You appear to be offline. Please check your internet connection.';
    }
    
    return 'An unexpected error occurred. Please try again.';
  };

  const handleSubmitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({ email: '', password: '' });
    
    // Validate inputs
    let isValid = true;
    
    if (!validateEmail(email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      isValid = false;
    }
    
    if (!validatePassword(password)) {
      setErrors(prev => ({ ...prev, password: 'Password does not meet requirements' }));
      isValid = false;
    }

    if (!isValid) return;

    setIsTransitioning(true);

    try {
      const result = await signup(email, password);
      
      if (result.success && result.keyMaterial) {
        // Store the key material (including the generated key) and move to the recovery key step
        setKeyMaterial(result.keyMaterial as KeyMaterialWithGeneratedKey); // Cast to the updated type
        setCurrentStep(SignUpStep.RECOVERY_KEY);
      } else if (result.error) {
        setErrors(prev => ({ ...prev, email: result.error || '' }));
      }
    } catch (error) {
      console.error('Signup error:', error);
      setErrors(prev => ({ ...prev, email: getErrorMessage(error) }));
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleConfirmRecoveryKey = async () => {
    if (!keyMaterial || !keyMaterial.generatedSymmetricKey) { // Check for generated key too
      setErrors(prev => ({ ...prev, email: 'Missing key material or generated key. Please try again.' }));
      setCurrentStep(SignUpStep.CREDENTIALS);
      return;
    }

    if (!useAuthStore.getState().user) {
      setErrors(prev => ({ ...prev, email: 'User not authenticated. Please try again.' }));
      setCurrentStep(SignUpStep.CREDENTIALS);
      return;
    }

    setIsTransitioning(true);

    try {
      // Pass the keyMaterial AND the generatedSymmetricKey to storeGeneratedKeys
      const result = await storeGeneratedKeys(keyMaterial, keyMaterial.generatedSymmetricKey);
      
      if (result.success) {
        setCurrentStep(SignUpStep.SUCCESS);
        // Wait a moment before redirecting to dashboard
        setTimeout(() => router.push('/dashboard'), 2000);
      } else if (result.error) {
        setErrors(prev => ({ ...prev, email: result.error || '' }));
        // Go back to credentials step if key storage fails
        setCurrentStep(SignUpStep.CREDENTIALS);
      }
    } catch (error) {
      console.error('Key storage error:', error);
      setErrors(prev => ({ ...prev, email: getErrorMessage(error) }));
      setCurrentStep(SignUpStep.CREDENTIALS);
    } finally {
      setIsTransitioning(false);
    }
  };

  // Render different content based on the current step
  const renderStepContent = () => {
    switch (currentStep) {
      case SignUpStep.CREDENTIALS:
        return (
          <form onSubmit={handleSubmitCredentials} className="space-y-6">
            <Input
              type="email"
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
            />

            <div>
              <Input
                type="password"
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                required
              />
              <PasswordRequirements password={password} />
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading} // Use isLoading prop instead of conditional text
              disabled={isLoading || isTransitioning}
            >
              Sign Up
            </Button>

            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link 
                href="/log-in" 
                className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Sign in
              </Link>
            </p>
          </form>
        );
      
      case SignUpStep.RECOVERY_KEY:
        return (
          <RecoveryKeyDisplay
            recoveryKeyString={keyMaterial?.recoveryKeyString || ''}
            isChecked={hasSavedRecoveryKey}
            onCheckChange={setHasSavedRecoveryKey}
            onContinue={handleConfirmRecoveryKey}
            onGoBack={() => setCurrentStep(SignUpStep.CREDENTIALS)}
            isLoading={isLoading}
          />
        );
      
      case SignUpStep.SUCCESS:
        return (
          <div className="text-center space-y-4">
            <div className="text-green-500 text-6xl">✓</div>
            <h3 className="text-xl font-medium text-gray-900">Account created successfully!</h3>
            <p className="text-gray-500">Redirecting to your dashboard...</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Common error display */}
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {renderStepContent()}
    </div>
  );
}