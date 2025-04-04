// Type for cryptographic key material generated during signup
export interface KeyMaterial {
    userId: string;
    saltB64: string;
    encKeyPwB64: string;
    ivPwB64: string;
    encKeyRecoveryB64: string;
    ivRecoveryB64: string;
    recoveryKeyString: string; // The recovery key to display to the user
}

// Type for encrypted key data fetched from the database
export interface EncryptedKeyData {
    salt: string;
    enc_key_pw: string;
    iv_pw: string;
    enc_key_recovery: string;
    iv_recovery: string;
}

// Type for recovery key data used during recovery
export interface RecoveryKeyData {
    recoveryKeyString: string;
    saltB64: string;
    encKeyRecoveryB64: string;
    ivRecoveryB64: string;
}

// Enum for the sign-up flow steps
export enum SignUpStep {
    CREDENTIALS = 0,
    RECOVERY_KEY = 1,
    SUCCESS = 2,
  }

// Props for the RecoveryKeyDisplay component
export interface RecoveryKeyDisplayProps {
    recoveryKeyString: string;
    isChecked: boolean;
    onCheckChange: (checked: boolean) => void;
    onContinue: () => void;
    onGoBack: () => void;
    isLoading: boolean;
  }