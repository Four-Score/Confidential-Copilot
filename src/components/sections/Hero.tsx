import { Button } from '../ui/Button';
import Link from 'next/link';
import Image from 'next/image';

export function Hero() {
  return (
    <div className="relative min-h-screen flex flex-col justify-center bg-gradient-to-b from-primary-navy to-blue-900 text-white px-6 overflow-hidden">
      {/* Abstract shapes in background - slightly reduced opacity for more minimalistic look */}
      <div className="absolute inset-0 overflow-hidden opacity-15">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-purple-400 rounded-full filter blur-3xl animate-pulse-slower"></div>
        <div className="absolute -bottom-32 left-1/4 w-96 h-96 bg-cyan-400 rounded-full filter blur-3xl animate-pulse-slow"></div>
      </div>
      
      <div className="max-w-7xl mx-auto w-full z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-16 md:py-28">
        <div className="flex flex-col space-y-12 text-center lg:text-left">
          <div className="space-y-6">            {/* Badge with improved spacing and darker background for better visibility */}
            <div className="mb-5">
              <span className="text-xs sm:text-sm uppercase tracking-wider text-white/90 font-medium px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/10">
                Security by Design • Zero-Trust Architecture
              </span>
            </div>
            
            {/* Headline with improved typography and spacing */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-bold leading-tight md:leading-tight tracking-tight">
              Secure Gen AI for Your <br className="hidden sm:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-blue-500 drop-shadow-sm">
                Confidential Data
              </span>
            </h1>
            
            {/* Subheading with improved readability */}
            <p className="text-base sm:text-lg text-gray-200/90 max-w-xl mx-auto lg:mx-0">
              Leverage the power of AI while keeping your data completely private and secure.
              Your information never leaves your control.
            </p>
          </div>          {/* Call to action buttons with more modern styling and full width */}
          <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start w-full max-w-xl mx-auto lg:mx-0">
            <Link href="/sign-up" className="w-full sm:w-1/2">
              <Button size="lg" className="w-full px-7 py-4 text-base font-medium shadow-lg shadow-blue-900/20 rounded-lg">
                Get Started
              </Button>
            </Link>
            <Link href="#features" className="w-full sm:w-1/2">
              <Button size="lg" variant="outline" className="w-full px-7 py-4 text-base font-medium bg-white/10 hover:bg-white/20 border-0 rounded-lg backdrop-blur-sm">
                Learn More
              </Button>
            </Link>
          </div>

          {/* Features section with improved layout */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-4 text-sm sm:text-base">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-500/20 p-1.5 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-300"><path d="M20 6 9 17l-5-5"></path></svg>
              </div>
              <span className="text-white/90 font-light">Client-side Encryption</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-500/20 p-1.5 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-300"><path d="M20 6 9 17l-5-5"></path></svg>
              </div>
              <span className="text-white/90 font-light">Zero Knowledge Architecture</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-500/20 p-1.5 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-300"><path d="M20 6 9 17l-5-5"></path></svg>
              </div>
              <span className="text-white/90 font-light">Searchable Encryption</span>
            </div>
          </div>
        </div>
        
        {/* Right side visualization with enhanced styling */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-600/15 blur-3xl rounded-full animate-pulse-slow"></div>
          <div className="relative bg-gradient-to-r from-blue-900/40 to-blue-800/40 backdrop-blur-sm border border-white/10 rounded-2xl p-3 shadow-2xl w-full max-w-md mx-auto">
            <div className="aspect-[4/3] relative rounded-xl overflow-hidden bg-gray-900/90">
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-2/5 h-2/5 text-blue-400/30" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3">
                <div className="flex space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                </div>
                <div className="h-3 w-20 bg-gray-800 rounded-full"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="h-3 w-2/3 bg-blue-500/20 rounded-full mb-3"></div>
                <div className="h-3 w-3/4 bg-blue-500/15 rounded-full mb-3"></div>
                <div className="h-3 w-1/2 bg-blue-500/10 rounded-full"></div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 px-2 pb-2">
              <div className="h-7 bg-gray-800/60 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <div className="w-4 h-4 rounded-full bg-blue-500/20"></div>
              </div>
              <div className="h-7 bg-gray-800/60 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <div className="w-4 h-4 rounded-full bg-purple-500/20"></div>
              </div>
              <div className="h-7 bg-gray-800/60 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <div className="w-4 h-4 rounded-full bg-cyan-500/20"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}