// Export main service
export { keyManagementService, KeyManagementService } from './KeyManagementService';

// Export React hook
export { useKeyManagement } from './useKeyManagement';

// Export utility functions
export {
  encryptText,
  decryptText,
  encryptMetadata,
  decryptMetadata,
  encryptVector,
  decryptVector
} from './cryptoUtils';

// Export interfaces
export type {
  KeyStorageProvider,
  CryptoProvider,
  DCPEProvider,
  StorageResult
} from './interfaces';