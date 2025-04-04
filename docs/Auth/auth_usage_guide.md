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
    -   **Important:** This key is only available after successful login or recovery and is cleared on logout.

-   **Encryption/Decryption:**
    -   Use the functions in `src/lib/crypto.ts` for all cryptographic operations.
    -   Ensure that you handle errors and loading states appropriately.

### 4. Error Handling

-   Use the `handleAuthError` function in `authStore.ts` for centralized error handling.
-   Display user-friendly error messages to the user.
-   Log errors to the console for debugging.

