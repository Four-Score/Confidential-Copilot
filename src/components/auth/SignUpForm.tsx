'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PasswordRequirements } from './PasswordRequirements';
import { useAuthStore } from '@/store/authStore';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const router = useRouter();
  const { signup, isLoading } = useAuthStore();

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

  const handleSubmit = async (e: React.FormEvent) => {
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

    try {
      const result = await signup(email, password);
      
      if (result.success && result.keyMaterial) {
        // Handle successful signup - you might want to store the keyMaterial
        // and redirect to a confirmation page or dashboard
        router.push('/dashboard');
      } else if (result.error) {
        // Handle error - you might want to show it in the UI
        setErrors(prev => ({ ...prev, email: result.error || '' }));
      }
    } catch (error) {
      console.error('Signup error:', error);
      setErrors(prev => ({ ...prev, email: 'An unexpected error occurred' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        disabled={isLoading}
      >
        {isLoading ? 'Signing up...' : 'Sign Up'}
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
}