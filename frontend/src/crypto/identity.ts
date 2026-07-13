import { toArrayBuffer, toBase64, fromBase64 } from "./base64";
import { loadIdentityPrivateKey, saveIdentityPrivateKey } from "./keyStore";

const ECDH_PARAMS: EcKeyImportParams = { name: "ECDH", namedCurve: "P-256" };

export const generateIdentityKeyPair = async () =>
  crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );

export const exportPublicKeyJwk = async (publicKey: CryptoKey) => {
  const jwk = await crypto.subtle.exportKey("jwk", publicKey);
  return JSON.stringify(jwk);
};

export const importPublicKeyJwk = async (publicKeyJwk: string) => {
  const jwk = JSON.parse(publicKeyJwk) as JsonWebKey;
  return crypto.subtle.importKey("jwk", jwk, ECDH_PARAMS, true, []);
};

export const loadIdentityPrivateCryptoKey = async (userId: string) => {
  const privateKeyJwk = await loadIdentityPrivateKey(userId);

  if (!privateKeyJwk) {
    return null;
  }

  return crypto.subtle.importKey("jwk", privateKeyJwk, ECDH_PARAMS, true, [
    "deriveKey",
    "deriveBits",
  ]);
};

export const ensureIdentityKeys = async (userId: string) => {
  const existingPrivateKey = await loadIdentityPrivateCryptoKey(userId);

  if (existingPrivateKey) {
    const privateJwk = await crypto.subtle.exportKey("jwk", existingPrivateKey);
    const publicJwk: JsonWebKey = {
      kty: privateJwk.kty,
      crv: privateJwk.crv,
      x: privateJwk.x,
      y: privateJwk.y,
    };
    const publicKey = await crypto.subtle.importKey("jwk", publicJwk, ECDH_PARAMS, true, []);

    return {
      privateKey: existingPrivateKey,
      publicKeyJwk: await exportPublicKeyJwk(publicKey),
    };
  }

  const keyPair = await generateIdentityKeyPair();
  const privateJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
  await saveIdentityPrivateKey(userId, privateJwk);

  return {
    privateKey: keyPair.privateKey,
    publicKeyJwk: await exportPublicKeyJwk(keyPair.publicKey),
  };
};

export const deriveAesKey = async (sharedSecret: ArrayBuffer, salt: string) => {
  const baseKey = await crypto.subtle.importKey("raw", sharedSecret, "HKDF", false, [
    "deriveKey",
  ]);

  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new TextEncoder().encode(salt),
      info: new TextEncoder().encode("jchat-e2ee"),
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

export const deriveDirectChatKey = async (
  chatId: string,
  privateKey: CryptoKey,
  otherPublicKeyJwk: string
) => {
  const otherPublicKey = await importPublicKeyJwk(otherPublicKeyJwk);
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: otherPublicKey },
    privateKey,
    256
  );

  return deriveAesKey(sharedBits, chatId);
};

export const wrapChatKeyForUser = async (
  rawChatKey: Uint8Array,
  recipientPublicKeyJwk: string
) => {
  const ephemeralKeyPair = await generateIdentityKeyPair();
  const recipientPublicKey = await importPublicKeyJwk(recipientPublicKeyJwk);
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: recipientPublicKey },
    ephemeralKeyPair.privateKey,
    256
  );
  const wrapKey = await deriveAesKey(sharedBits, "jchat-wrap");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    wrapKey,
    toArrayBuffer(rawChatKey)
  );

  return {
    wrappedKey: toBase64(new Uint8Array(ciphertext)),
    iv: toBase64(iv),
    ephemeralPublicKey: await exportPublicKeyJwk(ephemeralKeyPair.publicKey),
  };
};

export const unwrapChatKey = async (
  wrapped: { wrappedKey: string; iv: string; ephemeralPublicKey: string },
  privateKey: CryptoKey
) => {
  const ephemeralPublicKey = await importPublicKeyJwk(wrapped.ephemeralPublicKey);
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: ephemeralPublicKey },
    privateKey,
    256
  );
  const wrapKey = await deriveAesKey(sharedBits, "jchat-wrap");
  const iv = fromBase64(wrapped.iv);
  const ciphertext = fromBase64(wrapped.wrappedKey);
  const rawKey = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    wrapKey,
    toArrayBuffer(ciphertext)
  );

  return new Uint8Array(rawKey);
};

export const generateRawChatKey = () => crypto.getRandomValues(new Uint8Array(32));
