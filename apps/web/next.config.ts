import path from "node:path";
import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

function apiRemotePattern() {
  if (!apiUrl) return null;
  const url = new URL(apiUrl);
  return {
    protocol: url.protocol.replace(":", "") as "http" | "https",
    hostname: url.hostname,
    ...(url.port && { port: url.port }),
    pathname: `${url.pathname === "/" ? "" : url.pathname}/images/**`,
  };
}

const dynamicPattern = apiRemotePattern();

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/images/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "4000",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...(dynamicPattern ? [dynamicPattern] : []),
    ],
  },
};

export default nextConfig;
