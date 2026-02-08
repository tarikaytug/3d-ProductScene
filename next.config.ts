import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* React Strict Mode, R3F Canvas'ın WebGL context'ini bozuyor.
     Three.js projelerinde kapatmak standart pratiktir. */
  reactStrictMode: false,
};

export default nextConfig;
