'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setErrors({ email: '', password: '' });

    // Validate inputs
    let isValid = true;

    if (!validateEmail(email)) {
      setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }));
      isValid = false;
    }

    if (!password) {
      setErrors((prev) => ({ ...prev, password: 'Password is required' }));
      isValid = false;
    }

    if (!isValid) return;

    try {
      const result = await login(email, password);

      if (result.success) {
        // Redirect to dashboard on successful login
        router.push('/dashboard');
      } else if (result.error) {
        // Handle error
        setErrors((prev) => ({ ...prev, email: result.error || '' }));
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors((prev) => ({ ...prev, email: 'An unexpected error occurred' }));
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

      <Input
        type="password"
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        required
      />

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Logging in...' : 'Log In'}
      </Button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?{' '}
        <Link
          href="/sign-up"
          className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}