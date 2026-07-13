import { fromBase64, toArrayBuffer, toBase64 } from "./base64";

export const encryptText = async (plaintext: string, key: CryptoKey) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  return {
    ciphertext: toBase64(new Uint8Array(ciphertext)),
    iv: toBase64(iv),
  };
};

export const decryptText = async (ciphertext: string, iv: string, key: CryptoKey) => {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(iv) },
    key,
    toArrayBuffer(fromBase64(ciphertext))
  );

  return new TextDecoder().decode(decrypted);
};
