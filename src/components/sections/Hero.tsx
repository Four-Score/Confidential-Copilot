import { Button } from '../ui/Button';
import Link from 'next/link';
import Image from 'next/image';

export function Hero() {
  return (
    <div className="relative min-h-screen flex flex-col justify-center bg-gradient-to-b from-primary-navy to-blue-900 text-white px-4 overflow-hidden">
      {/* Abstract shapes in background */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl"></div>
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-purple-400 rounded-full filter blur-3xl"></div>
        <div className="absolute -bottom-32 left-1/4 w-96 h-96 bg-cyan-400 rounded-full filter blur-3xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto w-full z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-12">        <div className="flex flex-col space-y-8 text-center lg:text-left px-4">          <div>            <h2 className="text-sm sm:text-base uppercase tracking-widest text-white font-semibold mb-2 drop-shadow-sm bg-blue-900/50 inline-block px-3 py-1 rounded-full">
              Security by Design • Zero-Trust Architecture</h2><h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tighter mb-4">
              Secure Gen AI for Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-700 drop-shadow-md">Confidential Data</span>
            </h1><p className="text-lg sm:text-xl text-gray-100 max-w-2xl mx-auto lg:mx-0 text-shadow">
              Leverage the power of AI while keeping your data completely private and secure.
              Zero-trust architecture ensures your information never leaves your control.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link href="/sign-up">
              <Button size="lg" className="px-8 py-6 text-lg font-medium shadow-lg shadow-blue-900/20">
                Get Started
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg font-medium bg-white/10 hover:bg-white/20 border-0">
                Learn More
              </Button>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="bg-green-500 rounded-full w-3 h-3"></div>
              <span>Client-side Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-green-500 rounded-full w-3 h-3"></div>
              <span>Zero Knowledge Architecture</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-green-500 rounded-full w-3 h-3"></div>
              <span>Searchable Encryption</span>
            </div>
          </div>
        </div>
        
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-600/20 blur-3xl rounded-full"></div>
          <div className="relative bg-gradient-to-r from-blue-900/50 to-blue-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-2 shadow-2xl w-full max-w-md mx-auto">
            <div className="aspect-[4/3] relative rounded-lg overflow-hidden bg-gray-900">
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-1/2 h-1/2 text-blue-400/30" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3">
                <div className="flex space-x-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="h-4 w-24 bg-gray-800 rounded"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="h-4 w-2/3 bg-blue-500/30 rounded mb-2"></div>
                <div className="h-4 w-3/4 bg-blue-500/20 rounded mb-2"></div>
                <div className="h-4 w-1/2 bg-blue-500/10 rounded"></div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 px-2 pb-2">
              <div className="h-8 bg-gray-800/80 rounded flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-blue-500/30"></div>
              </div>
              <div className="h-8 bg-gray-800/80 rounded flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-purple-500/30"></div>
              </div>
              <div className="h-8 bg-gray-800/80 rounded flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-cyan-500/30"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}