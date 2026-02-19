// Web Crypto API utilities for encrypting/decrypting sensitive session data
// Uses AES-GCM with a device-bound key stored in IndexedDB

import { logger } from '@/utils/logger';

const CRYPTO_DB_NAME = 'acls_crypto';
const CRYPTO_STORE_NAME = 'keys';
const KEY_ID = 'session-encryption-key';

// Open crypto key database
async function openCryptoDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CRYPTO_DB_NAME, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(CRYPTO_STORE_NAME)) {
        db.createObjectStore(CRYPTO_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

// Generate a new AES-GCM key
async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, // extractable for storage
    ['encrypt', 'decrypt']
  );
}

// Store the key in IndexedDB
async function storeKey(key: CryptoKey): Promise<void> {
  const db = await openCryptoDB();
  const exportedKey = await crypto.subtle.exportKey('raw', key);
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CRYPTO_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(CRYPTO_STORE_NAME);
    const request = store.put({ id: KEY_ID, key: Array.from(new Uint8Array(exportedKey)) });
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Retrieve the key from IndexedDB, or generate a new one
async function getOrCreateKey(): Promise<CryptoKey> {
  const db = await openCryptoDB();
  
  return new Promise(async (resolve, reject) => {
    const transaction = db.transaction(CRYPTO_STORE_NAME, 'readonly');
    const store = transaction.objectStore(CRYPTO_STORE_NAME);
    const request = store.get(KEY_ID);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = async () => {
      try {
        if (request.result) {
          // Import existing key
          const keyData = new Uint8Array(request.result.key);
          const key = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
          );
          resolve(key);
        } else {
          // Generate and store new key
          const key = await generateKey();
          await storeKey(key);
          resolve(key);
        }
      } catch (err) {
        reject(err);
      }
    };
  });
}

// Encrypt data using AES-GCM
export async function encryptData(data: string): Promise<string> {
  try {
    const key = await getOrCreateKey();
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    );
    
    // Combine IV + encrypted data and encode as base64
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  } catch (err) {
    logger.error('Encryption failed', err);
    throw err;
  }
}

// Decrypt data using AES-GCM
export async function decryptData(encryptedData: string): Promise<string> {
  try {
    const key = await getOrCreateKey();
    
    // Decode base64 and split IV from encrypted data
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(c => c.charCodeAt(0))
    );
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (err) {
    logger.error('Decryption failed', err);
    throw err;
  }
}

// Check if Web Crypto API is available
export function isCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && 
         typeof crypto.subtle !== 'undefined' &&
         typeof indexedDB !== 'undefined';
}

export async function clearCryptoDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(CRYPTO_DB_NAME);

    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
    request.onsuccess = () => resolve();
  });
}

// Encrypted localStorage wrapper
export const encryptedStorage = {
  async setItem(key: string, value: string): Promise<void> {
    if (isCryptoAvailable()) {
      const encrypted = await encryptData(value);
      localStorage.setItem(key, encrypted);
      localStorage.setItem(`${key}_encrypted`, 'true');
    } else {
      // Fallback to plain storage if crypto unavailable
      localStorage.setItem(key, value);
      localStorage.removeItem(`${key}_encrypted`);
    }
  },
  
  async getItem(key: string): Promise<string | null> {
    const value = localStorage.getItem(key);
    if (!value) return null;
    
    const isEncrypted = localStorage.getItem(`${key}_encrypted`) === 'true';
    
    if (isEncrypted && isCryptoAvailable()) {
      try {
        return await decryptData(value);
      } catch {
        // If decryption fails, return null (corrupted or wrong key)
        return null;
      }
    }
    
    return value;
  },
  
  removeItem(key: string): void {
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_encrypted`);
  }
};
