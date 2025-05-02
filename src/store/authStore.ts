import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client'; // Use the browser client
import { userDbService } from '@/services/database';
import { encryptionService } from '@/lib/encryptionUtils';
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
import { KeyMaterial,
        EncryptedKeyData,
        RecoveryKeyData
} from '@/types/auth';

// Helper function to validate email format
const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Helper function to validate minimum password length and complexity
const isValidPassword = (password: string): boolean => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
        password.length >= minLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumber &&
        hasSpecialChar
    );
};

// Define the state structure
interface AuthState {
    user: User | null; // Current Supabase user
    session: Session | null; // Current Supabase session
    decryptedSymmetricKey: CryptoKey | null; // Store the actual CryptoKey object - only kept in memory
    isLoading: boolean; // Indicates if an async operation is in progress
    error: string | null; // Stores any error message
    isAuthenticated: () => boolean; // Derived state helper - checks if user and session exist

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
            generatedSymmetricKey: CryptoKey; // <-- Add the generated key
        } | null;
    }>;
    storeGeneratedKeys: (
        keyMaterial: NonNullable<AuthState['signup']['prototype']['keyMaterial']>,
        generatedKey: CryptoKey // <-- Add parameter for the key
    ) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    recoverWithKey: (recoveryKeyData: RecoveryKeyData) => Promise<{ success: boolean; error?: string }>; // For use after recovery
    resetPasswordAndUpdateKeys: (newPassword: string) => Promise<{ success: boolean; error?: string }>; // For use after recovery or password change

    // --- Internal Actions / State Setters ---
    setAuthState: (user: User | null, session: Session | null) => void;
    setDecryptedKey: (key: CryptoKey | null) => void; // Allow explicitly setting/clearing the key
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
    initializeAuth: () => Promise<void>; // Check initial auth state
}


//  Centralized error handling function to reduce repetitive error handling logic.
//  @param set - Zustand's set function to update the store.
//  @param supabase - The Supabase client.
//  @param error - The error object.
//  @param customMessage - Optional custom error message.
//  @param signOut - Whether to sign out the user after the error.
//  @returns An object with success: false and the error message.

const handleAuthError = async (
    set: any,
    supabase: any,
    error: any,
    customMessage?: string,
    signOut: boolean = false
) => {
    console.error("Authentication error:", error);
    const errorMessage = customMessage || error.message || "An unknown error occurred.";
    set({ isLoading: false, error: errorMessage });

    if (signOut && supabase) {
        await supabase.auth.signOut().catch((err: any) => console.error("Error signing out after error:", err));
        set({ decryptedSymmetricKey: null }); // Clear the decrypted key from memory
    }

    return { success: false, error: errorMessage };
};

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

    
    //  Sets the user and session state.
    //  @param user - The Supabase user object.
    //  @param session - The Supabase session object.
     
    setAuthState: (user, session) => {
        if (!user || !session) {
            console.error("Invalid user or session provided to setAuthState.");
            set({ user: null, session: null, isLoading: false, error: "Invalid user or session." });
            return;
        }

        set({ user, session, isLoading: false });
        console.log("Auth state updated:", { user, session });
    },

    
    //  Sets the decrypted symmetric key in the store.
    //  @param key - The decrypted symmetric key (CryptoKey object).
    
    setDecryptedKey: (key) => {
        if (key) {
            console.log("Decrypted symmetric key set in memory.");
        } else {
             console.log("Decrypted symmetric key cleared from memory.");
        }
        set({ decryptedSymmetricKey: key });
    },

    
    //  Sets the loading state.
    //  @param loading - A boolean indicating whether to show the loading state.
    
    setLoading: (loading) => set({ isLoading: loading }),

    
    //  Sets the error state.
    //  @param error - The error message.
    
    setError: (error: string | null) => set({ error, isLoading: false }), // Stop loading on error

    /**
     * Clears the error state.
     */
    clearError: () => set({ error: null }),

    /**
     * Initializes the authentication state by checking for an existing session.
     * This function is called once when the app loads.
     */
    initializeAuth: async () => {
        set({ isLoading: true });
        const supabase = createClient(); // Browser client

        try {
            // First check if we have a user from the direct authentication request
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error) {
                console.error("Error fetching auth user:", error);
                set({ user: null, session: null, isLoading: false, error: "Failed to initialize session." });
                return;
            }

            if (user) {
                set({ user, session: null, isLoading: false });
                console.log("User found:", user);

                // Get user security key if it exists
                const { data: userKeyData, error: userKeyError } = await supabase
                    .from('user_keys')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (userKeyError) {
                    console.error("Error fetching user key:", userKeyError);
                } else if (userKeyData) {
                    console.log("User key data found:", userKeyData);
                } else {
                    console.log("No user key data found.");
                }
            } else {
                set({ user: null, session: null, isLoading: false });
                console.log("No user found.");
            }
        } catch (error) {
            console.error("Error initializing auth:", error);
            set({ user: null, session: null, isLoading: false, error: "Failed to initialize session." });
        }
    },

   
    //  Logs in an existing user.
    //  @param email - The user's email address.
    //  @param password - The user's password.
    //  @returns An object with success: true if login is successful, or success: false and an error message otherwise.
    
    login: async (email: string, password: string): Promise<{
        success: boolean;
        error?: string;
        recoveryKeyNeeded?: boolean;
    }> => {
        set({ isLoading: true, error: null, decryptedSymmetricKey: null }); // Clear previous key on new login attempt
        const supabase = createClient();

        // Validate inputs
        if (!email || !isValidEmail(email)) {
            return handleAuthError(set, supabase, new Error("Invalid email address."), "Invalid email address.");
        }
        if (!password || !isValidPassword(password)) {
            return handleAuthError(set, supabase, new Error("Invalid password. Must be at least 8 characters."), "Invalid password. Must be at least 8 characters.");
        }

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
            const fetchedKeyData = await userDbService.fetchUserKeys(user.id);

                if (!fetchedKeyData) {
                    console.warn("User keys not found. Signup might be incomplete.");
                    set({ isLoading: false, error: "Encryption keys not found. Please complete signup or contact support." });
                    return { success: false, error: "Encryption keys not found.", recoveryKeyNeeded: true };
                }

                // Type assert keyData as EncryptedKeyData
                const encryptedKeyData: EncryptedKeyData = fetchedKeyData as EncryptedKeyData;

                if (!encryptedKeyData || !encryptedKeyData.salt || !encryptedKeyData.enc_key_pw || !encryptedKeyData.iv_pw) {
                    return handleAuthError(set, supabase, new Error("Incomplete key data fetched from database."), "Incomplete key data fetched from database.");
                }
                console.log("User keys fetched successfully.");

            // 3. Decode data
            const salt: ArrayBuffer = base64ToArrayBuffer(encryptedKeyData.salt);
            const encryptedKeyDataPw: ArrayBuffer = base64ToArrayBuffer(encryptedKeyData.enc_key_pw);
            const iv: Uint8Array = new Uint8Array(base64ToArrayBuffer(encryptedKeyData.iv_pw));

            // 4. Derive wrapping key from password
            console.log("Deriving key from password...");
            const wrappingKey: CryptoKey = await deriveKeyFromPassword(password, new Uint8Array(salt));
            console.log("Password key derived.");

            // 5. Decrypt the symmetric key
            console.log("Decrypting symmetric key...");
            const decryptedRawKey: ArrayBuffer = await decryptKey(encryptedKeyDataPw, new Uint8Array(iv), wrappingKey);
            console.log("Symmetric key decrypted.");

            // 6. Import the raw key into a CryptoKey object
            const symmetricKey: CryptoKey = await importSymmetricKey(decryptedRawKey);
            console.log("Symmetric key imported.");

            // 7. Store the decrypted key in state
            set({ decryptedSymmetricKey: symmetricKey, isLoading: false, error: null });
            console.log("Decrypted key stored in memory.");

            return { success: true };

        } catch (error: any) {
            return handleAuthError(set, supabase, error, undefined, true);
        }
    },

    
    //  Signs up a new user.
    //  @param email - The user's email address.
    //  @param password - The user's password.
    //  @returns An object with success: true if signup is successful, or success: false and an error message otherwise.
    //  If signup is successful, it also returns the key material needed to store the encryption keys.
    
    signup: async (email: string, password: string): Promise<{
        success: boolean;
        error?: string;
        keyMaterial?: KeyMaterial & { generatedSymmetricKey: CryptoKey } | null; // <-- Update return type
        }> => {
        set({ isLoading: true, error: null });
        const supabase = createClient();

        // Validate inputs
        if (!email || !isValidEmail(email)) {
            return handleAuthError(set, supabase, new Error("Invalid email address."), "Invalid email address.");
        }
        if (!password || !isValidPassword(password)) {
            return handleAuthError(set, supabase, new Error("Invalid password. Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."), "Invalid password. Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
        }

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
                    return handleAuthError(set, supabase, new Error("User already exists. Please log in or confirm your email."), "User already exists. Please log in or confirm your email.");
                }
                return handleAuthError(set, supabase, signUpError, `Sign up failed: ${signUpError.message}`);
            }
            // Handle cases where user exists but isn't confirmed, or general lack of user data
            if (!signUpData.user) {
                // Check if user might exist but needs confirmation
                const userExists = await userDbService.checkUserExists(email);
                
                if (userExists) {
                    return handleAuthError(set, supabase, new Error("User already exists. Please log in or confirm your email."), "User already exists. Please log in or confirm your email.");
                }
                
                return handleAuthError(set, supabase, new Error("No user data returned."), "Sign up failed: No user data returned.");
            }
            if (signUpData.user.identities?.length === 0) {
                // This can happen if email confirmation is required but the user already exists unconfirmed.
                // Supabase might return a user object but without an identity.
                 console.warn("User may already exist and require confirmation.");
                 // Depending on your flow, you might want to prompt the user to check their email again.
                 // For this flow, we'll treat it as a potential issue needing confirmation.
                 return handleAuthError(set, supabase, new Error("Sign up requires email confirmation. Please check your inbox (and spam folder)."), "Sign up requires email confirmation. Please check your inbox (and spam folder).");
            }

            const user = signUpData.user;
            console.log("Supabase sign up successful for user:", user.id);
            // Note: Session might be null if email confirmation is needed.
            // The onAuthStateChange listener will handle setting the session later if confirmation happens.
            set({ user: user, session: signUpData.session });

            // 2. Generate all cryptographic keys and material CLIENT-SIDE
            console.log("Generating cryptographic keys...");
            const salt: Uint8Array = generateSalt();
            const passwordDerivedKey: CryptoKey = await deriveKeyFromPassword(password, salt);
            const symmetricKey: CryptoKey = await generateRandomSymmetricKey(); // <-- Keep this key
            const recoveryKeyString: string = generateRecoveryKeyString(); // Generate the string for the user
            const recoveryDerivedKey: CryptoKey = await deriveKeyFromRecoveryString(recoveryKeyString, salt); // Use same salt

            // 3. Encrypt the symmetric key twice
            const { ciphertext: ctPw, iv: ivPw } = await encryptKey(symmetricKey, passwordDerivedKey);
            const { ciphertext: ctRec, iv: ivRec } = await encryptKey(symmetricKey, recoveryDerivedKey);

            // 4. Encode everything to Base64 for storage/transfer
            const saltB64: string = arrayBufferToBase64(salt.buffer as ArrayBuffer);
            const encKeyPwB64: string = arrayBufferToBase64(ctPw);
            const ivPwB64: string = arrayBufferToBase64(ivPw.buffer as ArrayBuffer);
            const encKeyRecoveryB64: string = arrayBufferToBase64(ctRec as ArrayBuffer);
            const ivRecoveryB64: string = arrayBufferToBase64(ivRec.buffer as ArrayBuffer);

            console.log("Keys generated and encrypted.");

            // 5. Return success and the necessary key material INCLUDING the raw key
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
                    recoveryKeyString, // Pass this back to UI!
                    generatedSymmetricKey: symmetricKey // <-- Return the key object
                }
            };

        } catch (error: any) {
            return handleAuthError(set, supabase, error, undefined, true);
        }
    },

    /**
     * Stores the generated encryption keys in the database.
     * @param keyMaterial - The key material generated during signup.
     * @param generatedKey - The generated symmetric key.
     * @returns An object with success: true if the keys are stored successfully, or success: false and an error message otherwise.
     */
    storeGeneratedKeys: async (
        keyMaterial: KeyMaterial,
        generatedKey: CryptoKey // <-- Accept the key
    ): Promise<{ success: boolean; error?: string }> => {
        set({ isLoading: true, error: null });
        const supabase = createClient();
        const currentUser = get().user;

        // Ensure the user performing this action matches the userId in keyMaterial
        if (!currentUser || currentUser.id !== keyMaterial.userId) {
            return handleAuthError(set, supabase, new Error("Authentication mismatch: Cannot store keys for a different user."), "Authentication mismatch: Cannot store keys for a different user.");
        }

        console.log("Storing generated keys for user:", keyMaterial.userId);

        if (currentUser.id !== keyMaterial.userId) {
            console.error("User ID mismatch:", currentUser.id, keyMaterial.userId);
            return handleAuthError(set, supabase, new Error("User ID mismatch: The user ID in the key material does not match the current user's ID."), "User ID mismatch: The user ID in the key material does not match the current user's ID.");
        }

        const auth = await supabase.auth.getUser();
        console.log("Current user ID from auth:", auth?.data?.user?.id);
        console.log("Current user ID from store:", currentUser.id);
        console.log("Key material user ID:", keyMaterial.userId);
        
        const maxRetries = 3;
        let attempt = 0;

        while (attempt < maxRetries) {
            try {
                // Validate schema compatibility (e.g., check required fields)
                if (!keyMaterial.saltB64 || !keyMaterial.encKeyPwB64 || !keyMaterial.ivPwB64) {
                    throw new Error("Invalid key material: Missing required fields.");
                }

                const result = await userDbService.storeUserKeys(keyMaterial);

                if (!result.success) {
                    return handleAuthError(
                        set, 
                        supabase, 
                        new Error(`Failed to store keys: ${result.error}`), 
                        `Failed to store keys: ${result.error}`
                    );
                }

                console.log("Keys stored successfully in database.");
                // --- NEW: Set the decrypted key in state ---
                set({ decryptedSymmetricKey: generatedKey, isLoading: false, error: null });
                console.log("Decrypted key set in memory after signup.");
                // --- End NEW ---

                // Initialize encryption service immediately if needed
                try {
                    // Use the singleton directly
                    await encryptionService.initialize(generatedKey);
                    console.log("Encryption service initialized immediately after key storage.");
                  } catch (initError) {
                    console.error("Failed to initialize encryption service immediately:", initError);
                    // This might not be fatal, but log it. The hook might retry later.
                  }

                return { success: true };

            } catch (error: any) {
                console.error(`Attempt ${attempt + 1} to store keys failed:`, error.message);
                console.log("RLS violation details:", {
                    userIdFromAuth: auth?.data?.user?.id,
                    userIdFromStore: currentUser.id,
                    userIdFromKeyMaterial: keyMaterial.userId
                });
                if (attempt === maxRetries - 1) {
                    return handleAuthError(set, supabase, error, "Failed to store encryption keys after multiple attempts.");
                }

                attempt++;
            }
        }

        // Ensure a return statement outside the loop
        return handleAuthError(set, supabase, new Error("Failed to store encryption keys after all attempts."), "Failed to store encryption keys after all attempts.");
    },

    /**
     * Logs out the current user.
     */
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

    //  Recovers the symmetric key using the recovery key.
    //  Assumes key data (salt, enc_key_recovery, iv_recovery) for the user
    //  has ALREADY been fetched securely (e.g., via a dedicated API route/server action using email)
    //  and passed into this function.
    //  @param recoveryKeyString - The user's recovery key.
    //  @param saltB64 - The base64 encoded salt.
    //  @param encKeyRecoveryB64 - The base64 encoded encrypted key (encrypted with recovery key).
    //  @param ivRecoveryB64 - The base64 encoded IV for the encrypted key (encrypted with recovery key).
    //  @returns An object with success: true if the key is recovered successfully, or success: false and an error message otherwise.

    recoverWithKey: async (
        recoveryKeyData: RecoveryKeyData
    ): Promise<{ success: boolean; error?: string }> => {
        set({ isLoading: true, error: null, decryptedSymmetricKey: null }); // Clear previous key

        // Validate inputs
        if (!recoveryKeyData.recoveryKeyString) {
            return handleAuthError(set, null, new Error("Recovery key is required."), "Recovery key is required.");
        }
        if (!recoveryKeyData.saltB64) {
            return handleAuthError(set, null, new Error("Salt is required."), "Salt is required.");
        }
        if (!recoveryKeyData.encKeyRecoveryB64) {
            return handleAuthError(set, null, new Error("Encrypted key is required."), "Encrypted key is required.");
        }
        if (!recoveryKeyData.ivRecoveryB64) {
            return handleAuthError(set, null, new Error("IV is required."), "IV is required.");
        }

        try {
            console.log("Attempting key recovery...");

            // 1. Decode fetched data
            const salt = base64ToArrayBuffer(recoveryKeyData.saltB64);
            const encryptedKeyData = base64ToArrayBuffer(recoveryKeyData.encKeyRecoveryB64);
            const iv = base64ToArrayBuffer(recoveryKeyData.ivRecoveryB64);

            // 2. Derive wrapping key from recovery string
            console.log("Deriving key from recovery string...");
            const wrappingKey = await deriveKeyFromRecoveryString(recoveryKeyData.recoveryKeyString, new Uint8Array(salt));
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
            return handleAuthError(set, null, error, "Failed to recover key. Invalid recovery key or data.");
        }
    },

    
    //  Resets the user's password and updates the encryption keys.
    //  @param newPassword - The new password.
    //  @returns An object with success: true if the password is reset successfully, or success: false and an error message otherwise.
    
    resetPasswordAndUpdateKeys: async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
        set({ isLoading: true, error: null });
        const supabase = createClient();
        const currentKey = get().decryptedSymmetricKey;
        const currentUser = get().user;

        // Validate inputs
        if (!newPassword || !isValidPassword(newPassword)) {
            return handleAuthError(set, supabase, new Error("Invalid password. Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."), "Invalid password. Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
        }

        if (!currentKey) {
            return handleAuthError(set, supabase, new Error("Cannot reset password: Decrypted symmetric key not available in memory. Please recover using your recovery key first."), "Cannot reset password: Decrypted symmetric key not available in memory. Please recover using your recovery key first.");
        }
        if (!currentUser) {
            return handleAuthError(set, supabase, new Error("Cannot reset password: No authenticated user found."), "Cannot reset password: No authenticated user found.");
        }

        console.log("Starting password reset and key re-encryption...");

        try {
            // 1. Generate a NEW salt
            const currentSaltB64 = await userDbService.fetchUserSalt(currentUser.id);

            if (!currentSaltB64) {
                throw new Error("Failed to fetch current salt for password reset.");
            }
            const currentSalt = base64ToArrayBuffer(currentSaltB64);

            // 2. Derive a NEW wrapping key from the new password and new salt
            const newWrappingKey = await deriveKeyFromPassword(newPassword, new Uint8Array(currentSalt));
            console.log("Derived new password wrapping key.");

            // 3. Export the *existing* symmetric key (currently in memory)
            const rawSymmetricKey = await window.crypto.subtle.exportKey('raw', currentKey);

            // 4. Re-encrypt the symmetric key with the NEW wrapping key
            const { ciphertext: newEncKeyPw, iv: newIvPw } = await encryptKey(currentKey, newWrappingKey); // Re-use encryptKey with the new wrapping key
            console.log("Re-encrypted symmetric key with new password key.");

            // 5. Encode the ciphertext and IV to Base64
            const newEncKeyPwB64 = arrayBufferToBase64(newEncKeyPw);
            const newIvPwB64 = arrayBufferToBase64(newIvPw.buffer as ArrayBuffer);

            // 6. Update the user's password in Supabase Auth
            console.log("Updating user password in Supabase Auth...");
            const { error: updateAuthError } = await supabase.auth.updateUser({
                password: newPassword
            });
            if (updateAuthError) throw new Error(`Failed to update password in Supabase Auth: ${updateAuthError.message}`);
            console.log("Supabase Auth password updated.");

            // 7. Update the user_keys table with the enc_key_pw and iv_pw
            // Note: enc_key_recovery and iv_recovery remain unchanged
            console.log("Updating user_keys table in database...");
            const updateResult = await userDbService.updateUserPasswordKey(
                currentUser.id,
                newEncKeyPwB64,
                newIvPwB64
            );
            
            if (!updateResult.success) {
                return handleAuthError(
                    set, 
                    supabase, 
                    new Error(updateResult.error || "Unknown error"), 
                    `Failed to update keys in database: ${updateResult.error}`
                );
            }
            console.log("User keys updated in database.");

            // 8. Optional: Re-derive the key with the new password/salt and update in memory?
            // This ensures the key in memory matches the *new* password derivation immediately.
            // Alternatively, require a new login, but this is smoother.
             const reDerivedKey = await deriveKeyFromPassword(newPassword, new Uint8Array(currentSalt));
             const reDecryptedRaw = await decryptKey(newEncKeyPw, newIvPw, reDerivedKey);
             const finalSymmetricKey = await importSymmetricKey(reDecryptedRaw);
             set({ decryptedSymmetricKey: finalSymmetricKey });
             console.log("Key updated in memory to match new password derivation.");


            set({ isLoading: false, error: null });
            console.log("Password reset and key update process completed successfully.");
            return { success: true };

        } catch (error: any) {
            return handleAuthError(set, supabase, error, "An unknown error occurred during password reset.");
        }
    },

}));

// --- Optional: Initialize listener on module load ---
// This ensures the listener is set up once when the store is first imported.
// Alternatively, call initializeAuth from your root layout/provider.
useAuthStore.getState().initializeAuth();