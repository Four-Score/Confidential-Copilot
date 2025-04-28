import { SignUpForm } from '@/components/auth/SignUpForm';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-navy to-blue-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-xl">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-800">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Join us to secure your AI interactions
          </p>
        </div>

        <SignUpForm />
      </div>
    </div>
  );
}