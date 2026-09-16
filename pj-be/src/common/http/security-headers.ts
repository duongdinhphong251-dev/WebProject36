import type { Response } from 'express';

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: https:",
  "connect-src 'self' https:",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' https:",
  "style-src 'self' 'unsafe-inline'",
].join('; ');

export function applySecurityHeaders(response: Response): void {
  response.setHeader('Content-Security-Policy', CONTENT_SECURITY_POLICY);
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
}

export { CONTENT_SECURITY_POLICY };
