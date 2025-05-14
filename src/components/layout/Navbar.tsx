"use client";
import Link from 'next/link';
import { Button } from '../ui/Button';
import { useState } from 'react';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md shadow-md shadow-black/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-8 rounded-md bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <span className="text-xl font-bold text-white">CC</span>
            </div>
            <span className="text-xl font-bold text-blue-900 hidden sm:block">Confidential Copilot</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Features
            </Link>
            <Link href="#security" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Security
            </Link>
            <Link href="#about" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              About
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/log-in">
              <Button variant="outline" size="sm" className="px-5 font-medium">Log In</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="px-5 font-medium">Sign Up</Button>
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="md:hidden flex items-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
          >
            <span className="sr-only">Open main menu</span>
            {/* Icon when menu is closed */}
            <svg 
              className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`} 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            {/* Icon when menu is open */}
            <svg 
              className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`} 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden bg-white border-t border-gray-200`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link href="#features" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50">
            Features
          </Link>
          <Link href="#security" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50">
            Security
          </Link>
          <Link href="#about" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50">
            About
          </Link>
          <div className="flex flex-col space-y-2 px-3 py-2">
            <Link href="/log-in">
              <Button variant="outline" size="sm" className="w-full justify-center">Log In</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="w-full justify-center">Sign Up</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
