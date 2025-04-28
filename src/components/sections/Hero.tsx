import { Button } from '../ui/Button';
import Link from 'next/link';

export function Hero() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary-navy to-blue-900 text-white px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
          Secure AI for Your Confidential Data
        </h1>
        <p className="text-lg sm:text-xl text-gray-300 mb-8">
          Leverage the power of AI while keeping your data completely private and secure.
          Zero-trust architecture ensures your information never leaves your control.
        </p>
        <Link href="/sign-up">
          <Button size="lg" className="animate-pulse">
            Get Started
          </Button>
        </Link>
      </div>
    </div>
  );
}