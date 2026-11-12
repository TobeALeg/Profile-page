import { failure } from './config.mjs';

export const SESSION_COOKIE = '__Host-portfolio-session';
export const LOGIN_COOKIE = '__Host-portfolio-login';
const encoder = new TextEncoder();
const encode = bytes => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
const decode = text => Uint8Array.from(atob(text.replaceAll('-', '+').replaceAll('_', '/')), char => char.charCodeAt(0));
export const randomToken = () => encode(crypto.getRandomValues(new Uint8Array(32)));
export const challenge = async verifier => encode(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(verifier))));

async function key(secret) {
  if (!secret || secret.length < 43) throw failure(503, '编辑服务尚未完成配置。');
  return crypto.subtle.importKey('raw', await crypto.subtle.digest('SHA-256', encoder.encode(secret)), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function seal(value, secret, purpose) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(purpose) },
    await key(secret), encoder.encode(JSON.stringify(value)));
  return `${encode(iv)}.${encode(new Uint8Array(ciphertext))}`;
}

export async function unseal(value, secret, purpose) {
  if (!value || value.length > 3500) return null;
  try {
    const [iv, data] = value.split('.');
    const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(iv), additionalData: encoder.encode(purpose) },
      await key(secret), decode(data));
    const result = JSON.parse(new TextDecoder().decode(bytes));
    return result.expires > Date.now() ? result : null;
  } catch { return null; }
}

export function cookie(name, value, seconds) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${seconds}`;
}

export function readCookie(request, name) {
  return (request.headers.get('Cookie') || '').split(';').map(part => part.trim())
    .find(part => part.startsWith(`${name}=`))?.slice(name.length + 1);
}
