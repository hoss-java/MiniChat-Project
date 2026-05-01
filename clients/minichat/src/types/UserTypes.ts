// src/types/UserTypes.ts
/**
 * User interface
 * Represents authenticated user data
 * - id: Unique user identifier
 * - username: User's login username
 * - email: User's email address
 * - publicKey: User's RSA public key for encryption
 * - fingerprint: SHA256 hash of public key for verification
 * - createdAt: Account creation timestamp (ISO 8601)
 */
export interface User {
  id: string;
  username: string;
  email: string;
  publicKey?: string;
  fingerprint?: string;
  createdAt?: string;
}
