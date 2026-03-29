import type { NextConfig } from "next";
import path from "path";

/**
 * 상위 폴더에 다른 lockfile이 있으면 로컬에서 Turbopack이 잘못된 워크스페이스 루트를 잡을 수 있음.
 * Vercel 빌드는 단일 루트이므로 `turbopack.root`는 로컬에만 적용해 클라우드 빌드와 충돌을 피함.
 */
const nextConfig: NextConfig = {
  ...(process.env.VERCEL === "1"
    ? {}
    : {
        turbopack: {
          root: path.join(__dirname),
        },
      }),
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/icon.png",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
