export const toBase64 = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes));

export const fromBase64 = (value: string) =>
  Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

export const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
