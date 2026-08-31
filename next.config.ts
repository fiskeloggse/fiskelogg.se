import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Lets next/image optimize (resize, re-encode) catch photos stored in
    // Vercel Blob, instead of shipping the full ~1600px upload for every
    // small thumbnail in the register list.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
