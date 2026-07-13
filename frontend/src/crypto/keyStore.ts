import { fromBase64, toArrayBuffer, toBase64 } from "./base64";

const DB_NAME = "jchat-crypto";
const DB_VERSION = 1;
const IDENTITY_STORE = "identity-keys";
const CHAT_KEY_STORE = "chat-keys";

interface IdentityRecord {
  userId: string;
  privateKeyJwk: JsonWebKey;
}

interface ChatKeyRecord {
  chatId: string;
  rawKey: string;
}

const openDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(IDENTITY_STORE)) {
        db.createObjectStore(IDENTITY_STORE, { keyPath: "userId" });
      }

      if (!db.objectStoreNames.contains(CHAT_KEY_STORE)) {
        db.createObjectStore(CHAT_KEY_STORE, { keyPath: "chatId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open crypto database"));
  });

const runTransaction = async <T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
) => {
  const db = await openDatabase();

  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = operation(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB operation failed"));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
  });
};

export const saveIdentityPrivateKey = async (userId: string, privateKeyJwk: JsonWebKey) => {
  await runTransaction(IDENTITY_STORE, "readwrite", (store) =>
    store.put({ userId, privateKeyJwk } satisfies IdentityRecord)
  );
};

export const loadIdentityPrivateKey = async (userId: string) => {
  const record = await runTransaction<IdentityRecord | undefined>(
    IDENTITY_STORE,
    "readonly",
    (store) => store.get(userId)
  );

  return record?.privateKeyJwk ?? null;
};

export const saveChatKeyRaw = async (chatId: string, rawKey: Uint8Array) => {
  await runTransaction(CHAT_KEY_STORE, "readwrite", (store) =>
    store.put({ chatId, rawKey: toBase64(rawKey) } satisfies ChatKeyRecord)
  );
};

export const loadChatKeyRaw = async (chatId: string) => {
  const record = await runTransaction<ChatKeyRecord | undefined>(
    CHAT_KEY_STORE,
    "readonly",
    (store) => store.get(chatId)
  );

  return record ? fromBase64(record.rawKey) : null;
};

export const clearChatKeyRaw = async (chatId: string) => {
  await runTransaction(CHAT_KEY_STORE, "readwrite", (store) => store.delete(chatId));
};

export const importAesKeyFromRaw = async (rawKey: Uint8Array) =>
  crypto.subtle.importKey("raw", toArrayBuffer(rawKey), { name: "AES-GCM" }, true, [
    "encrypt",
    "decrypt",
  ]);

export const exportRawAesKey = async (key: CryptoKey) =>
  new Uint8Array(await crypto.subtle.exportKey("raw", key));
