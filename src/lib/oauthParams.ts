/** Parse OAuth callback query or hash (#code=, #access_token=, ?code=). */
export function parseOAuthParamsFromUrl(url: string): {
  code?: string | null;
  error?: string | null;
  error_description?: string | null;
} {
  const out: {
    code?: string | null;
    error?: string | null;
    error_description?: string | null;
  } = {};

  try {
    const parsed = new URL(url);
    out.code = parsed.searchParams.get('code');
    out.error = parsed.searchParams.get('error');
    out.error_description = parsed.searchParams.get('error_description');
    if (!out.code && parsed.hash) {
      const hash = parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash;
      const hashParams = new URLSearchParams(hash);
      out.code = hashParams.get('code');
      out.error = out.error ?? hashParams.get('error');
      out.error_description = out.error_description ?? hashParams.get('error_description');
    }
  } catch {
    const q = url.includes('?') ? url.split('?')[1]?.split('#')[0] : '';
    const h = url.includes('#') ? url.split('#')[1] : '';
    const qs = new URLSearchParams(q);
    const hs = new URLSearchParams(h);
    out.code = qs.get('code') ?? hs.get('code');
    out.error = qs.get('error') ?? hs.get('error');
    out.error_description = qs.get('error_description') ?? hs.get('error_description');
  }

  return out;
}
