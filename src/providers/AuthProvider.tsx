"use client";
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const initializeAuth = useAuthStore(state => state.initializeAuth);
  
  useEffect(() => {
    let mounted = true;
    
    async function init() {
      try {
        console.log("Starting auth initialization...");
        
        // First check if there's an existing session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session retrieval error:", error);
        } else {
          console.log("Session status before initialization:", 
            data.session ? "Session exists" : "No session");
        }
        
        // Initialize auth store regardless of current session status
        await initializeAuth();
        
        if (mounted) {
          console.log("Auth initialization completed successfully");
          setIsAuthReady(true);
        }
      } catch (error) {
        console.error("Critical auth initialization error:", error);
        if (mounted) {
          setIsAuthReady(true); // Still set to true so the app doesn't hang
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [initializeAuth]);

  if (!isAuthReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="ml-2 text-lg">Initializing authentication...</span>
      </div>
    );
  }

  return <>{children}</>;
}