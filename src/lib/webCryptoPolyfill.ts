import * as Crypto from 'expo-crypto';

/**
 * Supabase PKCE requires SHA-256 (S256). Without `crypto.subtle`, auth-js uses "plain"
 * and GoTrue may reject the flow or fail to return to the app.
 */
export function ensureWebCryptoForSupabasePkce(): void {
  const g = globalThis as typeof globalThis & {
    crypto?: Crypto & { subtle?: SubtleCrypto };
  };
  const existing = g.crypto ?? ({} as Crypto);
  if (typeof existing.subtle?.digest === 'function') {
    return;
  }

  const subtle = {
    async digest(algorithm: AlgorithmIdentifier, data: BufferSource): Promise<ArrayBuffer> {
      const name = typeof algorithm === 'string' ? algorithm : (algorithm as Algorithm).name;
      if (name !== 'SHA-256' && name !== 'sha256') {
        throw new Error(`Unsupported digest algorithm: ${name}`);
      }
      const bytes =
        data instanceof ArrayBuffer
          ? new Uint8Array(data)
          : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      return Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes);
    },
  } as SubtleCrypto;

  g.crypto = Object.assign(existing, { subtle });
}
