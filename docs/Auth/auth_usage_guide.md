## Usage Guide for Authentication System

This guide provides practical information for developers working with the authentication system.

### 1. Accessing User Session

-   **Server Components/API Routes:**
    -   Use `createServerClient` from `@/lib/supabase/server.ts`.
    -   Call `supabase.auth.getSession()` to get the session.
    -   Example:

    ```typescript
    import { createServerClient } from '@/lib/supabase/server';
    import { cookies } from 'next/headers';

    async function getData() {
      const supabase = createServerClient({ cookies });
      const { data: { session } } = await supabase.auth.getSession();

      return session;
    }
    ```

-   **Client Components:**
    -   Use `createBrowserClient` from `@/lib/supabase/client.ts`.
    -   Call `supabase.auth.getSession()` to get the session.
    -   Example:

    ```typescript
    import { createBrowserClient } from '@/lib/supabase/client';
    import { useState, useEffect } from 'react';

    function useSession() {
      const [session, setSession] = useState(null);
      const supabase = createBrowserClient();

      useEffect(() => {
        async function getSession() {
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session);
        }
        getSession();
      }, []);

      return session;
    }
    ```

-   **Auth Store (Zustand):**
    -   Use `useAuthStore` from `@/store/authStore.ts` to access the user and session state.
    -   Example:

    ```typescript
    import { useAuthStore } from '@/store/authStore';

    function MyComponent() {
      const user = useAuthStore((state) => state.user);
      const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

      if (isAuthenticated()) {
        return <p>Welcome, {user?.email}!</p>;
      } else {
        return <p>Please log in.</p>;
      }
    }
    ```

### 2. Adding a New Database Query

1.  **Create a Function in `src/services/database.ts`:**
    -   Use the existing functions as a template.
    -   Create a new function within the `userDbService` object.
    -   Example:

    ```typescript
    async function getSomething(userId: string): Promise<any | null> {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('your_table')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error("Error getting something:", error);
        return null;
      }

      return data;
    }
    ```

### 3. Key Management

-   **Symmetric Key:**
    -   The `decryptedSymmetricKey` is stored in memory using Zustand in `authStore.ts`.
    -   Access it using `useAuthStore((state) => state.decryptedSymmetricKey)`.
    -   The key is also persisted in session storage for page refreshes and tab persistence.
    -   **Important:** This key is only available after successful login or recovery and is cleared on logout.

-   **Session Storage:**
    -   The symmetric key is automatically stored in and retrieved from session storage.
    -   This ensures the key persists across page refreshes without requiring re-authentication.
    -   When opening a new tab, the application will attempt to recover the key from session storage.
    -   If that fails, a password prompt will appear to re-authenticate the user.

-   **DCPE Keys:**
    -   Deterministic Convergent Privacy Encryption (DCPE) keys are used for deterministic encryption of metadata.
    -   These keys are stored in both the database (`encrypted_dcpe_keys` column in `user_keys` table) and localStorage.
    -   Database storage ensures consistency across devices, while localStorage provides faster access.
    -   Keys are always encrypted with the user's symmetric key before storage.
    -   The Key Management Service manages the loading priority: first from database, then from localStorage, finally generating new keys if neither exists.

-   **Using the Key Management Service:**
    -   Access the Key Management Service using the `useKeyManagement` hook:
    
    ```typescript
    import { useKeyManagement } from '@/services/keyManagement';
    
    function MyComponent() {
      const { service, isLoading, error, ensureInitialized } = useKeyManagement();
      
      // Use ensureInitialized before encryption/decryption operations
      const handleEncryption = async () => {
        await ensureInitialized();
        // Now it's safe to use the service
        if (service) {
          const encryptedText = service.encryptText('Secret message');
          const decryptedText = service.decryptText(encryptedText);
        }
      };
      
      if (isLoading) return <div>Loading encryption service...</div>;
      if (error) return <div>Error: {error}</div>;
    }
    ```
    
    -   For non-React code, use the standalone utility functions:
    
    ```typescript
    import { encryptText, encryptMetadata, encryptVector } from '@/services/keyManagement';
    
    // Inside an async function
    const symmetricKey = useAuthStore.getState().decryptedSymmetricKey;
    const encryptedText = await encryptText('Secret message', symmetricKey);
    ```

### 4. Handling Password Prompts

-   When the encryption key is not available (e.g., in a new browser tab), a password prompt will appear.
-   You can manually trigger a password prompt using the PasswordModalContext:

    ```typescript
    import { usePasswordModalContext } from '@/contexts/PasswordModalContext';
    
    function MyComponent() {
      const { showPasswordPrompt } = usePasswordModalContext();
      
      const handleSecureAction = async () => {
        // This will show the password prompt if the key is not available
        const result = await showPasswordPrompt();
        if (result.success) {
          // Key is now available, proceed with secure action
        }
      };
      
      return <button onClick={handleSecureAction}>Secure Action</button>;
    }
    ```

-   Components that need encryption should handle the case where the key might not be available:

    ```typescript
    import { useKeyManagement } from '@/services/keyManagement';
    
    function SecureComponent() {
      const { service, isLoading, ensureInitialized } = useKeyManagement();
      
      useEffect(() => {
        // This will trigger a password prompt if needed
        ensureInitialized();
      }, [ensureInitialized]);
      
      if (isLoading) return <div>Loading...</div>;
      
      return <div>Secure content is available!</div>;
    }
    ```

### 5. Error Handling

-   Use the `handleAuthError` function in `authStore.ts` for centralized error handling.
-   Display user-friendly error messages to the user.
-   Log errors to the console for debugging.
-   Handle key initialization failures gracefully:

    ```typescript
    import { useKeyManagement } from '@/services/keyManagement';
    
    function MyComponent() {
      const { service, isLoading, error, ensureInitialized } = useKeyManagement();
      
      const handleSecureOperation = async () => {
        try {
          await ensureInitialized();
          // Proceed with secure operation
        } catch (error) {
          // Handle initialization failure
          console.error("Failed to initialize encryption:", error);
          // Show user-friendly message
        }
      };
      
      // Component render logic
    }
    ```

