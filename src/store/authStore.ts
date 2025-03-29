import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client'; // Use the browser client
import {
    deriveKeyFromPassword,
    deriveKeyFromRecoveryString,
    decryptKey,
    importSymmetricKey,
    base64ToArrayBuffer,
    arrayBufferToBase64,
    generateSalt,
    generateRandomSymmetricKey,
    generateRecoveryKeyString,
    encryptKey
} from '@/lib/crypto'; 

// Define the state structure
interface AuthState {
    user: User | null;
    session: Session | null;
    decryptedSymmetricKey: CryptoKey | null; // Store the actual CryptoKey object
    isLoading: boolean;
    error: string | null;
    isAuthenticated: () => boolean; // Derived state helper

    // --- Core Actions ---
    // (Implementation details will be added later for complex ones)
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string; recoveryKeyNeeded?: boolean }>;
    signup: (email: string, password: string) => Promise<{
        success: boolean;
        error?: string;
        // Data to be passed to storeGeneratedKeys after user confirmation
        keyMaterial?: {
            userId: string;
            saltB64: string;
            encKeyPwB64: string;
            ivPwB64: string;
            encKeyRecoveryB64: string;
            ivRecoveryB64: string;
            recoveryKeyString: string; // The key to display to the user
        } | null;
    }>;
    storeGeneratedKeys: (keyMaterial: NonNullable<AuthState['signup']['prototype']['keyMaterial']>) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    recoverWithKey: (recoveryKeyString: string, saltB64: string, encKeyRecoveryB64: string, ivRecoveryB64: string) => Promise<{ success: boolean; error?: string }>; // For use after recovery
    resetPasswordAndUpdateKeys: (newPassword: string) => Promise<{ success: boolean; error?: string }>; // For use after recovery or password change

    // --- Internal Actions / State Setters ---
    setAuthState: (user: User | null, session: Session | null) => void;
    setDecryptedKey: (key: CryptoKey | null) => void; // Allow explicitly setting/clearing the key
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
    initializeAuth: () => Promise<void>; // Check initial auth state
}

// Create the Zustand store
export const useAuthStore = create<AuthState>((set, get) => ({
    // Initial State 
    user: null,
    session: null,
    decryptedSymmetricKey: null,
    isLoading: true, // Start loading initially to check session
    error: null,
    isAuthenticated: () => !!get().session && !!get().user, // Check if session and user exist

    // Actions Implementation

    setAuthState: (user, session) => {
        if (!user || !session) {
            console.error("Invalid user or session provided to setAuthState.");
            set({ user: null, session: null, isLoading: false, error: "Invalid user or session." });
            return;
        }
    
        set({ user, session, isLoading: false });
        console.log("Auth state updated:", { user, session });
    },

    setDecryptedKey: (key) => {
        if (key) {
            console.log("Decrypted symmetric key set in memory.");
        } else {
             console.log("Decrypted symmetric key cleared from memory.");
        }
        set({ decryptedSymmetricKey: key });
    },

    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error, isLoading: false }), // Stop loading on error
    clearError: () => set({ error: null }),

    // Initialize Auth State (Call this once when the app loads)
    initializeAuth: async () => {
        set({ isLoading: true });
        const supabase = createClient(); // Browser client
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error("Error fetching initial session:", error);
            set({ user: null, session: null, isLoading: false, error: "Failed to initialize session." });
            return;
        }

        if (session) {
             console.log("Initial session found:", session);
            // If there's a session, we have the user, but NOT the key yet.
            // Key needs to be decrypted on login or recovery.
            set({ user: session.user, session, isLoading: false });
        } else {
             console.log("No initial session found.");
            set({ user: null, session: null, isLoading: false });
        }

        // Listen for auth changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                console.log("Auth state changed:", _event, session);
                const currentState = get();
                // Update user/session state
                set({ user: session?.user ?? null, session });

                // IMPORTANT: Clear the decrypted key if the user logs out or session becomes invalid
                if (_event === 'SIGNED_OUT' || !session) {
                    if (currentState.decryptedSymmetricKey) {
                        currentState.setDecryptedKey(null);
                    }
                }
                // Note: Key is NOT automatically decrypted on SIGNED_IN or TOKEN_REFRESHED
                // It requires explicit user action (login/recovery) involving the password/recovery key.
            }
        );

        // Return cleanup function for the listener
        // This is often handled by framework integration, but good practice
        // return () => {
        //     subscription?.unsubscribe();
        // };
    },

    login: async (email, password) => {
        set({ isLoading: true, error: null, decryptedSymmetricKey: null }); // Clear previous key on new login attempt
        const supabase = createClient();

        try {
            // 1. Sign in with Supabase
            const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) throw new Error(`Login failed: ${signInError.message}`);
            if (!authData.user || !authData.session) throw new Error("Login failed: No user or session data returned.");

            const user = authData.user;
            console.log("Login successful for user:", user.id);
            // Update auth state immediately (listener might be slightly delayed)
            set({ user: user, session: authData.session });

            // 2. Fetch encrypted keys and salt from DB
            console.log("Fetching user keys...");
            const { data: keyData, error: keyFetchError } = await supabase
                .from('user_keys')
                .select('salt, enc_key_pw, iv_pw') // Select only needed fields for password login
                .eq('user_id', user.id)
                .single(); // Expect exactly one row

            if (keyFetchError) {
                // Distinguish between "not found" and other errors
                if (keyFetchError.code === 'PGRST116') { // PostgREST code for "Resource Not Found"
                     console.warn("User keys not found. Signup might be incomplete.");
                     set({ isLoading: false, error: "Encryption keys not found. Please complete signup or contact support." });
                     // Optionally return a specific flag if needed by UI
                     return { success: false, error: "Encryption keys not found.", recoveryKeyNeeded: true }; // Indicate potential signup issue
                }
                 throw new Error(`Failed to fetch keys: ${keyFetchError.message}`);
            }
            if (!keyData || !keyData.salt || !keyData.enc_key_pw || !keyData.iv_pw) {
                throw new Error("Incomplete key data fetched from database.");
            }
            console.log("User keys fetched successfully.");

            // 3. Decode data
            const salt = base64ToArrayBuffer(keyData.salt);
            const encryptedKeyData = base64ToArrayBuffer(keyData.enc_key_pw);
            const iv = base64ToArrayBuffer(keyData.iv_pw);

            // 4. Derive wrapping key from password
            console.log("Deriving key from password...");
            const wrappingKey = await deriveKeyFromPassword(password, new Uint8Array(salt));
            console.log("Password key derived.");

            // 5. Decrypt the symmetric key
            console.log("Decrypting symmetric key...");
            const decryptedRawKey = await decryptKey(encryptedKeyData, new Uint8Array(iv), wrappingKey);
            console.log("Symmetric key decrypted.");

            // 6. Import the raw key into a CryptoKey object
            const symmetricKey = await importSymmetricKey(decryptedRawKey);
            console.log("Symmetric key imported.");

            // 7. Store the decrypted key in state
            set({ decryptedSymmetricKey: symmetricKey, isLoading: false, error: null });
            console.log("Decrypted key stored in memory.");

            return { success: true };

        } catch (error: any) {
            console.error("Login process error:", error);
            // Clear potentially partially set state on failure
            set({ isLoading: false, error: error.message || "An unknown login error occurred.", decryptedSymmetricKey: null, user: null, session: null });
             // Sign out if login failed after Supabase sign-in but before key decryption
            await supabase.auth.signOut().catch(err => console.error("Error signing out after failed login:", err));
            return { success: false, error: error.message };
        }
    },

    signup: async (email, password) => {
        set({ isLoading: true, error: null });
        const supabase = createClient();

        try {
            // 1. Sign up with Supabase Auth
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                // options: { data: { /* Optional metadata */ } }
            });

            if (signUpError) {
                // Check for specific error cases before throwing general error
                if (signUpError.message.includes("User already registered")) {
                    throw new Error("User already exists. Please log in or confirm your email.");
                }
                throw new Error(`Sign up failed: ${signUpError.message}`);
            }
            // Handle cases where user exists but isn't confirmed, or general lack of user data
            if (!signUpData.user) {
                // Check if user might exist but needs confirmation
                const { data } = await fetch('/api/check-user-exists', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                }).then(res => res.json());
                
                // Use the data from the API response instead of signUpError
                if (data?.userExists) {
                    throw new Error("User already exists. Please log in or confirm your email.");
                }
                
                throw new Error("Sign up failed: No user data returned.");
            }
            if (signUpData.user.identities?.length === 0) {
                // This can happen if email confirmation is required but the user already exists unconfirmed.
                // Supabase might return a user object but without an identity.
                 console.warn("User may already exist and require confirmation.");
                 // Depending on your flow, you might want to prompt the user to check their email again.
                 // For this flow, we'll treat it as a potential issue needing confirmation.
                 throw new Error("Sign up requires email confirmation. Please check your inbox (and spam folder).");
            }

            const user = signUpData.user;
            console.log("Supabase sign up successful for user:", user.id);
            // Note: Session might be null if email confirmation is needed.
            // The onAuthStateChange listener will handle setting the session later if confirmation happens.
            set({ user: user, session: signUpData.session });

            // 2. Generate all cryptographic keys and material CLIENT-SIDE
            console.log("Generating cryptographic keys...");
            const salt = generateSalt();
            const passwordDerivedKey = await deriveKeyFromPassword(password, salt);
            const symmetricKey = await generateRandomSymmetricKey();
            const recoveryKeyString = generateRecoveryKeyString(); // Generate the string for the user
            const recoveryDerivedKey = await deriveKeyFromRecoveryString(recoveryKeyString, salt); // Use same salt

            // 3. Encrypt the symmetric key twice
            const { ciphertext: ctPw, iv: ivPw } = await encryptKey(symmetricKey, passwordDerivedKey);
            const { ciphertext: ctRec, iv: ivRec } = await encryptKey(symmetricKey, recoveryDerivedKey);

            // 4. Encode everything to Base64 for storage/transfer
            const saltB64 = arrayBufferToBase64(salt.buffer as ArrayBuffer);
            const encKeyPwB64 = arrayBufferToBase64(ctPw);
            const ivPwB64 = arrayBufferToBase64(ivPw.buffer as ArrayBuffer);
            const encKeyRecoveryB64 = arrayBufferToBase64(ctRec as ArrayBuffer);
            const ivRecoveryB64 = arrayBufferToBase64(ivRec.buffer as ArrayBuffer);

            console.log("Keys generated and encrypted.");

            // 5. Return success and the necessary key material
            // The UI will display recoveryKeyString and call storeGeneratedKeys on confirmation
            set({ isLoading: false, error: null });
            return {
                success: true,
                keyMaterial: {
                    userId: user.id,
                    saltB64,
                    encKeyPwB64,
                    ivPwB64,
                    encKeyRecoveryB64,
                    ivRecoveryB64,
                    recoveryKeyString // Pass this back to UI!
                }
            };

        } catch (error: any) {
            console.error("Signup process error:", error);
            set({ isLoading: false, error: error.message || "An unknown signup error occurred.", user: null, session: null });
            // Attempt to sign out if Supabase signup succeeded but key gen failed
            if (get().user) {
                await supabase.auth.signOut().catch(err => console.error("Error signing out after failed signup keygen:", err));
            }
            return { success: false, error: error.message };
        }
    },

    storeGeneratedKeys: async (keyMaterial) => {
        set({ isLoading: true, error: null });
        const supabase = createClient();
        const currentUser = get().user;
    
        // Ensure the user performing this action matches the userId in keyMaterial
        if (!currentUser || currentUser.id !== keyMaterial.userId) {
            const errorMsg = "Authentication mismatch: Cannot store keys for a different user.";
            console.error(errorMsg);
            set({ isLoading: false, error: errorMsg });
            return { success: false, error: errorMsg };
        }
    
        console.log("Storing generated keys for user:", keyMaterial.userId);
    
        const maxRetries = 3;
        let attempt = 0;
    
        while (attempt < maxRetries) {
            try {
                // Validate schema compatibility (e.g., check required fields)
                if (!keyMaterial.saltB64 || !keyMaterial.encKeyPwB64 || !keyMaterial.ivPwB64) {
                    throw new Error("Invalid key material: Missing required fields.");
                }
    
                const { error: insertError } = await supabase
                    .from('user_keys')
                    .insert({
                        user_id: keyMaterial.userId,
                        salt: keyMaterial.saltB64,
                        enc_key_pw: keyMaterial.encKeyPwB64,
                        iv_pw: keyMaterial.ivPwB64,
                        enc_key_recovery: keyMaterial.encKeyRecoveryB64,
                        iv_recovery: keyMaterial.ivRecoveryB64,
                    });
    
                if (insertError) {
                    // Handle potential unique constraint violation if keys already exist
                    if (insertError.code === '23505') { // PostgreSQL unique violation code
                        console.warn(`Keys already exist for user ${keyMaterial.userId}.`);
                        throw new Error("Failed to store keys: Keys already exist for this user.");
                    }
                    throw new Error(`Database error storing keys: ${insertError.message}`);
                }
    
                console.log("Keys stored successfully in database.");
                set({ isLoading: false, error: null });
                return { success: true };
    
            } catch (error: any) {
                console.error(`Attempt ${attempt + 1} to store keys failed:`, error.message);
    
                if (attempt === maxRetries - 1) {
                    set({ isLoading: false, error: error.message || "Failed to store encryption keys after multiple attempts." });
                    return { success: false, error: error.message };
                }
    
                attempt++;
            }
        }

        // Ensure a return statement outside the loop
        set({ isLoading: false, error: "Failed to store encryption keys after all attempts." });
        return { success: false, error: "Failed to store encryption keys after all attempts." };
    },

    logout: async () => {
        console.log("Logging out...");
        set({ isLoading: true, error: null });
        const supabase = createClient();
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error logging out:", error);
            set({ error: error.message, isLoading: false });
        } else {
            console.log("Logout successful.");
            // State update (user, session, key) handled by onAuthStateChange listener
            set({ isLoading: false }); // Listener will set user/session/key to null
        }
    },

        // Assumes key data (salt, enc_key_recovery, iv_recovery) for the user
    // has ALREADY been fetched securely (e.g., via a dedicated API route/server action using email)
    // and passed into this function.
    recoverWithKey: async (recoveryKeyString, saltB64, encKeyRecoveryB64, ivRecoveryB64) => {
        set({ isLoading: true, error: null, decryptedSymmetricKey: null }); // Clear previous key
    
        try {
            console.log("Attempting key recovery...");
    
            // Validate inputs
            if (!recoveryKeyString || !saltB64 || !encKeyRecoveryB64 || !ivRecoveryB64) {
                throw new Error("Invalid recovery data provided. Please ensure all fields are filled.");
            }
    
            // 1. Decode fetched data
            const salt = base64ToArrayBuffer(saltB64);
            const encryptedKeyData = base64ToArrayBuffer(encKeyRecoveryB64);
            const iv = base64ToArrayBuffer(ivRecoveryB64);
    
            // 2. Derive wrapping key from recovery string
            console.log("Deriving key from recovery string...");
            const wrappingKey = await deriveKeyFromRecoveryString(recoveryKeyString, new Uint8Array(salt));
            console.log("Recovery key derived.");
    
            // 3. Decrypt the symmetric key
            console.log("Decrypting symmetric key using recovery key...");
            const decryptedRawKey = await decryptKey(encryptedKeyData, new Uint8Array(iv), wrappingKey);
            console.log("Symmetric key decrypted.");
    
            // 4. Import the raw key into a CryptoKey object
            const symmetricKey = await importSymmetricKey(decryptedRawKey);
            console.log("Symmetric key imported.");
    
            // 5. Store the decrypted key in state
            set({ decryptedSymmetricKey: symmetricKey, isLoading: false, error: null });
            console.log("Decrypted key stored in memory for password reset.");
    
            return { success: true };
    
        } catch (error: any) {
            console.error("Key recovery process error:", error);
            set({ isLoading: false, error: error.message || "Failed to recover key. Invalid recovery key or data.", decryptedSymmetricKey: null });
            return { success: false, error: error.message };
        }
    },

    resetPasswordAndUpdateKeys: async (newPassword) => {
        set({ isLoading: true, error: null });
        const supabase = createClient();
        const currentKey = get().decryptedSymmetricKey;
        const currentUser = get().user;

        if (!currentKey) {
            const msg = "Cannot reset password: Decrypted symmetric key not available in memory. Please recover using your recovery key first.";
            console.error(msg);
            set({ isLoading: false, error: msg });
            return { success: false, error: msg };
        }
        if (!currentUser) {
            const msg = "Cannot reset password: No authenticated user found.";
             console.error(msg);
             set({ isLoading: false, error: msg });
             return { success: false, error: msg };
        }

        console.log("Starting password reset and key re-encryption...");

        try {
            // 1. Generate a NEW salt
            const newSalt = generateSalt();
            console.log("Generated new salt for password reset.");

            // 2. Derive a NEW wrapping key from the new password and new salt
            const newWrappingKey = await deriveKeyFromPassword(newPassword, newSalt);
            console.log("Derived new password wrapping key.");

            // 3. Export the *existing* symmetric key (currently in memory)
            const rawSymmetricKey = await window.crypto.subtle.exportKey('raw', currentKey);

            // 4. Re-encrypt the symmetric key with the NEW wrapping key
            const { ciphertext: newEncKeyPw, iv: newIvPw } = await encryptKey(currentKey, newWrappingKey); // Re-use encryptKey with the new wrapping key
            console.log("Re-encrypted symmetric key with new password key.");

            // 5. Encode new salt, ciphertext, and IV to Base64
            const newSaltB64 = arrayBufferToBase64(newSalt.buffer as ArrayBuffer);
            const newEncKeyPwB64 = arrayBufferToBase64(newEncKeyPw);
            const newIvPwB64 = arrayBufferToBase64(newIvPw.buffer as ArrayBuffer);

            // 6. Update the user's password in Supabase Auth
            console.log("Updating user password in Supabase Auth...");
            const { error: updateAuthError } = await supabase.auth.updateUser({
                password: newPassword
            });
            if (updateAuthError) throw new Error(`Failed to update password in Supabase Auth: ${updateAuthError.message}`);
            console.log("Supabase Auth password updated.");

            // 7. Update the user_keys table with the new salt, enc_key_pw, iv_pw
            // Note: enc_key_recovery and iv_recovery remain unchanged
            console.log("Updating user_keys table in database...");
            const { error: updateDbError } = await supabase
                .from('user_keys')
                .update({
                    salt: newSaltB64,
                    enc_key_pw: newEncKeyPwB64,
                    iv_pw: newIvPwB64,
                    // updated_at is handled by trigger (if set up)
                })
                .eq('user_id', currentUser.id);

            if (updateDbError) throw new Error(`Failed to update keys in database: ${updateDbError.message}`);
            console.log("User keys updated in database.");

            // 8. Optional: Re-derive the key with the new password/salt and update in memory?
            // This ensures the key in memory matches the *new* password derivation immediately.
            // Alternatively, require a new login, but this is smoother.
             const reDerivedKey = await deriveKeyFromPassword(newPassword, newSalt);
             const reDecryptedRaw = await decryptKey(newEncKeyPw, newIvPw, reDerivedKey);
             const finalSymmetricKey = await importSymmetricKey(reDecryptedRaw);
             set({ decryptedSymmetricKey: finalSymmetricKey });
             console.log("Key updated in memory to match new password derivation.");


            set({ isLoading: false, error: null });
            console.log("Password reset and key update process completed successfully.");
            return { success: true };

        } catch (error: any) {
            console.error("Password reset process error:", error);
            set({ isLoading: false, error: error.message || "An unknown error occurred during password reset." });
            // Note: State might be inconsistent here (e.g., password updated in Auth but not DB).
            // Consider more robust transaction handling if possible or manual recovery steps.
            return { success: false, error: error.message };
        }
    },

}));

// --- Optional: Initialize listener on module load ---
// This ensures the listener is set up once when the store is first imported.
// Alternatively, call initializeAuth from your root layout/provider.
useAuthStore.getState().initializeAuth();