import type { NextConfig } from 'next';

/* The chat API lives behind the same origin in production. In development we
   proxy it, so cookies stay first-party and the client code never has to know
   whether it is talking to localhost or to ask.zeroto10.xyz.

   Point ALLYA_API_ORIGIN at a local backend to develop against one. */
const apiOrigin = process.env.ALLYA_API_ORIGIN;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (!apiOrigin) return [];
    return [{ source: '/api/:path*', destination: `${apiOrigin}/api/:path*` }];
  },
};

export default nextConfig;
