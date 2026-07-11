import type { NextConfig } from "next";

// No nonce-based CSP here deliberately: nonces require forcing every page into dynamic
// rendering (Next's own docs flag this as a real perf/caching cost), and this app has
// zero inline <script>/dangerouslySetInnerHTML of its own (verified by grep) — the thing
// actually worth locking down is connect-src, since that's what stops a future XSS from
// exfiltrating the Gemini/Tavily keys sitting in localStorage to an attacker's server.
// 'unsafe-inline' stays on script/style because Next's own hydration payload and
// Tailwind/Framer Motion rely on inline <script>/style, and default-src already blocks
// loading any *external* script.
const isDev = process.env.NODE_ENV === 'development';

// 'unsafe-eval' is dev-only, straight from Next's own CSP guide: React uses eval() in
// development to reconstruct server-side error stacks in the browser. Neither React nor
// Next.js use eval() in production, so this never loosens the header actually served.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self' data:;
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, ' ')
  .trim();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: cspHeader },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
          },
          // Render terminates TLS in front of this app, so it's always served over HTTPS —
          // safe to tell browsers to never even attempt a plain-HTTP request.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};

export default nextConfig;
