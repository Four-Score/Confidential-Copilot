import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client'; // Use the browser client
import { userDbService } from '@/services/database';
import { keyManagementService } from '@/services/keyManagement'; // Import only the new key management service
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
import { 
    storeSymmetricKeyInSession, 
    getSymmetricKeyFromSession,
    clearSessionKey 
} from '@/services/keyManagement/sessionKeyManager';


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
    checkSessionStorage: () => Promise<boolean>;
    recoverKeyFromSession: () => Promise<boolean>;
    recoverWithPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
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
            // Get existing session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
                if (sessionError.message?.includes("Auth session missing") || 
                   sessionError.message?.includes("Refresh Token Not Found") ||
                   sessionError.name === "AuthSessionMissingError") {
                    console.log("No active session found - user not logged in");
                    set({ user: null, session: null, isLoading: false, error: null });
                    return;
                }
                
                console.error("Error fetching auth session:", sessionError);
                set({ user: null, session: null, isLoading: false, error: "Failed to initialize session." });
                return;
            }

            if (session) {
                // Set user and session from existing session
                set({ 
                    user: session.user,
                    session: session
                });

                try {
                    // Check session storage for symmetric key
                    console.log("Checking session storage for symmetric key");
                    const sessionKey = await getSymmetricKeyFromSession();
                    if (sessionKey) {
                        console.log('Found symmetric key in session storage');
                        set({ decryptedSymmetricKey: sessionKey });
                        
                        // Initialize key management service with session key
                        try {
                            await keyManagementService.initialize(session.user.id, sessionKey);
                            console.log("Key management service initialized from session storage");
                        } catch (initError) {
                            console.error("Failed to initialize key management service from session:", initError);
                        }
                    } else {
                        console.log("No symmetric key found in session storage");
                        // Continue without key - user will need to log in again
                    }
                } catch (sessionStorageError) {
                    console.error("Failed to check session storage:", sessionStorageError);
                }
                
                try {
                    // Attempt to load the user's encryption keys if session exists
                    const userId = session.user.id;
                    const keyData = await userDbService.fetchUserKeys(userId);
                    
                    if (keyData) {
                        console.log('Found existing user keys, session restored');
                        // Note: For security, we're not automatically loading the symmetric key
                        // The user will need to log in again to decrypt the key
                    } else {
                        console.log("No user key data found.");
                    }
                } catch (error) {
                    console.error('Error loading keys for existing session:', error);
                    // Continue with authenticated session but without keys loaded
                }
            } else {
                set({ user: null, session: null });
                console.log("No active session found.");
            }
            
            // Set up the auth state change listener
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
                console.log("Auth state changed:", event);
                if (currentSession) {
                    set({ user: currentSession.user, session: currentSession });
                } else {
                    // Clear auth state and decrypted key when session is lost
                    set({ user: null, session: null, decryptedSymmetricKey: null });
                }
            });
            
            set({ isLoading: false });
        } catch (error: any) {
            if (error.message?.includes("Auth session missing") || 
                error.name === "AuthSessionMissingError") {
                console.log("No active session found - user not logged in");
                set({ user: null, session: null, isLoading: false, error: null });
                return;
            }
            
            console.error("Error initializing auth:", error);
            set({ 
                user: null, 
                session: null, 
                isLoading: false, 
                error: error instanceof Error ? error.message : "Failed to initialize session." 
            });
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

            // Store the symmetric key in session storage
            try {
                await storeSymmetricKeyInSession(symmetricKey);
                console.log("Symmetric key saved to session storage");
            } catch (sessionError) {
                console.error("Failed to save key to session storage:", sessionError);
                // Non-fatal error, continue with login
            }

            // 8. Initialize the new key management service
            try {
                await keyManagementService.initialize(user.id, symmetricKey);
                console.log("Key management service initialized.");
            } catch (initError) {
                console.error("Failed to initialize key management service:", initError);
                // Non-fatal error, continue with login
            }

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
                
                set({ decryptedSymmetricKey: generatedKey, isLoading: false, error: null });
                console.log("Decrypted key set in memory after signup.");
                // Store the symmetric key in session storage
                try {
                    await storeSymmetricKeyInSession(generatedKey);
                    console.log("Symmetric key saved to session storage after signup");
                } catch (sessionError) {
                    console.error("Failed to save key to session storage:", sessionError);
                    // Non-fatal error, continue with signup
                }

              

                // Initialize the key management service with new keys immediately
                try {
                    // Use initializeWithNewKeys to generate fresh DCPE keys during signup
                    await keyManagementService.initializeWithNewKeys(currentUser.id, generatedKey);
                    console.log("Key management service initialized with new DCPE keys during signup.");
                } catch (initError) {
                    console.error("Failed to initialize key management service during signup:", initError);
                    // This is non-fatal, but log it
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
        
        // Clear the session key
        try {
            await clearSessionKey();
            console.log("Cleared symmetric key from session storage");
        } catch (error) {
            console.error("Error clearing session key:", error);
            // Non-fatal error, continue with logout
        }
        
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
            
            // Store the symmetric key in session storage
            try {
                await storeSymmetricKeyInSession(symmetricKey);
                console.log("Symmetric key saved to session storage after recovery");
            } catch (sessionError) {
                console.error("Failed to save key to session storage after recovery:", sessionError);
                // Non-fatal error, continue with recovery
            }

            // 6. Initialize the new key management service if user is available
            const currentUser = get().user;
            if (currentUser) {
                try {
                    await keyManagementService.initialize(currentUser.id, symmetricKey);
                    console.log("Key management service initialized after key recovery.");
                } catch (initError) {
                    console.error("Failed to initialize key management service after recovery:", initError);
                    // Non-fatal error, continue with recovery
                }
            }

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
            
            // Update the key in session storage
            try {
                await storeSymmetricKeyInSession(finalSymmetricKey);
                console.log("Updated symmetric key saved to session storage after password reset");
            } catch (sessionError) {
                console.error("Failed to update key in session storage:", sessionError);
                // Non-fatal error, continue with password reset
            }

            set({ isLoading: false, error: null });
            console.log("Password reset and key update process completed successfully.");
            return { success: true };

        } catch (error: any) {
            return handleAuthError(set, supabase, error, "An unknown error occurred during password reset.");
        }
    },

    /**
     * Checks session storage for a saved symmetric key
     * @returns Promise<boolean> indicating if a key was successfully retrieved
     */
    checkSessionStorage: async (): Promise<boolean> => {
        try {
            console.log("Checking session storage for saved symmetric key");
            const symmetricKey = await getSymmetricKeyFromSession();
            
            if (symmetricKey) {
                console.log("Found symmetric key in session storage");
                set({ decryptedSymmetricKey: symmetricKey });
                
                // Initialize key management service with the session key
                const user = get().user;
                if (user) {
                    try {
                        await keyManagementService.initialize(user.id, symmetricKey);
                        console.log("Key management service initialized with session key");
                        return true;
                    } catch (error) {
                        console.error("Failed to initialize key management with session key:", error);
                    }
                }
            } else {
                console.log("No symmetric key found in session storage");
            }
            return false;
        } catch (error) {
            console.error("Error retrieving key from session storage:", error);
            return false;
        }
    },

    recoverKeyFromSession: async (): Promise<boolean> => {
        const user = get().user;
        const supabase = createClient();
        
        if (!user) return false;
        
        try {
        set({ isLoading: true });
        
        // First try session storage
        const sessionKey = await getSymmetricKeyFromSession();
        if (sessionKey) {
            set({ decryptedSymmetricKey: sessionKey });
            await keyManagementService.initialize(user.id, sessionKey);
            set({ isLoading: false });
            return true;
        }
        
        // If that fails, try to recover using database key data
        // Note: This will require the Supabase JWT token to have the correct permissions
        
        // 1. Get the user's key material
        console.log("Attempting to recover key from database in new tab...");
        const keyData = await userDbService.fetchUserKeys(user.id);
        
        if (!keyData || !keyData.enc_key_pw || !keyData.iv_pw || !keyData.salt) {
            console.log("Could not find key data in database");
            set({ isLoading: false });
            return false;
        }
        
        // 2. Request the user to re-enter their password
        // This would require a UI prompt - for now we'll just return false
        console.log("Would need password to recover key - returning false for now");
        set({ isLoading: false });
        return false;
        
        // In a complete implementation, you would:
        // - Show a password prompt modal
        // - Use the password to decrypt the key
        // - Store in sessionStorage
        // - Initialize the key management service
        } catch (error) {
        console.error("Error in recoverKeyFromSession:", error);
        set({ isLoading: false, error: "Failed to recover key from session" });
        return false;
        }
    },
    recoverWithPassword: async (password: string): Promise<{ success: boolean; error?: string }> => {
        const user = get().user;
        
        if (!user) {
          return { success: false, error: "Not authenticated" };
        }
        
        try {
          set({ isLoading: true, error: null });
          
          // 1. Fetch the user's key material
          const keyData = await userDbService.fetchUserKeys(user.id);
          
          if (!keyData || !keyData.enc_key_pw || !keyData.iv_pw || !keyData.salt) {
            set({ isLoading: false, error: "Key data not found" });
            return { success: false, error: "Encryption keys not found in database" };
          }
          
          // 2. Decode data
          const salt = base64ToArrayBuffer(keyData.salt);
          const encryptedKeyData = base64ToArrayBuffer(keyData.enc_key_pw);
          const iv = new Uint8Array(base64ToArrayBuffer(keyData.iv_pw));
          
          // 3. Derive wrapping key from password
          console.log("Deriving key from password...");
          const wrappingKey = await deriveKeyFromPassword(password, new Uint8Array(salt));
          
          // 4. Decrypt the symmetric key
          console.log("Decrypting symmetric key...");
          try {
            const decryptedRawKey = await decryptKey(encryptedKeyData, iv, wrappingKey);
            const symmetricKey = await importSymmetricKey(decryptedRawKey);
            
            // 5. Store in state and session storage
            set({ decryptedSymmetricKey: symmetricKey });
            await storeSymmetricKeyInSession(symmetricKey);
            console.log("Key recovered successfully and stored in session");
            
            // 6. Initialize key management service
            await keyManagementService.initialize(user.id, symmetricKey);
            console.log("Key management service initialized from password recovery");
            
            set({ isLoading: false });
            return { success: true };
          } catch (decryptError) {
            console.error("Failed to decrypt key:", decryptError);
            set({ isLoading: false, error: "Invalid password" });
            return { success: false, error: "Invalid password" };
          }
        } catch (error) {
          console.error("Error recovering with password:", error);
          set({ isLoading: false, error: "Failed to recover key" });
          return { success: false, error: "An error occurred while recovering your key" };
        }
      },

}));

// --- Optional: Initialize listener on module load ---
// This ensures the listener is set up once when the store is first imported.
// Alternatively, call initializeAuth from your root layout/provider.
useAuthStore.getState().initializeAuth();