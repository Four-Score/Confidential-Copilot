import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-navy to-blue-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-xl">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-800">
            Log in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Access your secure AI workspace
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}