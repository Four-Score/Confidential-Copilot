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
