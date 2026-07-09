/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const DB_NAME = 'dupla_pdf_history_db';
const STORE_NAME = 'pdf_bytes';
const DB_VERSION = 1;

export function initDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is only available in the browser'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open database'));
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function savePdfBytes(id: string, bytes: ArrayBuffer | Uint8Array): Promise<void> {
  try {
    const db = await initDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const dataToStore = bytes instanceof Uint8Array ? bytes.buffer : bytes;
      const request = store.put(dataToStore, id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save pdf bytes'));
    });
  } catch (error) {
    console.error('savePdfBytes failed:', error);
  }
}

export async function getPdfBytes(id: string): Promise<ArrayBuffer | null> {
  try {
    const db = await initDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = (event: any) => {
        resolve(event.target.result || null);
      };
      request.onerror = () => reject(new Error('Failed to get pdf bytes'));
    });
  } catch (error) {
    console.error('getPdfBytes failed:', error);
    return null;
  }
}

export async function deletePdfBytes(id: string): Promise<void> {
  try {
    const db = await initDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete pdf bytes'));
    });
  } catch (error) {
    console.error('deletePdfBytes failed:', error);
  }
}

export async function clearAllPdfBytes(): Promise<void> {
  try {
    const db = await initDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear all pdf bytes'));
    });
  } catch (error) {
    console.error('clearAllPdfBytes failed:', error);
  }
}
