# Authentication Flow Documentation

## 1. Overview

This authentication system is designed with security by design and zero-trust principles in mind. It ensures that user data remains confidential even if the server or database is compromised. The system leverages Supabase for user authentication and authorization, while cryptographic operations are performed client-side to protect sensitive data.

## 2. Key Concepts

- Symmetric Key: A randomly generated key used to encrypt and decrypt user data. This key is never stored in plaintext on the server.
- Password-Derived Key: A key derived from the user's password using a strong key derivation function (KDF) like PBKDF2. This key is used to encrypt the symmetric key.
- Recovery Key: A randomly generated key displayed to the user during signup. This key is used as a backup to decrypt the symmetric key if the user forgets their password.
- Salt: A random value used to protect against rainbow table attacks.
- Initialization Vector (IV): A random value used to ensure that the same plaintext encrypts to different ciphertexts.

## 3. Authentication Flow

### Signup

1. The user enters their email and password.
2. The client-side code generates a random salt, a symmetric key, and a recovery key.
3. The password-derived key is generated from the password and salt.
4. The symmetric key is encrypted twice:
   - Once with the password-derived key
   - Once with the recovery key
5. The encrypted symmetric keys, IVs, and salt are stored in the Supabase database.
6. The recovery key is displayed to the user, who is prompted to save it securely.

### Login

1. The user enters their email and password.
2. The client authenticates the user with Supabase Auth.
3. The client fetches the encrypted key material (encrypted symmetric keys, IVs, and salt) from the Supabase database.
4. The password-derived key is generated from the password and salt.
5. The symmetric key is decrypted using the password-derived key.
6. The decrypted symmetric key is stored in memory.

### Logout

1. The client signs the user out of Supabase Auth.
2. The decrypted symmetric key is cleared from memory.

### Recovery

1. The user enters their recovery key.
2. The client fetches the encrypted key material (encrypted symmetric key, IV, and salt) from the Supabase database.
3. The recovery-key-based key is generated from the recovery key and salt.
4. The symmetric key is decrypted using the recovery-key-based key.
5. The decrypted symmetric key is stored in memory.

### Password Reset

1. The user initiates a password reset.
2. The client generates a new salt.
3. The client derives a new password-based key from the new password and salt.
4. The client re-encrypts the symmetric key with the new password-based key.
5. The client updates the user's password in Supabase Auth.
6. The client updates the encrypted key material (encrypted symmetric key, IV, and salt) in the Supabase database.

## 4. Key Management

- Key Generation: All cryptographic keys are generated client-side using cryptographically secure random number generators.
- Key Storage: Only encrypted key material is stored in the Supabase database. The actual symmetric key and password are never stored on the server.
- Key Rotation: The password reset process effectively rotates the password-derived key.
- Key Destruction: The decrypted symmetric key is cleared from memory on logout or session expiry.

## 5. Security Considerations

- Password Strength: Users should be encouraged to use strong, unique passwords.
- Recovery Key Security: Users should be educated about the importance of securely storing their recovery key.
- Supabase Security: The Supabase project should be configured with appropriate security measures, such as network restrictions and regular security audits.
- Code Security: The client-side code should be regularly reviewed for security vulnerabilities.

# Directory Structure (backend auth relevant folders and files):
```
src/
├── app/
├── components/
├── features/
├── lib/
│   ├── crypto.ts # Client-side crypto functions
│   └── supabase/
│       ├── client.ts # Supabase browser client
│       ├── middleware.ts # Session refresh logic
│       └── server.ts # Supabase server client
├── store/
│   └── authStore.ts # Manages authentication state
├── types/
│   └── auth.ts # Authentication related types
└── middleware.ts # Calls session update function from lib/supabase/middleware.ts

```

# Folder Breakdown: src/lib/supabase

## Core Strategy: JWTs in Cookies + Middleware Refresh

- Authentication: Uses Supabase Auth, which provides JWT Access Tokens (short-lived, authorize requests) and Refresh Tokens (long-lived, HttpOnly, used to get new Access Tokens).

- Storage: Both tokens are stored securely in browser cookies. The HttpOnly flag on the Refresh Token prevents client-side JavaScript access, enhancing security.

- Session Management: Relies heavily on Next.js Middleware to automatically refresh the Access Token using the Refresh Token before requests reach your server-side code.

## File Breakdown & Roles:

### src/lib/supabase/client.ts (Browser Client)

- Purpose: Creates a Supabase client instance for use in the browser (Client Components, client-side scripts).

- How: Uses createBrowserClient with public Supabase URL/Anon Key.

- Auth: Reads auth cookies directly from the browser's storage. Sends Access Token with requests directly from the browser to Supabase.

- Refresh: Cannot perform token refresh itself due to HttpOnly Refresh Token. Relies on cookies being kept fresh by the Middleware.

### src/lib/supabase/middleware.ts (updateSession function)

- Purpose: The core of session maintenance. Ensures a valid session for requests arriving at the Next.js server.

- How: Called by your main src/middleware.ts. Uses createServerClient configured for the middleware context. Runs before pages, route handlers, or server actions.

- Key Action: Calls supabase.auth.getUser(). This checks the Access Token from the incoming request's cookies.

- Token Management: If the Access Token is expired BUT the HttpOnly Refresh Token is valid, this function automatically and securely contacts Supabase to get a new Access Token, then sets updated cookies on the response going back to the browser.

- Result: Keeps the user's session alive seamlessly during navigation and interaction with the Next.js app.

### src/lib/supabase/server.ts (Server-Side Client)

- Purpose: Creates a Supabase client instance for use on the Next.js server (Server Components, Route Handlers, Server Actions).

- How: Uses createServerClient and reads cookies via next/headers.

- Auth: Reads the auth cookies associated with the incoming browser request (which were just validated/refreshed by the Middleware). Sends the valid Access Token with requests from the Next.js server to Supabase.

- Refresh: Does not perform token refresh itself; it relies on the Middleware having already ensured the token's validity for the current request lifecycle.

### Flow:
1. Login: User logs in (via `client.ts`), and Supabase sends back tokens. The browser client stores these tokens as cookies.

2. Request to Next.js: The browser sends a request (e.g., page load or API call) to your Next.js server, including the cookies.

3. Middleware Runs: The `updateSession` function intercepts the request, validates the session, refreshes the Access Token using the Refresh Token if needed, and updates the response cookies.

4. Server-Side Logic: Server Components or Routes (using `server.ts`) execute after the middleware. They read the now-validated/refreshed cookies and make authenticated calls from Next.js to Supabase using the fresh Access Token.

5. Client-Side Logic: Client Components (using `client.ts`) make calls directly from the browser to Supabase using the Access Token currently stored in browser cookies.

### Expiry Handling:

- Access Token: Regularly expires but is transparently refreshed by the Middleware during user interaction with the Next.js app.

- Refresh Token: Eventually expires, requiring the user to log in again.

- Client-Side Edge Case: If a user is idle on a page for longer than the Access Token lifespan, a direct client-side call to Supabase might fail (401). Error handling should prompt a refresh action (e.g., page reload) to trigger the Middleware refresh cycle.


# File Breakdown: src/lib/crypto.ts:

- Purpose: Implements client-side cryptographic operations using the browser's Web Crypto API to manage user encryption keys securely in a zero-trust manner. Ensures plaintext keys/passwords never reach the server.

## Key Generation & Derivation:

- Generates a unique salt per user (stored in DB).
- Generates a strong, random symmetricKey (for actual data encryption).
- Generates a user-facing recoveryKeyString.
- Derives a passwordWrappingKey from the user's password + salt (using PBKDF2).
- Derives a separate recoveryWrappingKey from the recovery string + salt (using SHA-256).

## Encryption/Decryption Flow:

- Sign-up: The symmetricKey is encrypted twice: once with passwordWrappingKey and once with recoveryWrappingKey. Both encrypted versions, their unique IVs, and the salt are stored in the user_keys table.
- Login: The password-encrypted key + IV are fetched. The passwordWrappingKey is re-derived client-side using the entered password + salt. This key decrypts the symmetricKey.
- Recovery: The recovery-encrypted key + IV are fetched. The recoveryWrappingKey is re-derived client-side using the entered recovery string + salt. This key decrypts the same original symmetricKey.

## Zero-Trust & Password Handling:

- All key derivation and symmetric key decryption happens client-side.
- Plaintext passwords/recovery keys and the decrypted symmetricKey never leave the browser.
- Supabase Auth handles password verification using secure, salted hashes (stored internally by Supabase). Supabase cannot access the plaintext password and therefore cannot derive the wrapping keys or decrypt the user's symmetricKey.

# File Breakdown: src/store/auth.ts

- Purpose: Manages application authentication state (user, session) and handles client-side cryptography for user keys using Zustand. Implements a zero-trust key management system.

- Core Principle: All cryptographic operations (key generation, derivation, encryption, decryption) happen client-side in the user's browser via the Web Crypto API. The plaintext symmetric encryption key (`decryptedSymmetricKey`) exists only in memory while the user is logged in and is never sent to the server or stored persistently.

- State: Holds user, session, the sensitive `decryptedSymmetricKey` (in memory), `isLoading`, and `error` states. Provides an `isAuthenticated` helper.

### Key Functions:

- `initializeAuth`: Checks for an existing session on app load and sets up a Supabase listener (`onAuthStateChange`) that automatically updates user/session state and crucially clears the `decryptedSymmetricKey` from memory on logout.

- `signup`: Handles Supabase user registration. Client-side: generates salt, main symmetric key, recovery key string. Derives password & recovery wrapping keys. Encrypts the symmetric key twice (once with password key, once with recovery key). Returns encrypted data, salt, and the plaintext recovery key string (for the user to save).

- `storeGeneratedKeys`: Takes the encrypted keys/salt/IVs from signup (after user confirmation) and saves them to the `user_keys` table in Supabase.

- `login`: Handles Supabase password authentication. Fetches the user's salt, password-encrypted key, and IV from the database. Client-side: re-derives the password wrapping key, decrypts the symmetric key, and stores the resulting `CryptoKey` in the `decryptedSymmetricKey` state (memory).

- `logout`: Calls Supabase sign out. Relies on the `onAuthStateChange` listener to clear the user, session, and `decryptedSymmetricKey` state.

- `recoverWithKey`: (Assumes necessary encrypted data/salt is pre-fetched securely). Client-side: Takes the user-entered recovery key string and the fetched data, derives the recovery wrapping key, decrypts the symmetric key, and stores it in memory (`decryptedSymmetricKey`), enabling a password reset.

- `resetPasswordAndUpdateKeys`: (Requires `decryptedSymmetricKey` in memory). Updates the password in Supabase Auth. Client-side: Fetches the existing salt, derives a new wrapping key from the new password + existing salt, re-encrypts the symmetric key (from memory) using this new key. Updates only the password-related encrypted key (`enc_key_pw`) and IV (`iv_pw`) in the database, leaving the salt and recovery key data unchanged. Optionally updates the in-memory key for consistency.

- Security: Ensures Supabase (or any server-side actor) cannot access the user's decrypted symmetric key, as the decryption password/recovery key is never sent to the server, and decryption happens only in the browser.

# File Breakdown: src/services/database.ts: Database Service

- Purpose: Provides a unified service for all database interactions related to user authentication and key management. Abstracts Supabase client calls for cleaner code and easier maintenance.

## Key Functions:

- `fetchUserKeys(userId: string)`: Fetches encrypted key data (salt, encrypted symmetric key, IVs) for a given user ID from the `user_keys` table. Returns `null` if not found.

- `storeUserKeys(keyMaterial: KeyMaterial)`: Stores the encrypted key data generated during signup into the `user_keys` table. Handles potential unique constraint violations (duplicate user keys).

- `fetchUserSalt(userId: string)`: Fetches only the salt for a given user ID. Used during password reset.

- `checkUserExists(email: string)`: Checks if a user exists in the `auth.users` table by email via the `/api/check-user-exists` API route.

- `updateUserPasswordKey(userId: string, encKeyPwB64: string, ivPwB64: string)`: Updates the password-encrypted symmetric key and IV in the `user_keys` table during password reset.

## Usage Notes:

- All functions use the Supabase client (`createClient` from `@/lib/supabase/client`).
- Error handling is centralized within each function, returning a `success: false` object with an error message on failure.
- This service promotes separation of concerns by isolating database logic from the authentication store.

# File Breakdown: src/app/api/check-user-exists/route.ts: 

- Purpose: Provides a server-side API endpoint to check if a user exists in the `auth.users` table by email. Used by the `checkUserExists` function in `src/services/database.ts`.

## Key Function:

- `POST(request: Request)`:
  - Receives an email address in the request body.
  - Uses the Supabase server client (`createRouteHandlerClient` from `@supabase/auth-helpers-nextjs`) to query the `auth.users` table.
  - Returns a JSON response with a `userExists` boolean indicating whether a user with the given email exists.
  - Returns error responses for invalid requests or database errors.

## Security Notes:

- This route uses the server-side Supabase client, which has elevated privileges, to access the `auth.users` table.
- Input validation is performed to ensure the email is provided in the request body.
- Error responses are generic to avoid exposing sensitive information.

# Frontend Authentication Components Documentation

This section provides a concise overview of the key frontend components involved in the authentication flow.

## `src/app/(auth)/sign-up/page.tsx` & `src/app/(auth)/log-in/page.tsx`: Page Components

-   Purpose: These files are the entry points for the sign-up and log-in pages, respectively.
-   Functionality: They import and render the `SignUpForm` and `LoginForm` components within a basic layout.

## `src/components/auth/SignUpForm.tsx`: Sign-Up Form Component

-   Purpose: Handles the user sign-up process, including collecting credentials, displaying the recovery key, and storing encrypted keys.
-   Key Features:
    -   Multi-step form using `useState` for managing the current step (`SignUpStep.CREDENTIALS`, `SignUpStep.RECOVERY_KEY`, `SignUpStep.SUCCESS`).
    -   Client-side validation of email and password.
    -   Calls `signup` from `authStore.ts` to initiate the sign-up process.
    -   Renders `RecoveryKeyDisplay.tsx` to show the recovery key.
    -   Calls `storeGeneratedKeys` from `authStore.ts` to store the encrypted keys after user confirmation.
    -   Handles loading and error states.

## `src/components/auth/LoginForm.tsx`: Log-In Form Component

-   Purpose: Handles the user log-in process.
-   Key Features:
    -   Collects user email and password.
    -   Client-side validation of email and password.
    -   Calls `login` from `authStore.ts` to authenticate the user.
    -   Redirects to the dashboard on successful login.
    -   Handles loading and error states.

## `src/components/auth/RecoveryKeyDisplay.tsx`: Recovery Key Display Component

-   Purpose: Displays the recovery key to the user and provides copy-to-clipboard functionality.
-   Key Features:
    -   Displays the recovery key string.
    -   Provides a button to copy the recovery key to the clipboard.
    -   Includes a checkbox for the user to confirm that they have saved the recovery key.
    -   Uses a modal for display.

## `src/components/auth/PasswordRequirements.tsx`: Password Requirements Component

-   Purpose: Displays password requirements with visual indicators.
-   Key Features:
    -   Shows a list of password requirements (e.g., minimum length, uppercase letter, etc.).
    -   Uses green checkmarks to indicate which requirements are met.


