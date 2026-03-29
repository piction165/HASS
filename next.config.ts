import type { NextConfig } from "next";
import path from "path";

/**
 * 로컬: 상위 폴더에 다른 lockfile이 있으면 Turbopack 루트가 어긋나는 경우가 있어 고정.
 * Vercel 빌드(VERCEL=1)에서는 이 옵션을 빼서 호스팅 환경과 충돌을 줄입니다.
 */
const nextConfig: NextConfig =
  process.env.VERCEL === "1"
    ? {}
    : {
        turbopack: {
          root: path.join(__dirname),
        },
      };

export default nextConfig;
